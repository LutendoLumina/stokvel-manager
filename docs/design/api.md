# API contract

A REST API under /api/v1 with 25 endpoints. Every route except sign-up and log-in needs a token, and every stokvel route checks the caller's role in that stokvel.

## Conventions

- **Base URL:** `/api/v1`. Requests and responses are JSON.
- **Auth:** log-in returns a JWT. Send it as `Authorization: Bearer <token>`. It expires after 1 hour. Logging out means the app deletes the token.
- **Roles:** a guard loads the caller's membership for the stokvel in the URL. In the tables below, **Treasurer** means the treasurer or the chairperson, and **Member** means anyone in that stokvel.
- **Not a member:** stokvel routes return 404, not 403, so outsiders can't tell whether a stokvel exists.
- **Money:** always `amountCents` as a whole number. R500.00 is `50000`. The frontend formats it as rand.
- **Phone numbers:** accepted as `082 123 4567` or `+27821234567`, always returned as `+27821234567`.
- **Dates:** ISO 8601. Dates only, like `2026-12-01`, for due dates; full UTC timestamps for everything else.
- **IDs:** UUIDs.
- **Cycles are created automatically,** not through the API. The first cycle opens on the start date, and the daily job opens each next one.

## Endpoints

**Auth**

| Method | Path | Who | What it does | Story |
| --- | --- | --- | --- | --- |
| POST | /auth/signup | Public | Create an account; links to any membership with the same phone | US-01, 03 |
| POST | /auth/login | Public | Log in with phone and password, returns a token | US-01 |
| GET | /me | Any user | The logged-in user's profile | US-01 |

**Stokvels**

| Method | Path | Who | What it does | Story |
| --- | --- | --- | --- | --- |
| POST | /stokvels | Any user | Create a stokvel; the caller becomes chairperson | US-02 |
| GET | /stokvels | Any user | List the stokvels the caller belongs to | US-01 |
| GET | /stokvels/:id | Member | Stokvel details and rules | US-09 |
| PATCH | /stokvels/:id | Chairperson | Change name or rules, only before the first cycle starts | US-02 |

**Members and invites**

| Method | Path | Who | What it does | Story |
| --- | --- | --- | --- | --- |
| GET | /stokvels/:id/members | Member | List members with role, phone and payout position | US-09 |
| POST | /stokvels/:id/members | Treasurer | Add a member by name and phone, no login needed | US-03, rule 1 |
| PATCH | /stokvels/:id/members/:memberId/role | Chairperson | Make a member the treasurer | US-04 |
| POST | /stokvels/:id/members/:memberId/leave | Chairperson, or the member | Mark a member as left; history stays | Rule 3 |
| POST | /stokvels/:id/invites | Treasurer | Create an invite link that expires in 7 days | US-03 |
| POST | /invites/:token/accept | Any user | Join the stokvel from an invite link | US-03 |

**Payout order and swaps**

| Method | Path | Who | What it does | Story |
| --- | --- | --- | --- | --- |
| PUT | /stokvels/:id/payout-order | Chairperson | Set the full payout order | US-05 |
| POST | /stokvels/:id/swaps | Member | Ask another member to swap turns | Rule 4 |
| POST | /stokvels/:id/swaps/:swapId/accept | The other member | Agree to the swap | Rule 4 |
| POST | /stokvels/:id/swaps/:swapId/approve | Chairperson | Approve; both positions change in one transaction | Rule 4 |
| POST | /stokvels/:id/swaps/:swapId/reject | The other member or chairperson | Turn the swap down | Rule 4 |

**Money**

| Method | Path | Who | What it does | Story |
| --- | --- | --- | --- | --- |
| GET | /stokvels/:id/cycles | Member | List cycles with due date, recipient and status | US-09 |
| GET | /stokvels/:id/ledger | Treasurer | All ledger entries; filter by `?cycleId=` or `?memberId=` | US-06, 07 |
| POST | /stokvels/:id/payments | Treasurer | Record a payment (full or partial) | US-06, rule 2 |
| POST | /stokvels/:id/ledger/:entryId/reverse | Treasurer | Cancel a wrong entry with a reversal | US-07 |
| POST | /stokvels/:id/cycles/:cycleId/payout | Treasurer | Record the payout to this cycle's recipient | US-08, rule 5 |

**Dashboard**

| Method | Path | Who | What it does | Story |
| --- | --- | --- | --- | --- |
| GET | /stokvels/:id/dashboard | Member | Pot total, who paid, who's late, who's next | US-09, 10 |
| GET | /stokvels/:id/members/:memberId/statement | Treasurer, or the member | One member's payments, balance owed and payout date | US-09 |

## Key requests and responses

These three carry the main business rules, so they're spelled out in full. The rest follow the same style.

**Record a payment:** `POST /stokvels/:id/payments`

```json
{
  "memberId": "b7e1c2a0-...",
  "cycleId": "4f2d9e11-...",
  "amountCents": 30000
}
```

Returns `201` with the new entry and the member's updated status for that cycle:

```json
{
  "entry": {
    "id": "9a0c55b3-...",
    "type": "CONTRIBUTION",
    "amountCents": 30000,
    "recordedBy": "Thandi Mokoena",
    "createdAt": "2026-12-01T08:15:00Z"
  },
  "memberStatus": {
    "paidCents": 30000,
    "owedCents": 20000,
    "status": "PARTIAL"
  }
}
```

**Reverse a wrong entry:** `POST /stokvels/:id/ledger/:entryId/reverse`

```json
{
  "reason": "Recorded R300 instead of R500"
}
```

Returns `201` with a new REVERSAL entry pointing at the original. A reason is required. Reversing the same entry twice returns `409`.

**Dashboard:** `GET /stokvels/:id/dashboard`

```json
{
  "stokvel": { "id": "c1d2...", "name": "Kasi Savers", "contributionCents": 50000 },
  "currentCycle": {
    "number": 3,
    "dueDate": "2026-12-01",
    "potCents": 350000,
    "recipient": { "memberId": "e8f9...", "name": "Sipho Dlamini" }
  },
  "members": [
    { "memberId": "b7e1...", "name": "Lerato Nkosi", "paidCents": 50000, "owedCents": 0, "status": "PAID" },
    { "memberId": "a3c4...", "name": "Gogo Mahlangu", "paidCents": 0, "owedCents": 50000, "status": "LATE", "hasEmail": false }
  ],
  "nextUp": { "memberId": "f0a1...", "name": "Naledi Khumalo", "cycle": 4 }
}
```

Member status is one of `PAID`, `PARTIAL`, `NOT_DUE` or `LATE`. It's calculated from the ledger on every request, never stored. `hasEmail: false` tells the treasurer to phone that member instead.

## Errors

Every error returns the same shape, so the frontend can handle them in one place:

```json
{
  "statusCode": 409,
  "error": "ENTRY_ALREADY_REVERSED",
  "message": "This entry has already been reversed."
}
```

| Status | Meaning in this API | Examples |
| --- | --- | --- |
| 400 | The request body is invalid | Amount is 0 or negative; phone number in the wrong format |
| 401 | No token, or it has expired | Calling any stokvel route without logging in |
| 403 | A member, but the wrong role | A member trying to record a payment |
| 404 | Not found, or the caller isn't in this stokvel | Opening another group's stokvel |
| 409 | Clashes with the current state | Phone already registered; already a member; entry already reversed; cycle already paid out |
| 410 | The link is no longer valid | Accepting an invite after 7 days |
| 422 | Breaks a business rule | Payout to someone who isn't this cycle's recipient; swapping a turn that's already been paid out; changing rules after the first cycle |
