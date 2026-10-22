# 03: Status and To-Do
## A. DONE and verified (by automated tests and a browser run in the build environment)
- Landing page, registration, login/logout, role-based dashboards, protected API routes.
- Donation create/edit/cancel, full lifecycle per the State Diagram, status history.
- NGO review, volunteer assignment, volunteer delivery, emergency requests with urgency, request linking, auto-Fulfilled on delivery.
- In-app notifications (mark as read), profile editing, NGO/volunteer verification, admin user list and reports.
- Basic smart matching (resource type, urgency, quantity).
- Server-side validation; hashed passwords; data persists in SQLite across restarts (design property; see doc 05 for the restart test you should run).
- 3 automated test groups (many assertions) all passing.
**Caveat:** verified in my build environment, not on your machine. Re-run `npm test` yourself and do the demo once.

## B. NOT built / known gaps
| Item | Notes |
|---|---|
| Search/filter controls in the UI | API supports `search`, `category`, `status`; no UI inputs yet |
| Separate Resource entity / resource-donation records | Class diagram has `Resource`; app uses a fixed category list |
| Location-based matching | NGO/request/donation locations are text only. Phase 1 mentions location accuracy; say it is future work |
| Email/SMS/push | Not implemented; notifications are in-app only. Say so honestly |
| Landing page extras | Impact section on landing page and category cards are minimal; images not added |
| Responsive design | CSS uses flexible grids but was **not tested** on phone/tablet |
| Accessibility | Not audited |
| Deployment | Not done (optional) |
| Admin can't edit users/requests beyond verify/remove-listing | |
| Beneficiary privacy | Beneficiaries only see their own requests (implemented); donors/NGOs see all open requests by design |
| Rate limiting, session expiry, HTTPS | Not implemented; list as limitations |

## C. Priority to-do list (do in this order)
**P1: Must do before the exam**
1. Run the app and do the full demo once (doc 06). Note anything broken.
2. Fix report inconsistencies (doc 04).
3. Execute the manual test cases in doc 05 and record real results.
4. Write Phase 4 (testing) and Phase 5 (maintenance) in your report.
5. Rehearse the viva.
**P2: If time permits**
6. Add search/filter inputs to the donations list.
7. Test on a phone-sized window; fix layout problems.
8. Add a little more content to the landing page (categories, impact labelled as demo data).
**P3: Optional**
9. Deployment; email notifications; location matching.

## D. Tell your examiner (limitations you can state confidently)
In-app notifications only; basic matching; fixed resource categories; no location/GPS; demo accounts and demo data only; no real-world impact has been measured.
