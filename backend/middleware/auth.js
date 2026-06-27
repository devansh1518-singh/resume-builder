const crypto = require("crypto");
const { readCollection } = require("../services/jsonDb");

const TOKEN_SECRET = process.env.TOKEN_SECRET || "change-this-secret-in-production";
const TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7;

// This is a small signed token format so the project does not need a JWT package.
function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadText) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(payloadText).digest("base64url");
}

function createToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_LIFETIME_MS
  };

  const payloadText = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadText);

  return `${payloadText}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token || !token.includes(".")) {
      return null;
    }

    const [payloadText, providedSignature] = token.split(".");
    const expectedSignature = signPayload(payloadText);
    const providedBuffer = Buffer.from(providedSignature || "");
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadText));

    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  // scrypt is built into Node.js and is safer than storing plain text passwords.
  const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { passwordHash, passwordSalt: salt };
}

function isPasswordValid(password, user) {
  const attemptedHash = crypto.scryptSync(password, user.passwordSalt, 64).toString("hex");
  const attemptedBuffer = Buffer.from(attemptedHash, "hex");
  const storedBuffer = Buffer.from(user.passwordHash, "hex");

  return (
    attemptedBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(attemptedBuffer, storedBuffer)
  );
}

async function requireAuth(req, res, next) {
  try {
    const headerToken = req.headers.authorization?.replace("Bearer ", "");
    const token = headerToken || req.query.token;
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const users = await readCollection("users");
    const user = users.find((record) => record.id === payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createToken,
  hashPassword,
  isPasswordValid,
  requireAuth
};
