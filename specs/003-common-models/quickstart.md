# Validation Quickstart: Common SQL Models

This guide outlines the steps to validate that the common SQL entities are functioning as designed.

## 1. Prerequisites

Before running validation, ensure you have:
1. Installed project dependencies:
   ```bash
   npm install
   ```
2. A running PostgreSQL database (if running database-dependent integration tests) or use memory-based TypeORM/mocking for basic unit tests.

---

## 2. Validation Scenarios

### Scenario A: Unit Test Execution
We validate the mappings, validation logic, self-referencing properties, and basic multi-tenant configurations.

**Run Command**:
```bash
npm run test --prefix libs/libs-sql
```
or specifically for the common models:
```bash
npx jest libs/libs-sql/tests/common --config libs/libs-sql/jest.config.js
```

**Expected Outcome**:
- All tests pass.
- Entity schemas validate with no TypeORM compiler or metadata error.
- Status values are validated, rejecting any invalid value (e.g. `'active-duty'`).

---

## 3. Reference Material
- Data definitions: See [data-model.md](./data-model.md)
- Class signatures: See [contracts/common-models-contracts.md](./contracts/common-models-contracts.md)
