const crypto = require("crypto");
const express = require("express");
const PDFDocument = require("pdfkit");
const { requireAuth } = require("../middleware/auth");
const { readCollection, writeCollection } = require("../services/jsonDb");
const { renderResumePdf } = require("../utils/pdfRenderer");
const { sanitizeResumePayload, validateResume } = require("../utils/validation");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const resumes = await readCollection("resumes");
    const userResumes = resumes
      .filter((resume) => resume.userId === req.user.id)
      .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));

    res.json({ resumes: userResumes });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const resumeData = sanitizeResumePayload(req.body);
    const errors = validateResume(resumeData);

    if (errors.length) {
      return res.status(400).json({ message: "Please fix the resume errors.", errors });
    }

    const resumes = await readCollection("resumes");
    const timestamp = new Date().toISOString();
    const newResume = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      ...resumeData,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    resumes.push(newResume);
    await writeCollection("resumes", resumes);

    res.status(201).json({ resume: newResume });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/pdf", async (req, res, next) => {
  try {
    const resumes = await readCollection("resumes");
    const resume = resumes.find((record) => record.id === req.params.id && record.userId === req.user.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    const safeFileName = resume.fullName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName || "resume"}.pdf"`);

    // PDFKit writes the file directly to the HTTP response stream.
    doc.pipe(res);
    renderResumePdf(doc, resume);
    doc.end();
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const resumes = await readCollection("resumes");
    const resume = resumes.find((record) => record.id === req.params.id && record.userId === req.user.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    res.json({ resume });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const resumeData = sanitizeResumePayload(req.body);
    const errors = validateResume(resumeData);

    if (errors.length) {
      return res.status(400).json({ message: "Please fix the resume errors.", errors });
    }

    const resumes = await readCollection("resumes");
    const resumeIndex = resumes.findIndex((record) => record.id === req.params.id && record.userId === req.user.id);

    if (resumeIndex === -1) {
      return res.status(404).json({ message: "Resume not found." });
    }

    const updatedResume = {
      ...resumes[resumeIndex],
      ...resumeData,
      updatedAt: new Date().toISOString()
    };

    resumes[resumeIndex] = updatedResume;
    await writeCollection("resumes", resumes);

    res.json({ resume: updatedResume });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const resumes = await readCollection("resumes");
    const resume = resumes.find((record) => record.id === req.params.id && record.userId === req.user.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    const remainingResumes = resumes.filter((record) => record.id !== req.params.id);
    await writeCollection("resumes", remainingResumes);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
