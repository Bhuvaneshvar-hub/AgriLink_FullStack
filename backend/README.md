# AgriLink — Farm Management & Agricultural Services Platform

A Spring Boot **microservices** implementation of the AgriLink platform. The system is split into
8 independent Spring Boot applications (one per functional module from the SRS), each running on
its **own port** with its **own MySQL schema** (database-per-service).

Built with: Java 21, Spring Boot 4.1.0, Spring Data JPA, Lombok, MySQL (runtime), H2 (tests),
JUnit 5 + Mockito.

## Modules / Services

> An **API Gateway** (`gateway-service`, port **8080**) sits in front of all services and is the
> single entry point — see [API Gateway](#api-gateway) below. The services can also still be called
> directly on their own ports.

| Module (SRS)                          | Artifact              | Port | Context path           | MySQL schema           | Entities (ER names)                              |
|---------------------------------------|-----------------------|------|------------------------|------------------------|--------------------------------------------------|
| 2.1 Identity & Access Management      | `iam-service`         | 8081 | `/agrilink/iam`        | `agrilink_iam`         | Role, Permission, RolePermission, User, AuditLog |
| 2.2 Farmer & Land Registration        | `farmer-service`      | 8082 | `/agrilink/farmer`     | `agrilink_farmer`      | FarmerProfile, LandHolding                       |
| 2.3 Crop Planning & Season Management | `crop-service`        | 8083 | `/agrilink/crop`       | `agrilink_crop`        | CropCatalog, CropPlan, GrowthObservation         |
| 2.4 Agri-Input & Procurement          | `input-service`       | 8084 | `/agrilink/input`      | `agrilink_input`       | Catalog, Request                                 |
| 2.5 Subsidy & Scheme Management       | `subsidy-service`     | 8085 | `/agrilink/subsidy`    | `agrilink_subsidy`     | SchemeCatalog, SubsidyApplication                |
| 2.6 Produce Sales & Market Linkage    | `produce-service`     | 8086 | `/agrilink/produce`    | `agrilink_produce`     | ProduceListing, ProduceSale                      |
| 2.7 Agricultural Analytics & Reporting| `report-service`      | 8087 | `/agrilink/report`     | `agrilink_report`      | AgriReport                                       |
| 2.8 Notifications & Alerts            | `notification-service`| 8088 | `/agrilink/notification`| `agrilink_notification`| Notification                                     |

## API Gateway

`gateway-service` (Spring Cloud Gateway Server **WebMVC**, Spring Cloud `2025.1.2`) runs on port
**8080** and routes by path prefix to each microservice — no service discovery, just static routes:

| Incoming (gateway, :8080)            | Forwarded to            |
|--------------------------------------|-------------------------|
| `/agrilink/iam/**`                   | `http://localhost:8081` |
| `/agrilink/farmer/**`                | `http://localhost:8082` |
| `/agrilink/crop/**`                  | `http://localhost:8083` |
| `/agrilink/input/**`                 | `http://localhost:8084` |
| `/agrilink/subsidy/**`               | `http://localhost:8085` |
| `/agrilink/produce/**`               | `http://localhost:8086` |
| `/agrilink/report/**`                | `http://localhost:8087` |
| `/agrilink/notification/**`          | `http://localhost:8088` |

The path is preserved end-to-end, so the same URL works whether you hit the gateway or the service
directly — only the port/host changes:

```
http://localhost:8080/agrilink/iam/users     (via gateway)
http://localhost:8081/agrilink/iam/users     (direct)
```

Routes are defined in code (`gateway-service/.../config/GatewayRoutesConfig.java`) using the
functional DSL; downstream base URLs are configurable in `gateway-service`'s `application.properties`
(`agrilink.services.*`). To run the gateway:

```powershell
.\mvnw.cmd -pl gateway-service spring-boot:run -Dmaven.resolver.transport=wagon -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true
```

> If port 8080 is already in use on your machine, start it on another port with
> `-Dspring-boot.run.arguments=--server.port=9090` (or change `server.port` in its
> `application.properties`).

## API conventions

- **URL format:** `agrilink/<module>/<endpoints>` — the `/agrilink/<module>` prefix is the service
  context path; the resource path is the controller mapping.
- **GET** returns the **full data** (entity or list of entities).
- **POST / PUT / DELETE** return **only a message**: `{ "message": "<Entity> created/updated/deleted successfully" }`.

Each entity exposes a uniform CRUD controller. Example for `iam-service` (port 8081):

| Method | URL                                         | Response            |
|--------|---------------------------------------------|---------------------|
| GET    | `/agrilink/iam/users`                       | `List<User>` (full) |
| GET    | `/agrilink/iam/users/{id}`                  | `User` (full)       |
| POST   | `/agrilink/iam/users`                       | `{ "message": "User created successfully" }`  |
| PUT    | `/agrilink/iam/users/{id}`                  | `{ "message": "User updated successfully" }`  |
| DELETE | `/agrilink/iam/users/{id}`                  | `{ "message": "User deleted successfully" }`  |

Resource paths per service: `iam` → `roles`, `permissions`, `role-permissions`, `users`, `audit-logs`;
`farmer` → `farmer-profiles`, `land-holdings`; `crop` → `crop-catalogs`, `crop-plans`, `growth-observations`;
`input` → `catalogs`, `requests`; `subsidy` → `scheme-catalogs`, `subsidy-applications`;
`produce` → `produce-listings`, `produce-sales`; `report` → `agri-reports`; `notification` → `notifications`.

## Data model

- Entity and column names match the ER diagram **exactly** (e.g. `@Table(name="User")`,
  `@Column(name="PasswordHash")`). Identifiers are globally quoted
  (`hibernate.globally_quoted_identifiers=true`) so reserved words like `User` and `Request` work
  on both MySQL and H2.
- **Within a service:** JPA via `JpaRepository`.
- **Cross-service foreign keys** (e.g. `CropPlan.FarmerID`, `Notification.UserID`) are stored as
  plain `Integer` ID columns — no cross-database JPA relationships, per microservice best practice.

## Project layout (per service)

```
<service>/
  pom.xml
  src/main/java/com/cognizant/agrilink/<module>/
    <Module>ServiceApplication.java
    entity/        @Entity classes (ER tables)
    dto/           request/response DTOs + MessageResponse
    repository/    JpaRepository interfaces
    service/       business logic
    controller/    REST controllers
  src/main/resources/application.properties   (MySQL, port, context-path)
  src/test/resources/application.properties    (H2, used by @DataJpaTest)
  src/test/java/.../{repository,service,controller}/   JUnit 5 + Mockito tests
```

## Tests

Each entity has 3 test classes (JUnit 5 + Mockito):
- **Repository test** — `@DataJpaTest` against in-memory H2 (save/findById, findAll, delete).
- **Service test** — pure Mockito (`@Mock` repository, `@InjectMocks` service), incl. not-found path.
- **Controller test** — standalone `MockMvc` with a mocked service (verifies GET returns data,
  and POST/PUT/DELETE return the message only).

**252 tests total, all passing.**

## Prerequisites

- JDK 21
- MySQL running on `localhost:3306` with user `root` / password `root` (schemas are auto-created via
  `createDatabaseIfNotExist=true`). Adjust credentials in each service's
  `src/main/resources/application.properties` if needed.
- Maven — use the bundled wrapper (`./mvnw`).

## Build & test

```bash
# Build and run all tests for every service (tests use H2, no MySQL needed)
./mvnw test

# Build a single service
./mvnw -pl iam-service test
```

> **Note (corporate network):** if Maven cannot download dependencies due to SSL interception
> (`PKIX path building failed`), append:
> `-Dmaven.resolver.transport=wagon -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true`

## Run the services

Each service is an independent Spring Boot app. Start them in separate terminals (MySQL must be up):

```bash
./mvnw -pl iam-service          spring-boot:run   # 8081
./mvnw -pl farmer-service       spring-boot:run   # 8082
./mvnw -pl crop-service         spring-boot:run   # 8083
./mvnw -pl input-service        spring-boot:run   # 8084
./mvnw -pl subsidy-service      spring-boot:run   # 8085
./mvnw -pl produce-service      spring-boot:run   # 8086
./mvnw -pl report-service       spring-boot:run   # 8087
./mvnw -pl notification-service spring-boot:run   # 8088
```

Example:

```bash
curl http://localhost:8081/agrilink/iam/users
curl -X POST http://localhost:8081/agrilink/iam/users \
     -H "Content-Type: application/json" \
     -d '{"name":"Asha","roleId":1,"email":"asha@example.com","phone":"99999","regionId":1,"passwordHash":"x","status":"Active"}'
```
#   m i c r o s e r v i c e s  
 