# School Management System — System Testing & User Acceptance Testing (UAT) Guide

**Document type:** QA / UAT Certification Guide
**Audience:** QA testers, UAT participants, release managers
**Prerequisite knowledge:** None — every step is explicit.
**Status:** Pre-production certification

---

## Table of Contents

1. System Overview
2. Prerequisites
3. Test Environment Setup
4. Roles Required
5. Master Test Data
6. Detailed Test Cases (Phases 1–10)
7. Negative Test Cases
8. Security Tests
9. Integration Tests
10. User Acceptance Checklist
11. Production Readiness Checklist
12. Known Failure Indicators
13. Final Sign-Off Form

**Test case output format** — every case in Sections 6–9 records these fields:

> **Test ID · Module · Scenario · Preconditions · Steps · Expected Result · Actual Result · Pass/Fail · Comments**

(Use `05-test-cases-import-template.csv` to record Actual Result / Pass-Fail / Comments per case.)

---

## 1. System Overview

The School Management System is a **multi-tenant** (multi-institution) academic ERP composed of:

- **Backend:** Laravel REST API (`/api/...`), token authentication, role/permission authorization (Spatie), per-institution data segregation.
- **Frontend:** React + Vite single-page app consuming the API.

### Functional domains (modules)

| Module key | Area |
|------------|------|
| `institutions`, `departments`, `academics` | Institution & academic structure (years, semesters, programmes, subjects, units) |
| `admissions` | Application → review → admission → enrollment, payments, letters |
| `fees` | Post-enrollment semester fees & payments |
| `timetable` | Courses, assignments, classrooms, teacher availability, timetable generation, lesson logging, reports |
| `timesheets` | Staff/teacher time tracking |
| `letters` | Letters, announcements, WhatsApp messaging, templates |
| `contracts`, `document_workflow` | Document generation & digital signing |
| `tasks`, `hr`, `library`, `hostel`, `canteen`, `assets`, `results`, `attendance`, `character_certificates` | Operational modules |
| `audit`, `notifications`, `reports`, `modules`, `users`, `roles`, `permissions` | Platform/admin |

### End-to-end journey under test

```
Application → Admission Review → Admit → Accept → Tuition Payment → Enrollment
   → Student & Registration Number → Finance/Fees → Course Registration
   → Course Allocation → Timetable → Teacher Lesson Logging → Student Portal Access
```

### Architecture facts that affect testing

- **Authorization is permission-based.** Every menu/action is gated by a permission (e.g. `admissions.registry.review`, `timetable.manage`, `fees.manage`). Roles bundle permissions. Test both "has permission → allowed" and "lacks permission → blocked".
- **Data is segregated by `institution_id`.** A user only sees their own institution's data. Cross-institution access returns **404** (not 403) by design.
- **`super-admin` bypasses module-enable checks** and has all permissions.
- **Module enablement** is per institution (`institution_modules`). A disabled module blocks its API routes via the `module_enabled` middleware (exception: the Letters routes — see §12).

---

## 2. Prerequisites

### 2.1 Software

| Requirement | Version / note |
|-------------|----------------|
| PHP | 8.1+ (matching `composer.json`) |
| Composer | latest |
| Node.js | 18+ |
| npm | 9+ |
| Database | PostgreSQL (project uses Postgres; `pgsql` driver) |
| Browser | Latest Chrome/Edge/Firefox + a mobile browser for public/signature testing |
| API client | Postman / Insomnia / `curl` (for API-level and negative tests) |

### 2.2 Access & accounts

- Database credentials for a **dedicated UAT database** (never production).
- Ability to run `php artisan` commands.
- (Optional, for messaging tests) A **WasenderAPI** account/key and an institution-level WhatsApp configuration; an SMTP mailbox for email tests.

### 2.3 Exit criteria for "ready to test"

- API responds at `http://localhost:8000/api`.
- SPA loads at `http://localhost:5173`.
- You can log in as `admin@test.com` / `admin123`.

---

## 3. Test Environment Setup

> Run all commands from the project root: `school_management_system/`.

### 3.1 Backend

```bash
cd backend-laravel
cp .env.example .env                  # if .env not present
# Edit .env: set DB_CONNECTION=pgsql, DB_DATABASE=<uat_db>, DB_USERNAME, DB_PASSWORD
#            set APP_URL=http://localhost:8000  FRONTEND_URL=http://localhost:5173
composer install
php artisan key:generate
php artisan migrate:fresh --seed       # fresh schema + seed roles/permissions/modules/test users
php artisan storage:link               # so uploaded files/PDFs are served
php artisan serve --host=127.0.0.1 --port=8000
```

**Verify:** `php artisan migrate:status` shows all migrations "Ran", and the seeder output ends with `Database seeding completed successfully.`

### 3.2 Frontend

```bash
cd frontend-react
cp .env.example .env                   # if .env not present
# Ensure VITE_API_BASE points to the backend, e.g.:
#   VITE_API_BASE=http://localhost:8000/api
npm install
npm run dev                            # serves http://localhost:5173
```

### 3.3 Background workers (required for WhatsApp / scheduled jobs)

WhatsApp sends and scheduled announcements run on the **database queue** (`QUEUE_CONNECTION=database`). To test messaging end to end:

```bash
cd backend-laravel
php artisan queue:work --queue=whatsapp,default
# In a second terminal, to test scheduled items / expiry jobs:
php artisan schedule:work
```

### 3.4 Messaging configuration (only for Phase 10 messaging tests)

In `backend-laravel/.env`:

