# 01: Setup and Run
## Requirements
- Node.js **22.13 or newer** (check: `node -v`). Download from nodejs.org (LTS 22 or later).
- Nothing else. **No `npm install`**: the app uses only Node's built-in modules (http, crypto, node:sqlite).

## Run
    cd annasetu
    node server.js
Open http://localhost:3000. On first start the database file `annasetu.db` is created and demo accounts are seeded.
(You will see an "ExperimentalWarning: SQLite" message. That is normal and harmless.)

## Demo accounts (DEMO DATA, password `Demo@1234`)
| Role | Email |
|---|---|
| Admin | admin@demo.test |
| Donor | donor@demo.test |
| NGO | ngo@demo.test |
| Volunteer | volunteer@demo.test |
| Beneficiary | beneficiary@demo.test |

## Reset the demo
Stop the server (Ctrl+C), delete `annasetu.db`, start again.

## Run the automated tests
    npm test
(uses an in-memory database; never touches your demo data).

## Change port / database file
    PORT=4000 node server.js            (Windows PowerShell: $env:PORT=4000; node server.js)
    DB_FILE=/path/to/other.db node server.js

## Troubleshooting
| Problem | Fix |
|---|---|
| `Cannot find module 'node:sqlite'` | Node is too old. Install Node 22.13+. |
| Port already in use | Use another port (see above) or close the other program. |
| Login fails for demo accounts | Delete `annasetu.db` and restart so seeding runs again. |
| Old screens/errors after updating files | Delete `annasetu.db` (schema changed between versions). |
| Page blank | Open browser console (F12). Make sure you opened http://localhost:3000, not the HTML file directly. |
| No internet at exam | Fine. Everything runs locally. |
