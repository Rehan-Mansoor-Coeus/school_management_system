# ASSMS Release Report — `admissions` branch v1.0.0

**Product:** African Students School Management System (ASSMS)  
**Developer:** Alpha Bridge Technologies Ltd.  
**Branch:** `admissions`  
**Version:** `1.0.0-admissions`  
**Release date:** 11 June 2026  
**Git commit:** `ecaa535f859491b77014b84eb15560f9744c5389`  
**Production URL:** https://okusoma.com  
**VPS app path:** `/var/www/school_management_system`  
**Frontend path:** `/var/www/okusoma`

---

## 1. Version & backup snapshot

This milestone was tagged **`v1.0.0-admissions`** after code, database, and storage were aligned between local and production.

### Local backup (11 Jun 2026, 16:44 WAT)

| Item | Location |
|------|----------|
| PostgreSQL (custom) | `backups/admissions-v1.0.0-20260611-164426/school_management.dump` |
| PostgreSQL (SQL) | `backups/admissions-v1.0.0-20260611-164426/school_management.sql.gz` |
| Uploaded files | `backups/admissions-v1.0.0-20260611-164426/storage-public/` |
| Environment | `backups/admissions-v1.0.0-20260611-164426/backend.env.backup` |
| Git pointer | `backups/admissions-v1.0.0-20260611-164426/git-commit.txt` |

### Production backup (11 Jun 2026, 15:44 UTC)

| Item | Location |
|------|----------|
| PostgreSQL (SQL) | `/var/backups/school_management/admissions-v1.0.0-20260611-154429/school_management.sql.gz` |
| Uploaded files | `/var/backups/school_management/admissions-v1.0.0-20260611-154429/storage-public/` |
| Environment | `/var/backups/school_management/admissions-v1.0.0-20260611-154429/backend.env.backup` |
| Git pointer | `/var/backups/school_management/admissions-v1.0.0-20260611-154429/git-commit.txt` |

### Data at this milestone

| Metric | Local (PostgreSQL) | Production (PostgreSQL) |
|--------|-------------------|-------------------------|
| Institutions | 1 | 1 |
| Programmes | 2 | 2 |
| Users | 12 | 12 |

### Re-run backups

```bash
./deploy/db/backup-milestone.sh local
ssh alphabridge-ts 'bash -s' < deploy/db/backup-milestone.sh vps v1.0.0-admissions
```

---

## 2. Infrastructure changes

### Local development

- Switched this project from **MySQL → PostgreSQL 16** (Homebrew) for parity with production.
- MySQL `.env` preserved at `backend-laravel/.env.mysql.backup`.
- Added pgloader import workflow and timestamp column fix for Laravel compatibility.
- Added Vite `/storage` proxy for local branding previews.

### Production (VPS: `alphabridge-ts`)

- **okusoma.com** serves React frontend + Laravel API on same origin (`/api`, `/storage`).
- Nginx `/storage/` alias serves `backend-laravel/storage/app/public/`.
- PostgreSQL database `school_management` (user `school_user`).
- PHP 7.4-FPM, upload limits raised to 8 MB for branding assets.

### Deploy & sync tooling (`deploy/db/`)

| Script | Purpose |
|--------|---------|
| `import-from-mysql.sh` | One-time MySQL → local PostgreSQL import via pgloader |
| `sync-to-vps.sh --confirm` | Full local DB → VPS replace (with auto backup) |
| `sync-storage-to-vps.sh --confirm` | Rsync uploaded files to VPS |
| `fix-timestamp-columns.sql` | Fix pgloader timestamptz → Laravel date parsing |
| `backup-milestone.sh` | Milestone backup (DB + storage + env) |
| `README.md` | Full workflow documentation |

---

## 3. Feature summary (branch commits)

### Admissions & enrollment (`1159e48`)

- End-to-end admissions workflow: applications, document review, payments, enrollment automation.
- Admission/rejection letters and payment invoices as PDFs.
- Barcode/QR verification on letters.

### Academics & programmes (`1d50bed`)

- Academics UI improvements and programme save fixes.
- Nginx deploy hardening for multi-site VPS.

### Production storage (`0aa6d2e`)

- Nginx config so institution logos and letter assets load on okusoma.com.

