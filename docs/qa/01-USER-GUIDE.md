# School Management System — User Guide

A role-by-role functional walkthrough of the platform. Use this alongside the UAT
guide so a tester understands *what each screen does* before testing *whether it works*.

---

## 1. Getting started

| Item | Value |
|------|-------|
| Web app | `http://localhost:5173` (dev) / your production domain |
| Sign-in page | `/admin` (staff) and `/login`; students may use `/signup` to self-register |
| Identifier | Email, username, **or** phone number |
| Password reset | `/forgot-password` (WhatsApp OTP based) |

After login, the **left sidebar** shows only the modules and menus your role has permission to see. If you cannot see a menu, you lack the permission (or the module is disabled for your institution).

---

## 2. Roles at a glance

| Role | What they do |
|------|--------------|
| **Super Admin** | Full platform control: institutions, modules, users, roles, permissions, all data. Bypasses module-enable checks. |
| **Registrar** | Final admission decision (admit), issues/resends admission letters; full timetable control. |
| **Admission Officer (Registry)** | First-line application + document review; approves/rejects at registry stage. |
| **Finance Officer** | Verifies tuition payments (triggers enrollment), manages semester fees and payments. |
| **Dean** | Views and approves/publishes timetables; views workload, reports, contact hours. |
| **HOD** | Department-level review of applications & course registrations; manages department timetable, availability, assignments. |
| **Course Master** | Manages courses and course allocations; generates timetables; monitors contact hours. |
| **Teacher** | Views own timetable; logs lessons taught (accumulates contact hours). |
| **Student** | Applies, pays, registers for courses, views timetable, fees, notifications. |
| **Parent** | No portal account; appears as a document signatory where required (e.g. consent/enrollment agreements). |

---

## 3. Institution & academic setup (Admin)

1. **Institutions** — create the institution (name, code, acronym, branding/logo). Modules are enabled per institution under **Institution → Modules**.
2. **Departments** — academic departments (name, code).
3. **Academics → Programmes** — create programmes (with duration, application fee, tuition fee). Creating a programme **auto-generates** its semesters and levels (100/200/300…).
4. **Academics → Subjects** — define subjects with credit hours and default contact hours.
5. **Academics → assign subjects** to a programme's semesters (so students can register for them).
6. **Fees** — set the semester fee amount and due dates on each programme semester.
7. **Timetable → Classrooms** — add rooms (name, building, capacity, room type).

---

## 4. The student journey

### 4.1 Apply (Student)
- Self-register at `/signup` (phone OTP) → log in.
- **Admissions → Apply**: choose a **programme** and **academic year**. The form shows the programme's application fee and required documents.
- Upload required documents (PDF/JPG/PNG ≤ 5 MB), draw/upload your **signature** (required), accept any agreements, and **Submit**. You receive an `application_number` (e.g. `APP-2026-000001`).
- **Pay the application fee** (card/mobile money, or upload a bank-transfer proof). Paying (or proof approval) unlocks staff review.

### 4.2 Review & admit (Registry → HOD → Registrar)
- **Registry** reviews documents and approves → status `registry_reviewed`.
- **HOD** (matching the programme's department) approves → `department_approved`.
- **Registrar** admits → `admitted` and an **admission letter PDF** is generated (institution branding, QR code, barcode) and delivered by email + WhatsApp + in-app notification.
- Rejections at registry or department stages generate a **rejection letter PDF**.

### 4.3 Accept & pay tuition (Student)
- Accept the offer → `accepted`.
- Pay tuition. Digital payment **auto-enrolls** you. Bank-transfer proof requires **Finance** to verify.

### 4.4 Enrollment (automatic / Finance)
- On enrollment the system creates your **Student record** and a **login** (if you didn't already have one), assigns a unique **registration number** (`{INST}/{UNIT}/{DEPT}/{idSuffix}`), sets level 100, and links you to your programme.

### 4.5 Fees (Finance / Student)
- Finance records payments (partial or full); balance and status update automatically.
- Students view their **financial statement** in the portal.

### 4.6 Course registration (Student → HOD)
- Student registers for the subjects offered in their programme/semester.
- **HOD** approves or rejects each registration.

### 4.7 Timetable (Course Master / Admin → Student)
- Define timetable courses, assign teachers/classrooms, set teacher availability.
- **Auto Generate** builds a conflict-free timetable (respecting availability, room capacity/type, weekly load cap, and clashes). Adjust manually if needed, then **publish**.
- Students automatically see the published timetable for their programme/semester.

### 4.8 Teaching (Teacher)
- Teachers view their timetable and **log each lesson** (course, date, duration or start/end, topic, remarks). Logging accumulates **contact hours**, visible to HOD/Dean/Course Master.

---

## 5. Communication

- **Announcements** — compose (optionally from a template), target recipient groups, send immediately or schedule. Delivery is via **WhatsApp** (WasenderAPI). Message logs record delivery.
- **Letters** — formal letters with a configurable workflow (edit → approve → sign → send), optional OTP on send, and a **public verification** link.
- **Notifications** — in-app bell shows status changes and queue items; mark read / read-all.
- **Email** — used for admission letters, account creation, and contracts.

---

## 6. Reports & exports

- **Timetable reports**: Department, Teacher, Classroom, Student, Contact Hours, Teacher Workload — exportable to **PDF** and **CSV (Excel)**, plus print.
- **Fees report**: outstanding totals by programme and semester; per-student payment history.

---

## 7. Tips for testers

- The sidebar is **permission-driven** — to test a role, log in as that role (not as admin).
- Data is **per-institution** — keep one institution for the main journey to avoid confusion.
- For messaging/OTP flows, ensure the **queue worker** runs and **WasenderAPI/SMTP** are configured, and that test users have **phone numbers**.
- To reset everything: `php artisan migrate:fresh --seed`.

See `02-UAT-GUIDE.md` for the full step-by-step test cases and expected results.
