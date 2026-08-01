# AgriLink — Project Description & Study Notes

> Farm Management & Agricultural Services Platform
> Domain: Agriculture & Rural Development
> Stack: Spring Boot microservices + Angular 18 + MySQL

---

## Table of Contents
1. [What AgriLink Is](#1-what-agrilink-is)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Backend — How a Microservice Is Structured](#4-backend--how-a-microservice-is-structured)
5. [Frontend — Full Explanation](#5-frontend--full-explanation)
6. [End-to-End Sequence (login → guarded call)](#6-end-to-end-sequence-login--guarded-call)
7. [The 8 Modules & the 6 Roles](#7-the-8-modules--the-6-roles)
8. [Deep Dive: IAM (Module 2.1)](#8-deep-dive-iam-module-21)
9. [Deep Dive: Farmer & Land Registration (Module 2.2)](#9-deep-dive-farmer--land-registration-module-22)
10. [Deep Dive: Crop Planning (Module 2.3 — my module)](#10-deep-dive-crop-planning-module-23--my-module)
11. [Deep Dive: Agri-Input & Procurement (Module 2.4)](#11-deep-dive-agri-input--procurement-module-24)
12. [Deep Dive: Subsidy & Scheme (Module 2.5)](#12-deep-dive-subsidy--scheme-module-25)
13. [Deep Dive: Produce Sales & Market Linkage (Module 2.6)](#13-deep-dive-produce-sales--market-linkage-module-26)
14. [Deep Dive: Analytics & Reporting (Module 2.7)](#14-deep-dive-analytics--reporting-module-27)
15. [Deep Dive: Notifications & Alerts (Module 2.8)](#15-deep-dive-notifications--alerts-module-28)
16. [Inside crops.component.ts](#16-inside-cropscomponentts)
17. [Non-Functional Requirements & Constraints](#17-non-functional-requirements--constraints)
18. [Quick Revision Hooks](#18-quick-revision-hooks)
19. [Cross-Module Cheat Sheet](#19-cross-module-cheat-sheet)

---

## 1. What AgriLink Is

A **web-based farm management & agricultural services platform** connecting **farmers**, **agri-department staff**, and **buyers**. It digitizes the full agricultural lifecycle:

register farmers & land → plan crops → track growth → request subsidized inputs → apply for government subsidies → sell produce → report & notify.

It uses a **REST API-based backend** with an **Angular frontend**, compatible with Java (Spring Boot) and .NET (ASP.NET Core). This implementation uses **Java Spring Boot microservices + Angular + MySQL**.

---

## 2. High-Level System Architecture

```
                         ┌──────────────────────────┐
                         │   Angular SPA (browser)   │   one frontend app
                         │  login • role-based menus │
                         └───────────┬──────────────┘
                                     │  REST + JWT (Bearer token)
                                     ▼
                         ┌──────────────────────────┐
                         │      API Gateway (:9091)  │  single entry, routes by path
                         └───────────┬──────────────┘
                                     │  looks up service locations
                         ┌───────────▼──────────────┐
                         │  Eureka (Service Registry)│  :8761  every service registers here
                         └───────────┬──────────────┘
      ┌──────────┬──────────┬────────┼────────┬──────────┬──────────┬──────────┐
      ▼          ▼          ▼        ▼        ▼          ▼          ▼          ▼
   ┌──────┐  ┌───────┐  ┌──────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌───────┐ ┌────────────┐
   │ iam  │  │farmer │  │ crop │ │input │ │subsidy│ │produce │ │report │ │notification│
   └──┬───┘  └──┬────┘  └──┬───┘ └──┬───┘ └──┬────┘ └──┬─────┘ └──┬────┘ └──┬─────────┘
      ▼         ▼          ▼        ▼        ▼          ▼          ▼         ▼
   agrilink_ agrilink_ agrilink_ agrilink agrilink_ agrilink_ agrilink_ agrilink_
     iam      farmer     crop     _input   subsidy   produce    report   notification
        (each microservice owns its OWN MySQL database — no shared tables)
```

**Key principles**
- **Microservices** — each business capability is an independent Spring Boot app with its own DB (database-per-service). They talk over **REST**, never sharing tables.
- **Eureka** — service discovery; services find each other by name (`http://farmer-service/...`) instead of hardcoded IPs.
- **API Gateway (:9091)** — single entry point; routes requests to the right service.
- **JWT** — stateless auth. iam-service issues a signed token; every service validates it itself using a shared secret.
- **RBAC** — role-based access control enforced per service (config + controller/service logic).

---

## 3. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Angular 18 (standalone components, signals, `@if`/`@for`) | Single SPA, reactive forms, role-aware UI |
| Backend | Java 17 + Spring Boot (Web, Security, Data JPA) | One app per module |
| Service discovery | Spring Cloud Netflix Eureka | Port 8761 |
| Gateway | Spring Cloud Gateway | Port 9091 |
| Auth | JWT (HMAC-signed) + BCrypt password hashing | Shared secret across services |
| Database | MySQL 8.0 | One schema per service; Hibernate `ddl-auto=update` |
| Build | Maven (`mvnw`) / npm (`ng`) | |

---

## 4. Backend — How a Microservice Is Structured

Every service follows the same layered pattern (crop-service shown):

```
controller/   → REST endpoints (@RestController). HTTP, RBAC checks, return DTOs.
service/      → Business logic & validation. The "brain."
repository/   → Spring Data JPA interfaces (extend JpaRepository). DB access.
entity/       → JPA @Entity classes mapped to DB tables.
dto/          → Data Transfer Objects — the shape sent/received over HTTP.
enums/        → Fixed value sets (Status, Stage, PlanStatus…).
security/     → JwtAuthFilter (reads token), JwtUtil (validates/parses).
config/       → SecurityConfig (which roles can hit which endpoints).
client/       → Calls to OTHER services (e.g. FarmerClient → farmer-service).
exception/    → GlobalExceptionHandler (turns errors into clean JSON).
```

**Request flow (e.g. "farmer views crop plans")**
1. Angular sends `GET /agrilink/crop/crop-plans` with `Authorization: Bearer <jwt>`.
2. `JwtAuthFilter` validates the token, extracts userId + role, populates Spring `Authentication`.
3. `SecurityConfig` checks the role is allowed to hit this path.
4. `CropPlanController` runs — if the caller is a Farmer, it scopes results to their own data.
5. `CropPlanService` applies business rules; `CropPlanRepository` fetches from MySQL.
6. Response serialized to JSON and returned.

---

## 5. Frontend — Full Explanation

A single **Angular 18 SPA** serving all modules and all roles. Standalone components, signals, `@if`/`@for`, reactive forms, lazy-loaded routes. Talks to the backend purely over REST + JWT.

### 5.1 Bootstrapping — `app.config.ts`
```ts
providers: [
  provideZoneChangeDetection({ eventCoalescing: true }),   // batch change detection
  provideRouter(routes),                                   // routing
  provideHttpClient(withInterceptors([authInterceptor])),  // HTTP + attach JWT
  { provide: DEFAULT_CURRENCY_CODE, useValue: 'INR' }       // ₹ everywhere
]
```
- `authInterceptor` is registered **globally** → every HTTP request gets the token + auto-refresh.
- Currency defaults to **INR**.

### 5.2 Routing & Layouts — `app.routes.ts`

**Two layouts**
| Layout | Used for | Behavior |
|---|---|---|
| AuthLayoutComponent | `login`, `register` | Bare screens |
| MainLayoutComponent | everything else | Sidebar + top bar; guarded by `authGuard` |

**Lazy loading** — every page uses `loadComponent: () => import(...)`; each page is a separate JS chunk downloaded on demand.

**Route-level RBAC** — routes declare allowed roles as `data`, enforced by `roleGuard`:
```ts
{ path: 'crops',
  loadComponent: () => import('./pages/crops/crops.component')...,
  canActivate: [roleGuard],
  data: { roles: ['AgriLinkAdmin', 'ExtensionOfficer', 'Farmer'] } }
```

**Route → role map**
| Route | Allowed roles |
|---|---|
| `/dashboard`, `/notifications` | any logged-in user |
| `/users` | AgriLinkAdmin |
| `/pending-users` | Admin, ExtensionOfficer |
| `/audit-logs` | Admin, ComplianceAnalyst |
| `/farmers` | Admin, ExtensionOfficer |
| `/crops` | Admin, ExtensionOfficer, Farmer |
| `/inputs` | Admin, Farmer, ExtensionOfficer |
| `/produce` | Admin, Farmer, Procurement, Extension |
| `/schemes`, `/reports` | staff roles |
| `/applications` | staff + Farmer |

Unknown paths (`**`) redirect to `/dashboard`.

### 5.3 Authentication — 4 cooperating pieces

**(a) `AuthService` — session state**
- On login, calls `POST /agriLink/session/login`, stores in `localStorage`: `agrilink_token` (JWT), `agrilink_refresh_token`, `agrilink_session` (user info).
- Holds current user in a `BehaviorSubject` (`currentUser$`) so components react to login/logout.
- Reloads session on refresh (stay logged in).
- Helpers: `isLoggedIn()`, `hasRole(roles[])`, `token`, `logout()`, `refreshToken()`, `changePassword()`, `clearSession()`.

**(b) `authInterceptor` — automatic token handling** (runs on every request)
1. Attaches `Authorization: Bearer <token>` (skips the 3 public URLs: login/register/refresh).
2. Silent refresh on auth failure: on **401 or 403** (this backend returns 403 for expired JWTs) it calls `refreshToken()`, retries the original request, and on refresh failure clears session + redirects to `/login`.
3. Concurrency guard: `isRefreshing` + a `BehaviorSubject` so simultaneous failures trigger only one refresh; the rest wait and retry.

**(c) `authGuard`** — blocks unauthenticated access to the whole MainLayout subtree.

**(d) `roleGuard`** — compares `route.data['roles']` to the user's `roleName`; mismatch → redirect to `/`.

> ⚠️ Guards and `@if (isFarmer())` are **UX conveniences, not security**. Real enforcement is server-side (see the crop-plan scoping fix).

### 5.4 Service layer — one service per module
Thin HTTP wrappers with **relative URLs**:
```ts
getAllCropPlans()        → GET    /agrilink/crop/crop-plans
createCropPlan(data)     → POST   /agrilink/crop/crop-plans
updateCropPlan(id, data) → PUT    /agrilink/crop/crop-plans/{id}
deleteCropPlan(id)       → DELETE /agrilink/crop/crop-plans/{id}
```
Shared services: `toast.service.ts` (notifications), `export.service.ts` (Excel/PDF).

### 5.5 Dev routing — `proxy.conf.json`
In dev (`ng serve` on :4200), relative calls are proxied to the Gateway:
```json
{ "/agriLink": { "target": "http://localhost:9091" },
  "/agrilink": { "target": "http://localhost:9091" } }
```
Frontend → Gateway (:9091) → Eureka lookup → the right microservice. Both casings proxied (`/agriLink` = iam, `/agrilink` = business services).

### 5.6 Reusable components — `app/components/`
| Component | Purpose |
|---|---|
| pagination | Page-size + page-number control |
| action-menu | The "⋮" row menu (View/Edit/Delete/Log Observation) |
| confirmation-modal | "Are you sure?" delete dialogs |
| detail-modal | "View" pop-up showing full record incl. hidden IDs |
| toast | Transient success/error notifications |

### 5.7 Modern Angular patterns used
- Standalone components (no NgModule).
- Signals: `x.set(v)` / `x()` for reactive state.
- New control flow: `@if`, `@for (... ; track id)`, `@else`.
- Reactive forms: `FormGroup` + `Validators` + `formControlName` + `valueChanges`.
- Functional guards & interceptors (`CanActivateFn`, `HttpInterceptorFn`).
- `inject()` for DI.

---

## 6. End-to-End Sequence (login → guarded call)

```
User            Angular SPA                 Gateway(:9091)     iam-service        crop-service      farmer-service
 │  enter creds    │                              │                │                  │                  │
 ├────────────────>│  POST /agriLink/session/login│                │                  │                  │
 │                 ├─────────────────────────────>├───────────────>│  verify BCrypt   │                  │
 │                 │                              │                │  issue JWT+refresh│                  │
 │                 │<─────────────────────────────┤<───────────────┤ {accessToken,…}  │                  │
 │                 │  store tokens in localStorage │                │                  │                  │
 │  click "Crops"  │                              │                │                  │                  │
 ├────────────────>│  authGuard: logged in? ✔     │                │                  │                  │
 │                 │  roleGuard: role allowed? ✔  │                │                  │                  │
 │                 │  GET /agrilink/crop/crop-plans│                │                  │                  │
 │                 │  (authInterceptor adds Bearer)│                │                  │                  │
 │                 ├─────────────────────────────>├────────────────────────────────>│ JwtAuthFilter     │
 │                 │                              │                │  validate JWT     │  reads role/uid   │
 │                 │                              │                │  if Farmer:       ├─ GET /farmer-     │
 │                 │                              │                │                   │   profiles (JWT)─>│ scope by userId
 │                 │                              │                │                   │<─ owned ids ──────┤
 │                 │                              │                │  findByFarmerIdIn │                  │
 │                 │<─────────────────────────────┤<────────────────────────────────┤ JSON (own plans) │
 │  see own plans  │  render table + badges        │                │                  │                  │
```

If the access token is expired, the service replies **403**; the `authInterceptor` silently calls `/session/refresh`, gets a new token, and retries the request transparently.

---

## 7. The 8 Modules & the 6 Roles

| # | Module (Service) | Purpose | Key entities | Main actors |
|---|---|---|---|---|
| 2.1 | Identity & Access (iam) | Login, users, roles, RBAC, audit | User, AuditLog | All (login); Admin (manage) |
| 2.2 | Farmer & Land (farmer) | Farmer profiles, land holdings, crop history | FarmerProfile, LandHolding | Farmer, Extension Officer |
| 2.3 ⭐ | Crop Planning (crop) | Crop calendars, sowing plans, growth-stage tracking | CropCatalog, CropPlan, GrowthObservation | Admin, Farmer, Officer |
| 2.4 | Agri-Input & Procurement (input) | Seed/fertilizer/pesticide catalog + requests | InputCatalog, InputRequest | Farmer, Procurement Officer |
| 2.5 | Subsidy & Scheme (subsidy) | Scheme catalog + subsidy applications & disbursement | SchemeCatalog, SubsidyApplication | Farmer, Subsidy Admin |
| 2.6 | Produce Sales (produce) | Produce listings, buyer matching, sale settlement | ProduceListing, ProduceSale | Farmer, Procurement Officer, Buyer |
| 2.7 | Analytics & Reporting (report) | Dashboards: crop coverage, yield, subsidy utilisation | AgriReport | Compliance Analyst, Admin |
| 2.8 | Notifications & Alerts (notification) | In-app advisories, subsidy/input updates, reminders | Notification | All users |

**The 6 roles**
| Role | What they do |
|---|---|
| Farmer | Register land, plan crops, request inputs, apply for subsidies, list produce |
| Agri-Extension Officer | Crop advisory, field visits, record growth observations |
| Procurement Officer | Produce buy-back, price negotiation, payments |
| Subsidy Administrator | Review eligibility, approve schemes, track disbursement |
| Compliance Analyst | Audit scheme use, validate land records, generate reports |
| AgriLink Admin | Configure crop calendars, scheme catalog, input prices, user roles |

Demo login password (this build): **`Agrilink@123`**.

---

## 8. Deep Dive: IAM (Module 2.1)

The security backbone every other service trusts. Own database `agrilink_iam`.

### 8.1 Data model (4 tables)
| Table | Purpose | Key fields |
|---|---|---|
| UserRole | The 6 roles | `roleId, roleName, description, status(A/I)` |
| UserDetails | The user account | `userId, name, email, phone, passwordHash, regionId, roleId→UserRole, status(A/I/S/P)` |
| UserSession | Login sessions / refresh tokens | `sessionId, userId, refreshTokenHash, expiresAt, ipAddress, deviceInfo, status` |
| AuditLog | Action trail | `auditId, userId, action, module, timestamp` |

User status codes: `A`=Active, `I`=Inactive, `S`=Suspended, `P`=Pending approval.

### 8.2 Login flow (`POST /agriLink/session/login`)
```
1. Find user by email                 → else "Invalid email or password"
2. passwordEncoder.matches(raw, hash)  → BCrypt compare; fail → same generic error
3. Check status: S/I/P block login
4. (Optional) selected role must match the account's role
5. Issue ACCESS token (JWT) + REFRESH token (opaque random)
6. Save UserSession (stores only SHA-256 HASH of refresh token, + IP + device)
7. Write audit log
8. Return { accessToken, refreshToken, user info }
```

### 8.3 Two-token design
- **Access token = JWT**, short-lived, stateless, sent on every request.
- **Refresh token = opaque random**, long-lived, used at `/session/refresh` to get a new access token without re-login.

**Security details**
- Passwords hashed with **BCrypt**.
- Refresh tokens stored **SHA-256 hashed**, never raw.
- Generic error message avoids leaking which emails exist.

### 8.4 The JWT payload (`JwtUtil`)
```
subject   = userId            ← who you are
claim roleId    = 2
claim roleName  = "Farmer"    ← other services read this for RBAC
claim regionId  = 1           ← data scoping
issuedAt / expiration
signature = HMAC-SHA(secret)  ← tamper-proof
```
Shared secret lets all services validate the token themselves — no call back to iam per request.

### 8.5 RBAC in two layers
**Layer 1 — coarse, `SecurityConfig`** (URL + method → role):
```java
.requestMatchers("/agriLink/session/login","/refresh","/register").permitAll()
.requestMatchers(POST, "/agriLink/user/createUser").hasAnyRole("AgriLinkAdmin","ExtensionOfficer")
.requestMatchers(POST, "/agriLink/user/*/approve").hasAnyRole("AgriLinkAdmin","ExtensionOfficer")
.requestMatchers(GET,  "/agriLink/user/pending").hasAnyRole("AgriLinkAdmin","ExtensionOfficer")
.requestMatchers(GET,  "/agriLink/audit/**").hasAnyRole("AgriLinkAdmin","ComplianceAnalyst")
.requestMatchers("/agriLink/user/**","/agriLink/role/**").hasRole("AgriLinkAdmin")
.anyRequest().authenticated()
```
CSRF disabled + STATELESS sessions (the JWT *is* the session).

**Layer 2 — fine-grained, `UserService`**:
- ExtensionOfficer can create only Farmer accounts.
- ExtensionOfficer can approve only Farmers, and only in their own region (`regionId` match). Admin approves anyone.
- Can't assign an inactive role; can't duplicate an email.

### 8.6 User lifecycle & endpoints
Session (`/agriLink/session`): `login`, `refresh`, `register` (public), `logout`, `change-password` (authed).
User mgmt (`/agriLink/user`): `createUser`, `pending`, `{id}/approve`, list/get/`PUT`, `DELETE` (soft delete), `{id}/reset-password`.
Also `/agriLink/role/**` (Admin), `/agriLink/audit/**` (Admin + ComplianceAnalyst).

**Self-registration → approval:** visitor registers → Pending → cannot log in → Officer/Admin approves → Active → login works.

### 8.7 Link to the Crop module
iam issues the JWT → Angular attaches it to crop-service calls → crop-service validates it (shared secret) and enforces RBAC → for farmer scoping, crop-service forwards the JWT to farmer-service, which uses the token's `userId`. No other service stores passwords or re-authenticates.

---

## 9. Deep Dive: Farmer & Land Registration (Module 2.2)

Manages farmer identity and their land. Own database `agrilink_farmer`, service on port **8082**, context-path **`/agrilink/farmer`**.

### 9.1 Entities & relationship
```
FarmerProfile (farmer_profile)          LandHolding (land_holding)
  farmerId (PK)                            holdingId (PK)
  userId    → the IAM user who owns it     farmerId → FarmerProfile
  name, dateOfBirth, gender                surveyNumber (unique)
  nationalIdNumber (unique)                areaAcres
  village, district, state                 soilType, irrigationSource
  phone, bankAccountNumber                 ownershipType
  status (AC/IN)                           status (AC/IN)

One FarmerProfile → many LandHoldings (by farmerId).
userId links a profile to its login account in iam-service.
```

### 9.2 Enum
`Status { AC = Active, IN = Inactive }` — stored as the 2-letter string. (Spec mentions Verified/Disputed; implementation uses AC/IN for both entities.)

### 9.3 Endpoints
- FarmerProfile — `GET /farmer-profiles`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`
- LandHolding — `GET /land-holdings`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`

### 9.4 RBAC
| Action | Allowed roles |
|---|---|
| Profiles — view | all 6 roles |
| Profiles — create/edit/delete | Farmer, AgriLinkAdmin |
| Holdings — view | Farmer, ExtensionOfficer, SubsidyAdmin, ComplianceAnalyst, Admin (**ProcurementOfficer excluded**) |
| Holdings — create/edit/delete | Farmer, AgriLinkAdmin |

### 9.5 Farmer scoping (the model the Crop module relies on)
- Principal = `userId` from the JWT.
- **Profile:** a Farmer's list returns only `getByUserId(userId)`; view/edit/delete by id is denied if `profile.userId != principal`; on create/update `userId` is forced to the principal (can't reassign ownership).
- **Holding:** `ownedFarmerIds` = the farmerIds of the profiles owned by this userId; holdings are filtered to that set, with ownership checks on every by-id/write.
- Officers/Admins are unrestricted.
- 📌 This is exactly the endpoint that crop-service's `FarmerClient` calls (forwarding the JWT) to resolve a farmer's owned ids for the crop-plan security fix.

### 9.6 Business rules
- Unique `nationalIdNumber` (checked on create, and on update excluding self).
- Unique `surveyNumber` (same pattern).
- `status` defaults to `AC` on create.

### 9.7 Audit
Every POST/PUT/DELETE is auto-audited via an AOP aspect → iam-service `/agriLink/audit`, module `"FARMER"`, action `CREATE_/UPDATE_/DELETE_<Entity>` (fire-and-forget, never blocks the request).

---

## 10. Deep Dive: Crop Planning (Module 2.3 — my module)

### 9.1 Purpose
Define **crop templates**, let farmers **plan** what to sow where/when, and let officers **track growth** stage-by-stage to harvest. Own database `agrilink_crop`, service on port **8083**, context path **`/agrilink/crop`**.

### 9.2 Entities & relationships
```
CropCatalog  (Admin templates: "Rice, Kharif, 120 days, 24 t/acre")
     │ cropId
     ▼
CropPlan     (Farmer X sows crop Y on holding Z, season/year, lifecycle status)
     │ planId       ├─ farmerId  → farmer-service FarmerProfile
     ▼              └─ holdingId → farmer-service LandHolding
GrowthObservation  (Officer field visits: stage + pest flag + remarks, over time)
```

### 9.3 Fields & enums (spec-exact)
**CropCatalog** — `cropId, cropName, category, season, typicalDurationDays, expectedYieldPerAcre, status`
- Category: Cereal / Pulse / Vegetable / Fruit / Cash (Fibre/Oilseed/Spice used in data)
- Season: Kharif / Rabi / Zaid / Perennial
- Status: Active / Inactive → enum `Status{AC, IN}`

**CropPlan** — `planId, farmerId, holdingId, cropId, season, year, sowingDate, expectedHarvestDate, areaPlanted, status`
- Status (lifecycle): enum `PlanStatus{PLANNED, SOWING, GROWING, HARVESTED, FAILED}`

**GrowthObservation** — `observationId, planId, officerId, observationDate, stage, pestOrDiseaseFlag, remarks`
- Stage: enum `Stage{GERMINATION, VEGETATIVE, FLOWERING, MATURITY}` (declaration order = natural forward flow)

> 📌 Two different "Status" meanings: Catalog = Active/Inactive (`AC/IN`); Plan = lifecycle. **Different enums** (`Status` vs `PlanStatus`).

### 9.4 Endpoints (crop-service)
| Resource | Endpoints |
|---|---|
| CropCatalog | `GET /crop-catalogs`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| CropPlan | `GET /crop-plans`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| GrowthObservation | `GET /growth-observations`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |

### 9.5 RBAC
| Action | Admin | Extension Officer | Farmer |
|---|:--:|:--:|:--:|
| Crop Catalog (create/edit) | ✅ | ❌ | ❌ |
| Crop Catalog (view) | ✅ | ✅ | ✅ |
| Crop Plan (create/edit) | ✅ all | ✅ all | ✅ own only |
| Crop Plan (view) | ✅ all | ✅ all | ✅ own only |
| Growth Observation (create) | ✅ | ✅ | ❌ |

Rationale: catalog is a master template (Admin curates); observations are field work (Officer/Admin); plans belong to farmers (own only).

### 9.6 Business rules
1. **Forward-only growth flow** — first observation must be Germination; stages only move forward (Germination→Vegetative→Flowering→Maturity). Enforced in `GrowthObservationService` via enum ordinal.
2. **No duplicate plan** — unique per farmer+holding+crop+season+year.
3. **Default status** — new plan defaults to `PLANNED`.
4. **Season ↔ Crop coupling (UI)** — season filters the crop list; picking a crop auto-fills its season.

### 9.7 Server-side security fix (key talking point)
**Problem:** "farmer sees only their own plans" was originally enforced only in the UI — a farmer could call `GET /crop-plans` directly and read everyone's data (PII/privacy hole).

**Fix (in `main`):**
- `CropPlanController` reads the role from the JWT.
- If Farmer → `FarmerClient` calls farmer-service `GET /farmer-profiles` (forwarding the JWT); farmer-service scopes to the token's `userId`, returning only that farmer's profile IDs.
- `CropPlanService.getByFarmerIds()` → `repository.findByFarmerIdIn(...)`.
- GET-by-id / PUT / DELETE all verify ownership. Officers/Admins unrestricted.

> 📌 Lesson: frontend filtering is UX; **true access control lives server-side**.

### 9.8 Frontend features (crops tab)
- Three tabs: Crop Catalog, Crop Plans ("My Crop Plans" for farmers), Growth Observation.
- IDs hidden in tables, shown in View detail modals.
- Colored status badges — Plan: Planned=grey, Sowing=amber, Growing=green, Harvested=indigo, Failed=red; Observation stages have progression colors.
- Search on plans (farmer/crop/status/season) and observations (farmer/crop/stage/remarks/pest flag).
- Pagination + sort by most recent.
- Units in headers: Expected Yield (in Tons), Area (in Acres).
- Reactive-form dropdowns with "Select …" placeholders; role-gated create buttons.

### 9.9 DB notes
- camelCase columns, quoted identifiers (`globally_quoted_identifiers=true`).
- Enum columns stored as strings (`@Enumerated(EnumType.STRING)`).
- `ddl-auto=update` — adds columns, never drops data (contrast `create`, which wipes on restart).

---

## 11. Deep Dive: Agri-Input & Procurement (Module 2.4)

Seed/fertilizer/pesticide catalog + farmer procurement requests. DB `agrilink_input`, port **8084**, context-path **`/agrilink/input`**.

### 11.1 Entities
- **Catalog** (`catalog`): `inputId, name (unique), category, unit, pricePerUnit, subsidisedPrice, availableStock, status`
- **Request** (`request`): `requestId, farmerId, inputId, quantityRequested, requestDate, assignedCentreId, actualPrice, status`

### 11.2 Enums
- `Status { AC=Active, IN=Inactive }` (catalog)
- `RequestStatus { PE=Pending, AP=Approved, RE=Rejected, DL=Delivered }`
  - ⚠️ Implementation has **4 states** — the spec's *Dispatched/Cancelled* are not modeled.

### 11.3 Endpoints
`/catalogs` CRUD · `/requests` CRUD.

### 11.4 RBAC
| Action | Allowed roles |
|---|---|
| Catalog — view | staff roles (**Farmer excluded**) |
| Catalog — create/edit/delete | ProcurementOfficer, AgriLinkAdmin |
| Request — view | all 6 roles |
| Request — create/edit/delete | Farmer, ExtensionOfficer, ProcurementOfficer, AgriLinkAdmin |

### 11.5 Business rules & notes
- Unique catalog `name`; catalog `status` defaults to `AC`; request `status` defaults to `PE`.
- No state-transition validation on request status (any value can overwrite any).
- ⚠️ **No farmer-scoping** — a Farmer can `GET /requests` (all farmers' requests) and edit/delete any by id. This is the *same class of gap* the Crop module fixed server-side; not yet fixed here.

---

## 12. Deep Dive: Subsidy & Scheme (Module 2.5)

Government scheme catalog + farmer subsidy applications & disbursement. DB `agrilink_subsidy`, port **8085**, **no context-path** (paths live directly under `/agriLink/subsidyScheme`).

### 12.1 Entities
- **SchemeCatalog** (`scheme_catalog`): `schemeId, schemeName (unique), category, eligibilityCriteria, benefitAmount, fundingSource, startDate, endDate, status, createdAt`
- **SubsidyApplication** (`subsidy_application`, unique `(farmerId, schemeId)`): `applicationId, farmerId, userId, schemeId, applicationDate, eligibilityScore, reviewedBy, disbursedAmount, disbursedDate, status, createdAt`

### 12.2 Enums
- `Status { AC=Active, IN=Inactive }` (scheme)
- `ApplicationStatus { PE=Pending, AP=Approved, RE=Rejected, DB=Disbursed }`
  - ⚠️ Spec's *Submitted/UnderReview* and scheme *Closed/Upcoming* are not modeled; `PE` is the initial state.

### 12.3 Endpoints (base `/agriLink/subsidyScheme`)
- Schemes: `GET /fetchSchemes`, `GET /fetchSchemeById/{id}`, `POST /createScheme`, `PUT /updateScheme/{id}`, `PUT /updateSchemeStatus/{id}`, `DELETE /deleteScheme/{id}`
- Applications: `GET /fetchApplications`, `GET /fetchApplicationById/{id}`, `GET /fetchApplicationsByFarmer/{id}`, `POST /createApplication`, `PUT /updateApplication/{id}`, `PUT /reviewApplication/{id}`, `PUT /updateApplicationStatus/{id}`, `DELETE /deleteApplication/{id}`

### 12.4 RBAC
| Action | Allowed roles |
|---|---|
| Schemes — view | staff (**Farmer excluded**) |
| Schemes — write | SubsidyAdmin, AgriLinkAdmin |
| Applications — view | Farmer, ExtensionOfficer, SubsidyAdmin, ComplianceAnalyst, Admin (**ProcurementOfficer excluded**) |
| Applications — write | Farmer, ExtensionOfficer, SubsidyAdmin, AgriLinkAdmin |

### 12.5 Farmer scoping (✅ present, like Crop)
A Farmer only sees/edits applications where `userId == token userId` (else `AccessDeniedException`). On create, their `userId` is forced and `reviewedBy/disbursedAmount/disbursedDate` are nulled — **a farmer cannot self-approve or self-disburse**. Review/status endpoints are staff-driven.

### 12.6 Business rules
- Unique scheme name; unique `(farmerId, schemeId)` application pair.
- Scheme default `AC`; application default `PE`.
- **No automatic eligibility-scoring formula** and no disbursement derivation — `eligibilityScore`, `disbursedAmount`, `disbursedDate` are all caller-supplied.

---

## 13. Deep Dive: Produce Sales & Market Linkage (Module 2.6)

Produce listings + sales to buyers. DB `agrilink_produce`, port **8086**, context-path **`/agrilink/produce`**.

### 13.1 Entities
- **ProduceListing** (`produce_listing`): `listingId, farmerId, cropId, harvestDate, quantityKg, qualityGrade (String), askingPricePerKg, status`
- **ProduceSale** (`produce_sale`): `saleId, listingId, buyerId, quantitySoldKg, agreedPricePerKg, totalAmount, saleDate, paymentStatus`

### 13.2 Enums
- `ListingStatus { AV=Available, SO=Sold, WD=Withdrawn }` (⚠️ no *PartiallyBooked*)
- `PaymentStatus { PE=Pending, PD=Paid, FL=Failed }` (⚠️ `FL`, not *Overdue*)
- `qualityGrade` is a **free-text String** — no A/B/C enum enforced.

### 13.3 Endpoints
`/produce-listings` CRUD · `/produce-sales` CRUD.

### 13.4 RBAC
| Action | Allowed roles |
|---|---|
| Listings — view | all 6 roles |
| Listings — write | Farmer, ProcurementOfficer, AgriLinkAdmin |
| Sales — view | ProcurementOfficer, SubsidyAdmin, ComplianceAnalyst, Admin (**Farmer & ExtensionOfficer excluded**) |
| Sales — write | ProcurementOfficer, AgriLinkAdmin |

### 13.5 Business rules & notes
- Listing `status` defaults `AV`; sale `paymentStatus` defaults `PE`.
- ⚠️ `totalAmount` is taken from the DTO, **not computed** from qty × price.
- ⚠️ No stock decrement, no "quantitySold ≤ listing quantity" check, no farmer/buyer scoping.

---

## 14. Deep Dive: Analytics & Reporting (Module 2.7)

DB `agrilink_report`, port **8087**, context-path **`/agriLink/analytics`**. This is an **aggregation service** — it mostly reads from other services live and computes metrics on the fly; it stores very little itself.

### 14.1 Entity
- **AgriReport** (`agri_report`): `reportId, generatedBy, scope (String), metrics (String — client-supplied, stored verbatim), generatedDate`. **No enums** anywhere (scope is free text).

### 14.2 Two controllers
- **AgriReportController** (`/reports` or `/agri-reports`): CRUD on saved report records + `POST /export` (xlsx default / pdf, via Apache POI + OpenPDF).
- **AnalyticsController** (absolute paths, all GET, computed per-request):
  - `/dashboard/*` — cropCoverage, yieldEstimate, harvestVolume, subsidyUtilisation, inputDeliveryRate, produceSalesSummary
  - `/farmers/*` — registrationSummary, landHoldingsSummary, cropHistory/{farmerId}
  - `/subsidy/*` — utilisationByScheme, disbursementTrend, eligibilityDistribution
  - `/produce/*` — salesByRegion, priceDiscovery, qualityGradeDistribution

### 14.3 RBAC
| Action | Allowed roles |
|---|---|
| Saved reports — view | ExtensionOfficer, ProcurementOfficer, SubsidyAdmin, ComplianceAnalyst, Admin |
| Reports — generate/export/delete | SubsidyAdmin, ComplianceAnalyst, AgriLinkAdmin |
| All live analytics (`/dashboard`, `/farmers`, `/subsidy`, `/produce`) | all authenticated roles |

### 14.4 How metrics are produced
- Saved `AgriReport.metrics` = a **String supplied by the client**, stored verbatim (no computation).
- Live analytics = computed each request by `AnalyticsService` calling other services via one `@LoadBalanced RestTemplate` with a **JwtPropagationInterceptor** (forwards the caller's JWT). It hits crop / farmer / input / produce / subsidy services by Eureka name and aggregates with Java streams. Every call is wrapped in try/catch → returns empty on failure (resilient, never errors the dashboard).
- Notable hardcoded rules: expected yield = `areaPlanted × 2500` kg/acre; subsidy utilisation counts only `Approved`/`Disbursed`.

---

## 15. Deep Dive: Notifications & Alerts (Module 2.8)

In-app notifications. DB `agrilink_notification`, port **8088**, context-path **`/agrilink/notification`**.

### 15.1 Entity
- **Notification** (`notification`): `notificationId, userId, message, category (String, free text), status, createdDate`

### 15.2 Enum
- `NotificationStatus { UN=Unread, RD=Read }` (⚠️ no *Dismissed*). `category` is free-text (no enum).

### 15.3 Endpoints
`/notifications` CRUD.

### 15.4 RBAC
| Action | Allowed roles |
|---|---|
| View | all 6 roles |
| Create/edit/delete | ExtensionOfficer, AgriLinkAdmin |

### 15.5 Business rules & notes
- `status` defaults to `UN` on create; thin CRUD.
- ⚠️ **No per-user scoping** — a user sees *all* notifications, not just their own.
- ⚠️ `ddl-auto=create` here → this DB is **recreated (data wiped) on every restart** (all other services use `update`).
- **Delivery model:** in-app only. There is no Kafka/messaging/Feign consumer — other services don't auto-push notifications; they would have to POST to this endpoint. (Matches the Phase-1 "in-app only, no SMS" constraint.)

---

## 16. Inside crops.component.ts

The largest page component — one standalone component holding all three tabs, forms, filtering, badges, and role logic.

**State (signals)**
- `cropCatalogs()`, `cropPlans()`, `growthObservations()`, `farmerProfiles()`, `landHoldings()` — data loaded from services via `loadAllData()`.
- `activeTab()` — which tab is shown.
- Pagination state per tab: `catalogPage/PageSize`, `planPage/PageSize`, `obsPage/PageSize` (default size 5).
- Search terms: `planSearch`, `obsSearch`.

**Role helpers**
- `isAdmin()`, `isFarmer()`, `isAdminOrOfficer()`, `canViewObservations()` — read the current role and gate UI.
- `myOwnedFarmerIds()` — for a farmer, the ids they own (drives scoping + hides the Farmer column).

**Reactive forms**
- `catalogForm`, `planForm`, `observationForm` (+ profile/holding forms).
- `planForm` has two `valueChanges` subscriptions implementing season ↔ crop two-way sync (guarded with `{ emitEvent: false }` to avoid loops).

**Derived / filtering methods**
- `filteredPlans()` — farmer-scope + search (farmer/crop/status/season) → `paginatedPlans()`.
- `filteredObservations()` — search (farmer/crop/stage/remarks/pest flag) → `paginatedObservations()`.
- `cropsForPlanSeason()` — Active catalog crops filtered by the chosen season (keeps the current crop when editing).

**Label / colour helpers**
- `getStatusLabel` (AC/IN → Active/Inactive), `getPlanStatusLabel` (PLANNED→Planned…), `getStageLabel` (GERMINATION→Germination…).
- `getPlanStatusClass` and `getStageClass` map values → badge colour classes.
- `getFarmerName`, `getFarmerNameForPlan`, `getCropName`, `getCropNameForPlan` — resolve ids to display names.

**Actions**
- Open/close modals; `submitCatalogForm`, `submitPlanForm`, `submitObservationForm`; `viewPlanDetails` / `viewObservationDetails` (full detail modal incl. IDs); confirm+delete flows; Excel/PDF export.

---

## 17. Non-Functional Requirements & Constraints

**NFRs**
- Performance: 20,000+ concurrent users at sowing-season peaks.
- Security: PII protection, bank-account encryption, RBAC, full audit trails.
- Scalability: multi-district/state, region-scoped partitioning.
- Availability: 99.9% uptime, offline-capable field forms.
- Maintainability: configurable crop calendars/scheme rules without code changes.
- Observability: seasonal dashboards, subsidy pipeline metrics, price-trend monitoring.

**Phase-1 constraints (out of scope)**
- No national land-registry API, no external weather feeds.
- Market price from internal lists (no commodity-exchange integration).
- In-app notifications only (no SMS).
- Soil-testing / remote-sensing deferred to Phase 2.

---

## 18. Quick Revision Hooks

**System**
- Microservices + Eureka + Gateway(:9091); DB-per-service; JWT stateless auth; RBAC per service.

**Frontend**
- 1 SPA; standalone + signals + lazy routes.
- Security = `AuthService` (localStorage tokens) + `authInterceptor` (attach JWT + silent refresh, treats 403 as expired) + `authGuard` + `roleGuard`.
- Services are thin HTTP wrappers, relative URLs, proxied to Gateway.
- Frontend role checks = UX; backend is the real gate.

**IAM**
- 4 tables: UserRole, UserDetails, UserSession, AuditLog.
- 2 tokens: JWT access (signed, stateless) + opaque refresh (SHA-256 hashed).
- Passwords: BCrypt. RBAC in 2 layers (config + service).
- Lifecycle: register→Pending→approve→Active; delete = soft.
- 1 shared secret lets all services validate JWTs.

**Crop Planning (mine)**
- 3 entities: Catalog (template) → Plan (instance) → Observation (tracking).
- 2 status enums: Catalog `AC/IN`; Plan lifecycle `PLANNED→SOWING→GROWING→HARVESTED/FAILED`.
- 1 flow rule: observations forward-only from Germination.
- 1 big lesson: enforce farmer scoping server-side, not just in the UI.

---

## 19. Cross-Module Cheat Sheet

### Ports, context-paths & databases
| Service | Port | Context-path | Database | ddl-auto |
|---|---|---|---|---|
| iam | 8081* | `/agriLink` | agrilink_iam | update |
| farmer | 8082 | `/agrilink/farmer` | agrilink_farmer | update |
| crop | 8083 | `/agrilink/crop` | agrilink_crop | update |
| input | 8084 | `/agrilink/input` | agrilink_input | update |
| subsidy | 8085 | *(none — `/agriLink/subsidyScheme`)* | agrilink_subsidy | update |
| produce | 8086 | `/agrilink/produce` | agrilink_produce | update |
| report | 8087 | `/agriLink/analytics` | agrilink_report | update |
| notification | 8088 | `/agrilink/notification` | agrilink_notification | **create** ⚠️ (wipes on restart) |
| Eureka | 8761 | — | — | — |
| Gateway | 9091 | — | — | — |

\* iam port per its own `application.properties`; the others are confirmed above.

> ⚠️ Casing gotcha: iam, subsidy and report use **`/agriLink`** (capital L); farmer, crop, input, produce, notification use **`/agrilink`**. The frontend proxy forwards both.

### Enum codes across services (all stored as `EnumType.STRING`)
| Meaning | Service(s) | Codes |
|---|---|---|
| Active / Inactive | farmer, crop-catalog, input-catalog, subsidy-scheme | `AC` / `IN` |
| Crop plan lifecycle | crop | `PLANNED / SOWING / GROWING / HARVESTED / FAILED` (full words) |
| Growth stage | crop | `GERMINATION / VEGETATIVE / FLOWERING / MATURITY` (full words) |
| Input request status | input | `PE / AP / RE / DL` (Pending/Approved/Rejected/Delivered) |
| Subsidy application status | subsidy | `PE / AP / RE / DB` (Pending/Approved/Rejected/Disbursed) |
| Produce listing status | produce | `AV / SO / WD` (Available/Sold/Withdrawn) |
| Payment status | produce | `PE / PD / FL` (Pending/Paid/Failed) |
| Notification status | notification | `UN / RD` (Unread/Read) |
| User account status | iam | `A / I / S / P` (Active/Inactive/Suspended/Pending) |

> 📌 Note the crop module uses **full-word** enums (spec-aligned) while the other modules use **2-letter codes**. Some spec statuses were simplified in code (e.g. input has no Dispatched/Cancelled; produce listing has no PartiallyBooked; notification has no Dismissed).

### Server-side farmer scoping — who actually enforces it
| Service | Farmer sees only their own data? |
|---|---|
| farmer | ✅ yes (by JWT userId) |
| crop | ✅ yes (via FarmerClient → farmer-service) |
| subsidy | ✅ yes (applications by userId) |
| input | ❌ no — role-gated only |
| produce | ❌ no — role-gated only |
| notification | ❌ no — everyone sees all |

> This table is the honest security picture: three services scope by owner, three don't yet. The crop-plan fix brought crop into the "✅" column.

### Common backbone in every service
- Stateless JWT (`JwtAuthFilter` + `JwtUtil`), CSRF disabled, RBAC in `SecurityConfig`.
- `GlobalExceptionHandler` → clean JSON errors; `ResourceNotFoundException` for missing ids.
- Audit: an AOP `AuditLoggingAspect` + `AuditClient` fire-and-forget POST to iam-service `/agriLink/audit` on every write, tagged with the service's module name.
- Registered with Eureka; reached via the Gateway.