### System menu & institution branding (`2097f3d`, `b98b36d`, `ecaa535`)

- New **System** menu (General Settings moved from Access Control).
- Institution branding: **Header**, **Footer**, **Logo** (watermark on PDFs).
- Removed official stamp; footer image/text on admission documents.
- Admission/rejection/invoice PDFs match Letters module layout:
  - Header image at top
  - Footer image at bottom
  - Logo as centered watermark
- `BrandAssetUpload` component with live preview and upload-on-select.

### Account recovery (`5cc3b8b`)

- Sign-in: **Forgot username** (phone → WhatsApp) and **Forgot password** (phone → OTP → reset).
- Frontend recovery wizard on login page.

### Image upload fixes (`5cc3b8b`, `ecaa535`)

- Fixed multipart upload (removed manual `Content-Type` without boundary).
- `StorageUrl` / `publicFileUrl` for consistent asset URLs.
- Fixed upload bug where re-uploading logo/header deleted the file just written (same path delete-after-save).
- Backend returns `null` URL when file missing on disk (no broken previews).
- Cache-busted URLs after upload.

### Database & migrations (`b08a261`, `b98b36d`)

- Renamed duplicate migration classes blocking fresh PostgreSQL installs.
- `repair_programmes_semester_count_for_pgsql` migration.
- pgloader schema move (`school_management` → `public`) documented.

---

## 4. Key files changed (by area)

### Backend

- `app/Http/Controllers/Api/AuthController.php` — login, forgot username/password
- `app/Http/Controllers/Api/InstitutionController.php` — branding uploads
- `app/Institution.php` — footer field, URL accessors, file-exists check
- `app/Services/Letters/LetterAssetHelper.php` — PDF data URIs
- `app/Modules/Admissions/Services/*LetterService.php` — letter data
- `resources/views/admissions/{letter,rejection,invoice}.blade.php` — PDF layout

### Frontend

- `src/pages/ForgotPassword.tsx`, `Login.tsx` — account recovery
- `src/modules/Institutions/` — branding UI, upload service, previews
- `src/utils/publicFileUrl.ts` — storage URL resolution
- `vite.config.ts` — `/storage` dev proxy

### Deploy

- `deploy/nginx/okusoma.conf` — API + storage on same domain
- `deploy/db/*` — PostgreSQL sync and backup scripts

---

## 5. Known limitations & notes

1. **`migrate:fresh` on PostgreSQL** may still fail on legacy MySQL-only migration syntax; use pgloader from MySQL or pg_dump from an existing PG copy instead.
2. **Database sync does not include uploaded files** — always run `sync-storage-to-vps.sh` or re-upload branding after a DB sync.
3. **Branding assets** must be PNG/JPG for PDF embedding (DomPDF cannot render PDF inside `<img>`).
4. **Other local apps** remain on MySQL; only ASSMS uses PostgreSQL locally.
5. **`backups/`** directory is gitignored; milestone snapshots are kept locally and on VPS only.

---

## 6. Restore instructions

### Restore local database

```bash
dropdb school_management && createdb school_management
pg_restore -d school_management backups/admissions-v1.0.0-*/school_management.dump
```

### Restore production database

```bash
ssh alphabridge-ts
sudo gunzip -c /var/backups/school_management/admissions-v1.0.0-*/school_management.sql.gz | sudo -u postgres psql school_management
```

### Restore storage files

```bash
rsync -a backups/admissions-v1.0.0-*/storage-public/ backend-laravel/storage/app/public/
```

---

## 7. Git history (this branch, newest first)

```
ecaa535 Fix institution branding uploads and add local PostgreSQL VPS sync tooling.
b08a261 Fix duplicate Laravel migration class names blocking fresh installs.
b98b36d Align institution branding and admission PDFs with Letters module layout.
5cc3b8b Add account recovery flows and fix institution image uploads.
2097f3d Add System menu, institution footer branding, and letter layouts.
0aa6d2e Serve Laravel public storage files on okusoma.com via nginx.
1159e48 Enhance admissions workflow with letters, payments, and enrollment automation.
1d50bed Improve academics UI, fix programme save, and harden nginx deploy.
```

---

*Report generated at branch milestone v1.0.0-admissions — 11 June 2026.*
