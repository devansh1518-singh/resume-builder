const crypto = require("crypto");
const express = require("express");
const { createToken, hashPassword, isPasswordValid, requireAuth } = require("../middleware/auth");
const { readCollection, writeCollection } = require("../services/jsonDb");
const { cleanText, normalizeEmail, publicUser, validateLogin, validateSignup } = require("../utils/validation");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const name = cleanText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || "";
    const errors = validateSignup({ name, email, password });

    if (errors.length) {
      return res.status(400).json({ message: "Please fix the form errors.", errors });
    }

    const users = await readCollection("users");
    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordDetails = hashPassword(password);
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      ...passwordDetails,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeCollection("users", users);

    res.status(201).json({
      token: createToken(newUser),
      user: publicUser(newUser)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || "";
    const errors = validateLogin({ email, password });

    if (errors.length) {
      return res.status(400).json({ message: "Please fix the form errors.", errors });
    }

    const users = await readCollection("users");
    const user = users.find((record) => record.email === email);

    if (!user || !isPasswordValid(password, user)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
