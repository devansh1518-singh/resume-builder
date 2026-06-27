const API_BASE = "/api";

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const authForm = document.querySelector("#authForm");
const authTabs = document.querySelectorAll(".auth-tab");
const nameGroup = document.querySelector("#nameGroup");
const authName = document.querySelector("#authName");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authMessage = document.querySelector("#authMessage");
const userBadge = document.querySelector("#userBadge");
const logoutButton = document.querySelector("#logoutButton");
const resumeForm = document.querySelector("#resumeForm");
const formMessage = document.querySelector("#formMessage");
const clearButton = document.querySelector("#clearButton");
const refreshButton = document.querySelector("#refreshButton");
const downloadButton = document.querySelector("#downloadButton");
const savedResumes = document.querySelector("#savedResumes");
const resumePreview = document.querySelector("#resumePreview");

const textFields = [
  "fullName",
  "email",
  "phone",
  "address",
  "objective",
  "skills",
  "education",
  "projects",
  "experience",
  "hobbies"
];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let authMode = "login";
let currentResumeId = null;
let token = localStorage.getItem("resumeBuilderToken");
let currentUser = JSON.parse(localStorage.getItem("resumeBuilderUser") || "null");

function setMessage(element, text, type = "error") {
  element.textContent = text;
  element.classList.toggle("success", type === "success");
}

function splitItems(value) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiRequest(path, options = {}) {
  // Centralize fetch behavior so every API call sends the auth token consistently.
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed.");
    error.details = data?.errors || [];
    throw error;
  }

  return data;
}

function setAuthMode(mode) {
  authMode = mode;
  authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authMode === mode));
  nameGroup.classList.toggle("hidden", mode === "login");
  authName.required = mode === "signup";
  authPassword.autocomplete = mode === "signup" ? "new-password" : "current-password";
  authForm.querySelector("button[type='submit']").textContent = mode === "signup" ? "Create Account" : "Login";
  setMessage(authMessage, "");
}

function storeSession(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem("resumeBuilderToken", token);
  localStorage.setItem("resumeBuilderUser", JSON.stringify(currentUser));
}

function clearSession() {
  token = null;
  currentUser = null;
  currentResumeId = null;
  localStorage.removeItem("resumeBuilderToken");
  localStorage.removeItem("resumeBuilderUser");
}

function showApp() {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  userBadge.textContent = currentUser ? currentUser.email : "";
  loadSavedResumes();
  updatePreview();
}

function showAuth() {
  appView.classList.add("hidden");
  authView.classList.remove("hidden");
  setAuthMode("login");
}

function getResumeData() {
  const formData = new FormData(resumeForm);
  const selectedTemplate = formData.get("template") || "classic";

  return {
    fullName: formData.get("fullName").trim(),
    email: formData.get("email").trim(),
    phone: formData.get("phone").trim(),
    address: formData.get("address").trim(),
    objective: formData.get("objective").trim(),
    skills: formData.get("skills").trim(),
    education: formData.get("education").trim(),
    projects: formData.get("projects").trim(),
    experience: formData.get("experience").trim(),
    hobbies: formData.get("hobbies").trim(),
    template: selectedTemplate
  };
}

function setResumeData(resume) {
  textFields.forEach((field) => {
    document.querySelector(`#${field}`).value = resume[field] || "";
  });

  document.querySelector(`input[name="template"][value="${resume.template || "classic"}"]`).checked = true;
  currentResumeId = resume.id || null;
  updatePreview();
}

function resetResumeForm() {
  resumeForm.reset();
  currentResumeId = null;
  setMessage(formMessage, "");
  resumeForm.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));
  updatePreview();
}

function validateResumeForm() {
  const resume = getResumeData();
  const missingField = textFields.find((field) => !resume[field]);

  resumeForm.querySelectorAll(".invalid").forEach((field) => field.classList.remove("invalid"));

  if (missingField) {
    document.querySelector(`#${missingField}`).classList.add("invalid");
    setMessage(formMessage, "Please fill in all resume fields.");
    return false;
  }

  if (!emailPattern.test(resume.email)) {
    document.querySelector("#email").classList.add("invalid");
    setMessage(formMessage, "Please enter a valid email address.");
    return false;
  }

  setMessage(formMessage, "");
  return true;
}

