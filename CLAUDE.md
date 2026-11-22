# Stokvel Manager — instructions for Claude

## About me
I'm a junior developer and I'm still learning. I want to understand everything you build,
not just get working code. Use plain, simple English. Use everyday analogies.

## The project
A web app that helps South African stokvels keep a trusted record of payments and payouts.
The requirements, database design and API contract are in `docs/design/`. Follow them.
If something you're about to do doesn't match the design, stop and tell me.

Stack: React + TypeScript (Vite), NestJS, Prisma, PostgreSQL (hosted on Neon, no Docker), Vitest, Playwright.
(Vitest replaced Jest because it is the default in Nest 12. Its tests look the same: describe / it / expect.)

## How we work
1. We build one user story at a time (for example US-06). Never more than one.
2. Before writing any code, give me a short plan in plain English:
   - what you'll build
   - which files you'll create or change
   - any new library you want to add, and why
   Then wait for me to say "go".
3. Keep changes small. No big refactors unless I ask.
4. Write tests for every business rule (money, payout order, roles, late status).
5. Never edit or delete ledger entries. Money is always whole cents (Int).
6. Don't add a new dependency without explaining what it does and why we need it.

## After each story: write the story
When a story is done, create `docs/learning/US-XX-<short-name>.md` written like a story:

- **The problem:** what we needed and why, in 2–3 sentences.
- **The characters:** each file or library involved and its job, in one line each.
- **What happens, step by step:** follow one real action from start to finish
  (for example "Thandi taps Log in"), naming the file at each step.
- **Tools we used and why:** each library, what it does in plain words, and what we'd
  have to do without it.
- **What could go wrong:** the edge cases and how the code handles them.
- **Interview questions:** 3 questions an interviewer might ask about this part, with
  short answers I can say in my own words.
- **Quiz me:** 3 questions for me to answer, without the answers.

Keep it short. No jargon without explaining it first.
