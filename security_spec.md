# OperaRank Security Specification

## Data Invariants
1. A Task must always belong to the user who created it (`userId == request.auth.uid`).
2. A Task can only be updated from `in-progress` to `finished` by the owner.
3. A Task status can only be set to `approved` or `rejected` by an Admin.
4. Immortality: `userId`, `startTime`, and `sectorId` cannot be changed after a task is created.
5. Unique Remessa Lock: Logic for checking uniqueness must be handled at the application level via queries, as Firestore rules can't query other documents efficiently without a `get()` call which would increase costs. However, we can enforce `get()` in the `create` rule for safety if strictly required, but usually, app-level check + rules for state transitions are enough. Actually, the requirement says "verify if there is a task in progress".
6. Admin Isolation: Only admins can create/delete users, sectors, and clients.

## The Dirty Dozen Payloads (Rejection Targets)

1. **Self-Promotion**: An employee tries to update their own role from `employee` to `admin`.
2. **Ghost Task**: An employee tries to create a task for another `userId`.
3. **Time Travel**: An employee tries to set `startTime` in the future or backdate it (must match `request.time`).
4. **Approval Spoofing**: An employee tries to set their task status directly to `approved`.
5. **Modification of Finalized Task**: An employee tries to update a task that is already `approved` or `rejected`.
6. **Hijacking Remessa**: Creating a task with empty `remessa`.
7. **Size Attack**: Sending an `observation` that is 1MB in size.
8. **Admin Impersonation**: Attempting to release a ranking without admin status.
9. **Orphaned Task**: Creating a task with a `sectorId` that doesn't exist (relational check).
10. **Foreign Shift**: An employee trying to record a task for a shift that isn't theirs (must match their profile shift).
11. **Shadow Update**: Updating a finished task to `in-progress` again.
12. **PII Leak**: A signed-in employee trying to list all phone numbers/emails of other employees.

## Test Runner (Draft)
```typescript
// firestore.rules.test.ts (logic summary)
// - expect(createTaskByOtherUser).toFail();
// - expect(approveOwnTask).toFail();
// - expect(adminApproveTask).toSucceed();
// - expect(updateApprovedTask).toFail();
```
