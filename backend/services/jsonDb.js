const fs = require("fs/promises");
const path = require("path");

const dataDirectory = path.join(__dirname, "..", "data");

const collections = {
  users: path.join(dataDirectory, "users.json"),
  resumes: path.join(dataDirectory, "resumes.json")
};

async function ensureDataFiles() {
  await fs.mkdir(dataDirectory, { recursive: true });

  // Keep local setup simple by creating empty JSON collections on first run.
  await Promise.all(
    Object.values(collections).map(async (filePath) => {
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, "[]", "utf8");
      }
    })
  );
}

async function readCollection(collectionName) {
  const filePath = collections[collectionName];

  if (!filePath) {
    throw new Error(`Unknown collection: ${collectionName}`);
  }

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    return fileContent.trim() ? JSON.parse(fileContent) : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await ensureDataFiles();
      return [];
    }

    if (error instanceof SyntaxError) {
      throw new Error(`${collectionName}.json contains invalid JSON.`);
    }

    throw error;
  }
}

async function writeCollection(collectionName, records) {
  const filePath = collections[collectionName];

  if (!filePath) {
    throw new Error(`Unknown collection: ${collectionName}`);
  }

  await fs.writeFile(filePath, JSON.stringify(records, null, 2), "utf8");
}

module.exports = {
  ensureDataFiles,
  readCollection,
  writeCollection
};
