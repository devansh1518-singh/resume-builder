const path = require("path");
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const { ensureDataFiles } = require("./services/jsonDb");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(frontendPath));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Resume Builder" });
});

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: "Something went wrong on the server."
  });
});

ensureDataFiles()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Resume Builder is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to prepare JSON data files:", error);
    process.exit(1);
  });
