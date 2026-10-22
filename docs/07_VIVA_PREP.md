# 07: Viva Prep
Use your own words. Do not quote numbers you have not checked in your own report. For estimation questions, open your Phase 2 section and use *your* figures.

## Project basics
**What is AnnaSetu?** A web platform that connects donors with surplus food/resources to NGOs, volunteers and people in need, with tracking and emergency requests.
**Problem?** Surplus food is wasted while others lack supplies; there is no easy way to coordinate pickup, delivery and urgent needs.
**Stakeholders?** Donors, NGOs, volunteers, beneficiaries/disaster-affected people, administrator.
**Limitations (be honest):** in-app notifications only; basic matching without location; fixed categories; demo data; no measured real-world impact.
**Contribution?** One platform covering donation, review, assignment, delivery tracking and emergency requests with role-based access.
*Follow-up:* "Has it reduced food waste?" -> No. Those are intended benefits, not measured results.

## Requirements
**Functional vs non-functional:** functional = what the system does (register, donate, assign); non-functional = qualities (security, performance, usability).
**SRS:** a document defining what the software must do, for whom and under what constraints.
**Validation:** checking requirements are complete, consistent, testable (your checklist in section 9).
*Example:* FR "volunteer can update delivery status" vs NFR "passwords stored hashed".

## Estimation (use your report)
**LOC / FP / Halstead / COCOMO:** LOC counts code size; FP measures functionality (inputs, outputs, inquiries, files, interfaces) adjusted by a value factor; Halstead uses operators/operands; COCOMO (organic) Effort = 2.4 x KLOC^1.05, Time = 2.5 x Effort^0.38.
*Follow-up:* "Is your estimate accurate?" -> It is a pre-implementation estimate with assumptions; the prototype is smaller than the estimated full system.

## Design
**Use case:** actors and what they do. **Class:** entities, attributes, relationships. **Sequence:** message order for a scenario. **State:** donation lifecycle. **Activity:** workflow. **Component/Deployment:** modules and where they run.
**Three-tier:** presentation (browser/HTML), application (Node server rules), data (SQLite).
**Why a state machine?** To block invalid transitions; the server table `T` enforces it.
**Cardinalities:** one user creates many donations; one donation has at most one distribution and task in this prototype; one volunteer can have many tasks.
*Follow-up:* "Your ER has Delivery but code has two tables?" -> Delivery is represented by distributions (NGO side) and tasks (volunteer side); both diagrams are covered.

## Implementation
**Auth:** email + password; scrypt hash with salt; session token. **Authorization:** each route lists allowed roles; checked on the server; ownership checked for donors, NGOs, volunteers.
**Validation:** on the server (quantity 1-500, etc.). **Why SQLite/Node?** zero install, real database, runs offline.
*Follow-up:* "What if someone edits the frontend?" -> The server still rejects it.
*Follow-up:* "Security limits?" -> No HTTPS, rate limiting or session expiry yet.

## Testing
**Unit:** one function (validateDonation). **Integration:** modules together (API + database). **System:** whole workflow. **Black-box:** inputs/outputs only. **White-box:** internal branches. **BVA:** test at limits: 0, 1, 500, 501. **EP:** one value per valid/invalid group. **Regression:** re-run tests after changes. **Acceptance:** user/examiner confirms it meets needs.
**Coverage types:** statement (each line), branch (each decision both ways), condition, path. *Say you did not measure a coverage percentage unless you run it.*
*Follow-up:* "Show a defect you found." -> Lifecycle in code differed from the State Diagram; fixed and re-tested.

## Maintenance
**Corrective** fixes defects; **adaptive** adjusts to a changed environment; **perfective** adds/improves features; **preventive** improves structure to avoid future problems. See doc 08 for examples and impact analysis.
