# CircuitMap - Electrical Panel Mapping SaaS

A multi-tenant SaaS application for visualizing home electrical panel mappings. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose

### Local Development Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start Docker services (PostgreSQL, Redis, MinIO):**
   ```bash
   docker-compose up -d
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Push schema to database
   pnpm db:push

   # Seed with demo data
   pnpm db:seed
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **View the demo:**
   Open [http://localhost:3000/demo](http://localhost:3000/demo)

### Demo Credentials

After seeding, you can log in with:
- **Email:** demo@circuitmap.com
- **Password:** demo123

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** NextAuth.js
- **Database:** PostgreSQL (via Docker)
- **ORM:** Prisma
- **Storage:** MinIO (S3-compatible)
- **Cache:** Redis

## Project Structure

```
circuitmap/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── demo/              # Demo page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── panel/            # Panel visualization components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and seed
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data script
├── types/                # TypeScript types
└── docker-compose.yml    # Local dev services
```

## Available Scripts

```bash
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema to database
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed database with demo data
pnpm db:studio     # Open Prisma Studio
```

## Docker Services

The `docker-compose.yml` sets up three services:

- **PostgreSQL** (port 5432) - Main database
- **Redis** (port 6379) - Session storage and caching
- **MinIO** (ports 9000, 9001) - S3-compatible object storage

### Managing Docker Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart postgres
```

## Environment Variables

See `.env.example` for all available environment variables. The `.env` file is already configured for local development.

## Features Implemented

### ✅ Core Features
- [x] Next.js 14 with App Router
- [x] TypeScript configuration
- [x] Tailwind CSS styling
- [x] Prisma ORM with PostgreSQL
- [x] NextAuth.js authentication
- [x] Docker Compose for local dev
- [x] Database seeding with real data
- [x] Panel visualization component
- [x] Interactive breaker selection
- [x] Device tracking per breaker

### 🚧 Coming Soon
- [ ] Floor plan visualization
- [ ] Circuit tracing animation
- [ ] User authentication pages
- [ ] Panel CRUD operations
- [ ] Device management
- [ ] Photo uploads
- [ ] PDF export
- [ ] Stripe integration
- [ ] Email notifications

## Panel Visualization

The demo includes a fully functional electrical panel visualization with:

- **Realistic panel rendering** - Metallic gray background with 3D-style breakers
- **Circuit type color coding** - Visual distinction between lighting, appliances, HVAC, etc.
- **Protection badges** - GFCI, AFCI, and dual-function indicators
- **Interactive selection** - Click breakers to view connected devices
- **Multi-pole breakers** - Proper rendering of double and triple-pole breakers
- **Device listing** - Shows all outlets, fixtures, and appliances per circuit

## Database Schema

The Prisma schema includes:

- **Users** - Authentication and profile
- **Panels** - Electrical panel properties
- **Breakers** - Individual circuit breakers
- **Floors** - Building levels
- **Rooms** - Room definitions with positions
- **Devices** - Outlets, fixtures, and appliances

All tables include proper relations and cascade deletes for data integrity.

## Development Notes

### Adding New Components

Use shadcn/ui for new UI components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

### Database Changes

After modifying `prisma/schema.prisma`:
```bash
pnpm db:push        # For development
# OR
pnpm db:migrate     # For production-ready migrations
```

### Viewing Database

```bash
pnpm db:studio
```

This opens Prisma Studio at http://localhost:5555

## Troubleshooting

### Database Connection Issues

If you get database connection errors:
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Port Conflicts

If ports 5432, 6379, 9000, or 9001 are already in use, modify `docker-compose.yml` to use different ports.

### Prisma Client Issues

If you get Prisma client errors:
```bash
# Regenerate Prisma client
pnpm db:generate

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

## Next Steps

1. **Build authentication pages** - Login, signup, and password reset
2. **Create panel management UI** - CRUD operations for panels
3. **Implement floor plan builder** - Interactive room and device placement
4. **Add circuit tracing animations** - Visual connection highlighting
5. **Set up Stripe billing** - Subscription tiers and payment processing
6. **Deploy to production** - Vercel + managed database

## License

MIT

## Support

For issues and questions, please check the documentation files:
- [CLAUDE.md](./CLAUDE.md) - Technical architecture
- [PROMPT.md](./PROMPT.md) - Full feature specifications
