function splitLines(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function writeSection(doc, title, content) {
  const lines = splitLines(content);

  if (!lines.length) {
    return;
  }

  doc.moveDown(0.9);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#1f2937").text(title.toUpperCase());
  doc.moveDown(0.25);
  doc.strokeColor("#d1d5db").lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.45);

  lines.forEach((line) => {
    doc.font("Helvetica").fontSize(10.5).fillColor("#374151").text(`- ${line}`, {
      lineGap: 3
    });
  });
}

function writeParagraphSection(doc, title, content) {
  const text = String(content || "").trim();

  if (!text) {
    return;
  }

  doc.moveDown(0.9);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#1f2937").text(title.toUpperCase());
  doc.moveDown(0.25);
  doc.strokeColor("#d1d5db").lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.45);
  doc.font("Helvetica").fontSize(10.5).fillColor("#374151").text(text, {
    lineGap: 4
  });
}

function renderResumePdf(doc, resume) {
  const accentColor = resume.template === "modern" ? "#0f766e" : "#1f2937";

  doc.info.Title = `${resume.fullName} Resume`;
  doc.info.Author = resume.fullName;

  doc.rect(0, 0, 612, 72).fill(accentColor);

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text(resume.fullName, 50, 22, { width: 512 });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#f8fafc")
    .text(`${resume.email} | ${resume.phone} | ${resume.address}`, 50, 50, { width: 512 });

  doc.y = 98;
  writeParagraphSection(doc, "Objective", resume.objective);
  writeSection(doc, "Skills", resume.skills);
  writeSection(doc, "Education", resume.education);
  writeSection(doc, "Projects", resume.projects);
  writeSection(doc, "Experience", resume.experience);
  writeSection(doc, "Hobbies & Interests", resume.hobbies);
}

module.exports = {
  renderResumePdf
};
