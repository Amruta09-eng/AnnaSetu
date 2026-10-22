# 04: Lab Phases Checklist
Source: faculty slides (SE_Lab, Dr Shishir Singh Chauhan) vs your report dated 15 Oct. "Present" means the content exists in your report; it does not mean it is correct.

| Phase | Required items | In your report? |
|---|---|---|
| 1 Requirements | Problem statement, stakeholders, functional req., non-functional req., SRS, validation checklist | Present |
| 2 Estimation | LOC, Function Points, Halstead, cost, schedule, risk register | Present |
| 3 Design | Use Case, Activity, Class, Sequence, State, Component/Deployment, architecture, data model | Diagrams present; numbering and section gaps |
| 4 Testing | Unit, white-box, integration, black-box, BVA, EP, system, regression | **Missing**: use doc 05 |
| 5 Maintenance | Change requests, modify req./design, impact analysis, maintenance type, side effects | **Missing**: use doc 08 |

## Fixes needed in your report
1. **Section 6.8 (Phase 1) lifecycle contradicts the State Diagram.** Update 6.8 to: Created, Submitted, UnderReview, Approved, Available, Assigned, InTransit, Delivered (+ Rejected, Cancelled). The code follows the State Diagram.
2. **Phase 3 numbering:** headings jump 2, 4, 5, 6. Use Case and Class diagrams sit under Phase 1; move or cross-reference them so Phase 3 lists all required diagrams.
3. **Data model (section 8):** 8.1-8.3 are missing (8.4 follows the figure). Add entity descriptions, relationships/cardinalities and the mapping note from doc 02.
4. **ER vs class diagram differ** (ER: NGO, Volunteer, Delivery; class: Distribution, VolunteerTask, Resource). Add a sentence explaining how the implementation reconciles them.
5. **ER typos:** `deliveer_id`; USER entity drawn twice.
6. **Class diagram typo:** `AttributepickupLocation`.
7. **Features in the app but not in the diagrams:** user verification, profile update, smart matching page. They are in Phase 1 requirements; consider adding to the use case diagram or state them in the report.
8. **Phase 2 figures:** check COCOMO arithmetic (organic mode: Effort = 2.4 x KLOC^1.05; Time = 2.5 x Effort^0.38). Use consistent rounding throughout. State that these are pre-implementation estimates.
9. **Activity, Sequence, Component, Deployment diagrams:** not yet compared against the code. Check that they show: NGO (not admin) assigns volunteers; volunteer accepts and starts delivery; browser -> Node server -> SQLite.

## Rule when anything changes
If a requirement changes, update: requirement text -> use case/class/state diagrams -> code -> test cases -> estimates (if scope changes).
