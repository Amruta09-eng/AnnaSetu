# 02: How the Code Works
## Architecture (three-tier, matches your Phase 3 text)
    Browser (Presentation)  --HTTP/JSON-->  Node server (Application/business logic)  -->  SQLite (Data)
    annasetu/public/index.html              annasetu/server.js                            annasetu/annasetu.db

## Files
| File | Purpose |
|---|---|
| `server.js` | Backend: schema, validation, authentication, authorization, lifecycle rules, API, static file serving |
| `public/index.html` | Frontend: landing page, login/register, dashboards for each role (plain HTML/CSS/JS, no framework) |
| `tests/api.test.js` | Automated tests (Node's built-in test runner) |
| `package.json` | `npm start`, `npm test`; requires Node >= 22.13 |

## Backend, key ideas
1. **Routes table:** each endpoint is registered with `R(method, path, allowedRoles, handler)`. The server checks the session token and the role *before* the handler runs (authorization).
2. **Passwords:** hashed with scrypt + random salt (`crypto`). Plaintext is never stored.
3. **Sessions:** login creates a random token stored in the `sessions` table; the browser sends it as `Authorization: Bearer <token>`.
4. **Validation on the server:** `validateDonation` / `validateRequest` (the frontend hints are not trusted). Rules: title 3-100 chars; category from fixed list; **quantity whole number 1-500**; servings (optional) 1-1000; consumption deadline (optional) must be a valid date; pickup location required; urgency from fixed list.
5. **Lifecycle engine:** table `T` lists each action, allowed from-states, resulting state and allowed role. One generic handler checks role, current state and ownership, then updates and logs history. This is why invalid jumps return HTTP 409.
6. **Notifications:** rows in the `notifications` table, shown in-app. **No email/SMS is sent.**
7. **Smart matching (basic):** `/api/matches` pairs open donations with open requests of the same resource type, ordered by urgency then closest quantity. Location is **not** used.

## Donation lifecycle (= Phase 3 State Diagram)
    Created -> Submitted -> UnderReview -> Approved -> Available -> Assigned -> InTransit -> Delivered
    UnderReview -> Rejected -> Created (edit and resubmit)
    Created / Submitted / Approved -> Cancelled
| Action | From | To | Who |
|---|---|---|---|
| submit | Created | Submitted | donor (own) |
| review | Submitted | UnderReview | verified NGO (becomes the donation's NGO) |
| approve / reject | UnderReview | Approved / Rejected | that NGO |
| reopen | Rejected | Created | donor (own) |
| release | Approved | Available | that NGO |
| assign | Available | Assigned | that NGO (needs volunteer + delivery location) |
| start | Assigned | InTransit | assigned volunteer |
| deliver | InTransit | Delivered | assigned volunteer |
| cancel | Created/Submitted/Approved | Cancelled | donor (own) or admin |
Delivered also marks the linked resource request as Fulfilled.

## Database tables
| Table | Holds | Notes |
|---|---|---|
| users | all roles | role, verified (NGO/volunteer need admin verification), availability, org_name, phone, address |
| sessions | login tokens | |
| donations | donations | status, request_id (optional link to a request), servings, deadline |
| distributions | one per accepted donation | ngo_id, delivery_location |
| tasks | volunteer task per distribution | volunteer_id, status, started/delivered timestamps |
| requests | emergency/resource requests | category, quantity, location, urgency, status |
| history | status changes | powers the History button |
| notifications | in-app messages | is_read |

**Mapping to your diagrams:** ER "NGO" and "Volunteer" are users with that role; ER "Delivery" = `distributions` + `tasks`; class-diagram "Distribution" and "VolunteerTask" = those two tables. The class diagram's "Resource" class has no table (categories are a fixed list).

## API summary
| Method + path | Roles | Purpose |
|---|---|---|
| POST /api/register, /api/login, /api/logout | public / any | auth |
| GET/POST /api/profile | any | view/update profile |
| POST /api/donations, /api/donations/edit | donor | create / edit (only while Created) |
| GET /api/donations?search=&category=&status= | any (filtered by role) | list |
| POST /api/donations/action | donor, ngo, volunteer, admin | lifecycle actions |
| GET /api/history?donation_id= | donor, ngo, admin | status history |
| POST/GET /api/requests | beneficiary, ngo (create); beneficiary, ngo, admin, donor (view) | resource requests |
| POST /api/requests/status | ngo, admin | Open -> In Progress -> Fulfilled |
| GET /api/notifications, POST /api/notifications/read | any | notifications |
| GET /api/volunteers | ngo, admin | verified, available volunteers |
| GET /api/users, POST /api/users/verify | admin | user management, verification |
| GET /api/matches | ngo, admin | suggested pairs |
| GET /api/reports | admin | counts |

## Frontend
One page; JavaScript switches views. `api()` wraps fetch and attaches the token. `dCard()` decides which buttons to show for the current role and donation status. The frontend only hides buttons; the **server** enforces permissions. Dark mode follows the OS setting.
