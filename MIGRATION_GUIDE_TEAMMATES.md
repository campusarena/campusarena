# Migration Guide for Teammates

## What Changed

Match-level check-in was removed; event-level check-in is now the only check-in.

### Database Schema Changes

1. MatchStatus enum values:
   - `READY` - Both players checked in
   - `IN_PROGRESS` - Match is being played
   - `COMPLETE` - Match finished

2. Match-level check-in fields were removed from `Match`.

## Migration Steps

### Step 1: Pull the latest code
```bash
git pull origin Issue-#60
```

### Step 2: Apply database migration
```bash
npx prisma migrate dev
```

### Step 3: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 4: Restart your dev server
```bash
npm run dev
```

## Troubleshooting

If you get errors:
- "Prisma schema has changed": Run `npx prisma generate`
- "Database is not in sync": Run `npx prisma migrate dev`

## Documentation

See `MATCH_STATUS_SYSTEM.md` for match status documentation.
