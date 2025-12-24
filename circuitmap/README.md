# CircuitMap

Map your home's electrical panel to every outlet, switch, and fixture. Know exactly which breaker controls what.

![CircuitMap Demo](https://img.shields.io/badge/version-0.0.1-blue)

## Quick Start (Docker)

The easiest way to run CircuitMap is with Docker. This sets up everything automatically.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run the App

```bash
# Clone the repository
git clone https://github.com/morbidsteve/circuitmap.git
cd circuitmap/circuitmap

# Start everything
docker compose up --build
```

Wait for the build to complete (first time takes 2-3 minutes). You'll see `circuitmap-app` logs when it's ready.

### Access the App

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/demo | Interactive demo with sample data |
| http://localhost:3000/auth/login | Login page |
| http://localhost:3000/dashboard | Dashboard (requires login) |

### Default Login Credentials

| Email | Password | Tier |
|-------|----------|------|
| `admin@circuitmap.com` | `admin123` | Premium |
| `demo@circuitmap.com` | `demo123` | Pro |

---

## Using the Demo

The demo page (`/demo`) lets you:

- **View breakers** - Click any breaker to see its details
- **Add breakers** - Click the `+` on empty slots
- **Edit breakers** - Select a breaker, then click Edit
- **Delete breakers** - Select a breaker, then click Delete
- **Drag to reorder** - Drag breakers to different slots
- **View connected devices** - See outlets/fixtures on each circuit

---

## Reset Everything

If something goes wrong or you want a fresh start:

```bash
# Stop containers and remove volumes
docker compose down -v

# Remove persistent data
rm -rf docker-data

# Rebuild from scratch
docker compose up --build
```

---

## Alternative: Native Development

If you prefer running without Docker:

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL 16
- Redis (optional)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env to point to your PostgreSQL

# Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start dev server
pnpm dev
```

---

## Available Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run linter

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:seed          # Seed demo data
pnpm db:studio        # Open Prisma Studio (database GUI)

# Testing
pnpm test:run         # Run unit tests
pnpm test:e2e         # Run E2E tests (requires app running)
```

---

## Docker Services

When running with Docker Compose, these services are available:

| Service | Port | Description |
|---------|------|-------------|
| App | 3000 | Next.js application |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/sessions |
| MinIO | 9000, 9001 | File storage (S3-compatible) |

### Docker Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Stop and remove all data
docker compose down -v && rm -rf docker-data
```

---

## Project Structure

```
circuitmap/
├── app/                    # Next.js pages and API routes
│   ├── api/               # REST API endpoints
│   ├── auth/              # Login/signup pages
│   ├── demo/              # Interactive demo
│   └── (dashboard)/       # Protected dashboard pages
├── components/            # React components
│   ├── panel/            # Breaker panel visualization
│   ├── floorplan/        # Floor plan editor
│   ├── forms/            # Input forms
│   └── ui/               # shadcn/ui components
├── prisma/               # Database schema and seed
├── lib/                  # Utilities and config
├── hooks/                # React hooks
├── stores/               # Zustand state stores
└── types/                # TypeScript types
```

---

## Features

### Working Now
- Interactive electrical panel visualization
- Breaker CRUD (create, read, update, delete)
- Drag-and-drop breaker reordering
- Multi-pole breaker support (240V circuits)
- Circuit type color coding
- GFCI/AFCI protection indicators
- Device tracking per circuit
- User authentication
- Dashboard with settings

### Coming Soon
- Floor plan editor with room shapes
- Device placement on floor plans
- Circuit tracing visualization
- Photo attachments
- PDF export
- Subscription billing

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Database:** PostgreSQL + Prisma
- **Auth:** NextAuth.js
- **State:** Zustand
- **Drag & Drop:** dnd-kit

---

## Troubleshooting

### "No Panel Found" on demo page

The database wasn't seeded. Reset with:
```bash
docker compose down -v && rm -rf docker-data && docker compose up --build
```

### Port already in use

Another service is using port 3000, 5432, 6379, or 9000. Either stop that service or modify `docker-compose.yml` to use different ports.

### Prisma client errors

Regenerate the client:
```bash
docker compose exec app pnpm prisma generate
```

### Container won't start

Check the logs:
```bash
docker compose logs app
docker compose logs migrate
```

---

## License

MIT

---

## Support

- Issues: [GitHub Issues](https://github.com/morbidsteve/circuitmap/issues)
- Documentation: See [CLAUDE.md](./CLAUDE.md) for technical details
