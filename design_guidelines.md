# Cinema Ticket Booking Web App - Design Guidelines

## Design Approach
**System-Based with Booking Platform References**: Drawing from Material Design principles and successful booking platforms (Fandango, BookMyShow) to create an efficient, trust-building experience. Focus on clarity, hierarchy, and seamless user flows for both ticket buyers and administrators.

## Typography System

**Font Stack**: 
- Primary: Inter or DM Sans (via Google Fonts CDN)
- Monospace: JetBrains Mono for seat numbers and booking IDs

**Hierarchy**:
- Page Titles: text-4xl font-bold
- Section Headers: text-2xl font-semibold  
- Card Titles (Film Names): text-xl font-semibold
- Body Text: text-base font-normal
- Metadata (Genre, Duration, Price): text-sm font-medium
- Labels & Captions: text-xs uppercase tracking-wide

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: mb-8 or mb-12
- Grid gaps: gap-4 or gap-6
- Button padding: px-6 py-3

**Grid Structures**:
- Film Browse: grid-cols-1 md:grid-cols-3 lg:grid-cols-4
- Admin Tables: Full-width responsive tables
- Seat Grid: Dynamic based on studio capacity (typically 8-12 columns)

**Container Widths**:
- Main content: max-w-7xl mx-auto
- Forms & Checkout: max-w-2xl mx-auto
- Admin panels: Full-width with px-6

## Component Library

### Navigation
- **User Header**: Logo left, "Browse Films" + "My Bookings" center, User menu + Logout right, sticky top-0
- **Admin Sidebar**: Fixed left navigation (Films, Showtimes, Bookings, Dashboard), collapsible on mobile

### Film Cards
- Aspect ratio 2:3 poster image
- Overlay gradient on hover revealing "View Details" button
- Title, genre, rating (star icons via Heroicons), duration below image
- Consistent card height with object-cover images

### Film Detail Page
- Split layout: Left 40% poster, Right 60% details
- Details include: Title, genre pills, rating, duration, description
- Showtimes grouped by date with time slots as clickable pills
- Price displayed prominently per showtime

### Seat Selection Grid
- Square buttons in grid formation (w-10 h-10 or w-12 h-12)
- Seat number centered in each cell
- Visual states via border and fill patterns (not colors):
  - Available: border-2 with transparent fill
  - Pending: border-2 with pattern fill
  - Booked: solid fill with cross-hatch pattern
  - Selected (user choice): thick border-4
- Legend at top showing status meanings
- Screen indicator: Wide rectangle at top with "SCREEN" text

### Checkout Flow
- Step indicator: horizontal progress bar (1. Select Seats → 2. Upload Proof → 3. Confirm)
- Booking summary card: Film poster thumbnail, showtime details, selected seats list, total price
- Payment proof upload: Large dropzone with drag-and-drop, file preview after upload
- Clear CTA: "Confirm Booking" button, prominent and full-width on mobile

### Booking History
- Table on desktop, stacked cards on mobile
- Columns: Booking ID, Film, Date/Time, Seats, Status, Proof
- Status badges with distinct typography patterns (UPPERCASE for status)
- Expandable rows showing seat details

### Admin Dashboard
- Stats cards: Total Films, Active Showtimes, Pending Bookings (grid-cols-1 md:grid-cols-3)
- Each stat card: Large number (text-4xl), label below, icon via Heroicons
- Recent activity feed below stats

### Admin Film Management
- Table with: Poster thumbnail, Title, Genre, Duration, Rating, Actions
- Actions: Edit (pencil icon), Delete (trash icon) from Heroicons
- "Add New Film" button: top-right, prominent
- Modal for CRUD forms with proper field spacing

### Admin Booking Verification
- Split view: Left shows booking details + seat info, Right shows uploaded payment proof image
- Large proof preview (max-w-md) with zoom capability
- Action buttons: "Confirm" (primary) and "Reject" (secondary) side-by-side
- Rejection reason textarea if reject is chosen

### Forms
- Consistent field styling: border-2 rounded-lg px-4 py-3
- Labels: text-sm font-medium mb-2
- Error states: border pattern change + error message text-sm below field
- Required field indicator: asterisk after label

## Icons
**Library**: Heroicons (solid and outline variants via CDN)
- Film: ticket icon
- Calendar: calendar icon
- Seats: grid icon  
- User: user-circle icon
- Admin: cog icon
- Status indicators: check-circle, x-circle, clock icons

## Interactive Elements

### Buttons
- Primary CTA: px-6 py-3 rounded-lg font-semibold
- Secondary: Same padding, border-2 variant
- Icon buttons: p-2 rounded-md (for tables/cards)
- On hero/image overlays: backdrop-blur-md bg-opacity-90

### Hover States
- Cards: subtle lift via shadow increase (shadow-md → shadow-xl)
- Buttons: slight scale transform (scale-105)
- Seat tiles: border thickness increase
- Table rows: background pattern shift

## Responsive Behavior

**Mobile (< 768px)**:
- Single column film grid
- Stacked film detail layout (poster on top)
- Seat grid: Reduce to 6-8 columns max, smaller seat size
- Admin sidebar converts to bottom tab bar
- Tables convert to cards

**Tablet (768px - 1024px)**:
- 2-3 column film grid
- Maintain split film detail layout
- Full seat grid with medium sizing

**Desktop (> 1024px)**:
- 4 column film grid
- Fixed admin sidebar
- Optimized table views

## Images

**Hero Section**: Not applicable - this is a functional app, not a marketing site. Jump straight to film browsing.

**Film Posters**: 
- Primary visual element throughout the app
- Aspect ratio 2:3 (movie poster standard)
- Displayed on: Browse page cards, detail page large view, booking history thumbnails, admin tables as small thumbnails
- Use object-cover to maintain aspect ratio
- Placeholder state: Empty frame with film icon when no poster URL

**Payment Proof**: 
- User-uploaded images in checkout flow
- Admin views full-size in verification interface
- Thumbnail in booking history

## Page-Specific Layouts

**Login/Register**: Centered card (max-w-md) with logo above, form fields, toggle between login/register

**Films Browse**: Grid of film cards with search/filter bar at top (genre dropdown, search input)

**Film Detail**: Split layout with prominent "Select Showtime" section below, showtimes organized by date tabs

**Seat Selection**: Full-width seat grid centered, booking summary sidebar on desktop (stacked below on mobile)

**My Bookings**: Tabs for status filtering (All, Pending, Confirmed, Rejected), table/card list below

**Admin**: Dashboard homepage with stats, sidebar navigation, content area for CRUD interfaces

This design prioritizes usability, trust-building through clarity, and efficient workflows for both users completing bookings and admins managing the system.