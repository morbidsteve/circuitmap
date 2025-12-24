# CircuitMap - Setup Instructions for New Host

## Current Status

✅ **Completed:**
- Next.js 14 project initialized with TypeScript, Tailwind CSS, and App Router
- Docker Compose configuration created (PostgreSQL, Redis, MinIO)
- Prisma schema defined with all database models
- NextAuth.js configured with credentials provider
- shadcn/ui components installed (Button, Card, Badge)
- Panel visualization component built
- Seed script created with full demo data
- Environment configuration files created
- API routes for panels created
- Demo page built and ready to use

## Prerequisites on New Host

1. **Node.js 18+** and npm (or pnpm)
2. **Docker** and **Docker Compose**
3. **Git** (to copy the repository)

## Setup Steps on New Host

### 1. Install Dependencies

```bash
# Using npm (if pnpm not available)
npm install

# OR using pnpm (recommended)
npm install -g pnpm
pnpm install
```

### 2. Start Docker Services

```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs if needed
docker-compose logs -f
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed database with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at: http://localhost:3000

### 5. View the Demo

Navigate to: http://localhost:3000/demo

This shows the interactive electrical panel with all your seed data.

## Demo Login Credentials

After seeding the database:
- **Email:** demo@circuitmap.com
- **Password:** demo123

## Docker Services

The following services run in Docker:

| Service | Port | Purpose | Credentials |
|---------|------|---------|-------------|
| PostgreSQL | 5432 | Main database | User: `circuitmap`<br>Pass: `circuitmap_dev_password`<br>DB: `circuitmap` |
| Redis | 6379 | Cache/sessions | No auth required |
| MinIO | 9000, 9001 | S3-compatible storage | Access: `circuitmap`<br>Secret: `circuitmap_dev_password` |

### MinIO Console

Access MinIO web console at: http://localhost:9001

## Environment Variables

The `.env` file is pre-configured for local development. No changes needed for local setup.

Key variables:
```
DATABASE_URL="postgresql://circuitmap:circuitmap_dev_password@localhost:5432/circuitmap"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-this-in-production-1234567890"
```

## Troubleshooting

### Docker Issues

If Docker services fail to start:

```bash
# Check if Docker daemon is running
systemctl status docker

# Start Docker (if needed)
sudo systemctl start docker

# Restart services
docker-compose restart
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Conflicts

If you get port conflicts, edit `docker-compose.yml` and change the port mappings:

```yaml
ports:
  - "5433:5432"  # Change 5432 to 5433 (or any free port)
```

Then update `DATABASE_URL` in `.env` to match.

### Prisma Client Issues

```bash
# Regenerate Prisma client
npm run db:generate

# If still having issues, clear and reinstall
rm -rf node_modules .next
npm install
```

## Database Management

### Prisma Studio

View and edit database data:

```bash
npm run db:studio
```

Opens at: http://localhost:5555

### Reset Database

To start fresh:

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm circuitmap_postgres_data

# Start services again
docker-compose up -d

# Re-run setup
npm run db:push
npm run db:seed
```

## Available Scripts

```bash
npm run dev           # Start dev server (port 3000)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint

npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations (production)
npm run db:seed       # Seed database with demo data
npm run db:studio     # Open Prisma Studio
```

## Project Structure

```
circuitmap/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── panels/route.ts
│   ├── demo/                # Demo page
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   └── card.tsx
│   └── panel/              # Panel components
│       ├── BreakerSlot.tsx
│       └── PanelView.tsx
├── lib/                    # Utilities
│   ├── auth.ts            # NextAuth config
│   ├── db.ts              # Prisma client
│   └── utils.ts           # Helper functions
├── prisma/                # Database
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── types/                 # TypeScript types
│   ├── next-auth.d.ts
│   └── panel.ts
├── docker-compose.yml     # Docker services
├── .env                   # Environment variables
├── .env.example          # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## What's Working

✅ **Panel Visualization:**
- Interactive electrical panel with 34 slots
- 23 breakers from your home mapped
- Click breakers to see connected devices
- Color-coded circuit types
- Protection type badges (GFCI, AFCI)
- Multi-pole breaker support

✅ **Data Model:**
- Users with authentication
- Panels with breakers
- Floors with rooms
- Devices connected to breakers
- Full relational data with cascading deletes

✅ **Seed Data:**
- Demo user account
- Complete home electrical panel
- 2 floors (1st and 2nd)
- 12 rooms
- 50+ devices mapped to breakers

## Next Steps (Not Yet Implemented)

- [ ] Authentication pages (login, signup)
- [ ] Protected routes with middleware
- [ ] Panel CRUD operations
- [ ] Floor plan visualization
- [ ] Device management UI
- [ ] Circuit tracing animations
- [ ] Photo upload to MinIO
- [ ] PDF export
- [ ] Stripe billing integration
- [ ] Email notifications

## Files to Review

- **README.md** - Main documentation
- **CLAUDE.md** - Technical architecture details
- **PROMPT.md** - Full feature specifications
- **SETUP.md** - This file (setup guide)

## Quick Test

After setup, verify everything works:

1. ✅ Docker services running: `docker-compose ps`
2. ✅ Database seeded: `npm run db:studio` (check for data)
3. ✅ Dev server starts: `npm run dev`
4. ✅ Demo page loads: http://localhost:3000/demo
5. ✅ Can click breakers and see connected devices

## Notes

- All dependencies are in `package.json` and will be installed on new host
- Docker volumes store data in `./docker-data/` (gitignored)
- `.env` file contains local development config (gitignored, but included for convenience)
- Prisma schema will auto-create tables on `db:push`
- Seed script is idempotent (uses upsert for demo user)

## Support

If you encounter issues:
1. Check Docker is running: `systemctl status docker`
2. Check service logs: `docker-compose logs [service-name]`
3. Verify `.env` has correct DATABASE_URL
4. Ensure ports 3000, 5432, 6379, 9000, 9001 are available
