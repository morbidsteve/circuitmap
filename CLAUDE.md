# CircuitMap - Electrical Panel Mapping SaaS

## Project Overview
A multi-tenant SaaS application for visualizing home electrical panel mappings. Homeowners can map their breakers to outlets/fixtures, visualize circuits, and access their data from anywhere. Built for scale and monetization.

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with SSR/SSG
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Zustand** - Client state management
- **React Query** - Server state management

### Backend
- **Next.js API Routes** - API endpoints
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email, Google, Apple)
  - Row Level Security (RLS) for multi-tenancy
  - Real-time subscriptions
  - Storage (for panel/outlet photos)

### Infrastructure
- **Vercel** - Hosting & deployment
- **Supabase** - Database & auth hosting
- **Stripe** - Payment processing
- **Resend** - Transactional emails

### Development
- **pnpm** - Package manager
- **ESLint + Prettier** - Code quality
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## File Structure
```
circuitmap/
├── CLAUDE.md
├── PROMPT.md
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
├── prisma/
│   └── schema.prisma          # Database schema (reference, Supabase manages)
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Demo data
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── panels/        # Panel management
│   │   │   │   ├── page.tsx   # List panels
│   │   │   │   ├── new/       # Create panel
│   │   │   │   └── [id]/      # View/edit panel
│   │   │   ├── settings/      # User settings
│   │   │   └── billing/       # Subscription management
│   │   ├── (marketing)/
│   │   │   ├── pricing/
│   │   │   ├── features/
│   │   │   └── about/
│   │   └── api/
│   │       ├── webhooks/
│   │       │   └── stripe/    # Stripe webhooks
│   │       └── trpc/          # tRPC routes (optional)
│   ├── components/
│   │   ├── ui/                # Shadcn components
│   │   ├── panel/
│   │   │   ├── PanelView.tsx
│   │   │   ├── BreakerSlot.tsx
│   │   │   └── CircuitTracer.tsx
│   │   ├── floorplan/
│   │   │   ├── FloorPlanView.tsx
│   │   │   ├── RoomShape.tsx
│   │   │   └── DeviceMarker.tsx
│   │   ├── forms/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser client
│   │   │   ├── server.ts      # Server client
│   │   │   └── middleware.ts  # Auth middleware
│   │   ├── stripe.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── usePanel.ts
│   │   ├── useBreakers.ts
│   │   └── useDevices.ts
│   ├── types/
│   │   └── database.ts        # Generated from Supabase
│   └── stores/
│       └── panelStore.ts      # Zustand store
└── public/
    ├── images/
    └── icons/
```

## Database Schema (Supabase/PostgreSQL)

```sql
-- Users (managed by Supabase Auth, extended with profile)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free',
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Panels (a user can have multiple properties/panels)
create table panels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  address text,
  brand text,
  main_amperage int,
  total_slots int default 40,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Breakers
create table breakers (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid references panels(id) on delete cascade,
  position text not null,
  amperage int not null,
  poles int default 1,
  label text,
  circuit_type text,
  protection_type text default 'standard',
  is_on boolean default true,
  notes text,
  sort_order int,
  created_at timestamptz default now()
);

-- Floors
create table floors (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid references panels(id) on delete cascade,
  name text not null,
  level int,
  floor_plan_data jsonb,
  created_at timestamptz default now()
);

-- Rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid references floors(id) on delete cascade,
  name text not null,
  position_x float,
  position_y float,
  width float,
  height float,
  created_at timestamptz default now()
);

-- Devices (outlets, fixtures, appliances)
create table devices (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  breaker_id uuid references breakers(id) on delete set null,
  type text not null,
  description text,
  position_x float,
  position_y float,
  estimated_wattage int,
  is_gfci_protected boolean default false,
  notes text,
  photo_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table panels enable row level security;
alter table breakers enable row level security;
alter table floors enable row level security;
alter table rooms enable row level security;
alter table devices enable row level security;

-- RLS Policies (users can only access their own data)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can CRUD own panels" on panels for all using (auth.uid() = user_id);
create policy "Users can CRUD own breakers" on breakers for all using (
  panel_id in (select id from panels where user_id = auth.uid())
);
-- ... similar policies for floors, rooms, devices
```

## Subscription Tiers

### Free Tier
- 1 panel
- Up to 20 breakers
- Basic floor plan (simple room boxes)
- Export to PDF
- Community support

### Pro Tier ($8/month or $72/year)
- Unlimited panels
- Unlimited breakers
- Custom floor plan shapes
- Photo attachments
- Load calculator
- Priority support
- Share read-only links

### Premium Tier ($15/month or $144/year)
- Everything in Pro
- Multi-user access (share with spouse, electrician)
- Historical tracking (breaker trips log)
- NEC code warnings
- API access
- White-label PDF exports

## Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=
```

## Commands
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm db:generate      # Generate Supabase types
pnpm db:migrate       # Run migrations
pnpm test             # Run tests
pnpm lint             # Lint code
```

## Development Workflow
1. Create Supabase project at supabase.com
2. Run migrations in Supabase dashboard
3. Copy environment variables
4. `pnpm install && pnpm dev`
5. Create Stripe account and products
6. Deploy to Vercel

## Git Workflow
- After making changes (especially user-requested changes), always commit and push automatically
- Do not wait for user to ask to commit - push changes immediately after implementation
- Use descriptive commit messages that explain the change

## Key Implementation Notes

### Authentication Flow
- Use Supabase Auth with @supabase/ssr
- Middleware protects /dashboard/* routes
- OAuth providers: Google, Apple (for mobile)
- Magic link option for passwordless

### Multi-tenancy
- All data queries filter by user_id via RLS
- No tenant data leakage possible at database level
- Supabase handles this automatically

### Real-time Updates
- Use Supabase real-time for collaborative editing (Premium)
- Subscribe to breaker/device changes
- Optimistic updates with React Query

### Performance
- Use Next.js ISR for marketing pages
- Client-side rendering for dashboard (dynamic data)
- Image optimization via next/image
- Lazy load floor plan canvas

### Mobile Responsiveness
- Dashboard works on tablet for walk-around use
- Touch-friendly breaker/device selection
- PWA support for home screen install

## Marketing Site Pages
- `/` - Hero, features overview, testimonials, CTA
- `/pricing` - Tier comparison table
- `/features` - Detailed feature explanations
- `/about` - Company/founder story
- `/blog` - SEO content (electrical tips, safety)