```
MAIL_DRIVER=smtp
MAIL_HOST=...  MAIL_PORT=...  MAIL_USERNAME=...  MAIL_PASSWORD=...  MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=...  MAIL_FROM_NAME="UAT School"

WASENDER_API_KEY=...
WASENDER_BASE_URL=https://wasenderapi.com/api
```

> If messaging is **not** configured, messaging test cases (Phase 10, OTP-based signup/reset) are expected to fail gracefully — mark them **N/A (not configured)** rather than Fail.

### 3.5 Reset between runs

To return to a clean baseline at any time:

```bash
php artisan migrate:fresh --seed
```

---

## 4. Roles Required

The seeder creates **16 roles**. Below is the mapping to the requested test roles. **Bold** roles have a ready-made seeded login (default institution `DEF`). Others must be created by an admin (see TC-P0 below).

| Requested role | System role(s) | Seeded login (default institution) |
|----------------|----------------|------------------------------------|
| **Super Admin** | `super-admin` | `admin@test.com` / `admin123` |
| **Registrar** | `registrar` | `registrar@test.com` / `registrar123` |
| **Admission Officer** | `registry` *(the registry reviewer is the de-facto admission officer)* | `registry@test.com` / `registry123` |
| **Finance Officer** | `finance-officer` | `finance@test.com` / `finance123` |
| **Dean** | `dean` | *none — create one* |
| **HOD** | `hod` (and `head-of-department`) | `hod@test.com` / `hod123` |
| **Course Master** | `course-master` | *none — create one* |
| **Teacher** | `teacher` | `teacher@test.com` / `teacher123` |
| **Student** | `student` | `student@test.com` / `student123` |
| **Parent** | *(no dedicated parent role/login)* | *N/A — see §12* |

Other seeded roles: `system-super-admin`, `admin`, `institution-admin`, `staff`, `time-sheet-supervisor`, `hr-officer`.

### TC-P0 — Create the missing test users (Dean, Course Master)

| Field | Value |
|-------|-------|
| **Test ID** | TC-P0-01 |
| **Module** | Users / Access Control |
| **Scenario** | Create Dean and Course Master users with the correct roles. |
| **Preconditions** | Logged in as `admin@test.com`. |
| **Steps** | 1. Go to **Access Control → Users → Add User**. 2. Create `dean@test.com` / `dean123`, assign role **dean**, institution = default. 3. Create `coursemaster@test.com` / `course123`, assign role **course-master**. 4. (Optional) add a phone number to each seeded user you will test OTP with. |
| **Expected Result** | Both users created, appear in the user list with the correct role badges; can log in. |
| **Pass/Fail** | |

> **OTP caveat:** Seeded users have **no phone number**, so WhatsApp OTP (signup, password reset, forgot-username) will not deliver to them until a phone number is added. Add phones before running OTP cases.

---

## 5. Master Test Data

Create this data **once** (Phase 1 builds most of it through the UI). CSV templates are in `templates/`. Suggested baseline:

### 5.1 Institution
| Field | Value |
|-------|-------|
| Name | UAT University |
| Code | UATU |
| Acronym | UATU |

### 5.2 Academic year
| Field | Value |
|-------|-------|
| Name | 2026/2027 |
| Start / End | 2026-09-01 / 2027-07-31 |
| Current | Yes |

### 5.3 Department
| Name | Code |
|------|------|
| Computer Science | CS |

### 5.4 Programme
| Field | Value |
|-------|-------|
| Name | Bachelor of Computer Science |
| Code | BCS |
| Department | Computer Science |
| Duration (years) | 3 |
| Application fee | 10000 |
| Tuition fee | 500000 |

> On programme creation the system **auto-generates** programme semesters (Semester 1..N) and programme levels (100, 200, 300).

### 5.5 Subjects
| Code | Name | Credit hours | Default contact hours |
|------|------|--------------|-----------------------|
| CSC101 | Introduction to Programming | 3 | 45 |
| CSC102 | Discrete Mathematics | 3 | 45 |
| MAT201 | Calculus II | 4 | 60 |

### 5.6 Semester fee (per programme semester)
| Field | Value |
|-------|-------|
| Total semester fee | 250000 |
| Expected payment date | 2026-09-30 |
| Latest payment date | 2026-10-31 |

### 5.7 Timetable classrooms
| Name | Building | Capacity | Type |
|------|----------|----------|------|
| Room A2 | Main Block | 60 | Lecture Hall |
| Lab 1 | ICT Block | 40 | Computer Lab |

### 5.8 Applicant (for the journey)
| Field | Value |
|-------|-------|
| Name | Jane Doe |
| Email | jane.doe+uat@example.com |
| Phone | +2376XXXXXXXX (use a real WhatsApp number if testing OTP) |
| ID number | 12345 (last 5 chars become the registration-number suffix) |
| Programme | Bachelor of Computer Science |
| Academic year | 2026/2027 |

---

## 6. Detailed Test Cases

> Execute phases **in order**. Each phase produces data the next phase consumes.
> Legend for "Expected Result" = the exact, observable outcome a tester must verify.

---

### PHASE 1 — Institution Setup

**Goal:** Build the academic structure. Login as `admin@test.com` unless stated.

