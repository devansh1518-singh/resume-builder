const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTemplates = ["classic", "modern"];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email) {
  return cleanText(email).toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function sanitizeResumePayload(body) {
  const selectedTemplate = cleanText(body.template);

  return {
    fullName: cleanText(body.fullName),
    email: normalizeEmail(body.email),
    phone: cleanText(body.phone),
    address: cleanText(body.address),
    objective: cleanText(body.objective),
    skills: cleanText(body.skills),
    education: cleanText(body.education),
    projects: cleanText(body.projects),
    experience: cleanText(body.experience),
    hobbies: cleanText(body.hobbies),
    template: allowedTemplates.includes(selectedTemplate) ? selectedTemplate : "classic"
  };
}

function validateSignup({ name, email, password }) {
  const errors = [];

  if (!cleanText(name)) errors.push("Name is required.");
  if (!emailPattern.test(normalizeEmail(email))) errors.push("A valid email is required.");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters.");

  return errors;
}

function validateLogin({ email, password }) {
  const errors = [];

  if (!emailPattern.test(normalizeEmail(email))) errors.push("A valid email is required.");
  if (!password) errors.push("Password is required.");

  return errors;
}

function validateResume(resume) {
  const errors = [];

  if (!resume.fullName) errors.push("Full name is required.");
  if (!emailPattern.test(resume.email)) errors.push("A valid email is required.");
  if (!resume.phone) errors.push("Phone number is required.");
  if (!resume.address) errors.push("Address is required.");
  if (!resume.objective) errors.push("Objective is required.");
  if (!resume.skills) errors.push("Skills are required.");
  if (!resume.education) errors.push("Education is required.");
  if (!resume.projects) errors.push("Projects are required.");
  if (!resume.experience) errors.push("Experience is required.");
  if (!resume.hobbies) errors.push("Hobbies and interests are required.");

  return errors;
}

module.exports = {
  cleanText,
  normalizeEmail,
  publicUser,
  sanitizeResumePayload,
  validateLogin,
  validateResume,
  validateSignup
};
