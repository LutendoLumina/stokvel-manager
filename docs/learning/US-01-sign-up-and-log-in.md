# US-01 Sign up and log in

## The problem

Before anyone can record a payment, the app needs to know who is using it. People sign up with their phone number (many members don't use email) and a password, then log in to get a "wristband" (a token) that proves who they are on every later request. A wrong phone or a wrong password must give the same message, so strangers can't use the log-in form to find out who has an account.

## The characters

- **`prisma/schema.prisma`** + **`prisma/migrations/…_create_user/`**: the User table, and the SQL that created it.
- **`src/common/phone.ts`**: turns `082 123 4567` into `+27821234567`, so one person always matches one account.
- **`src/auth/auth.dto.ts`**: the shape a sign-up or log-in body must have. Anything wrong becomes a 400.
- **`src/auth/password.ts`**: hashes passwords with scrypt, and checks them.
- **`src/auth/auth.service.ts`**: the sign-up and log-in rules.
- **`src/auth/auth.controller.ts`**: the two routes, `POST /auth/signup` and `POST /auth/login`.
- **`src/auth/auth.guard.ts`**: the bouncer. No valid token means 401, unless the route is `@Public()`.
- **`src/users/me.controller.ts`**: `GET /me`, your profile.
- **`src/common/http-exception.filter.ts`**: makes every error look like `{ statusCode, error, message }`.
- **`client/src/api.ts`**: the one place the website talks to the server.
- **`client/src/auth.ts`**: keeps the token in the browser.
- **`client/src/pages/*.tsx`**: the Sign up, Log in and My stokvels pages.

## What happens, step by step

Thandi types `082 123 4567` and her password, then taps **Log in**.

1. **`LoginPage.tsx`** calls `api.login(...)` in **`api.ts`**, which sends `POST /api/v1/auth/login`.
2. Vite's proxy passes the request to the server. The **`ValidationPipe`** (set up in `app.setup.ts`) checks the body against `LoginDto` in **`auth.dto.ts`**. On the way, it turns her phone into `+27821234567`.
3. **`AuthGuard`** sees that the route is `@Public()`, so it lets her through without a token.
4. **`AuthController.login`** hands over to **`AuthService.login`**, which asks **`UsersService`** to find the user by phone.
5. **`password.ts`** hashes what she typed, using the salt stored with her hash, and compares the two. They match.
6. **`AuthService`** signs a JWT that holds her user id and expires in 1 hour. It returns `{ accessToken, user }`.
7. Back in the browser, **`auth.ts`** saves the token, and the app goes to **`/stokvels`**.
8. **`StokvelsPage.tsx`** calls `GET /me`. This time **`api.ts`** adds `Authorization: Bearer <token>`, and **`AuthGuard`** checks the token's signature and expiry before letting the request in.
9. The page shows "Hi, Thandi" and *"You're not in any stokvels yet."*

## Tools we used and why

- **`@nestjs/jwt`**: makes and checks JWTs. A JWT is a small signed note that says "this is user X, valid until 13:00". The server can trust it without a database lookup, because only the server knows the `JWT_SECRET` it was signed with. Without this library, we'd write the signing code ourselves, and that's easy to get dangerously wrong.
- **`class-validator` + `class-transformer`**: let us label fields (`@MinLength(8)`, `@IsEmail()`) instead of writing `if` checks in every route. `@Transform` tidies the input first, for example the phone number.
- **`crypto.scrypt`** (built into Node): a password hash that's deliberately slow (about 1 second here), so guessing millions of passwords is impractical. We used it instead of bcrypt or argon2 because those need a native build step, which npm 11 blocks.
- **`react-router`**: shows a different page for each URL (`/login`, `/signup`, `/stokvels`). Without it, we'd build our own page switcher.
- **Prisma migrations**: a numbered SQL file for each database change, like a logbook. Dev, test and CI all replay the same files, so every database ends up identical.

## What could go wrong

- **The same person signs up twice**, perhaps once as `082…` and once as `+27…`. Both become `+27821234567`, and the database's unique rule returns **409** `PHONE_ALREADY_REGISTERED`. We let the database decide, so two sign-ups in the same second are caught too.
- **Someone guesses phone numbers on the log-in form.** An unknown phone and a wrong password get the same **401** message. They also take the same time, because we check a dummy hash when the phone isn't found.
- **A stolen database.** It holds only scrypt hashes with random salts, so passwords can't be read back.
- **A forged or expired token.** `AuthGuard` checks the signature and the 1-hour expiry and returns **401**. The website then logs you out.
- **A missing `JWT_SECRET`.** The server refuses to start, instead of running with a weak key.
- **Sneaky extra fields**, like `"role": "CHAIRPERSON"` in a sign-up. `forbidNonWhitelisted` rejects them with a **400**.
- **The token sits in `localStorage`.** If an attacker ever got their own script onto our page, it could read the token. The 1-hour expiry limits the damage; we can move to a cookie later.

## Interview questions

1. **Why hash passwords instead of encrypting them?**
   Encryption can be undone with the key; a hash can't be undone at all. We never need the real password back, only to check that a guess matches. A slow hash with a random salt makes stolen hashes almost useless.
2. **Why does log-in give the same error for a wrong phone and a wrong password?**
   If the messages differed, anyone could type phone numbers and learn who uses the app. That's called "user enumeration". The same message, and even the same response time, gives nothing away.
3. **How does the server know who is calling `/me`?**
   The request carries a JWT that the server signed at log-in. The guard checks the signature with our secret and checks the expiry, then reads the user id from inside the token. No session table is needed.

## Quiz me

1. What would break if `normalizePhone` were missing from `LoginDto`, but still in `SignupDto`?
2. Why does `/api/v1/health` need `@Public()` now, when it didn't in the walking skeleton?
3. Why does `npm run db:migrate:test` exist, instead of just running `prisma migrate deploy`?