| TC | Scenario | Preconditions | Steps | Expected Result |
|----|----------|---------------|-------|-----------------|
| TC-P1-01 | Create institution | Super Admin logged in | System → Institutions → Add; enter §5.1; save | Institution saved; appears in list; `code` unique; all modules enabled for it by default |
| TC-P1-02 | Create/confirm academic year | Institution exists | Confirm 2026/2027 exists (seeded) or create via admissions reference data | Academic year available for selection in applications |
| TC-P1-03 | Create department | Institution exists | Departments → Add → §5.3 | Department saved with code `CS`, scoped to institution |
| TC-P1-04 | Create programme | Department exists | Academics → Programmes → Add → §5.4 | Programme saved; **programme semesters auto-created** (Sem 1..6 for 3-yr); **programme levels** 100/200/300 created |
| TC-P1-05 | Create subjects | Institution exists | Academics → Subjects → Add each of §5.5 | 3 subjects saved with `code`, `credit_hours`, `default_contact_hours` |
| TC-P1-06 | Assign subjects to programme/semester | Programme + subjects exist | Academics → assign subjects to Programme Semester 1 | Subjects appear under the programme's semester; available later for course registration |
| TC-P1-07 | Configure semester fee | Programme semester exists | Academics/Fees → edit Programme Semester 1 → set §5.6 | `total_semester_fee`, due dates saved on the programme semester |
| TC-P1-08 | Create classrooms (timetable) | `timetable` module enabled | Timetable & Courses → Classrooms → add §5.7 | Both rooms saved with correct room types |

**Expected end state of Phase 1:** A complete academic skeleton (institution → year → department → programme → semesters/levels → subjects → fees → classrooms) exists and is institution-scoped.

> **Note (academic year):** There is no dedicated Academic-Year CRUD screen/API; years are seeded and surfaced through admissions reference data. See §12.

---

### PHASE 2 — Student Application Flow

**Goal:** An applicant creates an account, applies, uploads documents, pays the application fee.

| TC | Scenario | Preconditions | Steps | Expected Result |
|----|----------|---------------|-------|-----------------|
| TC-P2-01 | Student self-signup (request OTP) | `admissions` enabled; WhatsApp configured; phone valid | Public `/signup` → select institution → enter phone → request OTP | OTP sent via WhatsApp; cooldown 60s; OTP valid 180s |
| TC-P2-02 | Verify OTP | OTP received | Enter OTP | Returns a `signup_token`; proceeds to account form |
| TC-P2-03 | Complete signup | Valid `signup_token` | Enter name, username, email, password (+confirm), phone | Account created with **student** role; auto-login or redirect to login |
| TC-P2-04 | Login | Account exists | `/admin` or `/login` → enter email + password | Authenticated; Bearer token stored; student dashboard loads |
| TC-P2-05 | Password recovery (OTP) | Account has phone | `/forgot-password` → request OTP → verify → set new password | Password reset; can log in with new password |
| TC-P2-06 | Forgot username | Account has phone | `/forgot-password` (username path) → enter phone | Username delivered via WhatsApp |
| TC-P2-07 | Start application & select programme | Logged in as applicant | Admissions → Apply → choose **programme** + **academic year** | Application form shows programme-required documents and fee = programme application fee |
| TC-P2-08 | Upload documents | Application in progress | Attach passport photo, transcript, any programme-required docs | Files accepted (pdf/jpg/jpeg/png ≤ 5 MB); listed on the application |
| TC-P2-09 | Draw & attach signature | Application in progress | Use signature pad / upload signature image | Signature required and saved (`applicant_signature`) |
| TC-P2-10 | Submit application | All required docs + signature provided | Click Submit | Status = **`submitted`**; `application_number` = `APP-2026-000001` format; confirmation shown |
| TC-P2-11 | Pay application fee | Application submitted | Admissions → Pay application fee → choose method (bank transfer proof is always available) | Payment recorded (`PAY-...` reference); for proof method, status pending staff approval |
| TC-P2-12 | Verify status & notifications | After submit/pay | Check application status page + bell icon | Status reflects submitted; in-app notification `submitted` (and `application_fee_*`) present |
| TC-P2-13 | Verify audit/notification trail | After actions | Open notifications list (`/api/app-notifications`) | Notifications exist for the applicant; staff (registry/finance) receive their queue notifications |

**Expected end state:** Application `submitted` with `application_fee_paid = true` (after fee approval), unlocking registry review.

> **Duplicate-application guard:** Re-applying to the **same programme** while a prior application is not `rejected`/`cancelled` is blocked (covered in Negative §7).

---

### PHASE 3 — Admissions (Review Chain)

**Goal:** Move the application through the review chain to **admitted**, generating letters with QR/barcode. The chain is: **Registry → Department/HOD → Registrar**.

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P3-01 | Registry sees pending | `registry` | App `submitted` + fee paid | Admissions → Registry → Pending | Application appears in queue |
| TC-P3-02 | Document review | `registry`/`registrar` | Docs uploaded | Open application → review each document → approve/reject | Each doc `review_status` updates; mandatory docs must not be rejected before approval |
| TC-P3-03 | Registry approve | `registry` | All docs reviewed, mandatory OK | Decision = approved (+ optional comment) | Status → **`registry_reviewed`**; HOD notified |
| TC-P3-04 | HOD/Department approve | `hod` | Status `registry_reviewed`; HOD's department matches programme | Department → Pending → decide approved | Status → **`department_approved`**; registrar notified |
| TC-P3-05 | Registrar admit + letter | `registrar` | Status `department_approved` | Registrar → Ready → Admit | Status → **`admitted`**; **admission letter PDF generated** (Dompdf) with institution branding |
| TC-P3-06 | Admission letter QR + barcode | `registrar`/applicant | Letter generated | Open/download the admission letter PDF | PDF contains **Code128 barcode** of `application_number` and a **QR code** linking to the application URL |
| TC-P3-07 | Rejection (registry stage) | `registry` | A second test application `submitted` | Decision = rejected + reason | Status → **`rejected`**; **rejection letter PDF** (stage=registry) generated & delivered |
| TC-P3-08 | Rejection (department stage) | `hod` | An app at `registry_reviewed` | Decide rejected + reason | Status → **`rejected`**; rejection letter (stage=department) |
| TC-P3-09 | Resend admission letter | `registrar` | Admitted application | Registrar → Resend letter | Letter regenerated and re-delivered; no status change |
| TC-P3-10 | Letter delivery channels | any | Messaging configured | After admit/reject | Email with PDF attachment + WhatsApp text + WhatsApp document + in-app notification |

