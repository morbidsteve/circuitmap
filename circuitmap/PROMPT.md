# CircuitMap - Full SaaS Implementation Prompt

Build a production-ready, multi-tenant SaaS application called **CircuitMap** for visualizing home electrical panel mappings. This is a monetizable product targeting homeowners, DIYers, and property managers.

---

## Product Vision

**Problem:** Homeowners struggle to remember which breakers control which outlets. They resort to hand-drawn maps taped inside panel doors that get lost, damaged, or outdated.

**Solution:** A cloud-based app where users can:
1. Map their entire electrical panel visually
2. Trace circuits with a click
3. Access their data from any device
4. Share with electricians or family members
5. Never lose their electrical documentation again

**Target Users:**
- Homeowners doing DIY electrical work
- New homebuyers documenting their home
- Property managers with multiple properties
- Home inspectors
- Electricians managing client documentation

---

## Core User Flows

### Flow 1: New User Onboarding
1. User lands on marketing page → clicks "Start Free"
2. Signs up with email or Google
3. Guided setup wizard:
   - "What's your property name?" (e.g., "123 Main St" or "Home")
   - "What brand is your panel?" (Square D, Siemens, GE, etc.)
   - "How many breaker slots?" (20, 30, 40, etc.)
4. Empty panel view loads with correct slot count
5. Tutorial tooltips guide first breaker entry
6. After 3 breakers, prompt to add a room
7. After first device mapped, show circuit trace animation
8. Celebration modal: "You've mapped your first circuit!"

### Flow 2: Mapping Session (Core Usage)
1. User at their physical panel with phone/tablet
2. Opens CircuitMap dashboard
3. Clicks a breaker slot → enters details (amperage, label)
4. Switches to floor plan view → adds room
5. Adds devices in room → assigns to breaker
6. Tests: flips breaker in real panel, confirms devices are correct
7. Repeats until fully mapped

### Flow 3: Circuit Lookup (Key Value Prop)
1. User needs to do work in kitchen
2. Opens app → searches "kitchen"
3. All kitchen devices highlight → connected breakers highlight
4. User sees: "Turn off breakers 8, 14, 16, 19"
5. Safely does their work

### Flow 4: Sharing with Electrician
1. User has electrical issue, calls electrician
2. Generates "Share Link" (read-only, expires in 7 days)
3. Texts link to electrician
4. Electrician views full panel map without account
5. Arrives prepared, saves diagnostic time

---

## Detailed Feature Specifications

### 1. Authentication & User Management

**Sign Up Options:**
- Email + password
- Google OAuth
- Apple OAuth (required for iOS App Store if you go mobile)
- Magic link (passwordless email)

**User Profile:**
- Name, email, avatar
- Subscription tier badge
- Account created date
- Usage stats (panels, breakers mapped)

**Security:**
- Email verification required
- Password reset flow
- Session management (view active sessions)
- 2FA optional for Premium tier

### 2. Panel Management

**Panel Properties:**
```typescript
interface Panel {
  id: string;
  userId: string;
  name: string;              // "Home", "Rental Property", etc.
  address?: string;          // Optional full address
  brand: 'square_d' | 'siemens' | 'ge' | 'eaton' | 'murray' | 'other';
  mainAmperage: 100 | 150 | 200 | 400;
  totalSlots: number;        // 20, 30, 40, etc.
  columns: 1 | 2;            // Most are 2-column
  notes?: string;
  coverPhotoUrl?: string;    // Photo of physical panel
  createdAt: Date;
  updatedAt: Date;
}
```

**Panel Views:**
- List view: Cards showing all user's panels
- Detail view: Interactive panel + floor plan
- Settings: Edit panel properties, delete panel

**Limits by Tier:**
- Free: 1 panel
- Pro: Unlimited
- Premium: Unlimited + sharing

### 3. Breaker Visualization

**Breaker Properties:**
```typescript
interface Breaker {
  id: string;
  panelId: string;
  position: string;          // "1", "1-3" for double, "5-7" for triple
  amperage: 15 | 20 | 30 | 40 | 50 | 60 | 100 | 200;
  poles: 1 | 2 | 3;
  label: string;             // User-defined name
  circuitType: 'general' | 'lighting' | 'appliance' | 'hvac' | 'outdoor' | 'other';
  protectionType: 'standard' | 'gfci' | 'afci' | 'dual_function';
  isOn: boolean;             // Visual toggle
  notes?: string;
  sortOrder: number;
  createdAt: Date;
}
```

