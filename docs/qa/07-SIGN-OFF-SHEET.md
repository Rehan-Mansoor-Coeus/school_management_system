# UAT Certification & Sign-Off Sheet

**Project:** School Management System
**Build / commit:** ____________________________
**Test environment URL:** ____________________________
**Database:** ____________________________ (UAT only)
**UAT period:** __________ to __________

---

## 1. Scope tested

- [ ] Phase 1 — Institution Setup
- [ ] Phase 2 — Student Application
- [ ] Phase 3 — Admissions Review Chain
- [ ] Phase 4 — Enrollment
- [ ] Phase 5 — Finance / Fees
- [ ] Phase 6 — Course Registration
- [ ] Phase 7 — Timetable Management
- [ ] Phase 8 — Teacher Functions
- [ ] Phase 9 — Student Portal
- [ ] Phase 10 — Communication
- [ ] Negative suite (NEG-01..22)
- [ ] Security suite (SEC-01..15)
- [ ] Integration suite (INT-01..12)

## 2. Results summary

| Suite | Total | Pass | Fail | Blocked | N/A |
|-------|-------|------|------|---------|-----|
| Functional (Phases 1–10) | | | | | |
| Negative | | | | | |
| Security | | | | | |
| Integration | | | | | |
| **Total** | | | | | |

## 3. Defect summary

| Severity | Open | Closed | Notes |
|----------|------|--------|-------|
| P1 — Critical | | | |
| P2 — High | | | |
| P3 — Medium | | | |
| P4 — Low | | | |

## 4. Known gaps acknowledged (UAT Guide §12)

Confirm each known limitation has been reviewed and accepted (not a release blocker):

- [ ] K-01 No waitlist status
- [ ] K-02 Admission-letter QR is authenticated (no public verify API)
- [ ] K-03 No semester-fee invoice creation API
- [ ] K-04 No PDF receipt for semester fees
- [ ] K-05 Single canonical student ID (`registration_number`)
- [ ] K-06 Course registration gate is enrollment, not fee balance
- [ ] K-07 Limited system audit coverage (Tasks only)
- [ ] K-08 Letters routes not gated by `module_enabled`
- [ ] K-09 `schedule_announcements` permission not enforced
- [ ] K-10 Letters/announcements are WhatsApp-only
- [ ] K-11 API tokens have no server-side expiry
- [ ] K-12 No dedicated Parent role/portal
- [ ] K-13 No Academic-Year CRUD API/screen
- [ ] K-14 Letters context defaults missing institution_id to 1

## 5. Outstanding conditions / action items

| # | Item | Owner | Due | Status |
|---|------|-------|-----|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## 6. Certification decision

☐ **Approved for production** — system meets acceptance criteria; no open P1/P2.
☐ **Approved with conditions** — go-live permitted subject to the action items above.
☐ **Rejected** — must re-test after fixes.

**Rationale / notes:**
______________________________________________________________________
______________________________________________________________________

## 7. Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Product Owner | | | |
| Technical Lead | | | |
| Finance Representative | | | |
| Registrar / Academic Representative | | | |
| Project Sponsor | | | |

---

*By signing, each party confirms the test results above accurately reflect the system's
behavior and endorses the certification decision recorded in Section 6.*
