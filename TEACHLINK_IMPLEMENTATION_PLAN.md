# TeachLink — Implementation Plan

Status: Living document, updated as phases complete. Phases 0–10 are all done (project skeleton, DB foundation, authentication, teacher profile backend + onboarding wizard, relational data, public profile page, teacher search/discovery incl. Find Teachers and Home pages, teacher profile dashboard with per-section editing). Phase 11 (hardening) and Phase 12 (deployment) are still TODO. §26 lists everything that changed relative to the original plan. This file is the source of truth for build order.

---

## 1. Project Overview

**TeachLink** is a public **teacher discovery and teacher profile platform**. Teachers create detailed professional profiles; anyone (students, parents, schools, coaching institutes, other teachers) can browse and search those profiles without logging in, to find a suitable teacher for tuition, coaching, online classes, or home tuition.

- **Primary users (v1):** Teachers (profile owners), anonymous visitors (discovery), Admin (moderation).
- **Main use case:** A parent/student searches by subject + class + board + city + teaching mode, browses teacher cards, opens a full profile, and finds a way to make contact.
- **Initial scope:** Teacher auth, teacher profile CRUD, public profile pages, search/filter, basic admin. **Not** a social network yet.
- **Future vision:** Verification, reviews, messaging, bookmarking, teacher communities, jobs, schools/institute accounts, premium profiles, resource marketplace. The architecture below is chosen so these can be added as new modules/tables without reworking the core.

## 2. Existing Tech Stack (as inspected in repo)

**Repo layout:**
```
teachlink/
├── backend/
│   ├── .env, .gitignore
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma          (single `User` model: id, email, password, name, createdAt)
│   │   └── migrations/20261002062941_init/
│   └── src/server.js              (Express app: helmet, cors, express.json, cookie-parser, rate-limit, GET /api/health)
└── frontend/
    ├── package.json               (Vite 8 + React 19, default template)
    ├── vite.config.js             (@vitejs/plugin-react only)
    └── src/App.jsx, main.jsx      (unmodified Vite starter template)
```

**Backend deps installed:** express 5, cors, dotenv, bcryptjs, jsonwebtoken, cookie-parser, helmet, express-rate-limit, zod, prisma 6 + @prisma/client 6, nodemon (dev).
**Added since:** multer (photo upload), morgan (HTTP request logging). **Not yet installed (backend):** sharp (image resizing), any structured logging lib (pino), test tooling.

**Frontend deps installed:** react 19, react-dom 19. Dev: vite 8, @vitejs/plugin-react, oxlint, @types/react(-dom).
**Added since:** react-router-dom, axios, Tailwind CSS (utility styling; no form library — forms are hand-rolled). **Not yet installed (frontend):** test tooling.

**Database:** MySQL, reachable via `DATABASE_URL` in `backend/.env`. One migration applied (`User` table only).

**Nothing else exists** — no routes, controllers, middleware, auth, or additional pages. This plan assumes a clean slate on top of this scaffold.

## 3. Architecture

- **Frontend:** Vite + React SPA (stay JS, no TypeScript migration). Add `react-router-dom` for routing and a thin `axios` instance (`src/api/client.js`) with `withCredentials: true` for cookie-based auth. Organize by feature folders, not just by type.
- **Backend:** Modular monolith, Express 5, layered as **routes → controllers → services → Prisma**. No microservices, no queues/Redis/WebSockets for v1 (noted only under Future Architecture).
- **Database:** MySQL via Prisma 6. Normalized schema (see §5) — lookup tables for subjects/grades/boards instead of enums/CSV strings, so admin can manage them and search can use proper joins/indexes.
- **Authentication:** JWT stored in an **HTTP-only, Secure, SameSite=Lax cookie** (not localStorage) to mitigate XSS token theft; `cookie-parser` already installed supports this. Short-lived access token + refresh token pair (see §6).
- **API organization:** REST, versioned under `/api/*` (no `/v1` prefix needed yet — add only if a breaking change is needed later), grouped by resource (`/api/auth`, `/api/teachers`, `/api/users`, `/api/admin`, `/api/lookups`).
- **File/image storage:** Not in MySQL. Local disk in dev (`backend/uploads/`, served statically or via a signed route), S3-compatible object storage (e.g., Cloudflare R2) in production. Store only the storage key/URL in the DB.
- **Security:** helmet, cors (locked to frontend origin + credentials), rate-limiting (already installed, needs per-route tuning), bcrypt password hashing, Zod validation on every mutating route, Prisma parameterization (no raw SQL) against injection.
- **Validation:** Zod schemas per route, backend-enforced always; frontend may mirror schemas for instant feedback but is never trusted alone.
- **Error handling:** Central Express error-handling middleware + an `AppError` class + `asyncHandler` wrapper, so controllers just `throw` and one place formats JSON error responses (`{ error: { message, code } }`) and logs server-side.

## 4. Recommended Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── server.js                # bootstraps app, starts listener
│   ├── app.js                   # express app + global middleware (testable without a listening port)
│   ├── config/
│   │   └── env.js               # reads & validates process.env once
│   ├── lib/
│   │   └── prisma.js            # single PrismaClient instance
│   ├── routes/
│   │   ├── index.js             # mounts all sub-routers under /api
│   │   ├── auth.routes.js
│   │   ├── teacher.routes.js
│   │   ├── user.routes.js
│   │   ├── lookup.routes.js     # subjects/grades/boards
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── teacher.controller.js
│   │   ├── user.controller.js
│   │   ├── lookup.controller.js
│   │   └── admin.controller.js
│   ├── services/                # business logic + Prisma calls live here, not in controllers
│   │   ├── auth.service.js
│   │   ├── teacher.service.js
│   │   └── search.service.js
│   ├── middleware/
│   │   ├── auth.js              # requireAuth, requireRole('TEACHER'|'ADMIN')
│   │   ├── errorHandler.js
│   │   ├── asyncHandler.js
│   │   └── validate.js          # wraps a Zod schema into middleware
│   ├── validators/
│   │   ├── auth.schema.js
│   │   ├── teacher.schema.js
│   │   └── search.schema.js
│   └── utils/
│       ├── AppError.js
│       ├── jwt.js
│       └── slugify.js
└── uploads/                      # dev-only local file storage (gitignored)

frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx                  # routes only
│   ├── api/
│   │   └── client.js            # axios instance
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── FindTeachers.jsx
│   │   ├── TeacherProfile.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── onboarding/          # Step1..StepN
│   │   ├── dashboard/
│   │   │   ├── TeacherDashboard.jsx
│   │   │   └── EditProfile.jsx
│   │   ├── admin/
│   │   └── NotFound.jsx
│   ├── components/
│   │   ├── layout/ (Navbar, Footer)
│   │   ├── teacher/ (TeacherCard, FilterBar, SubjectPicker, ...)
│   │   └── common/ (Button, Input, Spinner, ...)
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   └── useAuth.js, useTeacherSearch.js
│   └── utils/
```

Changes from current state: add `react-router-dom`, `axios` to frontend; introduce `src/app.js` split from `server.js` in backend for testability; create all folders above as features are built (don't scaffold empty folders prematurely — create per phase).

## 5. Database Design

Guiding rule: `User` holds only account/auth concerns. Everything teacher-specific lives in `TeacherProfile` and related tables, joined 1:1 to `User`. Lookup values (subjects, grades, boards, languages) are **relational tables**, not enums or CSV strings, because they need admin management, filtering, and many-to-many relationships. Fixed, non-manageable choices (teaching mode, role, profile status) are **Prisma enums**.

### Models

**User** (auth + identity only)
- `id` Int @id @default(autoincrement())
- `email` String @unique
- `username` String @unique (added during Phase 2 — login/registration identifier instead of email)
- `password` String (bcrypt hash)
- `role` Enum `UserRole { USER TEACHER ADMIN }` default `USER`
- `name` String
- `phone` String? (nullable, private — not shown on profile by default)
- `status` Enum `UserStatus { ACTIVE SUSPENDED }` default `ACTIVE`
- `isEmailVerified` Boolean @default(false) — reserved for later
- `createdAt`, `updatedAt`
- Relation: `teacherProfile TeacherProfile?` (1:1)

**TeacherProfile** (1:1 with User; the "big" profile table, but only core/scalar fields — collections are split out)
- `id` Int @id @default(autoincrement())
- `userId` Int @unique → FK User.id (1:1)
- `slug` String @unique (e.g. `rahul-kumar-123`, see §8)
- `headline` String?
- `bio` String? @db.Text
- `photoUrl` String?
- `gender` Enum `Gender { MALE FEMALE OTHER PREFER_NOT_TO_SAY }?` nullable
- `experienceYears` Int? 
- `qualificationSummary` String? (short free text, e.g. "M.Sc. Mathematics, B.Ed.")
- `country` String? , `state` String?, `city` String?, `area` String?, `pincode` String?
- `onlineAvailable` Boolean @default(false)
- `offlineAvailable` Boolean @default(false)
- `homeTuitionAvailable` Boolean @default(false)
- `studentCanVisit` Boolean @default(false)
- `groupTuitionAvailable` Boolean @default(false)
- `individualTuitionAvailable` Boolean @default(false)
- `demoClassAvailable` Boolean @default(false)
- `teachingRadiusKm` Int? (nullable; only relevant if home tuition)
- `feeMin` Int?, `feeMax` Int? (store in smallest currency unit or plain rupees — document the choice in code)
- `contactPreference` Enum `ContactPreference { PLATFORM_ONLY PHONE WHATSAPP }` default `PLATFORM_ONLY`
- `contactNumber` String? — **added after the original plan**: the number shown publicly when `contactPreference` is PHONE or WHATSAPP. Deliberately separate from the private `User.phone`, so a teacher can publish a different WhatsApp number. Required (server + client) whenever the preference is not `PLATFORM_ONLY`; only returned by the public API when the teacher opted in.
- `isPublished` Boolean @default(false) — draft vs public (see §7)
- `isVerified` Boolean @default(false) — reserved for future verification
- `profileViews` Int @default(0) — cheap counter, optional
- `createdAt`, `updatedAt`
- Indexes: `@@index([city])`, `@@index([isPublished])`

**Subject** (lookup, admin-managed)
- `id`, `name` @unique, `isActive` Boolean @default(true)

**Grade** (lookup — "Class 1".."Class 12", "UKG", "Competitive Exam", etc.)
- `id`, `name` @unique, `sortOrder` Int, `isActive` Boolean

**Board** (lookup — CBSE, ICSE, State Board, JAC, etc.)
- `id`, `name` @unique, `isActive` Boolean

**Language** (lookup)
- `id`, `name` @unique

**TeacherSubject** (join table, many-to-many)
- `teacherProfileId` → FK, `subjectId` → FK, composite `@@id([teacherProfileId, subjectId])`

**TeacherGrade** (join table) — same pattern with Grade

**TeacherBoard** (join table) — same pattern with Board

**TeacherLanguage** (join table) — same pattern with Language

**TeacherAvailability** (one-to-many — a teacher has several day/time slots)
- `id`, `teacherProfileId` → FK, `dayOfWeek` Enum (`MON`..`SUN`), `startTime` String/DateTime, `endTime` String/DateTime

**TeacherQualification** (one-to-many — degrees/certifications, since a teacher may have several)
- `id`, `teacherProfileId` → FK, `title` String (e.g. "B.Ed."), `institution` String?, `yearCompleted` Int?, `type` Enum `QualificationType { DEGREE CERTIFICATION OTHER }`

**TeacherExperience** (one-to-many — past schools/coaching jobs)
- `id`, `teacherProfileId` → FK, `institutionName` String, `role` String?, `startDate`, `endDate` (nullable = current), `description` String? @db.Text

### Relationship summary
- User ↔ TeacherProfile: **one-to-one**
- TeacherProfile ↔ Subject/Grade/Board/Language: **many-to-many** via join tables
- TeacherProfile ↔ TeacherAvailability/TeacherQualification/TeacherExperience: **one-to-many**
- Unique constraints: `User.email`, `TeacherProfile.userId`, `TeacherProfile.slug`, lookup `.name` fields
- Nullable by design: everything that isn't known at signup time (location, fees, bio, etc.) — a teacher account must be creatable with just `User` + an empty draft `TeacherProfile`
- Enums vs relational tables: use enums only for small, code-controlled, non-orderable-by-admin sets (role, status, gender, contact preference, day-of-week). Use relational tables for anything admin should be able to add/rename/deactivate (subjects, grades, boards, languages) — this is exactly what §12 Admin needs.
- Sensitive data never duplicated onto the public profile object: `User.email`, `User.phone`, `User.password` are never selected into a public-facing API response — only `TeacherProfile` fields + a computed `contactOption` are serialized (see §16).

This is a **design**, not a schema.prisma rewrite — implement incrementally per phase (§17), starting with `User.role`/`status` and `TeacherProfile` in Phase 1–3, then lookups, then join/detail tables.

## 6. Authentication & Authorization Plan

- **Registration:** `POST /api/auth/register` — email, password, name, role defaults to `USER`; a separate `POST /api/auth/register-teacher` (or a `role` field) creates `User{role: TEACHER}` + an empty draft `TeacherProfile`. Password hashed with bcryptjs (already installed), never returned in any response.
- **Login:** `POST /api/auth/login` validates credentials, issues an **access token** (JWT, ~15 min expiry) and a **refresh token** (JWT or random string, ~30 days), both set as HTTP-only, Secure (in prod), SameSite=Lax cookies. Avoid localStorage entirely (XSS risk).
- **Refresh:** `POST /api/auth/refresh` reads refresh cookie, issues a new access token. Store refresh tokens server-side (a `RefreshToken` table or hashed value) only if you want revocation; for MVP, a stateless short refresh TTL is acceptable — document as a deliberate simplification.
- **Logout:** `POST /api/auth/logout` clears both cookies (and deletes server-side refresh record if implemented).
- **Password reset / email verification:** Design hooks now (an `emailToken` style flow) but **do not build** in MVP — explicitly postponed (§19).
- **Roles:** `requireAuth` middleware verifies access token cookie and attaches `req.user`; `requireRole('TEACHER')` / `requireRole('ADMIN')` middleware gate specific routes (e.g., only the owning teacher or admin can edit a `TeacherProfile`).
- **Why cookies over localStorage:** HTTP-only cookies aren't readable by JS, which blocks the most common XSS token-theft vector; `cors({ origin: FRONTEND_URL, credentials: true })` + `SameSite=Lax` keeps CSRF risk low for a same-site API+SPA setup. Revisit CSRF tokens if the frontend and API ever live on different top-level domains with cross-site requests.

## 7. Teacher Onboarding Flow

Multi-step, **save-as-draft at every step** (`TeacherProfile.isPublished = false` until the teacher explicitly publishes). Only `email`/`password`/`name` are mandatory at account creation; everything else is optional until publish.

1. **Create account** — email, password, name → `User{role:TEACHER}` + empty `TeacherProfile` draft created together.
2. **Basic profile** — photo, headline, bio, gender (optional), languages.
3. **Professional details** — qualifications, experience entries, years of experience.
4. **Subjects / classes / boards** — multi-select from lookup tables.
5. **Tuition preferences** — online/offline/home/group/individual/demo flags, fee range.
6. **Location** — country/state/city/area/pincode.
7. **Availability** — day/time slots.
8. **Review** — show the assembled public profile preview.
9. **Publish** — sets `isPublished = true`; minimum-required-fields check happens here (e.g., require at least name, one subject, one grade, city, one teaching mode) before allowing publish.

A teacher can log back in and resume at the last incomplete step, or edit any step later from the dashboard (§17 Phase 4/7).

## 8. Public Teacher Profile

- **URL:** `/teachers/:slug` where `slug` = `slugify(name) + '-' + shortId` (e.g. `rahul-kumar-4f8a`), generated once at first publish and stored on `TeacherProfile.slug`. Avoids exposing the numeric DB id, stays human-/SEO-readable, and avoids collisions without a sequential counter.
- **Public fields:** name, photo, headline, bio, subjects, grades, boards, experience years, qualifications (title/institution/year — no documents), location (city/area, not pincode), teaching modes, fee range, availability, `contactPreference`-driven contact action, verification badge (future).
- **Private fields, never serialized publicly:** email, phone (unless teacher explicitly sets `contactPreference = PHONE`), password, pincode, any verification documents, internal flags (`profileViews` can stay private or public — product decision, not technical).
- **SEO:** server-render-free SPA means these pages won't be crawlable by default — see §22 for the phased fix; for now, set `document.title` and meta description client-side via a small hook as a stopgap.
- **Contact privacy:** default `PLATFORM_ONLY` — visitor fills a contact-request form (even without login, with basic abuse protection/rate-limit) rather than seeing a raw phone number; teacher can opt into showing phone/WhatsApp directly.
- **Mobile layout:** profile page must work as a single-column stack (photo/header → key facts → bio → subjects/grades/boards chips → availability → contact action), since most discovery traffic will be mobile.

## 9. Teacher Search & Filtering

- **Endpoint:** `GET /api/teachers?subject=math&grade=10&board=cbse&city=bokaro&mode=offline&feeMax=1000&page=1&pageSize=20&sort=experience_desc`
- **Filters:** subject, grade, board, city/area, language, teaching mode (online/offline/home/group/individual), experience (min), fee range, verified (future).
- **Sorting:** relevance (default — e.g. published recently / profile completeness), experience, fee (asc/desc).
- **Pagination:** offset-based (`page`/`pageSize`) is sufficient at this scale; cap `pageSize` (e.g. max 50).
- **Query design:** parse/validate query params with a Zod schema (`search.schema.js`), translate into a Prisma `where` built from join-table filters (`subjects: { some: { subject: { name: ... } } }` etc.), always filter `isPublished: true` and `User.status: ACTIVE`.
- **Indexes:** `TeacherProfile.city`, `TeacherProfile.isPublished`, and the composite PKs on join tables already give efficient lookups for the filters above; add `@@index` on join-table FK columns if query plans show it's needed once there's real data volume.
- **Performance:** fine at MVP scale with plain indexed SQL; do not introduce Elasticsearch/Redis caching until there's a measured need (see §23).

## 10. Frontend Pages (MVP)

| Page | Purpose | Key UI | Key actions |
|---|---|---|---|
| Home | Landing/marketing + quick search | Hero, search box, how-it-works | Jump to Find Teachers |
| Find Teachers | Search & filter results | FilterBar, TeacherCard grid, pagination | Apply filters, open profile |
| Teacher Profile | Public profile | All public fields, contact CTA | Send contact request |
| Register | Create account (user or teacher) | Form, role toggle | Submit → onboarding or home |
| Login | Authenticate | Form | Submit → dashboard/home |
| Teacher Onboarding (multi-step) | Build profile | Stepper, per-step forms | Save & continue, publish |
| Teacher Dashboard | Overview for logged-in teacher | Profile completeness, status, quick links | Edit profile, view own public page |
| Edit Profile | Update any profile section post-onboarding | Same forms as onboarding, pre-filled | Save changes |
| Account Settings | Change password/basic account info | Form | Update, logout |
| Admin (basic) | Moderation | Tables: users, teachers, lookups | Suspend, hide, manage lookups |
| 404 | Unknown route | Message + home link | Navigate home |

## 11. Backend API Plan

**`/api/auth`**
- `POST /register` — public — create USER account
- `POST /register-teacher` — public — create TEACHER account + draft profile
- `POST /login` — public — sets auth cookies
- `POST /logout` — auth required — clears cookies
- `POST /refresh` — public (reads refresh cookie) — new access token
- `GET /me` — auth required — current user + role

**`/api/teachers`**
- `GET /` — public — search/filter/paginate (see §9)
- `GET /:slug` — public — full public profile
- `POST /` — auth (TEACHER) — create/init own profile (if not auto-created at registration)
- `PATCH /me` — auth (TEACHER) — update own profile (any onboarding step)
- `POST /me/publish` — auth (TEACHER) — validate required fields, set `isPublished`
- `POST /me/subjects`, `/me/grades`, `/me/boards`, `/me/languages` — auth (TEACHER) — set many-to-many selections
- `POST /me/qualifications`, `/me/experience`, `/me/availability` — auth (TEACHER) — CRUD sub-resources

**`/api/users`**
- `GET /me` — auth required — basic account info
- `PATCH /me` — auth required — update name/password

**`/api/lookups`**
- `GET /subjects`, `GET /grades`, `GET /boards`, `GET /languages` — public — active lookup values for filters/forms

**`/api/admin`** (all routes `requireAuth` + `requireRole('ADMIN')`)
- `GET /users`, `PATCH /users/:id/status` — list/suspend
- `GET /teachers`, `PATCH /teachers/:id/visibility` — list/hide
- `POST /subjects`, `PATCH /subjects/:id`, same for grades/boards/languages — manage lookups

Every mutating route: Zod-validated body, `asyncHandler`-wrapped, ownership-checked where relevant (a teacher can only PATCH their own profile — enforced by using `req.user.id` to find the profile, never a client-supplied id).

## 12. Admin Plan (MVP only)

- View users (basic table: email, name, role, status, createdAt)
- View teachers (table: name, city, published?, verified?, createdAt)
- Suspend/reactivate a `User` (blocks login; published profile should be hidden when suspended)
- Hide/unhide a `TeacherProfile` (sets `isPublished=false` without deleting data)
- Manage Subject/Grade/Board/Language lookup lists (create, rename, deactivate — never hard-delete if referenced)
- **Not in MVP:** reports/flagging workflow, analytics dashboards, bulk actions — postponed (§19).

## 13. Image / File Storage Plan

- **Never store image bytes in MySQL** — store only a URL/key string on `TeacherProfile.photoUrl`.
- **Local dev ✅ DONE (pulled forward during Phase 4):** `multer` saves uploads to `backend/uploads/` (gitignored, `.gitkeep` tracked), served statically at `/uploads/*` via `express.static` with `Cross-Origin-Resource-Policy: cross-origin` (needed since frontend/backend run on different ports and Helmet's default policy would otherwise block the `<img>` load). Endpoint: `POST /api/teachers/me/photo` (multipart, field name `photo`), `requireAuth` + `requireRole('TEACHER')`, old photo file deleted on replacement. Frontend has a real click/drag-to-upload `PhotoUploadField` with instant preview, replacing the earlier URL-text-field placeholder.
- **Production (still TODO):** move to an S3-compatible bucket (Cloudflare R2 recommended — low cost, S3 API, no egress fees) using `@aws-sdk/client-s3`; backend generates a pre-signed upload URL or proxies the upload, then stores the resulting object URL instead of the local `/uploads/...` path.
- **File naming ✅ DONE:** `${userId}-${uuid}.${ext}`, extension derived from validated mimetype (not client-supplied filename) to avoid collisions/path traversal.
- **Upload limits ✅ DONE:** 5MB cap, mimetypes restricted to `image/jpeg|png|webp` at the multer `fileFilter` layer, both client-side (instant feedback) and server-side (authoritative) — multer/fileFilter errors are converted to proper 400 `AppError` responses rather than falling through to a generic 500.
- **Validation (partial):** mimetype is checked; magic-byte verification beyond the `Content-Type` header is still TODO, deferred as low-priority since this is single-user-uploaded content, not untrusted third-party input at scale yet.
- **Resizing/compression (still TODO):** add `sharp` later (Phase 10+) to generate a thumbnail + capped max-dimension version on upload; not required for MVP functionality.

## 14. Validation (Zod)

Backend validation is mandatory on every mutating endpoint; frontend may reuse the same shape for instant feedback but never substitutes for backend checks.

- `auth.schema.js`: `registerSchema` (email, password min length/complexity, name), `loginSchema` (email, password)
- `teacher.schema.js`: `basicInfoSchema`, `professionalInfoSchema`, `tuitionPrefsSchema`, `locationSchema`, `availabilitySchema`, `publishSchema` (cross-field: requires minimum fields present)
- `search.schema.js`: validates/coerces query params (subject/grade/board as strings or arrays, numeric fee/experience bounds, page/pageSize bounds, enum-checked `mode`/`sort`)
- `validate.js` middleware: `validate(schema, 'body' | 'query')` parses and replaces `req.body`/`req.query`, returns 400 with field errors on failure.

## 15. Security Plan

- Passwords hashed with bcryptjs (cost factor ≥ 10); never log or return password fields.
- Auth via HTTP-only, Secure (prod), SameSite=Lax cookies — not localStorage.
- JWT: short access-token TTL, signed with a strong `JWT_SECRET` from env, `iss`/`aud` claims optional but recommended.
- Rate limiting: already installed — apply a stricter limiter specifically on `/api/auth/*` (e.g. 10 req/15min) in addition to the global one, to blunt brute force.
- Helmet: keep default protections on; review CSP once the frontend origin/CDN usage is finalized.
- CORS: `origin: FRONTEND_URL, credentials: true` — never `origin: '*'` once cookies are in play.
- SQL injection: mitigated by Prisma's parameterized queries — never build raw SQL string concatenation.
- XSS: React escapes by default — avoid `dangerouslySetInnerHTML`; sanitize any rich-text bio field if rich text is ever allowed.
- CSRF: low risk with SameSite=Lax + same-site cookie setup; revisit with CSRF tokens only if frontend/backend end up on different top-level domains.
- File upload security: mimetype + size validation, randomized filenames, never execute uploaded files, serve from a non-executable path.
- Input sanitization: trim/normalize strings server-side (e.g. lowercase email) beyond Zod's type checks.
- Environment variables / secrets: never commit `.env` (already gitignored); separate secrets per environment; rotate `JWT_SECRET` capability considered for later.
- Account enumeration: login/register error messages should not reveal whether an email exists ("invalid email or password" generic message).
- Login brute force: covered by the stricter auth rate limiter above; consider account lockout/backoff only if abuse is observed.

## 16. Privacy Plan

- Public by default: name, photo, headline, bio, subjects/grades/boards, experience, qualifications (title/institution/year only — no uploaded certificates), city/area, teaching modes, fee range, availability.
- Private by default, never in public API responses: email, phone/WhatsApp number, exact pincode/address, date of birth (collect only if a real feature needs it — currently none does, so **don't collect it in MVP**), verification documents.
- `contactPreference` controls the one exception: a teacher can explicitly opt in to showing phone/WhatsApp on their public profile; default stays `PLATFORM_ONLY` (a contact-request form that doesn't expose raw contact info).
- Any future verification documents (ID proof, certificates) go in a separate, admin-only-readable storage path/table — never attached to the public profile response.

## 17. Phase-wise Implementation

### Phase 0 — Project Cleanup & Foundation ✅ DONE
- **Objective:** Replace starter templates with real app shells.
- **Backend:** split `server.js` into `app.js` (middleware/routes) + `server.js` (listener); add `config/env.js`, `lib/prisma.js`, `middleware/errorHandler.js`, `middleware/asyncHandler.js`.
- **Frontend:** install `react-router-dom`, `axios`; replace default `App.jsx` with a `<Routes>` shell and placeholder pages; add `src/api/client.js`.
- **DB changes:** none yet.
- **Files created:** as listed in §4 (skeletons only).
- **Dependencies to add:** `react-router-dom`, `axios` (frontend).
- **Testing checklist:** `GET /api/health` still works through new `app.js`; frontend renders routed placeholder pages; `npm run dev` works on both sides.
- **Definition of Done:** clean skeleton in place, nothing hardcoded from the old starter remains.

### Phase 1 — Database Foundation ✅ DONE
- **Objective:** Model the real schema (without join/detail tables yet).
- **Backend:** update `schema.prisma`: add `role`/`status` to `User`; add `TeacherProfile` (scalar fields only, no relations beyond `userId`); add `Subject`, `Grade`, `Board`, `Language` lookup tables (empty).
- **DB changes:** new migration `add_teacher_profile_and_lookups`; seed script (`prisma/seed.js`) for initial Subject/Grade/Board/Language rows.
- **API changes:** none yet (schema only).
- **Files:** `prisma/seed.js`.
- **Testing checklist:** migration applies cleanly; seed populates lookup tables; Prisma Studio shows correct relations.
- **Definition of Done:** schema matches §5 for core tables; seed data present.

### Phase 2 — Authentication ✅ DONE
- **Objective:** Working register/login/logout/me with cookie-based JWT.
- **Backend:** `auth.service.js`, `auth.controller.js`, `auth.routes.js`, `utils/jwt.js`, `utils/cookies.js`, `utils/slugify.js`, `middleware/auth.js` (`requireAuth`, `requireRole`), `middleware/validate.js`, `validators/auth.schema.js`.
- **Frontend:** `AuthContext`, `useAuth` hook, and a combined `AuthModal` (login/register toggle in one modal, triggered from nav "Log in"/"Sign up" buttons) instead of separate `/login` and `/register` pages — a deliberate deviation from the original plan for a more modern UX.
- **DB changes:** added `User.username` (`@unique`, alongside email) beyond the original Phase 1 scope, per a later requirement — login/registration now use `username`, not email, as the identifier.
- **API:** `/api/auth/*` from §11, with `register`/`register-teacher` now requiring `username` + `confirmPassword` in addition to name/email/password, and `login` taking `username` + `password`.
- **Testing checklist:** register → login → `GET /me` returns correct user; logout clears cookies; wrong username/password rejected with generic message; duplicate email and duplicate username both rejected with distinct error codes; protected route rejects unauthenticated requests. All verified via curl.
- **Definition of Done:** a teacher and a normal user can both sign up and log in through the modal; sessions persist across reload via cookie.
- **Session refresh (bug found and fixed later):** the access cookie lasts 15 minutes and the refresh cookie 30 days, but the frontend originally never called `POST /api/auth/refresh`, so every user was effectively logged out after ~15 minutes (requests failed with 401 and a page reload showed them logged out). Fixed in `frontend/src/api/refresh.js` + `client.js`: an axios response interceptor renews the access token on a 401 and retries the request **once**, concurrent 401s share a single refresh call, `/auth/*` endpoints are excluded (so a wrong password still surfaces as a normal 401), and a failed refresh fires a `auth:session-expired` event that clears the user. `AuthContext.loadUser` also refreshes before treating a returning visitor as logged out. Verified with 11 automated checks (expired token, parallel requests, wrong password, suspended user, bad refresh token, no retry loop).

### Phase 3 — Teacher Profile Backend ✅ DONE
- **Objective:** CRUD for a teacher's own profile, still without join tables.
- **Backend:** `teacher.service.js`, `teacher.controller.js`, `teacher.routes.js`, `validators/teacher.schema.js` (single `updateProfileSchema` covering basic/professional/tuition/location fields, all optional for partial PATCH updates, with a `feeMin <= feeMax` cross-field check); `POST /me/publish` and `POST /me/unpublish` with minimum-field validation.
- **DB changes:** none beyond Phase 1 schema.
- **API:** `GET /api/teachers/me` (own full profile), `PATCH /api/teachers/me`, `POST /api/teachers/me/publish`, `POST /api/teachers/me/unpublish`, `GET /api/teachers/:slug` (public, scalar fields only for now).
- **Publish rule implemented:** requires `city`, at least one of online/offline/home-tuition, and a headline or bio. (Subject/grade/board minimums will be added once those join tables exist in Phase 5.)
- **Testing checklist:** ownership enforced implicitly (profile looked up by `req.user.sub`, never a client-supplied id); non-teacher role gets 403 on `/api/teachers/me`; publish blocked with a clear combined error message until required fields present; public GET excludes private fields (`pincode`, `profileViews`, raw ids) and 404s for unpublished/suspended/unknown slugs. All verified via curl.
- **Definition of Done:** a teacher can fill out and publish a profile with scalar fields; profile is fetchable by slug.

### Phase 4 — Teacher Onboarding Frontend ✅ DONE (scalar fields only)
- **Objective:** Multi-step onboarding UI matching §7, scoped to the scalar `TeacherProfile` fields that exist as of Phase 3 (subjects/grades/boards/availability step will be added once Phase 5 lands those tables).
- **Frontend built:** `api/teacherApi.js` (get/update/publish/unpublish); `components/onboarding/Stepper.jsx`, `FormField.jsx`; five steps — `StepBasicInfo`, `StepProfessional`, `StepTuition`, `StepLocation`, `StepReview` — assembled in `pages/onboarding/OnboardingWizard.jsx`; `components/common/ProtectedRoute.jsx` (auth + role guard) protecting the new `/onboarding` route; a "My Profile" nav link shown only to `TEACHER`-role users.
- **Save-as-draft behavior:** each step's fields are PATCHed to `/api/teachers/me` on "Save & Continue" (not on every keystroke), so partial progress is persisted to the DB immediately and a refresh resumes with whatever was last saved — not purely local/unsaved state.
- **Publish:** final step calls `POST /api/teachers/me/publish`; the existing Phase 3 server-side rule (city + a teaching mode + headline/bio) is the actual gate — the wizard surfaces the server's error message rather than re-implementing the rule client-side, so the two can't drift out of sync.
- **Testing checklist:** `npm run build` passes clean; manual browser walkthrough confirmed by user (registered as teacher, nav showed "My Profile", wizard reachable and functional).
- **Post-launch refinements (same phase, added after initial user feedback):** per-step client-side validation (required-field asterisks on Headline/Teaching Modes/City, inline errors, blocks "Save & Continue" until fixed) instead of only surfacing errors at final publish; a live "Profile Strength" percentage meter with encouraging copy; a live preview panel showing the profile card updating in real time as fields change; a real click/drag-to-upload photo picker (see §13) replacing the original URL-text-field placeholder.
- **Definition of Done:** a teacher can go from registration to a published scalar-field profile end-to-end in the UI.

### Phase 5 — Relational Data (Subjects/Grades/Boards/Languages + sub-resources) ✅ DONE
- **Objective:** Add many-to-many and one-to-many detail tables.
- **Backend built:** join tables `TeacherSubject/Grade/Board/Language`; detail tables `TeacherQualification`, `TeacherExperience`, `TeacherAvailability` (migration `add_relational_teacher_dat`). Public lookups at `GET /api/lookups/subjects|grades|boards|languages` (active values only; grades ordered by `sortOrder`).
- **API as built:** selections use `PUT /api/teachers/me/subjects|grades|boards|languages` with `{ ids: [...] }` — each call **replaces the whole selection in one transaction** (delete + `createMany` with `skipDuplicates`), rather than the incremental `POST`s sketched in §11. Qualifications, experience and availability have `POST /me/<x>` and `DELETE /me/<x>/:id` (ownership checked against the caller's own profile). Every mutating call returns the full, re-shaped own profile.
- **Publish rule extended:** now also requires at least one subject and one grade (the Phase 3 note that this would follow once the tables existed).
- **Frontend built:** onboarding steps for Subjects (subjects/classes/boards/languages multi-selects), Professional (qualifications + experience sub-forms) and Availability (day/time slots), plus `api/lookupApi.js`.
- **Seed:** lookup tables are empty until `npm run prisma:seed` (alias for `prisma db seed`) is run — required on every fresh database.
- **Not built:** editing an existing qualification/experience/availability row — only add and delete exist (edit = delete + re-add). Revisit if this becomes annoying.
- **Definition of Done:** full §5 schema implemented; onboarding captures all planned fields. ✅

### Phase 6 — Public Teacher Profile (full) ✅ DONE (contact form deferred to Phase 9)
- **Objective:** Complete public profile page per §8.
- **Backend:** `GET /api/teachers/:slug` joins subjects/grades/boards/languages/qualifications/experience/availability and serialises through `toPublicProfile`, which excludes email, phone, pincode, `profileViews` and raw ids. 404 for unpublished, suspended or unknown slugs. `contactNumber` is **not** returned (only `hasContactNumber`); see the Phase 9 "See contact" gate.
- **Frontend:** `pages/TeacherProfile.jsx` renders the shared `components/profile/ProfileView.jsx` (see Phase 8) in read-only mode: empty sections/tabs are hidden, `document.title` is set to the teacher's name, and a friendly "Teacher not found" page covers 404s. When the teacher opted in to showing a number, visitors see a "See contact number" button; after login and unlock it becomes a Call/WhatsApp button (`tel:` / `wa.me/<digits>` links).
- **Deferred:** the platform contact-request form is Phase 9; the SEO items in §22 (sitemap, robots, JSON-LD) are still TODO.
- **Definition of Done:** any visitor can view a complete, correctly-scoped public profile. ✅

### Phase 7 — Teacher Search & Discovery ✅ DONE
- **Backend:** `GET /api/teachers` (`validators/search.schema.js`, `services/search.service.js`). Filters, all optional: `subject`, `grade`, `board`, `language` (names; comma-separated list = match **any**, different filters combine with AND), `city` (partial match on city **or** area), `mode` (`online|offline|home|visit|group|individual|demo`), `feeMax` (teacher's lowest fee ≤ value; teachers with no fee are excluded when used), `experienceMin`, `sort` (`newest` default | `experience_desc` | `fee_asc` | `fee_desc`), `page`, `pageSize` (default 12, max 50). Always restricted to `isPublished` + `User.status = ACTIVE`. Returns **card-sized public data only** plus `pagination { page, pageSize, total, totalPages }`; ties are broken by `id` so pagination is stable. Invalid input returns 400 with a clear message; blank values (`?city=`) are ignored.
- **Fix made along the way:** Express 5 makes `req.query` read-only, so `middleware/validate.js` now handles `source = "query"` by redefining the property instead of assigning to it.
- **Frontend:** `pages/FindTeachers.jsx`, `components/teacher/FilterBar.jsx`, `components/teacher/TeacherCard.jsx`. Filters, sort and page live in the **URL** (shareable/bookmarkable, survives refresh/back). Subject, Class and City are always visible; Board, Mode, Language, Experience and Max fee sit under a collapsible **"More filters"** button with an active-count badge (auto-opens when a shared link sets one). Text inputs debounce 400 ms; stale responses are discarded; empty-state and pagination handled.
- **Home page (`pages/Home.jsx`, added scope):** hero with a Subject + City quick search that deep-links into Find Teachers, quick subject chips, a "Newly joined teachers" row (newest 6 via the same search endpoint), a "How it works" strip, and an "Are you a teacher?" call-to-action that opens sign-up with the teacher checkbox pre-ticked (hidden for logged-in teachers).
- **Known behaviour:** sorting by fee ascending lists teachers with no fee first (MySQL null ordering). Decide later whether to push them last or hide them.
- **Definition of Done:** a visitor can search and filter to a relevant teacher list from Home/Find Teachers. ✅

### Phase 8 — Teacher Dashboard & Profile Management ✅ DONE
- **Objective:** Logged-in teacher can review/edit everything post-onboarding.
- **Built:** the nav's **My Profile** now links to `/dashboard` (`pages/dashboard/MyProfile.jsx`), not the wizard. It shows a status bar (Draft/Published badge, **Publish/Unpublish** button, "View public page" link, profile-strength meter, server publish errors) above the profile itself. A brand-new teacher with no headline and no subjects is redirected to `/onboarding` first.
- **Profile layout:** `components/profile/ProfileView.jsx` is **one component shared by the owner dashboard and the public page** — a sticky identity card (photo, name, headline, location, experience, fee, teaching modes, contact button) beside tabs (About · Teaching · Experience · Availability). Owner mode adds **Edit / + Add** buttons per block; public mode hides empty tabs.
- **Per-section editing:** `components/profile/EditSectionModal.jsx` opens the matching onboarding step component in a modal (Esc / backdrop / Cancel close it), validates with the same `validateStep` rules, and saves via the shared `components/onboarding/stepSave.js` (also now used by the wizard, so the two can't drift). Sub-resources (qualifications, experience, slots) still save immediately on add/remove; closing the modal refetches the profile.
- **Account Settings (added later):** `/settings` (any logged-in user; reached by clicking "Hi, <name>" in the nav). *Account details* — username and email are shown read-only; name and a private phone number are editable (`PATCH /api/users/me`, which can only ever change `name` and `phone`, never role or email). The phone only pre-fills the phone field when the user sends a contact request; it is never public. *Change password* (`POST /api/users/me/password`) — current password, new password (min 8) and confirmation; a wrong current password returns **400 `INVALID_PASSWORD`, not 401**, so the session isn't treated as expired. Reading the current user stays `GET /api/auth/me` (no separate `GET /api/users/me`). Other devices' sessions are **not** invalidated by a password change (tokens are stateless).
- **Not built:** view-count display; editing (rather than delete + re-add) of qualifications, experience and availability.
- **Definition of Done:** a teacher can fully self-manage their profile without developer intervention. ✅

### Phase 9 — Contact Flow ✅ DONE (login required — deliberate change)
- **Decision:** contacting a teacher **requires an account** (the original plan allowed anonymous contact). Reasons: the teacher sees exactly who is writing, abuse can be limited per account and traced, a sender gets a request history, and the plain `USER` role finally has a purpose.
- **Backend:** `ContactRequest` model (`teacherProfileId`, `senderId`, `message`, optional `phone`, `isRead`, `createdAt`; migration `add_contact_requests`).
  - `POST /api/teachers/:slug/contact` — any logged-in user. Message 10–1000 chars, optional phone (same pattern as `contactNumber`). Only published profiles of active teachers (404 otherwise); a teacher can't contact themselves (400); the sender's account must be ACTIVE; **limit of 5 requests per sender per rolling 24 h** (429 `RATE_LIMITED`), enforced from the database rather than per IP.
  - `GET /api/contact-requests/received` (TEACHER) — own requests, newest first (max 100) with `unreadCount`; includes the sender's name, **account email** and optional phone, shared with that teacher only.
  - `GET /api/contact-requests/received/unread-count` (TEACHER) — for the nav badge.
  - `PATCH /api/contact-requests/:id/read` (TEACHER) — scoped to the caller's own profile, so another teacher's id is simply a 404.
  - `GET /api/contact-requests/sent` (any logged-in user) — own sent requests; the teacher link is dropped if the profile has since been unpublished.
- **Frontend:** a **"Contact teacher"** button on the public profile card (`ProfileView` `onContact`). Logged-out visitors get the login modal and, once signed in, the form opens automatically. `ContactModal` has a message box with a character counter, an optional phone field, validation mirroring the server, and a "Request sent" confirmation. New `/requests` page (any logged-in user): **Received** tab for teachers (New badge, mailto/tel links, "Mark as read") and **Sent** tab. The nav shows a **Requests** link with an unread badge for teachers, refreshed on every route change.
- **Privacy:** the teacher's own email/phone is never exposed through the request flow.
- **"See contact" gate (added after first build):** a teacher's opted-in `contactNumber` is **no longer in any public response**. `GET /api/teachers/:slug` returns only `hasContactNumber` (true when the teacher opted in via `contactPreference` and entered a number). Logged-in users unlock it through `GET /api/teachers/:slug/contact-number` (published + active + opted-in teachers only; everything else is a uniform 404 so the endpoint can't be used to discover who has a number). Limit: **20 new teachers per account per rolling 24 h** (429); numbers already unlocked stay available and a teacher can always read their own. Each first unlock is recorded in a new `ContactReveal` table (unique per viewer + teacher; migration `add_contact_reveals`) — nothing displays it yet, but it enables a future "who viewed your number" feature. On the profile, anonymous visitors see **See contact number / See WhatsApp number**; clicking opens the login modal and the number loads automatically after login, then becomes a Call/WhatsApp button. An unlocked number is hidden again if the visitor logs out.
- **Testing done:** 20 automated API checks for the request flow plus 17 for the contact-number gate, against the real database (temporary users, cleaned up afterwards) — anonymous 401, validation, self-contact, unpublished/unknown slug 404, send, teacher-to-teacher, role/ownership (403/404), unread counts, mark read, sent list, no password leakage, and the 6th request in a day returning 429. The frontend compiles and lints clean; the UI itself has **not** been walked through in a browser yet.
- **Known gaps:** teachers get no email notification (dashboard only — needs an email provider, §25 #3); a teacher viewing their own public page still sees the Contact button and gets a "your own profile" error if they use it; no reply/thread feature (replying happens off-platform via the shown email/phone); no delete/archive.
- **Definition of Done:** a logged-in visitor can reach a teacher without the teacher's raw phone number being exposed by default. ✅

### Phase 10 — Admin Basics ✅ DONE
- **Objective:** §12 admin capabilities.
- **Schema changes (migration `add_admin_moderation`):** `TeacherProfile.isHiddenByAdmin` (separate from `isPublished`, so a teacher **cannot undo a hide by re-publishing**) and `Language.isActive` (the other three lookups already had it).
- **Access control:** every `/api/admin/*` route runs `requireAuth` then a new `requireActiveAdmin`, which **re-reads the user from the database** — a forged/stale token role, a demoted admin or a suspended admin gets a 403 immediately instead of when the 15-minute token expires.
- **Backend:** `admin.routes.js` / `admin.controller.js` / `admin.service.js` / `validators/admin.schema.js`.
  - `GET /api/admin/users` (search `q` over name/username/email, `role`, `status`, pagination; never selects the password hash) and `PATCH /api/admin/users/:id/status` (`ACTIVE`/`SUSPENDED`). An admin can't change their own status, and **admin accounts can't be suspended through the API** (managed in the database).
  - `GET /api/admin/teachers` (search, `visibility = published|draft|hidden`, pagination; each row carries an `isVisible` flag = what a visitor can actually see, and no private fields) and `PATCH /api/admin/teachers/:id` with `isHiddenByAdmin` and/or `isVerified`. Verification is a **manual badge toggle only** — there is still no verification workflow (§19).
  - `GET|POST /api/admin/lookups/:type` and `PATCH /api/admin/lookups/:type/:id` for `subjects|grades|boards|languages`: list includes inactive items with a `teacherCount`; create trims the name and returns 409 on a case-insensitive duplicate; new grades are appended after the last `sortOrder`; update can rename, (de)activate and (grades) reorder. **No delete endpoint** — items are deactivated because profiles reference them. Deactivated items vanish from public lookups and search filters, while teachers who already have them keep them.
- **Moderation effects (verified):** a suspended account's public page 404s, it disappears from search, login returns 403, and `/api/auth/me` returns 403 and clears the cookies, so the user is signed out on their next page load. A hidden profile 404s publicly, drops out of search, can't be contacted, its number can't be unlocked, and the teacher gets `403 PROFILE_HIDDEN` if they try to publish.
- **Frontend:** `/admin` (ADMIN only; nav link shown only to admins) with three tabs — **Users** (search, role/status filters, Suspend/Reactivate with a confirm), **Teachers** (search, visibility filter, Hide/Unhide, Verify/Unverify, status badges) and **Subjects & lists** (switch between subjects/classes/boards/languages, add, rename inline, activate/deactivate with a usage-aware confirm). Shared `Pagination` component and `useDebouncedValue` hook. A teacher whose profile is hidden sees a red "Hidden by an administrator" badge and notice on My Profile, with the Publish button disabled.
- **Creating the first admin:** there is deliberately no default password and no sign-up path to ADMIN. Put `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (min 8 chars, optional `ADMIN_NAME`) in `backend/.env` and run `npm run prisma:seed`. If the username already exists it is promoted to ADMIN and its password is left untouched. If none of the three are set the seed skips the admin step; if only some are set it fails with a message naming the missing variable (e.g. `missing ADMIN_EMAIL in .env`) rather than silently skipping — all three are required. Remove the password from `.env` afterwards if you prefer.
- **Testing done:** 56 automated API checks against the real database (temporary users/lookups, cleaned up afterwards): auth/role gating incl. forged role and suspended admin, user list/filters/no password leak, suspend/reactivate and their effect on login, `/me`, public page and search, hide/unhide and every place a hidden profile must disappear, verify badge, and the full lookup lifecycle (create, duplicate, rename, deactivate, public visibility, ordering, no hard delete). The earlier contact (20) and number-unlock (17) suites were re-run and still pass; the seed's admin creation/promotion was verified. The admin UI compiles and lints but has **not** been walked through in a browser.
- **Known gaps:** no audit log of who suspended/hid whom or why (no reason field either); no reports/flagging workflow or bulk actions (still §19); suspended users' existing access tokens stay valid for up to 15 minutes for endpoints that don't re-check status (login, refresh, `/me`, contact and admin routes do); admin password can't be changed in-app (no Account Settings yet).
- **Definition of Done:** a seeded admin account can moderate users/teachers and manage lookup lists. ✅

### Phase 11 — Security, Testing, Optimization
- **Objective:** Harden before launch.
- **Backend:** tighten rate limits on auth, review Helmet/CORS config for prod domains, add indexes if query plans need them, add `sharp` image resizing, write integration tests for auth/profile/search.
- **Secrets & credentials (found during Phase 10 setup):** `backend/.env` still has the placeholder `JWT_SECRET=change_this_secret` / `JWT_REFRESH_SECRET=change_this_refresh_secret` — anyone who knows them can forge a login token, including an ADMIN one. Replace both with long random values (and different from each other), and use separate values per environment. Use a strong admin password (the dev `admin123` passes the 8-character minimum but is not acceptable for a public deployment); consider removing `ADMIN_PASSWORD` from `.env` after the admin is seeded. Consider failing startup in production if the JWT secrets are the placeholder values.
- **Suspension gap:** a suspended user's existing access token stays valid for up to 15 minutes on endpoints that don't re-check status — decide whether `requireAuth` should check status (costs one query per request) or keep the short TTL.
- **Frontend:** basic accessibility pass, loading/error states everywhere, form validation polish.
- **Testing checklist:** run full manual QA pass (§20 checklist), fix any privacy leaks found via direct API inspection.
- **Definition of Done:** no known security/privacy gaps against §15/§16; core flows covered by automated tests.

### Phase 12 — Production Deployment
- **Objective:** Ship it.
- **Backend:** production env vars, `prisma migrate deploy` in CI/CD, object storage wired for real, logging/monitoring baseline.
- **Frontend:** `vite build`, deployed to a static host/CDN.
- **Testing checklist:** smoke test all flows against production URLs; verify cookies work cross-subdomain if frontend/backend are on different subdomains (`api.teachlink.com` / `teachlink.com`) — set cookie `domain` accordingly.
- **Definition of Done:** TeachLink MVP is live and usable by real teachers and visitors.

## 18. MVP Definition

MVP is complete when:
- Teachers can register, log in, complete onboarding, and publish a profile with all §5 data captured.
- Visitors can browse without login, search/filter teachers, and view a complete public profile.
- Contact happens through the safe default flow (§9/§16), not raw exposed phone numbers, unless the teacher opted in.
- Admin can suspend abusive accounts and hide/manage inappropriate profiles, and manage the subject/grade/board lookup lists.
- Core security measures from §15 are in place (hashed passwords, HTTP-only cookies, rate limiting, Zod validation everywhere, no sensitive data leaking in public responses).

## 19. Features to Postpone (explicitly out of MVP)

- Private messaging between users
- Teacher community posts / feed
- Reviews and ratings
- Payments / paid premium profiles
- Teaching resource marketplace
- Teaching jobs board
- School/coaching institute accounts (as a distinct profile type)
- Events
- Notifications system
- AI-based recommendations/tools
- Teacher verification workflow (badge field exists in schema, but no verification process yet)
- Follow/bookmark teacher profiles

## 20. Testing Strategy

- **Unit testing:** Vitest (pairs naturally with Vite) for service-layer functions (slug generation, search query builder, validation schemas) and isolated React components.
- **API testing:** Supertest against the Express `app.js` (not the listener) for auth/teacher/search endpoints — this is the highest-value testing layer for this project.
- **Integration testing:** Supertest tests that hit a real (test) MySQL database via Prisma, covering register → onboard → publish → search → view flows.
- **Authentication testing:** explicit tests for cookie issuance, protected-route rejection, role enforcement, and that private fields never leak in public responses.
- **Database testing:** a separate `teachlink_test` database + `prisma migrate deploy` in a pretest script; reset/seed between runs.
- **Frontend testing:** React Testing Library for key components (FilterBar, onboarding steps, TeacherCard) — keep it light for MVP, prioritize backend coverage.
- **Manual testing:** a written checklist per phase's "Testing checklist" above, run before merging each phase.
- Add packages only as needed: `vitest`, `supertest`, `@testing-library/react` when Phase 11 starts — don't install test tooling speculatively in Phase 0.

## 21. Deployment Plan

- **Backend:** Node host (e.g. Railway/Render/VPS); run `prisma migrate deploy` (not `migrate dev`) as part of the deploy step, then start `node src/server.js` (or via a process manager like pm2).
- **Frontend:** `vite build` output deployed to a static host/CDN (Vercel/Netlify/Cloudflare Pages); configure `VITE_API_URL` env var pointing at the backend.
- **MySQL:** managed MySQL instance (PlanetScale, RDS, or provider-managed) — keep `DATABASE_URL` in platform secrets, never in source.
- **Object storage:** Cloudflare R2 (or S3) bucket for teacher photos; credentials via env vars.
- **Environment variables:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` (for CORS), `NODE_ENV`, storage credentials — document all in a `.env.example` (committed) vs `.env` (gitignored).
- **Prisma migrations in production:** always `npx prisma migrate deploy`, never `migrate dev`, as part of the release pipeline, before the new app version starts serving traffic.

## 22. SEO and Public Discovery

- **Limitation:** a pure Vite SPA renders an empty `<div id="root">` to crawlers before JS runs — bots that don't execute JS well will see little content, which hurts discoverability of public teacher profiles (a core goal of this product).
- **Recommendation — stay with Vite for MVP.** Don't rewrite to Next.js/SSR before there's a working product and real traffic; it's a significant rewrite for a benefit (SEO) that only matters once the catalog of teacher profiles is large enough to be worth ranking.
- **Phased approach:**
  1. **Now (MVP):** set `document.title` and a meta description dynamically per page (a tiny `useDocumentHead` hook) — helps social sharing/basic crawlers even without SSR.
  2. **Soon, still no framework rewrite:** add a `sitemap.xml` (server-generated from published teacher slugs) and `robots.txt`, served from the backend or a small build script — cheap, high-value SEO wins that don't require SSR.
  3. **If/when organic search traffic becomes a real growth channel:** consider pre-rendering only the public teacher profile route (e.g. via `vite-plugin-ssr`, a lightweight SSR adapter, or migrating just the public-facing pages to Next.js while keeping the dashboard/onboarding as the existing SPA) rather than a full-framework rewrite. Add JSON-LD structured data (`Person`/`EducationalOccupationalCredential` schema) on profile pages at this stage too.
- Don't block MVP launch on any of step 3.

## 23. Future Architecture (how today's design supports it)

- **Reviews:** new `Review` model (reviewerId, teacherProfileId, rating, comment) — additive, no changes to existing tables.
- **Messaging:** new `Conversation`/`Message` models; `ContactRequest` (Phase 9) is a natural precursor/migration path.
- **Teacher verification:** `TeacherProfile.isVerified` flag already reserved; add a `VerificationRequest` model with document storage keys when built.
- **Jobs:** new `JobPosting` model, optionally linked to a future "Institute" account type — doesn't require changing `TeacherProfile`.
- **Communities/posts:** new `Post`/`Community` models, independent of the profile schema.
- **Resources:** new `Resource` model + object storage, same pattern as photos.
- **Notifications:** a `Notification` table + polling or (later) WebSockets — explicitly not built until needed.
- **Premium accounts:** add `User.plan` or a `Subscription` model; gate features via existing `requireRole`/new `requirePlan` middleware — no core schema rework needed.
- **Scaling considerations (not now):** Redis for caching hot search queries/sessions, a job queue (BullMQ) for async email/image processing, Elasticsearch if filtered search outgrows indexed MySQL, WebSockets for real-time messaging/notifications, containerization (Docker) for deployment consistency once the team/infra grows. None of these are needed at MVP scale — call them out only as the triggers above are actually hit.

## 24. Development Order (checklist)

- [x] Phase 0 — Cleanup & foundation (routing, axios, app.js split)
- [x] Phase 1 — Database foundation (User roles, TeacherProfile scalars, lookup tables, seed)
- [x] Phase 2 — Authentication (register/login/logout/me, cookie-based JWT, login/register modal, username field)
- [x] Phase 3 — Teacher profile backend (scalar CRUD + publish rule)
- [x] Phase 4 — Teacher onboarding frontend (multi-step UI, scalar fields)
- [x] Phase 5 — Relational data (subjects/grades/boards/languages/qualifications/experience/availability)
- [x] Phase 6 — Public teacher profile (full, privacy-correct; contact form deferred to Phase 9)
- [x] Phase 7 — Teacher search & discovery (API, Find Teachers, Home)
- [x] Phase 8 — Teacher dashboard & profile management (incl. Account Settings)
- [x] Phase 9 — Contact flow (login required; in-app inbox, no email yet)
- [x] Phase 10 — Admin basics (users, teachers, lookups; hide/suspend/verify)
- [ ] Phase 11 — Security, testing, optimization
- [ ] Phase 12 — Production deployment

## 25. Important Decisions / Questions

Sensible defaults were applied throughout; the following are worth explicit confirmation before/while implementing, since they affect schema or UX directly:

1. **Fee storage unit/currency** — assumed plain integer (e.g. rupees); confirm currency assumption if multi-currency is ever needed (unlikely for a local tuition market, but worth a one-line confirmation).
2. **Refresh token storage** — plan assumes stateless short-TTL refresh tokens for MVP simplicity (no revocation list). If you want the ability to force-logout a compromised session, a server-side `RefreshToken` table should be added in Phase 2 instead of later.
3. **Contact request delivery** — Phase 9 assumes contact requests are stored and viewed in-dashboard; if you want teachers notified by email immediately, an email-sending service (e.g. Resend/SendGrid) needs to be chosen then — not required for MVP functionality itself.
4. **Date of birth** — plan deliberately **excludes** DOB from MVP since no current feature needs it (per your own note to only collect if genuinely needed); flag if a future feature (e.g. age-appropriate matching) requires it.
5. **Teacher photo requirement** — plan treats profile photo as optional; confirm if a photo should be mandatory before publish, since it affects conversion/trust on discovery.

## 26. Change Log — Built vs. Original Plan

Everything below was added or done differently from what the sections above originally described.

**Added (not in the original plan)**
- `TeacherProfile.contactNumber` + migration `add_contact_number`; form field on the Tuition step; server and client validation; public Call/WhatsApp button (see §5).
- `morgan` request logging in `app.js` (`dev` format locally, `combined` when `NODE_ENV=production`). Unexpected errors were already logged by `errorHandler`.
- Home page content (hero quick-search, newest teachers, how-it-works, teacher CTA) and a `register-teacher` entry point that pre-ticks the teacher checkbox in the sign-up modal (`defaultAsTeacher` prop on `RegisterForm`).
- `components/onboarding/stepSave.js` — shared "save this step" logic used by both the wizard and the edit modal.
- Collapsible "More filters" panel on Find Teachers.
- Session refresh interceptor (above) — fixes users being logged out after 15 minutes.
- Account Settings page and `PATCH /api/users/me`, `POST /api/users/me/password`; the contact modal pre-fills the account phone.
- Public profile now carries `isOwner` (new `optionalAuth` middleware identifies a logged-in viewer on the otherwise public route; an invalid cookie is just anonymous) so the "Contact teacher" button is hidden on your own page.
- `ProtectedRoute` shows a "Please log in to continue" prompt with a Log in button (and renders the page right after login) instead of silently redirecting logged-out visitors to Home; a wrong-role user is still redirected.
- Phase 10 admin: a separate `isHiddenByAdmin` flag (instead of §12's "hide sets `isPublished=false`", which a teacher could simply undo by re-publishing), `Language.isActive`, DB-checked `requireActiveAdmin`, suspended users signed out via `/api/auth/me`, and an env-driven admin seed.
- Contact-number gate: `contactNumber` removed from public payloads (`hasContactNumber` flag instead), unlocked by logged-in users via `GET /api/teachers/:slug/contact-number` with a per-account daily cap and a `ContactReveal` audit table. **This changes the Phase 6 public-profile contract** (`contactNumber` is no longer returned publicly).
- Phase 9 contact flow with an in-app inbox (`/requests`) and nav unread badge — and a decision to **require login to contact** a teacher, changing the original "anonymous contact form" idea in §8/§9/§16.

**Changed from the original design**
- Relation selections are `PUT` (replace-all in a transaction) instead of incremental `POST`s (§11).
- "My Profile" goes to `/dashboard` (profile view + modal editing); `/onboarding` is only the first-time wizard. This pulled most of Phase 8 and the Phase 6 page forward.
- Public profile and owner profile are one shared component instead of separate pages.
- The public search endpoint filters by lookup **names** (readable, shareable URLs) rather than ids, and `city` also matches `area`.
- `validate` middleware supports `"query"` (Express 5 read-only `req.query` workaround).
- Fees display with a ₹ sign on profile and cards (the onboarding preview card still shows no symbol).

**Operational notes**
- Fresh database: `npx prisma migrate dev`, then `npm run prisma:seed` (lookups are empty otherwise). To also create an admin, set `ADMIN_USERNAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` first.
- `backend/.env` holds real credentials and placeholder secrets — never commit it (it is gitignored) and replace the JWT secrets before any shared or production deployment (see Phase 11).
- On Windows, stop the running backend before `npx prisma generate`/`migrate dev`, or Prisma can't replace its locked engine file (`EPERM`).
- The shadow database used by `migrate dev` needs broad MySQL privileges for the dev user (`GRANT ALL ON *.*`), including `INDEX`.

**Still open (carry forward)**
- Edit (not just add/delete) for qualifications, experience and availability.
- Fee-sort null ordering; whether to make a photo mandatory before publish (§25 #5).
- Replace placeholder JWT secrets and the dev admin password before deployment (Phase 11).
- Admin audit log (who suspended/hid what, and why); reports/flagging and bulk actions.
- Phases 11–12 unchanged: security/testing, deployment.
- Email notifications for new contact requests.
