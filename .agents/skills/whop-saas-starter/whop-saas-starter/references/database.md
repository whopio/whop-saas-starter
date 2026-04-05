# Database Patterns

## Setup

- **Prisma 7** with `@prisma/adapter-pg` (native `pg` driver)
- Schema at `db/schema.prisma`, client singleton at `db/index.ts`
- Compatible with Neon, Supabase, Prisma Postgres, Nile, and any PostgreSQL provider
- Auto-detects `NILEDB_POSTGRES_URL` for zero-config Nile via Vercel Marketplace
- SSL auto-detected from connection string; override with `DATABASE_SSL=true/false`
- Pool size defaults to 5 (serverless-friendly); override with `DATABASE_POOL_SIZE`

## Schema

```prisma
model User {
  id                String   @id @default(cuid())
  whopUserId        String   @unique
  email             String?
  name              String?
  profileImageUrl   String?
  plan              String   @default("free")
  whopMembershipId  String?
  cancelAtPeriodEnd Boolean  @default(false)
  isAdmin           Boolean  @default(false)
  createdAt         DateTime @default(now()) @db.Timestamptz(3)
  updatedAt         DateTime @updatedAt @db.Timestamptz(3)

  @@index([email])
  @@index([plan])
}

model SystemConfig {
  key   String @id
  value String
}
```

## Query Patterns

### Always use `select`
```tsx
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { plan: true, cancelAtPeriodEnd: true }, // Only fetch what you need
});
```

### Parallel queries
```tsx
const [session, plans, config] = await Promise.all([
  requireSession(),
  getPlansConfig(),
  getConfig("accent_color"),
]);
```

### Upsert for create-or-update
```tsx
await prisma.user.upsert({
  where: { whopUserId },
  update: { plan, whopMembershipId: membershipId },
  create: { whopUserId, plan, whopMembershipId: membershipId },
});
```

### updateMany for webhook safety
```tsx
// Handles edge case of multiple records per whopUserId
await prisma.user.updateMany({
  where: { whopUserId },
  data: { plan: DEFAULT_PLAN, whopMembershipId: null },
});
```

## Adding a New Model

1. Add the model to `db/schema.prisma`
2. Add indexes on columns used in WHERE clauses and JOINs
3. Use `@db.Timestamptz(3)` for all DateTime fields
4. Use `text` (String in Prisma) for strings — not varchar
5. Run `pnpm db:push` (dev) or `pnpm db:migrate` (production)

## Schema Commands

```bash
pnpm db:generate  # Regenerate Prisma client
pnpm db:push      # Push schema to DB (development)
pnpm db:migrate   # Create migration (production)
pnpm db:studio    # Open Prisma Studio
```