**Visual Design:**
- Realistic panel rendering with metallic gray background
- Breakers as 3D-ish rectangles with:
  - Toggle switch graphic
  - Amperage number
  - Label text (truncated with tooltip)
  - Color bar for circuit type
  - Protection badge (GFCI/AFCI icon)
- Double-pole breakers span 2 slots with connected appearance
- Empty slots shown as knockouts
- Highlighted state: Glowing border animation

**Interactions:**
- Click to select → shows connected devices
- Double-click to edit
- Drag to reorder (within column)
- Right-click context menu
- Keyboard: Arrow keys to navigate, Enter to select

### 4. Floor Plan Builder

**Floor Properties:**
```typescript
interface Floor {
  id: string;
  panelId: string;
  name: string;              // "1st Floor", "Basement", "Garage"
  level: number;             // For sorting
  floorPlanData?: {          // Optional custom layout
    rooms: RoomShape[];
    scale: number;
  };
}
```

**Room Properties:**
```typescript
interface Room {
  id: string;
  floorId: string;
  name: string;
  shape: 'rectangle' | 'l_shape' | 'custom';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  customPath?: string;       // SVG path for custom shapes (Pro+)
  color?: string;            // Room fill color
}
```

**Floor Plan Modes:**

*Simple Mode (Free):*
- Grid-based room boxes
- Drag to position
- Resize handles
- Snap to grid

*Custom Mode (Pro+):*
- Import floor plan image as background
- Draw custom room shapes
- Scale/rotate tools
- Freeform device placement

**Device Markers:**
- Outlets: Orange circle with plug icon
- Fixtures: Green circle with lightbulb icon
- Appliances: Blue circle with appropriate icon
- Show breaker number on hover
- Pulsing animation when circuit traced

### 5. Device Management

**Device Properties:**
```typescript
interface Device {
  id: string;
  roomId: string;
  breakerId?: string;        // Can be unassigned initially
  type: 'outlet' | 'fixture' | 'switch' | 'appliance' | 'hardwired';
  subtype?: string;          // "ceiling_light", "recessed", "chandelier", etc.
  description: string;       // "Kitchen counter left"
  position: { x: number; y: number };
  estimatedWattage?: number;
  isGfciProtected: boolean;
  notes?: string;
  photoUrl?: string;         // Photo of actual device (Pro+)
  createdAt: Date;
}
```

**Device Subtypes:**
```
Outlets: standard, usb, gfci, outdoor, 240v
Fixtures: ceiling, recessed, pendant, chandelier, sconce, fan, track
Switches: single, dimmer, 3way, smart
Appliances: refrigerator, dishwasher, disposal, microwave, range, dryer, washer, hvac, water_heater
Hardwired: smoke_detector, doorbell, garage_door, security_panel
```

**Adding Devices:**
1. Click "+" in a room
2. Select type from icon grid
3. Enter description
4. Select breaker from dropdown (grouped by circuit type)
5. Optional: Add wattage, notes
6. Device appears in room

### 6. Circuit Tracing (Key Feature)

**Trace Animation:**
1. User clicks breaker 10
2. Breaker pulses/glows
3. Lines animate from panel to each connected device
4. All devices on circuit pulse simultaneously
5. Info panel shows: "Breaker 10 powers 8 devices across 4 rooms"

**Visual Effects:**
- SVG path animation following "wire" route
- Electrical spark particle effect at endpoints
- Glow effect on connected items
- Dimming of unrelated items

**Reverse Trace:**
1. User clicks device (outlet in kitchen)
2. Device highlights
3. Connected breaker highlights
4. All sibling devices on same circuit highlight
5. Info: "This outlet is on Breaker 14A with 5 other devices"

### 7. Search & Filter

**Search Box:**
- Searches: breaker labels, room names, device descriptions, notes
- Instant results as you type
- Keyboard shortcut: Cmd/Ctrl + K