> **Waitlist:** A "waitlist" status is **not implemented**. Log the waitlist requirement as a gap (§12), not a Fail.
> **QR verification:** The admission-letter QR opens an **authenticated** application view; there is no public no-login verify endpoint for admission letters (the Letters and Contracts modules have their own public verify URLs). See §12.

---

### PHASE 4 — Enrollment

**Goal:** Convert an admitted+paid applicant into a Student with generated IDs.

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P4-01 | Accept admission | applicant | Status `admitted` | Application → Accept offer | Status → **`accepted`**; tuition payment unlocked |
| TC-P4-02 | Pay tuition (digital) | applicant | Status `accepted` | Pay tuition via Stripe/Campay/Flutterwave (sandbox) | Status → `tuition_paid`; **auto-enrollment** triggers → `enrolled` |
| TC-P4-03 | Pay tuition (proof) + finance verify | applicant + `finance-officer` | Status `accepted` | Upload tuition proof → Finance → Pending tuition → Verify | On verify, `EnrollmentService` runs; status → **`enrolled`** |
| TC-P4-04 | Student record created | — | After enrollment | Check Students list / student profile | A `Student` row exists: `current_level = 100`, `status = active`, `admission_date` set |
| TC-P4-05 | Registration number generated | — | After enrollment | Inspect student profile | `registration_number` follows `{INST}/{UNIT}/{DEPT}/{idSuffix}` (e.g. `UATU/.../CS/12345`); **unique** |
| TC-P4-06 | User account created | — | After enrollment | Applicant can log in as a student | A `User` (role `student`) linked to the applicant; temp password `Stu@XXXXXXXX` generated if new |
| TC-P4-07 | No duplicate IDs | — | Enroll a second applicant with same ID-suffix | Enroll | Collision resolved with `-1`/`-2` suffix; no duplicate `registration_number` |
| TC-P4-08 | Correct programme assignment | — | After enrollment | Student profile | Student linked to the programme/department chosen at application |

> **Note:** `student_number` / `matricule` / `admission_number` are **not** DB fields. The canonical student ID is `registration_number` (a contract/merge alias "student_number" maps to it). See §12.

---

### PHASE 5 — Finance (Semester Fees)

**Goal:** Generate/inspect a fee invoice, record partial then full payment, verify balances.

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P5-01 | Fee invoice exists for enrolled student | `finance-officer` | Student enrolled; semester fee configured | Fees → list filtered by student | A `fees` row (invoice) exists with `invoice_number`, `total_amount`, `balance` |
| TC-P5-02 | Record partial payment | `finance-officer` | Invoice with balance | Fees → open invoice → Add payment (amount < balance) | `StudentFeePayment` created (`SFP-...` ref); `amount_paid` increases; `balance` decreases; status = `partial` |
| TC-P5-03 | Record full payment | `finance-officer` | Remaining balance | Add payment for remaining balance | `balance = 0`; status = `paid`; `paid_date` set |
| TC-P5-04 | Reject overpayment | `finance-officer` | Invoice nearly paid | Try to pay amount > balance | Rejected with validation error (amount must be ≤ balance) |
| TC-P5-05 | Receipt reference | `finance-officer` | Payment recorded | Inspect payment | `receipt_number`/reference present on the payment record |
| TC-P5-06 | Outstanding balance report | `finance-officer` | Some unpaid invoices | Fees → Reports → Summary | Shows `total_outstanding`, `outstanding_by_programme`, `outstanding_by_semester` |
| TC-P5-07 | Student sees own fees | `student` | Logged in as student | Portal → Financial statement | `GET /fees/my` shows invoice(s), amounts paid, balance |
| TC-P5-08 | Payment history | `finance-officer` | Payments exist | Fees → student payment history | Chronological list of `StudentFeePayment` rows |

> **Gap to verify:** There is **no API that creates `fees` invoice rows**. If no invoice exists after enrollment, the invoice must be seeded/created directly in the DB for UAT, OR this is a backlog item — record under §12. Receipts for semester fees are reference numbers only (no PDF). Admissions payments **do** have a PDF invoice (`/admissions/payment/{id}/invoice`).

---

### PHASE 6 — Course Registration

