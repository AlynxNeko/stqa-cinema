
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

// API Helper pengganti Supabase Client
export const api = {
  get: async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  post: async (url: string, data: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'API Error');
    }
    return res.json();
  },
  delete: async (url: string) => {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  patch: async (url: string, data: any) => {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  }
};

// Mock export agar file lain tidak error saat import
export const supabase = {
  from: () => ({ select: () => ({ eq: () => ({ single: () => {} }) }) }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
};