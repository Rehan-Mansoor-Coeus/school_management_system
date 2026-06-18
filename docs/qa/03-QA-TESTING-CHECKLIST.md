# QA Testing Checklist — Full Regression Sweep

Fast pass/fail checklist for a complete functional sweep. Mark each: **P** (pass), **F** (fail), **B** (blocked), **N/A**.
Reference the matching `TC-*` IDs in `02-UAT-GUIDE.md` for detailed steps/expected results.

> Recommended order: top to bottom. Reset with `php artisan migrate:fresh --seed` before a clean run.

## Environment
- [ ] Backend reachable at `:8000/api`
- [ ] Frontend reachable at `:5173`
- [ ] Login works as `admin@test.com`/`admin123`
- [ ] Queue worker running (`queue:work --queue=whatsapp,default`) — for messaging
- [ ] SMTP + WasenderAPI configured — for messaging/OTP

## Access control (SEC / TC-P0)
- [ ] Create Dean + Course Master users (TC-P0-01)
- [ ] Each seeded role can log in (admin, registrar, registry, finance, hod, teacher, student)
- [ ] Removing a permission hides the menu/action (SEC-01)
- [ ] No-token API call → 401 (SEC-02)
- [ ] Cross-institution record → 404 (SEC-05/NEG-20)
- [ ] Logout invalidates token (SEC-06)

## Phase 1 — Institution setup
- [ ] Institution created (TC-P1-01)
- [ ] Academic year available (TC-P1-02)
- [ ] Department created (TC-P1-03)
- [ ] Programme created + semesters/levels auto-generated (TC-P1-04)
- [ ] Subjects created (TC-P1-05)
- [ ] Subjects assigned to programme semester (TC-P1-06)
- [ ] Semester fee configured (TC-P1-07)
- [ ] Classrooms created (TC-P1-08)

## Phase 2 — Application
- [ ] Signup OTP request/verify/complete (TC-P2-01..03)
- [ ] Login (TC-P2-04)
- [ ] Password reset + forgot username (TC-P2-05/06)
- [ ] Apply: programme + year (TC-P2-07)
- [ ] Document upload (TC-P2-08)
- [ ] Signature required + saved (TC-P2-09)
- [ ] Submit → `submitted` + application number (TC-P2-10)
- [ ] Application fee paid/proof (TC-P2-11)
- [ ] Status + notifications correct (TC-P2-12/13)

## Phase 3 — Admissions
- [ ] Registry pending + doc review (TC-P3-01/02)
- [ ] Registry approve → `registry_reviewed` (TC-P3-03)
- [ ] HOD approve → `department_approved` (TC-P3-04)
- [ ] Registrar admit → `admitted` + letter (TC-P3-05)
- [ ] Letter has QR + barcode (TC-P3-06)
- [ ] Rejection letters (registry + department) (TC-P3-07/08)
- [ ] Resend letter (TC-P3-09)
- [ ] Delivery channels (TC-P3-10)

## Phase 4 — Enrollment
- [ ] Accept offer → `accepted` (TC-P4-01)
- [ ] Tuition digital → auto-enroll (TC-P4-02)
- [ ] Tuition proof → finance verify → enroll (TC-P4-03)
- [ ] Student record (level 100, active) (TC-P4-04)
- [ ] Registration number format + unique (TC-P4-05/07)
- [ ] Student login created (TC-P4-06)
- [ ] Correct programme link (TC-P4-08)

## Phase 5 — Finance
- [ ] Invoice present (or seeded — see K-03) (TC-P5-01)
- [ ] Partial payment (TC-P5-02)
- [ ] Full payment → paid (TC-P5-03)
- [ ] Overpayment rejected (TC-P5-04)
- [ ] Outstanding report (TC-P5-06)
- [ ] Student sees own fees (TC-P5-07)
- [ ] Payment history (TC-P5-08)

## Phase 6 — Course registration
- [ ] Available courses listed (TC-P6-01)
- [ ] Register subjects (TC-P6-02/03)
- [ ] HOD pending → approve/reject (TC-P6-05..07)
- [ ] Credit/contact hours correct (TC-P6-08)

## Phase 7 — Timetable
- [ ] Course created (TC-P7-01)
- [ ] Availability set (TC-P7-03)
- [ ] Assignment created (TC-P7-04)
- [ ] Auto-generate (TC-P7-05)
- [ ] Teacher/classroom/cohort clash prevented (TC-P7-07/08/09)
- [ ] Availability respected (TC-P7-10)
- [ ] Publish (TC-P7-11)
- [ ] Student sees timetable (TC-P7-12)

## Phase 8 — Teacher
- [ ] View own timetable (TC-P8-01)
- [ ] Log lesson + topic/remarks (TC-P8-02/03)
- [ ] Contact hours accumulate (TC-P8-04/05)
- [ ] Remaining/weekly correct (TC-P8-06)
- [ ] Teacher sees only own logs (TC-P8-07)
- [ ] Over-limit warning (TC-P8-08)

## Phase 9 — Student portal
- [ ] Login (TC-P9-01)
- [ ] Profile update (TC-P9-02)
- [ ] Course/timetable/fees views (TC-P9-03..05)
- [ ] Notifications (TC-P9-06)
- [ ] Change password (TC-P9-07)

## Phase 10 — Communication
- [ ] Announcement create/template (TC-P10-01/02)
- [ ] Send + schedule announcement (TC-P10-03/04)
- [ ] Letter create/send + OTP + public verify (TC-P10-05..07)
- [ ] In-app notifications (TC-P10-08)
- [ ] Email delivery (TC-P10-09)
- [ ] Message logs (TC-P10-10)

## Negative
- [ ] NEG-01..22 executed and behave as specified

## Security
- [ ] SEC-01..15 executed and behave as specified

## Integration
- [ ] INT-01..12 executed and behave as specified

## Reports
- [ ] Timetable reports export PDF/CSV/print
- [ ] Fees summary + payment history export

## Regression sign-off
- [ ] No P1/P2 defects open
- [ ] Known gaps (§12 / K-01..K-14) confirmed as expected, not new defects