function renderLines(containerId, value, fallback) {
  const container = document.querySelector(`#${containerId}`);
  const lines = splitItems(value);

  if (!lines.length) {
    container.innerHTML = `<p>${fallback}</p>`;
    return;
  }

  container.innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function renderParagraph(containerId, value, fallback) {
  const container = document.querySelector(`#${containerId}`);
  const text = value.trim();
  container.innerHTML = `<p>${escapeHtml(text || fallback)}</p>`;
}

function renderPills(containerId, value, fallback) {
  const container = document.querySelector(`#${containerId}`);
  const items = splitItems(value);

  container.innerHTML = items.length
    ? items.map((item) => `<span class="skill-pill">${escapeHtml(item)}</span>`).join("")
    : `<span class="skill-pill">${fallback}</span>`;
}

function updatePreview() {
  // The preview is rebuilt from the current form values on every input/change.
  const resume = getResumeData();

  document.querySelector('[data-preview="fullName"]').textContent = resume.fullName || "Your Name";
  document.querySelector('[data-preview="email"]').textContent = resume.email || "you@example.com";
  document.querySelector('[data-preview="phone"]').textContent = resume.phone || "+1 555 123 4567";
  document.querySelector('[data-preview="address"]').textContent = resume.address || "Your City";

  renderParagraph("previewObjective", resume.objective, "Your career objective will appear here.");
  renderPills("previewSkills", resume.skills, "Your skills");
  renderPills("previewHobbies", resume.hobbies, "Your interests");

  renderLines("previewEducation", resume.education, "Your education will appear here.");
  renderLines("previewProjects", resume.projects, "Your projects will appear here.");
  renderLines("previewExperience", resume.experience, "Your experience will appear here.");

  resumePreview.className = `resume-paper template-${resume.template}`;
}

function renderSavedResumes(resumes) {
  if (!resumes.length) {
    savedResumes.innerHTML = '<p class="message">No saved resumes yet.</p>';
    return;
  }

  savedResumes.innerHTML = resumes
    .map(
      (resume) => `
        <article class="saved-card">
          <div>
            <h3>${escapeHtml(resume.fullName)}</h3>
            <p>${escapeHtml(resume.email)} | Updated ${new Date(resume.updatedAt).toLocaleString()}</p>
          </div>
          <div class="saved-actions">
            <button class="secondary-button" type="button" data-action="edit" data-id="${resume.id}">Edit</button>
            <button class="ghost-button" type="button" data-action="pdf" data-id="${resume.id}">PDF</button>
            <button class="danger-button" type="button" data-action="delete" data-id="${resume.id}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadSavedResumes() {
  try {
    const data = await apiRequest("/resumes");
    renderSavedResumes(data.resumes);
  } catch (error) {
    setMessage(formMessage, error.message);
  }
}

async function saveResume(event) {
  event.preventDefault();

  if (!validateResumeForm()) {
    return;
  }

  try {
    const resume = getResumeData();
    const path = currentResumeId ? `/resumes/${currentResumeId}` : "/resumes";
    const method = currentResumeId ? "PUT" : "POST";
    const data = await apiRequest(path, {
      method,
      body: JSON.stringify(resume)
    });

    currentResumeId = data.resume.id;
    setMessage(formMessage, "Resume saved successfully.", "success");
    loadSavedResumes();
  } catch (error) {
    setMessage(formMessage, [error.message, ...error.details].join(" "));
  }
}

async function handleSavedAction(event) {
  // Event delegation lets buttons added after refresh work without extra listeners.
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  try {
    if (action === "edit") {
      const data = await apiRequest(`/resumes/${id}`);
      setResumeData(data.resume);
      setMessage(formMessage, "Loaded saved resume for editing.", "success");
    }

    if (action === "delete") {
      const confirmed = window.confirm("Delete this saved resume?");
      if (!confirmed) return;
      await apiRequest(`/resumes/${id}`, { method: "DELETE" });
      if (currentResumeId === id) resetResumeForm();
      loadSavedResumes();
    }

    if (action === "pdf") {
      await downloadSavedResumePdf(id);
    }
  } catch (error) {
    setMessage(formMessage, error.message);
  }
}

async function downloadSavedResumePdf(id) {
  const response = await fetch(`${API_BASE}/resumes/${id}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not export the saved resume PDF.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPreviewPdf() {
  const fileName = `${getResumeData().fullName || "resume"}.pdf`.replace(/[^a-z0-9.-]/gi, "-");

  if (window.html2pdf) {
    window
      .html2pdf()
      .set({
        margin: 0.25,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      })
      .from(resumePreview)
      .save();
    return;
  }

  window.print();
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const payload = {
    name: authName.value.trim(),
    email: authEmail.value.trim(),
    password: authPassword.value
  };

  if (!emailPattern.test(payload.email)) {
    setMessage(authMessage, "Please enter a valid email.");
    return;
  }

  if (authMode === "signup" && !payload.name) {
    setMessage(authMessage, "Please enter your name.");
    return;
  }

  if (payload.password.length < 6) {
    setMessage(authMessage, "Password must be at least 6 characters.");
    return;
  }

  try {
    const data = await apiRequest(`/auth/${authMode}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    storeSession(data);
    showApp();
  } catch (error) {
    setMessage(authMessage, [error.message, ...error.details].join(" "));
  }
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode));
});

authForm.addEventListener("submit", handleAuthSubmit);
resumeForm.addEventListener("input", updatePreview);
resumeForm.addEventListener("change", updatePreview);
resumeForm.addEventListener("submit", saveResume);
clearButton.addEventListener("click", resetResumeForm);
refreshButton.addEventListener("click", loadSavedResumes);
savedResumes.addEventListener("click", handleSavedAction);
downloadButton.addEventListener("click", downloadPreviewPdf);

logoutButton.addEventListener("click", () => {
  clearSession();
  resetResumeForm();
  showAuth();
});

if (token && currentUser) {
  showApp();
} else {
  showAuth();
}
