# Resume Builder Web Application

A complete beginner-friendly resume builder using HTML, CSS, vanilla JavaScript, Node.js, Express, JSON-file storage, basic authentication, real-time preview, editable saved resumes, multiple templates, and PDF export.

## Project Structure

```text
Resume Builder/
├── backend/
│   ├── data/
│   │   ├── resumes.json
│   │   └── users.json
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── resumeRoutes.js
│   ├── services/
│   │   └── jsonDb.js
│   ├── utils/
│   │   ├── pdfRenderer.js
│   │   └── validation.js
│   └── server.js
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── .gitignore
├── package.json
└── README.md
```

## Features

- Signup and login with simple token-based authentication
- Save, retrieve, edit, and delete resumes
- JSON-file database for easy local development
- Real-time resume preview while typing
- Two resume templates: Classic and Modern
- Client-side PDF download from the preview
- Server-side PDF export for saved resumes
- Objective and hobbies/interests resume sections
- Form validation for required fields and email format
- Responsive layout for desktop and mobile screens

## Requirements

- Node.js 18 or newer
- npm

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open the app:

```text
http://localhost:3000
```

## API Endpoints

### Auth

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

### Resumes

All resume routes require an `Authorization: Bearer <token>` header.

```text
GET    /api/resumes
POST   /api/resumes
GET    /api/resumes/:id
PUT    /api/resumes/:id
DELETE /api/resumes/:id
GET    /api/resumes/:id/pdf
```

## Notes

- Saved users and resumes are stored in `backend/data/users.json` and `backend/data/resumes.json`.
- For production, replace the JSON files with a real database and store `TOKEN_SECRET` in an environment variable.
- The frontend uses a CDN copy of `html2pdf.js` for downloading the live preview. If the CDN is unavailable, the app falls back to the browser print dialog.
