# 06: Demo Script (about 8-10 minutes)
**Before the exam:** delete `annasetu.db`, run `node server.js`, open http://localhost:3000. Use **separate browser windows** (one normal, one private) to avoid logging out each time. Password for all demo accounts: `Demo@1234`.

| # | Do | Say |
|---|---|---|
| 1 | Show landing page | "AnnaSetu connects donors, NGOs, volunteers and communities." Point at the 3 buttons. |
| 2 | Login as **donor@demo.test**; New Donation; enter qty `0` -> error shown | Server-side validation; allowed range 1-500 (boundary value). |
| 3 | Fix qty to 20, title "Veg biryani", pickup "Hostel mess"; Create | Status **Created**. |
| 4 | Click **Submit for review** | Status **Submitted**. Notifications went to verified NGOs. |
| 5 | Login as **ngo@demo.test**; Donations; **Start review** -> **Approve** -> **Mark available** | State diagram: UnderReview, Approved, Available. |
| 6 | **Matches** tab (optional: first create a request as beneficiary, see step 12) | Basic matching by type, urgency, quantity. |
| 7 | Still NGO: choose volunteer, **Assign volunteer**, enter delivery location | Status **Assigned**; a Distribution and a VolunteerTask are created. |
| 8 | Login as **volunteer@demo.test**; **Accept & start delivery** -> **Mark delivered** | InTransit then **Delivered**. |
| 9 | Back as donor: show Delivered + **History** + **Notifications** | Status history and in-app notifications. |
| 10 | Login as **admin@demo.test**; **Reports**, **Users** (verify a new NGO if you registered one) | Counts of records in this database, not real impact. |
| 11 | Try a forbidden action: as donor open `/api/users` in the address bar -> error | Role-based access control (401/403). |
| 12 | Login as **beneficiary@demo.test**; New Request: Water, qty 50, location "Flood camp A", urgency Critical | Emergency module; NGO/admin get notified. NGO: Requests tab -> Start -> Mark fulfilled. |
| 13 | Show `annasetu.db` (e.g. DB Browser for SQLite) tables: users, donations, distributions, tasks | Persistent database. Explain 3-tier architecture. |
| 14 | Run `npm test` in a terminal | Show real pass count. |
| 15 | Show report: diagrams, test table, maintenance | |

## Order tip
Do step 12 (create a request) **before** step 3, and select it in "Responding to request" when creating the donation. Then Delivered also marks the request Fulfilled, which is a nice finish.

## Backup plan (no internet / laptop issues)
Everything runs offline. Keep: a screenshot set of each step, the zip on a USB drive, and a second copy of the project. If the app fails, show `npm test` output and screenshots and walk through the diagrams.
