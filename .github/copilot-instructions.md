# Workspace instructions

- Keep the frontend in Angular standalone components and use strict TypeScript.
- Keep REST handlers in `apps/api/src/routes`; validate request bodies and use parameterized PostgreSQL queries.
- Never commit `.env` files or real credentials.
- Credential passwords are intentionally stored in plaintext per the current requirement. Do not describe this as encryption or production-safe storage; retain the warning in project documentation.
- Run `npm run build` when dependencies are available.
