# Prisma

Backend-owned Prisma schema and seed data.

| File | Purpose |
| --- | --- |
| `schema.prisma` | SQLite schema and Prisma Client generator config. |
| `seed.ts` | Demo dental office seed data. |

Run database commands from the repo root:

```bash
npm run db:seed
npm run db:studio
```

Or from `server/`:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```
