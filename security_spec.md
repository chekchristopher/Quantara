# Security Specification & Test-Driven Hardening

## 1. Data Invariants
1. **User Identity Boundary**: Every document under `/users/{userId}/**` belongs strictly to the authenticated user matching `request.auth.uid`.
2. **PII and Profile Isolation**: A user's profile at `/users/{userId}` can only be read or modified by the user themselves (`request.auth.uid == userId`) or a verified admin document. Blanket reads and unauthorized access are strictly forbidden.
3. **Immutability of Identity and Audit**:
   - `userId` and `id` must remain unchanged across any update.
   - Audit logs at `/users/{userId}/auditLogs/{logId}` are strictly append-only (cannot be mutated or overwritten by client updates).
4. **Role Integrity (Anti-Privilege-Escalation)**:
   - Users cannot escalate their own `role` or `enterpriseTier` beyond default `'operator'` and `'Standard'` on creation.
   - Admin roles are verified server-side against `/admins/{uid}` or explicit trusted records.
5. **Denial of Wallet & Boundary Guards**:
   - All text inputs have strict length limits (IDs $\le 128$ chars, strings $\le 256$ or $1024$ chars).
   - Numerical limits enforced on financial metrics (risk percentages, leverage, exposure).

---

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Anonymous/unauthenticated `get /users/user_abc123`.
2. **Cross-Tenant Read**: Authenticated user `user_attacker` attempting `get /users/user_victim`.
3. **Cross-Tenant Write**: User `user_attacker` attempting `set /users/user_victim/settings/risk`.
4. **Identity Spoofing**: User `user_attacker` sending payload with `userId: "user_victim"` to their own path.
5. **Ghost Field Injection (Shadow Update)**: Sending `{ isSuperAdmin: true, ...allowedFields }` into a risk settings document.
6. **Role Escalation on Signup**: Creating `/users/user_attacker` with `{ role: "admin", enterpriseTier: "Enterprise Dedicated" }`.
7. **Junk ID Poisoning**: Attempting to create a document with a 2,000-character malicious path ID or invalid characters like `../../../etc`.
8. **Audit Log Mutation**: Attempting an `update` or `delete` on an existing `/users/{userId}/auditLogs/{logId}`.
9. **Blanket Collection Query Scraping**: Attempting to query `collectionGroup('brokers')` or `collection('users')` without the matching `userId == auth.uid` constraint.
10. **Extreme Numeric Poisoning**: Updating `maxLeverage: 99999` or negative drawdown `maxAccountDrawdownPercent: -50`.
11. **Email Spoofing**: Presenting a forged unverified email payload trying to access administrative functions.
12. **Tampering with Creation Timestamps**: Trying to overwrite original `createdAt` in an update payload.

---

## 3. Test Runner Reference (`firestore.rules.test.ts`)
The security test runner asserts that all Dirty Dozen operations result in `PERMISSION_DENIED` using `@firebase/rules-unit-testing`.
