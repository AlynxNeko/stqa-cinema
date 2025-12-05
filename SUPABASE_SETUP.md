# Supabase Database Setup Instructions

This document contains all the SQL commands needed to set up your CinemaBook database in Supabase.

## Step 1: Navigate to SQL Editor

1. Open your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

## Step 2: Run the following SQL commands

Copy and paste this entire SQL script into the SQL Editor and click "Run":

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create films table
CREATE TABLE films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create studios table
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create showtimes table
CREATE TABLE showtimes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Rejected', 'Expired')) DEFAULT 'Pending',
  payment_proof_url TEXT,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create seats table
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(studio_id, seat_number)
);

-- Create booking_seats junction table
CREATE TABLE booking_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create seat_statuses table
CREATE TABLE seat_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Available', 'Pending', 'Booked')) DEFAULT 'Available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seat_id, showtime_id)
);

-- Create indexes for better performance
CREATE INDEX idx_showtimes_film ON showtimes(film_id);
CREATE INDEX idx_showtimes_studio ON showtimes(studio_id);
CREATE INDEX idx_showtimes_date ON showtimes(date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_showtime ON bookings(showtime_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_seat_statuses_showtime ON seat_statuses(showtime_id);
CREATE INDEX idx_seat_statuses_seat ON seat_statuses(seat_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_statuses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for films (public read, admin write)
CREATE POLICY "Anyone can view films" ON films FOR SELECT USING (true);
CREATE POLICY "Admins can insert films" ON films FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update films" ON films FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete films" ON films FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for studios (public read, admin write)
CREATE POLICY "Anyone can view studios" ON studios FOR SELECT USING (true);
CREATE POLICY "Admins can insert studios" ON studios FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update studios" ON studios FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete studios" ON studios FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for showtimes (public read, admin write)
CREATE POLICY "Anyone can view showtimes" ON showtimes FOR SELECT USING (true);
CREATE POLICY "Admins can insert showtimes" ON showtimes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update showtimes" ON showtimes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete showtimes" ON showtimes FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update bookings" ON bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for seats (public read, admin write)
CREATE POLICY "Anyone can view seats" ON seats FOR SELECT USING (true);
CREATE POLICY "Admins can insert seats" ON seats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for booking_seats
CREATE POLICY "Users can view own booking seats" ON booking_seats FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_seats.booking_id 
    AND (bookings.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);
CREATE POLICY "Users can insert own booking seats" ON booking_seats FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_seats.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- RLS Policies for seat_statuses (public read, authenticated write)
CREATE POLICY "Anyone can view seat statuses" ON seat_statuses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update seat statuses" ON seat_statuses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert seat statuses" ON seat_statuses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to automatically create seat statuses when a showtime is created
CREATE OR REPLACE FUNCTION create_seat_statuses_for_showtime()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO seat_statuses (seat_id, showtime_id, status)
  SELECT s.id, NEW.id, 'Available'
  FROM seats s
  WHERE s.studio_id = NEW.studio_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_seat_statuses
AFTER INSERT ON showtimes
FOR EACH ROW
EXECUTE FUNCTION create_seat_statuses_for_showtime();

-- Insert sample studios
INSERT INTO studios (name, capacity) VALUES
  ('Studio 1', 100),
  ('Studio 2', 80),
  ('Studio 3', 120);

-- Generate seats for each studio
DO $$
DECLARE
  studio RECORD;
  row_letter CHAR;
  seat_num INTEGER;
  total_rows INTEGER;
  seats_per_row INTEGER := 10;
BEGIN
  FOR studio IN SELECT id, capacity FROM studios LOOP
    total_rows := CEIL(studio.capacity::DECIMAL / seats_per_row);
    
    FOR i IN 0..(total_rows - 1) LOOP
      row_letter := CHR(65 + i); -- A, B, C, etc.
      
      FOR seat_num IN 1..seats_per_row LOOP
        IF (i * seats_per_row + seat_num) <= studio.capacity THEN
          INSERT INTO seats (studio_id, seat_number)
          VALUES (studio.id, row_letter || seat_num);
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Insert sample films
INSERT INTO films (title, genre, duration_min, description, poster_url, rating) VALUES
  ('The Matrix', 'Sci-Fi', 136, 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 8.7),
  ('Inception', 'Sci-Fi', 148, 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 8.8),
  ('The Dark Knight', 'Action', 152, 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 9.0),
  ('Interstellar', 'Sci-Fi', 169, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 8.6),
  ('Parasite', 'Thriller', 132, 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 8.5);

-- Insert sample showtimes (next 7 days)
DO $$
DECLARE
  film RECORD;
  studio RECORD;
  show_date DATE;
  show_time TIME;
BEGIN
  FOR film IN SELECT id FROM films LIMIT 5 LOOP
    FOR i IN 0..6 LOOP
      show_date := CURRENT_DATE + i;
      
      -- Morning show
      FOR studio IN SELECT id FROM studios ORDER BY RANDOM() LIMIT 1 LOOP
        INSERT INTO showtimes (film_id, studio_id, date, time, price)
        VALUES (film.id, studio.id, show_date, '10:00:00', 50000);
      END LOOP;
      
      -- Afternoon show
      FOR studio IN SELECT id FROM studios ORDER BY RANDOM() LIMIT 1 LOOP
        INSERT INTO showtimes (film_id, studio_id, date, time, price)
        VALUES (film.id, studio.id, show_date, '14:00:00', 60000);
      END LOOP;
      
      -- Evening show
      FOR studio IN SELECT id FROM studios ORDER BY RANDOM() LIMIT 1 LOOP
        INSERT INTO showtimes (film_id, studio_id, date, time, price)
        VALUES (film.id, studio.id, show_date, '19:00:00', 75000);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
```

## Step 3: Set up Storage Bucket for Payment Proofs

1. Go to "Storage" in the left sidebar
2. Click "Create a new bucket"
3. Name it: `payment_proofs`
4. Make it **public** (so images can be viewed)
5. Click "Create bucket"

### Storage Policies

After creating the bucket, click on the bucket name, then go to "Policies" and add these policies:

```sql
-- Allow authenticated users to upload payment proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment_proofs');

-- Allow anyone to view payment proofs
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment_proofs');

-- Allow admins to delete payment proofs
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment_proofs' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

## Step 4: Create an Admin User

After you register your first user through the app, you can promote them to admin:

1. Go to "SQL Editor"
2. Run this query (replace the email with your registered email):

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Done!

Your Supabase database is now fully configured and ready to use with the CinemaBook application.

### What was created:

- ✅ 8 tables with proper relationships
- ✅ Row Level Security (RLS) policies for data protection
- ✅ Automatic seat status creation for new showtimes
- ✅ Sample data (3 studios with seats, 5 films, multiple showtimes)
- ✅ Storage bucket for payment proof uploads
- ✅ Indexes for optimal query performance

The application will now work with real Supabase data!
