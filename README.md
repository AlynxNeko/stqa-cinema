# CinemaBook - Cinema Ticket Booking System

A beautiful, full-featured cinema ticket booking web application built with React, TypeScript, TailwindCSS, and Supabase.

## Features

### User Features
- 🎬 **Browse Films** - View all available movies with beautiful card layouts
- 📅 **View Showtimes** - See available screening times organized by date
- 💺 **Interactive Seat Selection** - Pick your seats with real-time availability status
- 💳 **Payment Proof Upload** - Upload payment confirmation screenshots
- 📋 **Booking History** - Track all your bookings and their status
- 🔐 **Secure Authentication** - Email and password authentication via Supabase

### Admin Features
- 🎥 **Film Management** - Add, edit, and remove films
- 🕐 **Showtime Management** - Schedule new showtimes
- ✅ **Booking Verification** - Review payment proofs and confirm/reject bookings
- 📊 **Dashboard** - View statistics and quick actions
- 🎫 **Automatic Seat Management** - Seat statuses update automatically

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Wouter (routing)
- **Backend**: Supabase (Authentication, Database, Storage)
- **UI Components**: Shadcn/ui
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

1. A Supabase account (free tier works great!)
2. Node.js installed

### Step 1: Set Up Supabase Database

Follow the comprehensive instructions in **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

This will:
- Create all necessary database tables
- Set up Row Level Security policies
- Create sample data (films, studios, showtimes)
- Configure the storage bucket for payment proofs

### Step 2: Configure Environment Variables

Your Supabase credentials are already configured in `client/src/config.ts`. The values have been set from your Replit Secrets during initial setup.

If you need to update them:
1. Edit `client/src/config.ts`
2. Replace the `url` and `anonKey` values with your new Supabase credentials

### Step 3: Run the Application

The application is already running! Just click the "Open in new tab" button to view it.

### Step 4: Create Your First Admin User

1. Register a new account through the login page
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Log out and log back in to access the admin panel at `/admin/dashboard`

## User Journey

### For Movie-Goers

1. **Register/Login** → Create an account or sign in
2. **Browse Films** → See all available movies
3. **Select Showtime** → Choose your preferred date and time
4. **Pick Seats** → Interactive seat selection with real-time availability
5. **Upload Payment Proof** → Upload your payment screenshot
6. **Track Booking** → View status in "My Bookings" (Pending/Confirmed/Rejected)

### For Cinema Admins

1. **Login** → Use admin account credentials
2. **Manage Films** → Add new releases, update information
3. **Schedule Showtimes** → Create screening schedules
4. **Review Bookings** → View payment proofs and confirm/reject bookings
5. **Dashboard** → Monitor operations with statistics

## Database Schema

### Core Tables

- **profiles** - User accounts with roles (user/admin)
- **films** - Movie information (title, genre, duration, poster, rating)
- **studios** - Cinema halls with seating capacity
- **showtimes** - Screening schedules linking films and studios
- **bookings** - Customer reservations with payment proofs
- **seats** - Individual seats in each studio
- **booking_seats** - Junction table for booking-seat relationships
- **seat_statuses** - Real-time seat availability per showtime

## Design Principles

This application follows professional booking platform design guidelines:

- **Clean Typography** - Inter font family for readability
- **Consistent Spacing** - Tailwind units (2, 4, 6, 8) used throughout
- **Beautiful Cards** - Film posters with hover effects
- **Responsive Design** - Mobile-first approach
- **Clear Status Indicators** - Color-coded badges for booking status
- **Accessible UI** - Proper labels, ARIA attributes, keyboard navigation

## Seat Status System

- **Available** (border outline) - Ready to book
- **Pending** (pattern fill) - Payment submitted, awaiting confirmation
- **Booked** (solid fill) - Confirmed and unavailable
- **Selected** (thick border) - Currently being selected by user

## Security

- **Row Level Security (RLS)** - Database-level access control
- **Authentication** - Supabase Auth with email/password
- **Role-Based Access** - Admin features protected
- **Secure Storage** - Payment proofs stored in Supabase Storage

## Support

Need help? Check these resources:
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)

---

**Built with ❤️ for seamless cinema ticket booking**