**Goal:** Student registers for subjects; HOD approves; credit/contact hours are visible.

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P6-01 | View available courses | `student` | Enrolled; subjects assigned to programme/semester | Portal → Course Registration → Available | Subjects list shows code, name, and `credit_units` (contact hours) |
| TC-P6-02 | Register for subjects | `student` | Available subjects shown | Select subjects → Register (optionally pick programme semester) | Registrations created, `status = registered`, `approved_by_hod = false`; HOD notified |
| TC-P6-03 | Elective selection | `student` | Multiple subjects available | Select a subset (electives) | Only chosen subjects registered |
| TC-P6-04 | My registrations | `student` | After registering | Portal → My registrations | Shows pending registrations |
| TC-P6-05 | HOD pending approvals | `hod` | Student registered | Course registrations → Pending approval | Student's registrations appear |
| TC-P6-06 | HOD approve (bulk) | `hod` | Pending registrations | Bulk approve by student | Status → `completed`, `approved_by_hod = true` |
| TC-P6-07 | HOD reject with reason | `hod` | Pending registration | Reject + reason | Status → `rejected`; reason stored; student notified |
| TC-P6-08 | Credit/contact hours calculation | `student`/`hod` | Subjects have hours | Inspect registration list | Contact hours come from program-subject override or `subject.default_contact_hours`; values correct |

> **Gate note:** Course registration only requires that a **Student record exists** (i.e. enrolled). Despite UI copy about fees, there is **no enforced fee-balance gate** in the controller. See §12.
> **Architecture note:** Course registration uses `subjects` (Academics), which is a **separate track** from the Timetable module's `tt_courses`. They are linked conceptually (same `subject_id`), not by a hard FK.

---

### PHASE 7 — Timetable Management

**Goal:** Define timetable courses, assignments, generate a conflict-free timetable, verify clashes are prevented.

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P7-01 | Create timetable course | `course-master`/admin | `timetable` enabled | Timetable → Course Management → New Course (code, name, dept, programme, semester, credit/contact/practical/lab hours) | Course saved; appears in list |
| TC-P7-02 | Create classrooms | admin | — | (Done in P1-08) | Rooms present with types |
| TC-P7-03 | Set teacher availability | `hod`/`course-master` | Teacher exists | Timetable → Teacher Availability → select teacher → mark available/unavailable days | Availability saved per day |
| TC-P7-04 | Assign course to teacher | `course-master` | Course + teacher exist | Timetable → Course Assignment → assign course → teacher → classroom → programme → semester → expected contact hours | Assignment created with expected contact hours |
| TC-P7-05 | Auto-generate timetable | `course-master`/admin | Assignments exist | Timetable → Auto Generate → select dept/programme/semester/year → Generate | Slots created respecting **teacher availability, classroom availability, weekly load cap, no conflicts**; unplaced items listed with reasons |
| TC-P7-06 | Manual add slot | admin | — | Timetable → Add Slot | Slot created if no conflict |
| TC-P7-07 | Teacher clash prevented | admin | Existing slot for a teacher | Add overlapping slot for same teacher | Conflict detected (422) listing the teacher clash; allow only via explicit Force |
| TC-P7-08 | Classroom clash prevented | admin | Existing slot in a room | Add overlapping slot in same room | Conflict detected for classroom |
| TC-P7-09 | Cohort clash prevented | admin | Existing slot for programme-semester | Add overlapping slot for same programme-semester | Conflict detected for cohort |
| TC-P7-10 | Availability respected | admin | Teacher unavailable Wed | Auto-generate | No Wednesday slots for that teacher |
| TC-P7-11 | Publish/approve timetable | `dean`/admin | Draft slots | Publish slots | Status → published; visible to students |
| TC-P7-12 | Student timetable visibility | `student` | Published slots for student's programme/semester | Portal → My Timetable | Student sees the published slots automatically (no manual assignment) |

---

### PHASE 8 — Teacher Functions

**Goal:** Teacher views timetable, logs lessons; contact hours accumulate.

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P8-01 | View own timetable | `teacher` | Slots assigned to teacher | Timetable → schedule (teacher view) | Teacher sees their assigned slots |
| TC-P8-02 | Record lesson taught | `teacher` | Course assignment exists | Timetable → Lesson Logging → New → select assignment, date, duration OR start/end, topic, remarks | Lesson saved |
| TC-P8-03 | Topic & remarks captured | `teacher` | Lesson logged | Inspect lesson | Topic + remarks stored |
| TC-P8-04 | Contact hours update | `teacher`/`course-master` | Lessons logged | Inspect course assignment / workload | `completed_contact_hours` increased by the logged duration |
| TC-P8-05 | Duration from times | `teacher` | Lesson with start/end only | Log 08:00–11:00, no duration | Duration computed = 3h; contact hours += 3 |
| TC-P8-06 | Remaining hours correct | `course-master` | Expected vs completed | Workload page | Remaining = expected − completed; weekly hours derived from published timetable |
| TC-P8-07 | Teacher sees only own logs | `teacher` | Multiple teachers logging | Lesson list | A plain teacher sees only their own logs; elevated roles see all |
| TC-P8-08 | Workload cap warning | admin | Teacher near 18h/week | Add slots beyond cap | Over-limit flagged in workload (status "Over limit") |

---

### PHASE 9 — Student Portal

**Goal:** The enrolled student can use the self-service portal.

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P9-01 | Login | `student` | Account exists | Login with email + password | Student dashboard loads |
| TC-P9-02 | Profile view/update | `student` | Logged in | Profile → edit allowed fields → save | Changes persist |
| TC-P9-03 | Course viewing | `student` | Registered courses | Portal → My courses / registrations | Shows registered subjects + approval status |
| TC-P9-04 | Timetable viewing | `student` | Published timetable | Portal → My Timetable | Slots for the student's programme/semester shown |
| TC-P9-05 | Financial statement | `student` | Fees exist | Portal → Fees | Invoices, payments, outstanding balance shown |
| TC-P9-06 | Notifications | `student` | Notifications exist | Bell icon | Lists notifications; mark-as-read works; unread count decrements |
| TC-P9-07 | Change password | `student` | Logged in | Profile → change password | Requires current password; succeeds; new password works on next login |

