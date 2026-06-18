# School Management System — QA / UAT Test Package

This folder contains the complete testing and certification package for the School
Management System (Laravel API + React SPA). It is designed so that a **tester with
no prior knowledge of the system** can execute every test from end to end and
confidently certify the platform for production.

## Contents

| # | File | Purpose |
|---|------|---------|
| 00 | `00-README.md` | This index. |
| 01 | `01-USER-GUIDE.md` | Functional walkthrough of every role and module (how the system works). |
| 02 | `02-UAT-GUIDE.md` | **Master document.** System overview, environment setup, roles, master data, detailed test cases (Phases 1–10), negative tests, security tests, integration tests, acceptance checklist, production readiness, known failure indicators, sign-off form. |
| 03 | `03-QA-TESTING-CHECKLIST.md` | Condensed pass/fail checklist for a fast full regression sweep. |
| 04 | `04-PRODUCTION-READINESS-CHECKLIST.md` | Infrastructure, security, data, and go-live gate checklist. |
| 05 | `05-test-cases-import-template.csv` | Excel-importable test-case tracker (all cases, ready to fill Actual/Pass-Fail). |
| 06 | `templates/` | Test-data CSV templates (institutions, users, programmes, subjects, applicants, fees, classrooms, courses, etc.). |
| 07 | `07-SIGN-OFF-SHEET.md` | Formal certification / sign-off form. |

## How to use this package

1. Read `02-UAT-GUIDE.md` Sections 1–5 to set up the environment, roles, and master data.
2. Import `05-test-cases-import-template.csv` into Excel/Google Sheets (one row = one test case).
3. Load master data using the CSV templates in `templates/`.
4. Execute Phases 1–10 in order (each phase depends on the previous one).
5. Run Negative, Security, and Integration suites.
6. Record Actual Result + Pass/Fail for every case.
7. Complete the acceptance + production-readiness checklists.
8. Sign off using `07-SIGN-OFF-SHEET.md`.

## Quick environment facts (verified against the codebase)

| Item | Value |
|------|-------|
| Backend (Laravel) | `http://localhost:8000` (`php artisan serve`) |
| API base | `http://localhost:8000/api` |
| Frontend (React/Vite) | `http://localhost:5173` (`npm run dev`) |
| Auth | Bearer token (`users.api_token`); **no JWT expiry** — token valid until logout |
| Login identifier | `login` field accepts **email, username, or phone** + `password` |
| Login 2FA | **None.** OTP is used only for student self-signup and password reset (delivered by WhatsApp) |
| Default super admin | `admin@test.com` / `admin123` |

> **Important:** Several real implementation gaps were found during analysis (e.g. no
> "waitlist" status, no semester-fee invoice creation API, no public admission-letter
> verification endpoint, limited audit coverage). These are documented in
> **Section 12 — Known Failure Indicators** of the UAT guide so testers do not log
> them as surprises. Treat them as product decisions/backlog, not test blockers.
