# 08: Maintenance (Phase 5): Hypothetical Change Requests
These are **hypothetical** (not implemented). Faculty slides ask for: identify change requests, modify requirements/design, impact analysis, maintenance type, side effects.

| ID | Change request | Type | Requirement/design change | Code impact | Tests to re-run | Possible side effects |
|---|---|---|---|---|---|---|
| CR1 | Send email when a donation is Delivered | Perfective | Add to FR 6.9 (notifications); add Email service to component/deployment diagrams | `notify()` in server.js; needs external service and config | Notification tests (TC24) + new email test | Failures/delays of email provider; privacy of addresses; cost |
| CR2 | Match by distance using GPS coordinates | Perfective | New attributes lat/long on donations/requests; update class + ER; FR 6.11 | `/api/matches`, schema, forms | TC26 + new location tests | Wrong coordinates give bad matches; privacy of exact location |
| CR3 | Donations auto-expire after consumption deadline | Perfective/Preventive | New transition Available -> Expired in State Diagram | lifecycle table `T`, scheduled job | Workflow tests, regression | Valid donations expiring wrongly due to time zones |
| CR4 | Fix: donor can currently edit only while Created; also allow after Rejected | Corrective | Clarify State Diagram edit rule | `/api/donations/edit` | TC21 + validation tests | Rejected-then-edited loops |
| CR5 | Move from SQLite to a server database (PostgreSQL) | Adaptive | Update deployment diagram | database layer | All integration tests | Different SQL behaviour, migration of data |
| CR6 | Add session expiry and login rate limiting | Preventive | NFR 7.2 security | auth code, sessions table | Security tests | Users logged out unexpectedly |

## How to write impact analysis for one CR (example CR1)
1. Requirements affected: FR 6.9. 2. Design: component diagram (new Email component), sequence diagram (delivery completion), deployment diagram. 3. Code: notification function, configuration (keys in environment variables, never in frontend). 4. Tests: re-run notification and workflow tests (regression) plus new tests. 5. Risks/side effects: external dependency, delays, spam, privacy. 6. Estimate effort using your Phase 2 method.

## Maintenance types: quick reference
Corrective = fix bugs. Adaptive = adjust to environment (new database, new OS). Perfective = improve/add features. Preventive = refactor to avoid future problems.