---

### PHASE 10 — Communication

**Goal:** Verify announcements, letters, notifications, WhatsApp, email. **Requires §3.3 queue worker + §3.4 messaging config.**

| TC | Scenario | Role | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TC-P10-01 | Create announcement | staff w/ `create_announcements` | Letters menu visible | Letters → Announcements → New → compose | Announcement saved (draft) |
| TC-P10-02 | Announcement template | same | — | Create/use a template | Template applied to a new announcement |
| TC-P10-03 | Send announcement (WhatsApp) | `send_whatsapp_announcements` | Wasender configured; recipients have phones; queue worker running | Send now / Send | `SendAnnouncementJob` queued on `whatsapp`; recipients receive WhatsApp; message logs created |
| TC-P10-04 | Schedule announcement | `create_announcements` | — | Schedule for future time; run `schedule:work` | Sent at scheduled time via `ProcessScheduledAnnouncementsJob` |
| TC-P10-05 | Create + send letter | `create_letters`/`send_letters` | Letter workflow configured | Letters → New → (forward/approve/sign as configured) → Send | Letter progresses through workflow; sent; `SendLetterJob` queued |
| TC-P10-06 | Letter OTP gate | `send_letters` | OTP enabled for send | Send letter → enter OTP | Send blocked until valid OTP entered |
| TC-P10-07 | Public letter verify | none (no login) | A sent/verifiable letter | Open `/api/letters/public/verify/{letter}` | Letter verification info returned without auth |
| TC-P10-08 | In-app notifications | any | Actions generated notifications | Bell icon → list / mark all read | Notifications listed; read-all clears unread |
| TC-P10-09 | Email delivery | — | SMTP configured | Trigger an email action (e.g. admission letter, user account email) | Email received with expected content/attachment (sent synchronously via `Mail::raw`) |
| TC-P10-10 | Message logs / audit | `view_letters_menu` | Messages sent | Letters → Message logs (and Audit → messaging) | Delivery attempts logged with status |

> **Email scope:** Letters/announcements messaging is **WhatsApp-only** (no email path in letter/announcement services). Email is used by admissions letters, user-account creation, and contracts. Test email through those flows.

---

## 7. Negative Test Cases

| TC | Module | Scenario | Steps | Expected Result |
|----|--------|----------|-------|-----------------|
| NEG-01 | Auth | Invalid login | Login with wrong password | 401/validation error; "Invalid credentials"; no token issued |
| NEG-02 | Auth | Unknown identifier | Login with non-existent email | Rejected; generic failure (no account enumeration leak) |
| NEG-03 | Auth | Wrong OTP | Signup/reset → enter wrong OTP | Rejected; no token; attempts respect expiry/cooldown |
| NEG-04 | Auth | Expired OTP | Wait > 180s → submit OTP | Rejected as expired; user must resend |
| NEG-05 | Auth | OTP resend spam | Request OTP twice within 60s | Second request blocked by cooldown |
| NEG-06 | Admissions | Duplicate application | Apply again to same programme while prior app active | Blocked: "existing application" message |
| NEG-07 | Admissions | Submit without signature | Try to submit without signature | Validation error — signature required |
| NEG-08 | Admissions | Submit without mandatory docs | Omit a programme-required document | Validation error — required document missing |
| NEG-09 | Admissions | Registry approve before fee paid | Registry approve an app with fee unpaid | Blocked — fee must be paid first |
| NEG-10 | Admissions | Approve with rejected mandatory doc | Reject a mandatory doc → try registry approve | Blocked until mandatory docs not rejected |
| NEG-11 | Admissions | Admit out of order | Registrar admit an app not `department_approved` | Blocked — precondition not met |
| NEG-12 | Enrollment | Enroll without tuition paid | Finance verify when tuition unpaid | Error — `tuition_fee_paid` required |
| NEG-13 | Enrollment | Duplicate registration number | Force same ID suffix | System appends `-1`/`-2`; never duplicates |
| NEG-14 | Finance | Overpayment | Pay more than balance | Validation error (≤ balance) |
| NEG-15 | Finance | Negative/zero payment | Pay 0 or negative | Validation error |
| NEG-16 | Uploads | Oversize/invalid file | Upload a 10 MB / .exe file | Rejected (type/size validation: pdf/jpg/jpeg/png ≤ 5 MB) |
| NEG-17 | Timetable | Force conflict off | Add overlapping slot without Force | 422 with conflict list; not saved |
| NEG-18 | Timetable | Over weekly cap | Assign beyond 18h/week | Over-limit warning surfaced |
| NEG-19 | AuthZ | Unauthorized action | Student calls a finance/admit endpoint directly | 403 (permission) or blocked in UI |
| NEG-20 | AuthZ | Cross-institution access | User A opens institution B's record by ID | **404** (segregation), not the record |
| NEG-21 | Course reg | Register with no Student record | Non-enrolled user tries to register courses | Blocked — must be an enrolled student |
| NEG-22 | Letters | Send without permission | User lacking `send_letters` sends | Blocked / 403 |

---

## 8. Security Tests

