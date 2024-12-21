# TP

## Prerequisites

- [Node.js](https://nodejs.org)
- [Bun](https://bun.sh)
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)

## `backend`

```bash
cd backend
pnpm i
bun run ./src/index.ts
# should be running on http://localhost:3000
```

By default, three users will be created:

- `Administrateur` with role `ADMIN`
- `Utilisateur1` with role `RESIDENTIALS`
- `Utilisateur2` with role `COMMERCIALS`

The password for all users is empty, so you can log in without any password.
You'll be asked to change the password on the first login.

## `frontend`

```bash
cd frontend
pnpm i
pnpm dev
# should be running on http://localhost:5173
```

The backend server should be running at the same time as the frontend server to work properly.