**Filter Panel:**
```
Floor:      [All] [1st Floor] [2nd Floor] [Basement]
Room:       [Dropdown of all rooms]
Type:       [All] [Outlets] [Fixtures] [Appliances]
Breaker:    [Dropdown of all breakers]
Amperage:   [All] [15A] [20A] [30A+]
Protection: [All] [Standard] [GFCI] [AFCI]
```

**Quick Queries:**
- "What's on breaker 10?" → Auto-selects breaker
- "Kitchen power" → Shows all kitchen devices and their breakers
- "Unassigned" → Shows devices not yet mapped to breakers

### 8. Load Calculator (Pro+)

**Per-Circuit View:**
- Total estimated load (sum of device wattages)
- Breaker capacity (amperage × 120V or 240V)
- Load percentage with color coding:
  - Green: < 50%
  - Yellow: 50-80%
  - Red: > 80% (NEC recommends max 80% continuous)
- Warning badges on overloaded circuits

**Whole-Panel View:**
- Total home load estimate
- Main breaker capacity
- Load balance between legs (for 240V panels)

### 9. Data Export & Sharing

**Export Options:**
- JSON (full backup, can re-import)
- PDF report (print-friendly panel summary)
- CSV (device list for spreadsheets)
- Image (PNG of panel view)

**PDF Report Contents:**
- Panel summary (brand, amperage, slot count)
- Two-column breaker list with connected devices
- Floor-by-floor room device list
- Generated date, user info
- QR code linking to live app (Pro+)

**Sharing (Premium):**
- Generate read-only share link
- Set expiration (1 day, 7 days, 30 days, never)
- Optional password protection
- Track link views
- Revoke access anytime

### 10. Subscription & Billing

**Stripe Integration:**
- Checkout Sessions for new subscriptions
- Customer Portal for management
- Webhooks for:
  - `checkout.session.completed` → Activate subscription
  - `invoice.paid` → Extend subscription
  - `customer.subscription.deleted` → Downgrade to free
  - `invoice.payment_failed` → Send warning email

**Upgrade Prompts:**
- Hit panel limit → "Upgrade to add more properties"
- Try to upload photo → "Photos available on Pro"
- Try to share → "Sharing available on Premium"
- Non-pushy, contextual

**Billing Page:**
- Current plan with features
- Usage stats
- Upgrade/downgrade buttons
- Invoice history
- Cancel subscription (with feedback survey)

---

## Technical Implementation Details

### API Routes Structure

```
/api/
├── auth/
│   └── callback/          # Supabase auth callback
├── panels/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts       # GET, PATCH, DELETE
│       ├── breakers/
│       ├── floors/
│       └── export/
├── breakers/
│   └── [id]/route.ts
├── devices/
│   └── [id]/route.ts
├── share/
│   ├── route.ts           # POST (create link)
│   └── [token]/route.ts   # GET (public view)
├── billing/
│   ├── checkout/          # Create Stripe session
│   ├── portal/            # Stripe customer portal
│   └── usage/             # Get usage stats
└── webhooks/
    └── stripe/route.ts
```

### Supabase Queries Examples

```typescript
// Get user's panels with counts
const { data: panels } = await supabase
  .from('panels')
  .select(`
    *,
    breakers(count),
    floors(
      *,
      rooms(
        *,
        devices(count)
      )
    )
  `)
  .eq('user_id', userId);

// Get full panel with all nested data
const { data: panel } = await supabase
  .from('panels')
  .select(`
    *,
    breakers(*),
    floors(
      *,
      rooms(
        *,
        devices(*)
      )
    )
  `)
  .eq('id', panelId)
  .single();

// Get devices for a specific breaker
const { data: devices } = await supabase
  .from('devices')
  .select(`
    *,
    room:rooms(name, floor:floors(name))
  `)
  .eq('breaker_id', breakerId);
```

### Component Architecture

```
<DashboardLayout>
  <Sidebar />
  <MainContent>
    <PanelPage>
      <PanelHeader />
      <div className="grid grid-cols-2">
        <PanelView>
          <BreakerColumn side="left">
            <BreakerSlot />
          </BreakerColumn>
          <BreakerColumn side="right">
            <BreakerSlot />
          </BreakerColumn>
          <CircuitTraceOverlay />
        </PanelView>
        <FloorPlanView>
          <FloorTabs />
          <FloorCanvas>
            <Room>
              <DeviceMarker />
            </Room>
            <CircuitTracePath />
          </FloorCanvas>
        </FloorPlanView>
      </div>
      <DetailPanel>
        <SelectedBreakerInfo />
        <DeviceList />
      </DetailPanel>
    </PanelPage>
  </MainContent>
</DashboardLayout>
```

