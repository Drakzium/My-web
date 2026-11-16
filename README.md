# NO ONE LABS

Premium developer portfolio + private admin CMS.

## Stack

- React, Vite, TypeScript, Tailwind CSS, Framer Motion
- Express API, SQLite (`data/noone.db`), disk uploads (`uploads/`)
- AppDeploy MCP was not connected in this environment; architecture uses a compatible local backend (auth + DB + storage)

## Run

```bash
npm install
npm run dev
```

- Site: http://localhost:5173
- API: http://localhost:3001
- Admin: http://localhost:5173/admin

## Owner auth (required for admin writes)

Copy `.env.example` → `.env` and set:

```
OWNER_EMAIL=your@email.com
OWNER_BOOTSTRAP_PASSWORD=your-long-password
```

Until `OWNER_EMAIL` is set (not `PENDING`), admin login and write APIs stay locked.