| TC | Area | Scenario | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| SEC-01 | Role permissions | Permission gating | Remove a permission from a role → user loses the menu/action | Action blocked immediately after permission change + re-login |
| SEC-02 | Access control | Direct API call without token | Call a protected endpoint with no `Authorization` header | 401 Unauthorized |
| SEC-03 | Access control | Tampered/expired token | Call with garbage Bearer token | 401; frontend redirects to `/admin?session=expired` |
| SEC-04 | Privilege escalation | Student → admin endpoint | Student token calls `POST /admissions/registrar/admit/{id}` | 403 / role check fails |
| SEC-05 | Data segregation | Institution isolation | Inst A user lists data → only Inst A rows | No Inst B data leaks; cross-ID returns 404 |
| SEC-06 | Session/token lifecycle | Logout invalidates token | Logout → reuse old token | 401 (token cleared server-side) |
| SEC-07 | Password reset security | Reset uses OTP + short-lived token | Attempt reset with stale `reset_token` (>15 min) | Rejected |
| SEC-08 | Password storage | Hashing | Inspect `users.password` in DB | Bcrypt hash, never plaintext |
| SEC-09 | Audit trail | Sensitive action logged | Create/update/delete a Task → check Audit → System | `task.created/updated/deleted` recorded with user, IP, timestamps |
| SEC-10 | Audit coverage | Aggregated sources | Audit → filter by source (system/timesheet/messaging/auth) | Each source returns its records |
| SEC-11 | File access | Uploaded doc authorization | Try to open another applicant's document URL | Access denied / 404 |
| SEC-12 | Module enablement | Disabled module blocks API | Disable `admissions` for an institution → call an admissions route | Blocked by `module_enabled` middleware |
| SEC-13 | Super-admin bypass | Super admin module bypass | Super admin accesses a route for a (disabled-module) institution | Allowed (documented bypass) |
| SEC-14 | Input validation | Injection attempt | Submit `' OR 1=1 --` / `<script>` in text fields | Stored/escaped safely; no SQL error, no script execution |
| SEC-15 | Rate/abuse | OTP cooldown | Rapid OTP requests | Cooldown enforced (60s) |

> **Audit coverage caveat:** Currently only the **Task Manager** writes to the system `audit_logs` table; messaging/auth/timesheet have their own logs surfaced in the aggregator. Broader CRUD audit coverage is a gap (§12) — SEC-09/10 verify what exists today.

---

## 9. Integration Tests

Verify cross-module data flows. Each row asserts that an action in module A correctly changes state in module B.

| TC | Integration | Trigger | Expected downstream effect |
|----|-------------|---------|----------------------------|
| INT-01 | Admissions ↔ Finance | Applicant pays tuition (digital) | Payment recorded **and** enrollment auto-triggered (status `enrolled`) |
| INT-02 | Admissions ↔ Finance | Finance verifies bank-transfer tuition proof | Enrollment runs; student created |
| INT-03 | Admissions → Enrollment (Registration) | Enrollment completes | `Student` + `User(role=student)` created; `registration_number` generated; programme linked |
| INT-04 | Finance ↔ Registration | Student enrolled | Student appears in fee lists; `GET /fees/my` returns invoice(s) (where invoice rows exist) |
| INT-05 | Registration ↔ Timetable | Student in programme/semester | Published timetable for that programme/semester is visible to the student automatically |
| INT-06 | Timetable ↔ Teacher Workload | Course assigned + slots published | Teacher's weekly hours reflect scheduled slots; over-limit flagged |
| INT-07 | Teacher Workload ↔ Contact Hours | Teacher logs a lesson | Assignment `completed_contact_hours` increases; remaining recalculated; visible to HOD/Dean/Course Master |
| INT-08 | Announcements ↔ Users | Send announcement to a recipient group | Targeted users receive WhatsApp + message log entries; recipient search resolves users by institution |
| INT-09 | Letters ↔ Students | Send a letter addressed to a student | Student is a valid recipient; delivery + public verify link works |
| INT-10 | Admissions ↔ Notifications | Each status change | Correct in-app notification + staff queue notification fired (submitted/reviewed/approved/admitted/accepted/tuition_paid/enrolled) |
| INT-11 | Academics ↔ Admissions | Programme created with fees/required docs | Application form reflects programme application fee + required documents |
| INT-12 | Academics ↔ Course Registration | Subjects assigned to programme semester | Those subjects appear in the student's available-courses list |

---

## 10. User Acceptance Checklist

Sign each item **Accepted / Rejected** with initials. (Condensed; full pass/fail per case lives in the CSV.)

- [ ] **UAT-01** A new student can self-register, recover their password, and log in.
- [ ] **UAT-02** An applicant can complete and submit an application with documents and signature.
- [ ] **UAT-03** The application fee can be paid (or proof uploaded and approved).
- [ ] **UAT-04** Registry → HOD → Registrar review chain works and enforces order.
- [ ] **UAT-05** Admission letter PDF is generated with branding, QR, and barcode.
- [ ] **UAT-06** Rejection letters are generated for registry and department stages.
- [ ] **UAT-07** Accepted + tuition-paid applicant becomes an enrolled Student.
- [ ] **UAT-08** A unique `registration_number` and a student login are created.
- [ ] **UAT-09** Fees show correct totals, partial/full payments, and balances.
- [ ] **UAT-10** Student can register for courses; HOD can approve/reject.
- [ ] **UAT-11** Timetable can be generated without teacher/classroom/cohort clashes.
- [ ] **UAT-12** Teacher availability and weekly load cap are respected.
- [ ] **UAT-13** Students see their published timetable automatically.
- [ ] **UAT-14** Teachers can log lessons; contact hours accumulate correctly.
- [ ] **UAT-15** Student portal shows profile, courses, timetable, and finances.
- [ ] **UAT-16** Announcements/letters/notifications deliver to the right recipients.
- [ ] **UAT-17** Permissions correctly grant/deny every menu and action.
- [ ] **UAT-18** Institution data is fully segregated (no cross-tenant leakage).
- [ ] **UAT-19** Reports (timetable, fees, workload) generate and export (PDF/CSV).
- [ ] **UAT-20** No P1/P2 defects remain open.