### State Management (Zustand)

```typescript
interface PanelStore {
  // Data
  panel: Panel | null;
  breakers: Breaker[];
  floors: Floor[];
  rooms: Room[];
  devices: Device[];
  
  // UI State
  selectedBreakerId: string | null;
  selectedDeviceId: string | null;
  activeFloorId: string | null;
  isTracing: boolean;
  searchQuery: string;
  filters: FilterState;
  
  // Actions
  selectBreaker: (id: string | null) => void;
  selectDevice: (id: string | null) => void;
  setActiveFloor: (id: string) => void;
  traceCircuit: (breakerId: string) => void;
  setSearch: (query: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  
  // CRUD
  addBreaker: (breaker: Omit<Breaker, 'id'>) => Promise<void>;
  updateBreaker: (id: string, updates: Partial<Breaker>) => Promise<void>;
  deleteBreaker: (id: string) => Promise<void>;
  // ... similar for rooms, devices
}
```

---

## Seed Data (Your Home)

Pre-populate the demo/seed data with your actual mappings for testing:

```typescript
const seedData = {
  panel: {
    name: "Main Panel",
    brand: "square_d",
    mainAmperage: 200,
    totalSlots: 34,
    columns: 2
  },
  
  breakers: [
    { position: "1-3", amperage: 40, poles: 2, label: "Range", circuitType: "appliance", protectionType: "standard" },
    { position: "5-7", amperage: 30, poles: 2, label: "Dryer", circuitType: "appliance", protectionType: "standard" },
    { position: "2-4", amperage: 100, poles: 2, label: "Subpanel", circuitType: "other", protectionType: "standard" },
    { position: "9", amperage: 30, poles: 1, label: "Water Heater", circuitType: "appliance", protectionType: "standard" },
    { position: "12", amperage: 20, poles: 2, label: "Furnace", circuitType: "hvac", protectionType: "standard" },
    { position: "6", amperage: 20, poles: 1, label: "Flower Room / Outdoor", circuitType: "general", protectionType: "standard" },
    { position: "8", amperage: 20, poles: 1, label: "1st Floor Lights / Stairs", circuitType: "lighting", protectionType: "standard" },
    { position: "10", amperage: 20, poles: 1, label: "2nd Floor Lights / Bedrooms", circuitType: "lighting", protectionType: "afci" },
    { position: "13", amperage: 15, poles: 1, label: "Living Room", circuitType: "general", protectionType: "afci" },
    { position: "14", amperage: 20, poles: 1, label: "Kitchen Outlets A", circuitType: "general", protectionType: "standard" },
    { position: "15", amperage: 20, poles: 1, label: "Laundry Room", circuitType: "general", protectionType: "standard" },
    { position: "16", amperage: 20, poles: 1, label: "Kitchen / Laundry B", circuitType: "general", protectionType: "afci" },
    { position: "17", amperage: 20, poles: 1, label: "Dining Room / Hallway", circuitType: "general", protectionType: "standard" },
    { position: "18", amperage: 20, poles: 1, label: "Office", circuitType: "general", protectionType: "afci" },
    { position: "19", amperage: 20, poles: 1, label: "Kitchen / Dining", circuitType: "general", protectionType: "standard" },
    { position: "20", amperage: 20, poles: 1, label: "Primary Bedroom", circuitType: "general", protectionType: "standard" },
    { position: "22", amperage: 15, poles: 1, label: "Closets / Misc", circuitType: "general", protectionType: "standard" },
    { position: "23", amperage: 20, poles: 1, label: "Den", circuitType: "general", protectionType: "standard" },
    { position: "24", amperage: 20, poles: 1, label: "2nd Floor Bath A", circuitType: "general", protectionType: "gfci" },
    { position: "25", amperage: 20, poles: 1, label: "Guest Bedroom / Office", circuitType: "general", protectionType: "standard" },
    { position: "26", amperage: 20, poles: 1, label: "Dining Room Lights", circuitType: "lighting", protectionType: "standard" },
    { position: "27", amperage: 20, poles: 1, label: "Stairs / Landing", circuitType: "general", protectionType: "standard" },
    { position: "30", amperage: 20, poles: 1, label: "Dining Room Outlets", circuitType: "general", protectionType: "standard" }
  ],
  
  floors: [
    { name: "1st Floor", level: 1 },
    { name: "2nd Floor", level: 2 }
  ],
  
  rooms: {
    "1st Floor": [
      { name: "Den", position: { x: 0, y: 0 }, dimensions: { width: 150, height: 120 } },
      { name: "Laundry/Bathroom", position: { x: 150, y: 0 }, dimensions: { width: 120, height: 100 } },
      { name: "Living Room", position: { x: 0, y: 120 }, dimensions: { width: 120, height: 150 } },
      { name: "Kitchen", position: { x: 120, y: 100 }, dimensions: { width: 140, height: 130 } },
      { name: "Dining Room", position: { x: 260, y: 100 }, dimensions: { width: 140, height: 180 } },
      { name: "Flower Room", position: { x: 120, y: 230 }, dimensions: { width: 100, height: 80 } }
    ],
    "2nd Floor": [
      { name: "Guest Bedroom", position: { x: 0, y: 0 }, dimensions: { width: 150, height: 130 } },
      { name: "Office", position: { x: 150, y: 0 }, dimensions: { width: 130, height: 130 } },
      { name: "Primary Bedroom", position: { x: 0, y: 130 }, dimensions: { width: 130, height: 180 } },
      { name: "Bathroom", position: { x: 130, y: 130 }, dimensions: { width: 100, height: 90 } },
      { name: "Primary Closet", position: { x: 130, y: 220 }, dimensions: { width: 100, height: 90 } },
      { name: "Stairs/Landing", position: { x: 230, y: 130 }, dimensions: { width: 70, height: 180 } }
    ]
  },
  
  devices: [
    // 1st Floor
    { room: "Den", type: "outlet", breakerPosition: "23", description: "Wall outlet" },
    { room: "Laundry/Bathroom", type: "outlet", breakerPosition: "15", description: "Washer outlet" },
    { room: "Laundry/Bathroom", type: "outlet", breakerPosition: "16", description: "Utility outlet" },
    { room: "Living Room", type: "outlet", breakerPosition: "10", description: "TV wall outlet" },
    { room: "Living Room", type: "outlet", breakerPosition: "10", description: "Sofa outlet" },
    { room: "Living Room", type: "outlet", breakerPosition: "8", description: "Near stairs" },
    { room: "Kitchen", type: "outlet", breakerPosition: "14", description: "Counter left" },
    { room: "Kitchen", type: "outlet", breakerPosition: "14", description: "Counter right" },
    { room: "Kitchen", type: "outlet", breakerPosition: "16", description: "Counter back" },
    { room: "Kitchen", type: "fixture", breakerPosition: "14", description: "Under cabinet lights" },
    { room: "Kitchen", type: "fixture", breakerPosition: "8", description: "Ceiling light" },
    { room: "Kitchen", type: "outlet", breakerPosition: "19", description: "Island outlet" },
    { room: "Dining Room", type: "outlet", breakerPosition: "19", description: "Buffet outlet" },
    { room: "Dining Room", type: "outlet", breakerPosition: "26", description: "Corner outlet" },
    { room: "Dining Room", type: "fixture", breakerPosition: "26", description: "Chandelier" },
    { room: "Dining Room", type: "outlet", breakerPosition: "30", description: "Window outlet 1" },
    { room: "Dining Room", type: "outlet", breakerPosition: "30", description: "Window outlet 2" },
    { room: "Dining Room", type: "outlet", breakerPosition: "30", description: "Back wall outlet" },
    { room: "Dining Room", type: "outlet", breakerPosition: "30", description: "Exterior door outlet" },
    { room: "Flower Room", type: "fixture", breakerPosition: "8", description: "Ceiling light" },
    { room: "Flower Room", type: "outlet", breakerPosition: "6", description: "Wall outlet" },
    
    // 2nd Floor
    { room: "Guest Bedroom", type: "fixture", breakerPosition: "10", description: "Ceiling light" },
    { room: "Guest Bedroom", type: "outlet", breakerPosition: "25", description: "Bed left" },
    { room: "Guest Bedroom", type: "outlet", breakerPosition: "25", description: "Bed right" },
    { room: "Guest Bedroom", type: "outlet", breakerPosition: "25", description: "Desk wall" },
    { room: "Office", type: "fixture", breakerPosition: "10", description: "Ceiling light" },
    { room: "Office", type: "outlet", breakerPosition: "25", description: "North wall 1" },
    { room: "Office", type: "outlet", breakerPosition: "25", description: "North wall 2" },
    { room: "Office", type: "outlet", breakerPosition: "25", description: "West wall" },
    { room: "Office", type: "outlet", breakerPosition: "18", description: "Desk outlet" },
    { room: "Primary Bedroom", type: "fixture", breakerPosition: "10", description: "Ceiling fan/light" },
    { room: "Primary Bedroom", type: "outlet", breakerPosition: "20", description: "Bed left" },
    { room: "Primary Bedroom", type: "outlet", breakerPosition: "20", description: "Bed right" },
    { room: "Primary Bedroom", type: "outlet", breakerPosition: "20", description: "Dresser wall" },
    { room: "Primary Bedroom", type: "outlet", breakerPosition: "20", description: "Window wall 1" },
    { room: "Primary Bedroom", type: "outlet", breakerPosition: "20", description: "Window wall 2" },
    { room: "Primary Bedroom", type: "outlet", breakerPosition: "20", description: "Closet door wall" },
    { room: "Primary Bedroom", type: "outlet", breakerPosition: "10", description: "TV outlet" },
    { room: "Bathroom", type: "fixture", breakerPosition: "10", description: "Vanity light" },
    { room: "Bathroom", type: "outlet", breakerPosition: "24", description: "Vanity left", isGfciProtected: true },
    { room: "Bathroom", type: "outlet", breakerPosition: "24", description: "Vanity right", isGfciProtected: true },
    { room: "Bathroom", type: "outlet", breakerPosition: "24", description: "Toilet wall" },
    { room: "Primary Closet", type: "fixture", breakerPosition: "10", description: "Closet light" },
    { room: "Primary Closet", type: "outlet", breakerPosition: "22", description: "Closet outlet" },
    { room: "Stairs/Landing", type: "fixture", breakerPosition: "8", description: "Stairway light" },
    { room: "Stairs/Landing", type: "fixture", breakerPosition: "27", description: "Landing light" },
    { room: "Stairs/Landing", type: "outlet", breakerPosition: "27", description: "Landing outlet" },
    { room: "Stairs/Landing", type: "outlet", breakerPosition: "23", description: "Top of stairs outlet" }
  ]
};
```

