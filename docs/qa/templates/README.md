# Test Data Templates

CSV templates to populate a UAT environment quickly. Fill the rows, then enter the
data through the corresponding UI screen (or import via your own seeder/script).
Column names mirror the system's fields. Sample rows are included — replace or extend.

| File | Loaded via | Notes |
|------|-----------|-------|
| `institutions.csv` | System → Institutions | `code` must be unique |
| `users.csv` | Access Control → Users | `role` must match a seeded role name |
| `departments.csv` | Departments | `institution_code` links to an institution |
| `programmes.csv` | Academics → Programmes | creating a programme auto-builds semesters + levels |
| `subjects.csv` | Academics → Subjects | `default_contact_hours` required |
| `programme_semester_fees.csv` | Academics/Fees → Programme Semester | semester fee + due dates |
| `classrooms.csv` | Timetable → Classrooms | `room_type`: lecture_hall, laboratory, workshop, computer_lab, seminar_room |
| `timetable_courses.csv` | Timetable → Course Management | links subject/programme/semester |
| `applicants.csv` | Admissions → Apply | `id_number` last 5 chars seed the registration number suffix |
| `fee_invoices.csv` | DB/seed (no UI create API — see K-03) | use to seed `fees` rows for Phase 5 |

> Roles available for `users.csv`: super-admin, system-super-admin, admin, institution-admin,
> staff, teacher, student, registry, registrar, hod, head-of-department, dean, course-master,
> finance-officer, hr-officer, time-sheet-supervisor.
