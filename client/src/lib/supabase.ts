import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Film {
  id: string;
  title: string;
  genre: string;
  duration_min: number;
  description: string;
  poster_url: string;
  rating: number;
}

export interface Studio {
  id: string;
  name: string;
  capacity: number;
}

export interface Showtime {
  id: string;
  film_id: string;
  studio_id: string;
  date: string;
  time: string;
  price: number;
  film?: Film;
  studio?: Studio;
}

export interface Booking {
  id: string;
  user_id: string;
  showtime_id: string;
  status: 'Pending' | 'Confirmed' | 'Rejected' | 'Expired';
  payment_proof_url: string | null;
  total_price: number;
  created_at?: string;
  showtime?: Showtime;
  booking_seats?: BookingSeat[];
}

export interface Seat {
  id: string;
  studio_id: string;
  seat_number: string;
}

export interface BookingSeat {
  id: string;
  booking_id: string;
  seat_id: string;
  seat?: Seat;
}

export interface SeatStatus {
  id: string;
  seat_id: string;
  showtime_id: string;
  status: 'Available' | 'Pending' | 'Booked';
  seat?: Seat;
}
