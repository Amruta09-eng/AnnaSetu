# 05: Test Plan and Results (Phase 4)
**Status legend:** EXECUTED = run in the build environment (automated, in `tests/api.test.js`) with the observed result matching expected. PLANNED = not yet run: **you must run it and fill in the Actual Result yourself.** Re-run `npm test` on your machine and note the date.

## Validation rules (documented first, as required)
Title 3-100 chars | Category in fixed list | Quantity integer 1-500 | Servings (optional) integer 1-1000 | Deadline (optional) valid date | Pickup required | Password >= 8 chars | Email valid and unique | Urgency in fixed list.

## Test cases
| ID | Type | Objective | Input / steps | Expected | Status |
|---|---|---|---|---|---|
| TC01 | BVA | Quantity 0 | create donation qty 0 | rejected (400) | EXECUTED: pass |
| TC02 | BVA | Quantity 1 | qty 1 | accepted | EXECUTED: pass |
| TC03 | BVA | Quantity 500 | qty 500 | accepted | EXECUTED: pass |
| TC04 | BVA | Quantity 501 | qty 501 | rejected (400) | EXECUTED: pass |
| TC05 | EP | Invalid category | category "Gold" | rejected | EXECUTED: pass |
| TC06 | EP | Short title | title "ab" | rejected | EXECUTED: pass |
| TC07 | EP | Missing pickup | pickup "" | rejected | EXECUTED: pass |
| TC08 | EP | Non-integer quantity | 2.5 | rejected | EXECUTED: pass |
| TC09 | Security | Wrong password | bad password | 401 | EXECUTED: pass |
| TC10 | Security | No token | GET donations without login | 401 | EXECUTED: pass |
| TC11 | Security | NGO creates donation | NGO token POST donations | 403 | EXECUTED: pass |
| TC12 | Security | Donor lists users | donor token GET users | 403 | EXECUTED: pass |
| TC13 | Workflow | Review before submit | NGO review on Created | 409 | EXECUTED: pass |
| TC14 | Workflow | Admin cannot review | admin review | 403 | EXECUTED: pass |
| TC15 | Workflow | Assign before Available | assign on UnderReview | 409 | EXECUTED: pass |
| TC16 | Workflow | Cancel once Available | donor cancel | 409 | EXECUTED: pass |
| TC17 | Validation | Assign without delivery location | assign, no location | 400 | EXECUTED: pass |
| TC18 | Workflow | Skip InTransit | volunteer deliver from Assigned | 409 | EXECUTED: pass |
| TC19 | System | Full happy path | submit>review>approve>release>assign>start>deliver | Delivered | EXECUTED: pass (automated + one browser run) |
| TC20 | Workflow | Rejected cannot proceed | reject then release | 409 | EXECUTED: pass |
| TC21 | Workflow | Reject then edit/resubmit | reopen | back to Created | EXECUTED: pass |
| TC22 | Security | Unverified NGO blocked | new NGO review | 403 | EXECUTED: pass |
| TC23 | Form | Duplicate registration | same email twice | 409 | EXECUTED: pass |
| TC24 | Integration | Notifications created | donor notifications after workflow | at least 2 | EXECUTED: pass |
| TC25 | Integration | Delivered request fulfilled | donation linked to request delivered | request hidden from donors (Fulfilled) | EXECUTED: pass |
| TC26 | Integration | Smart matching | submitted donation + same-type request | 1 suggestion | EXECUTED: pass |
| TC27 | Integration | Reports counts | admin reports after 1 delivery | delivered = 1 | EXECUTED: pass |
| TC28 | Database | Persistence | create donation, stop server, restart | donation still listed | PLANNED |
| TC29 | Form | Registration with short password | password "abc" | error message shown | PLANNED (UI) |
| TC30 | Form | Missing fields in registration | empty name/email | error shown | PLANNED (UI) |
| TC31 | Security | Donor A opens donor B's donation history | API with donor A token | 404 | PLANNED |
| TC32 | Security | Beneficiary sees only own requests | two beneficiaries | each sees own | PLANNED |
| TC33 | Black-box | Invalid input shown in UI | qty 0 in form | message "Quantity must be a whole number 1-500" | Observed once in browser; record formally |
| TC34 | UI | Responsive layout | phone-sized window | usable | PLANNED |
| TC35 | Regression | Re-run all after any code change | `npm test` | all pass | Re-run after each change |

## White-box testing (what to say / do)
Show the branches in the lifecycle handler (`/api/donations/action`): role check, state check, ownership check, per-action branches. Designed test paths: each guard failing once (TC11, TC13, TC14, TC16, TC22) and the full success path (TC19). **Coverage percentage has not been measured**: do not claim a figure. (Optional: `node --test --experimental-test-coverage tests/api.test.js` and record what it prints.)

## Where tests live
Unit: TC01-TC08 (`validateDonation`). Integration/System/Security/Workflow: the lifecycle test in `tests/api.test.js`.

## Defects found and fixed during development (real)
1. Lifecycle initially followed Phase 1 text; diagrams differed, so the code was changed to follow the State Diagram.
2. A script selector clash in my browser test (two "Login" buttons) was a test bug, not an app bug.
