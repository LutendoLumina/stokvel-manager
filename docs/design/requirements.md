# Stokvel Manager — Requirements

## Problem statement

Stokvels in South Africa are mostly run on WhatsApp groups, paper books and spreadsheets. The treasurer tracks who paid by hand, members can't easily see their own balance, and disputes start when records are unclear or missing.

Stokvel Manager gives a group one shared, trusted record: who has paid, who is late, how much is in the pot, and whose turn it is to receive the payout. Every money movement is recorded in a ledger that cannot be edited, only corrected with a new entry.

**Target users:** small rotating savings stokvels (5–30 members) where each member pays a fixed amount on a fixed schedule and one member receives the pot each cycle. Many members, especially older ones, don't use email, so the app identifies people by phone number and members don't need to log in.

## Users and roles

A user can belong to many stokvels and have a different role in each.

| Role | Who they are | What they can do |
| --- | --- | --- |
| Chairperson | Creates and leads the stokvel (one per stokvel) | Everything a treasurer can do, plus: set the rules, invite and remove members, set the payout order, assign the treasurer |
| Treasurer | Handles the money records | Record payments and payouts, correct mistakes with reversal entries, view all balances |
| Member | Contributes to the pot | If they have a login: view their own payments, balance and payout date; view the group's totals and payout order |

## Scope

**In the MVP:**

- Sign up, log in, log out (phone number and password; email optional)
- Create a stokvel and set its rules: contribution amount, frequency (monthly), start date
- Add members by name and phone number, or invite them with a link
- Set and view the payout order
- Record payments and payouts in an append-only ledger
- See each member's status for the current cycle: paid, late or not yet due
- A daily job that marks late payments and emails reminders

**Out of scope for now:**

- Real money movement (no bank or payment gateway integration; the app only records)
- Grocery, burial and investment stokvels (rotating payout only)
- Interest, fines and penalties
- Proof-of-payment uploads, PDF statements, SMS or WhatsApp reminders, and login with an SMS code (all planned for later)
- Mobile app (responsive web only)

## User stories

Each story becomes one GitHub issue. It's done when every acceptance criterion passes and has a test.

1. **US-01 Sign up and log in.** As a visitor, I can create an account and log in so I can use the app.
   - Phone number must be unique and is saved in +27 format; email is optional. Password is at least 8 characters and stored hashed.
   - Wrong phone number or password shows one general error message, not which field was wrong.
   - After login, I land on a list of my stokvels.
2. **US-02 Create a stokvel.** As a user, I can create a stokvel so I can start a group.
   - I enter a name, contribution amount (in rand), frequency (monthly) and start date.
   - The amount must be more than R0 and is saved in cents.
   - I become the chairperson automatically.
3. **US-03 Add members.** As a chairperson or treasurer, I can add members by name and phone number, or share an invite link with members who want to log in.
   - The link expires after 7 days.
   - A logged-in user who opens it can accept and becomes a member.
   - A member added by phone who later signs up with the same number is linked to their existing membership, not added twice.
4. **US-04 Assign the treasurer.** As a chairperson, I can make a member the treasurer.
   - Only one treasurer per stokvel at a time.
   - Only the chairperson can do this; anyone else gets a 403 error.
5. **US-05 Set the payout order.** As a chairperson, I can set the order in which members receive the payout.
   - Every member appears exactly once in the order.
   - The order can't change for a cycle that has already been paid out.
6. **US-06 Record a payment.** As a treasurer, I can record a member's payment so the records are up to date.
   - It creates a ledger entry with the amount, date, member and who recorded it.
   - The member's status for that cycle changes to "paid" once the full amount is in.
   - Members can't record payments.
7. **US-07 Correct a mistake.** As a treasurer, I can reverse a wrong entry so the ledger stays accurate.
   - The original entry is never edited or deleted.
   - A new reversal entry with the opposite amount and a reason is added.
   - Balances update to reflect the reversal.
8. **US-08 Record a payout.** As a treasurer, I can record that this cycle's recipient was paid.
   - Only the member whose turn it is can receive it.
   - The payout amount equals the pot for that cycle.
   - The next member in the order becomes "next up".
9. **US-09 View my stokvel.** As a member, I can see the group dashboard so I know where things stand.
   - It shows the pot total, who has paid, who is late, and who is next for payout.
   - I can see my own payment history and my payout date.
10. **US-10 Late payment reminders.** As a chairperson, I want late members flagged and reminded automatically.
    - A daily job marks a member "late" when the due date passes without full payment.
    - Late members with an email address get at most one reminder email per day. Members without email are flagged for the treasurer to phone.
    - The chairperson can see a list of late members on the dashboard.

## Business rules

These rules were agreed on 22 Nov 2026. Each rule needs at least one test.

1. **Joining late:** a member can join after the stokvel has started. They go to the end of the payout order.
2. **Partial payments:** allowed. The member's status shows how much is still owed for that cycle until the full amount is paid.
3. **Leaving:** a member can leave at any time. If they leave after receiving a payout, the app shows the amount they still owe so the chairperson can follow up.
4. **Swapping turns:** two members can swap payout turns if both agree and the chairperson approves. Turns that have already been paid out can't be swapped.
5. **Payout with missing payments:** the payout goes ahead with whatever is in the pot. Members who haven't paid are recorded as owing.
6. **Chairperson as treasurer:** allowed, but the app recommends using two different people.