---

## 11. Production Readiness Checklist

(Full version in `04-PRODUCTION-READINESS-CHECKLIST.md`.) Go-live gates:

- [ ] `APP_ENV=production`, `APP_DEBUG=false`, unique `APP_KEY` set.
- [ ] HTTPS enforced; correct `APP_URL`, `FRONTEND_URL`, CORS origins.
- [ ] Production DB provisioned, migrated; **no test seeders** run in prod.
- [ ] All seeded `*@test.com` accounts removed/disabled.
- [ ] Real super-admin created with strong password.
- [ ] `php artisan migrate --force` clean; `storage:link` done.
- [ ] Queue worker (`whatsapp,default`) running under a supervisor; `schedule:run` cron every minute.
- [ ] SMTP + WasenderAPI credentials configured and verified.
- [ ] Payment gateways (Stripe/Campay/Flutterwave) in **live** mode with webhooks reachable.
- [ ] Backups + restore tested; log rotation; monitoring/alerting in place.
- [ ] `config:cache`, `route:cache`, `view:cache` built; frontend `npm run build` deployed.
- [ ] File upload limits aligned in web server (nginx `client_max_body_size`) and PHP (`upload_max_filesize`).
- [ ] Per-institution module enablement reviewed.

---

## 12. Known Failure Indicators

These are **known behaviors/gaps found in the current code**. Do not log them as fresh defects — confirm them, then track as backlog/product decisions. They also tell a tester what a *real* failure looks like vs. an expected limitation.

| # | Area | Known behavior / gap | What a *real* failure looks like |
|---|------|----------------------|----------------------------------|
| K-01 | Admissions | **No "waitlist" status** exists in the workflow. | A status transition errors unexpectedly, or the chain skips a stage. |
| K-02 | Admissions | Admission-letter **QR opens an authenticated app view**; no public no-login verify API. | The PDF has no QR/barcode at all, or the QR points to a broken URL. |
| K-03 | Finance | **No API creates `fees` invoice rows.** Invoices must be seeded/created in DB for UAT. | Payment recording corrupts balances, or `GET /fees/my` errors. |
| K-04 | Finance | **No PDF receipt** for semester fees (reference number only). Admissions payments do have a PDF invoice. | Admissions invoice PDF fails to generate. |
| K-05 | Enrollment | Student ID is `registration_number` only; **no `student_number`/`matricule`/`admission_number` columns**. | A duplicate `registration_number` is created, or programme link is wrong. |
| K-06 | Course Reg | Registration gate is "Student record exists", **not a fee-balance check** (despite UI copy). | A non-enrolled user can register courses. |
| K-07 | Audit | Only **Task Manager** writes system `audit_logs`; other CRUD is not yet audited (messaging/auth/timesheet have separate logs). | The aggregator endpoint errors, or task actions are not logged. |
| K-08 | Letters | `/api/letters/*` routes are **not** behind `module_enabled:letters`; disabling the module in UI may not block the API. | Letters API returns 500, or ignores institution scoping. |
| K-09 | Announcements | `schedule_announcements` permission is defined but **not enforced**; scheduling allowed via `create_announcements`. | Scheduled announcement never sends with the worker running. |
| K-10 | Messaging | Letters/announcements are **WhatsApp-only** (no email path). Email exists only in admissions/contracts/user-account flows. | A configured email flow (admission letter) does not send. |
| K-11 | Auth | API tokens have **no server-side expiry** (valid until logout). | Logout does not invalidate the token. |
| K-12 | Roles | **No dedicated Parent role/login.** Parent involvement is via document signatories, not a portal account. | A "parent" account is required but cannot be created at all. |
| K-13 | Academics | **No Academic-Year CRUD API/screen**; years are seeded and read via admissions reference data. | The application form cannot list any academic year. |
| K-14 | Data scope | Letters context defaults missing `institution_id` to **1**; module-trait controllers **abort 422** instead. | A user with a valid institution sees another institution's data. |

---

## 13. Final Sign-Off Form

(Also provided standalone in `07-SIGN-OFF-SHEET.md`.)

| Field | Value |
|-------|-------|
| Project | School Management System |
| Build / commit | __________________________ |
| Test environment | __________________________ |
| UAT period | _______ to _______ |

**Results summary**

| Suite | Total | Pass | Fail | Blocked | N/A |
|-------|-------|------|------|---------|-----|
| Phase 1–10 functional | | | | | |
| Negative | | | | | |
| Security | | | | | |
| Integration | | | | | |

**Defect summary**

| Severity | Open | Closed |
|----------|------|--------|
| P1 — Critical | | |
| P2 — High | | |
| P3 — Medium | | |
| P4 — Low | | |

**Decision:** ☐ Approved for production ☐ Approved with conditions ☐ Rejected

**Conditions / notes:** ________________________________________________

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Product Owner | | | |
| Technical Lead | | | |
| Project Sponsor | | | |

---

*End of UAT Guide. Companion files: `01-USER-GUIDE.md`, `03-QA-TESTING-CHECKLIST.md`, `04-PRODUCTION-READINESS-CHECKLIST.md`, `05-test-cases-import-template.csv`, `templates/`, `07-SIGN-OFF-SHEET.md`.*
