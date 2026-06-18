# Production Readiness Checklist

Complete every gate before go-live. Mark **Done / N/A / Blocker**. A single open **Blocker** stops the release.

## 1. Application configuration (backend `.env`)
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` generated and unique to this environment
- [ ] `APP_URL` = real HTTPS API URL
- [ ] `FRONTEND_URL` = real SPA URL
- [ ] CORS allowed origins limited to production domains
- [ ] `SESSION_SECURE_COOKIE=true` (if web session used)
- [ ] `LOG_LEVEL` appropriate (e.g. `warning`/`error`), log channel persisted/rotated

## 2. Frontend configuration
- [ ] `VITE_API_BASE` points to production API (or `/api` behind same-origin proxy)
- [ ] `npm run build` succeeds; `dist/` deployed
- [ ] Source maps disabled or access-restricted
- [ ] App served over HTTPS

## 3. Database
- [ ] Production DB provisioned (PostgreSQL), credentials in secrets manager (not in repo)
- [ ] `php artisan migrate --force` runs clean
- [ ] `RolePermissionSeeder`/test seeders **NOT** run in production (no `*@test.com` users)
- [ ] `php artisan permissions:sync` run so the permission catalog is complete
- [ ] Real institution(s) created; modules enabled per institution as required
- [ ] Initial real **super-admin** created with a strong, rotated password
- [ ] Indexes/constraints verified; `registration_number`, `invoice_number`, `application_number` uniqueness intact

## 4. Storage & uploads
- [ ] `php artisan storage:link` done; public disk reachable over HTTPS
- [ ] Web server `client_max_body_size` ≥ app upload limit (≥ 5 MB docs)
- [ ] PHP `upload_max_filesize` / `post_max_size` aligned (≥ 6 MB)
- [ ] Generated PDFs (admission/rejection letters, invoices) render correctly in prod

## 5. Background processing
- [ ] Queue connection set (`QUEUE_CONNECTION=database` or redis)
- [ ] `queue:work --queue=whatsapp,default` running under Supervisor/systemd with auto-restart
- [ ] Scheduler cron installed: `* * * * * php artisan schedule:run`
- [ ] Scheduled jobs verified (scheduled announcements, document expiry alerts)

## 6. Messaging & payments
- [ ] SMTP configured and a live test email delivered
- [ ] `WASENDER_API_KEY` (+ base URL/session) configured; a live WhatsApp test delivered
- [ ] Stripe live keys + webhook endpoint reachable & verified
- [ ] Campay live credentials + status polling verified
- [ ] Flutterwave live keys + webhook (`/admissions/payment/webhook`) reachable & verified
- [ ] Payment idempotency/duplicate handling spot-checked

## 7. Security
- [ ] HTTPS/TLS enforced (HSTS), no mixed content
- [ ] Default/test accounts removed; passwords rotated
- [ ] Role/permission matrix reviewed for least privilege
- [ ] Institution data segregation verified on production data (cross-tenant → 404)
- [ ] Token lifecycle reviewed (logout invalidates; consider periodic rotation — see K-11)
- [ ] Rate limiting/WAF in front of auth + OTP endpoints
- [ ] Secrets not committed; `.env` excluded from VCS
- [ ] File-access authorization verified (no IDOR on uploaded documents)

## 8. Performance & caching
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] `php artisan view:cache`
- [ ] OPcache enabled
- [ ] DB connection pooling / sensible max connections
- [ ] Frontend assets gzipped/cached at the edge

## 9. Reliability & operations
- [ ] Automated DB backups scheduled; **restore tested**
- [ ] File/storage backups scheduled
- [ ] Monitoring + alerting (uptime, error rate, queue depth, failed jobs)
- [ ] `failed_jobs` table monitored; retry strategy defined
- [ ] Centralized logs with retention/rotation
- [ ] Rollback/runbook documented

## 10. Compliance & data
- [ ] PII handling / privacy policy reviewed
- [ ] Data retention rules defined for applications, payments, messages
- [ ] Audit expectations documented (note current limited coverage — K-07)

## 11. Final go/no-go
- [ ] UAT sign-off obtained (`07-SIGN-OFF-SHEET.md`)
- [ ] No open P1/P2 defects
- [ ] Known gaps (UAT §12) accepted by Product Owner
- [ ] Stakeholders notified of go-live window
- [ ] Post-deploy smoke test plan ready (login, apply, pay, admit, enroll, timetable, portal)

**Release decision:** ☐ GO ☐ NO-GO  — Approver: __________ Date: ______