---

## Launch Checklist

### MVP (Week 1-2)
- [ ] Supabase project setup with schema
- [ ] Next.js project with auth flow
- [ ] Basic panel visualization
- [ ] Breaker CRUD
- [ ] Single floor plan with rooms
- [ ] Device CRUD with breaker assignment
- [ ] Basic circuit highlighting (no animation)
- [ ] localStorage backup
- [ ] Deploy to Vercel

### Beta (Week 3-4)
- [ ] Animated circuit tracing
- [ ] Search and filter
- [ ] Multi-floor support
- [ ] PDF export
- [ ] Mobile responsive
- [ ] Onboarding wizard
- [ ] Stripe integration (Pro tier)

### Launch (Week 5-6)
- [ ] Marketing site
- [ ] Premium tier + sharing
- [ ] Photo uploads
- [ ] Load calculator
- [ ] Email notifications
- [ ] Analytics (Posthog/Mixpanel)
- [ ] Error tracking (Sentry)
- [ ] Documentation

### Post-Launch
- [ ] Mobile app (React Native or PWA)
- [ ] Electrician portal (view client panels)
- [ ] API access for integrations
- [ ] Community templates (common panel layouts)
- [ ] Multi-language support

---

## Success Metrics

- **Activation:** User maps at least 5 breakers in first session
- **Retention:** User returns within 7 days
- **Conversion:** 5% free → Pro, 2% Pro → Premium
- **NPS:** > 50

---

Now build this! Start with the core panel visualization and circuit tracing - that's the "wow" feature that will drive adoption.

