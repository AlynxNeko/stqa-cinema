import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");

export class JsonStorage {
  private async readDb() {
    try {
      const data = await fs.readFile(DB_PATH, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return { users: [], films: [], studios: [], showtimes: [], bookings: [], seat_statuses: [] };
    }
  }

  private async writeDb(data: any) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  }

  // --- USER ---
  async getUserByEmail(email: string) {
    const db = await this.readDb();
    return db.users.find((u: any) => u.email === email);
  }

  async createUser(user: any) {
    const db = await this.readDb();
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9), role: 'user' };
    db.users.push(newUser);
    await this.writeDb(db);
    return newUser;
  }

  // --- FILMS ---
  async getFilms() {
    const db = await this.readDb();
    return db.films;
  }

  // [BARU] Ambil 1 film by ID
  async getFilm(id: string) {
    const db = await this.readDb();
    return db.films.find((f: any) => f.id === id);
  }

  async createFilm(film: any) {
    const db = await this.readDb();
    const newFilm = { ...film, id: Math.random().toString(36).substr(2, 9) };
    db.films.push(newFilm);
    await this.writeDb(db);
    return newFilm;
  }

  // [BARU] Update film
  async updateFilm(id: string, updates: any) {
    const db = await this.readDb();
    const index = db.films.findIndex((f: any) => f.id === id);
    if (index !== -1) {
      db.films[index] = { ...db.films[index], ...updates };
      await this.writeDb(db);
      return db.films[index];
    }
    return null;
  }

  async deleteFilm(id: string) {
    const db = await this.readDb();
    db.films = db.films.filter((f: any) => f.id !== id);
    await this.writeDb(db);
  }

  // --- SHOWTIMES ---
  async getShowtimes() {
    const db = await this.readDb();
    return db.showtimes.map((s: any) => ({
      ...s,
      film: db.films.find((f: any) => f.id === s.film_id),
      studio: db.studios.find((st: any) => st.id === s.studio_id)
    }));
  }

  // [BARU] Ambil 1 showtime by ID (untuk halaman select-seats)
  async getShowtime(id: string) {
    const db = await this.readDb();
    const showtime = db.showtimes.find((s: any) => s.id === id);
    if (!showtime) return null;
    
    return {
      ...showtime,
      film: db.films.find((f: any) => f.id === showtime.film_id),
      studio: db.studios.find((st: any) => st.id === showtime.studio_id)
    };
  }

  async createShowtime(showtime: any) {
    const db = await this.readDb();
    const newShowtime = { ...showtime, id: Math.random().toString(36).substr(2, 9) };
    db.showtimes.push(newShowtime);
    // Auto-generate seat statuses (Available)
    const studio = db.studios.find((s: any) => s.id === showtime.studio_id);
    if (studio) {
       // Logic sederhana generate status kursi jika diperlukan
       // Tapi di kode user logic booking_seats nampaknya dinamis, jadi seat_statuses
       // biasanya diisi saat ada booking. Kita biarkan array kosong dulu.
    }
    await this.writeDb(db);
    return newShowtime;
  }

  async deleteShowtime(id: string) {
    const db = await this.readDb();
    db.showtimes = db.showtimes.filter((s: any) => s.id !== id);
    await this.writeDb(db);
  }

  // --- SEAT STATUSES ---
  // [BARU] Get seat statuses per showtime
  async getSeatStatuses(showtimeId: string) {
    const db = await this.readDb();
    // Kita perlu join dengan table 'seats' agar client tau nomor kursinya
    // Filter status khusus showtime ini
    const statuses = db.seat_statuses.filter((s: any) => s.showtime_id === showtimeId);
    
    // Tapi client butuh daftar SEMUA kursi beserta statusnya.
    // Flow: Ambil studio ID dari showtime -> Ambil semua kursi studio itu -> Map statusnya
    
    const showtime = db.showtimes.find((s: any) => s.id === showtimeId);
    if (!showtime) return [];

    // Generate kursi dummy berdasarkan kapasitas studio (karena table seats mungkin belum diisi manual)
    // Sesuai SUPABASE_SETUP.md logic generator:
    const studio = db.studios.find((s: any) => s.id === showtime.studio_id);
    const seats = [];
    if (studio) {
        const rows = Math.ceil(studio.capacity / 10);
        for (let i = 0; i < rows; i++) {
            const rowLetter = String.fromCharCode(65 + i);
            for (let j = 1; j <= 10; j++) {
                if ((i * 10 + j) > studio.capacity) break;
                const seatNum = `${rowLetter}${j}`;
                const seatId = `${studio.id}-${seatNum}`; // Fake ID for dummy DB
                
                // Cek status real di db.seat_statuses
                const statusObj = statuses.find((s: any) => s.seat_id === seatId);
                
                seats.push({
                    seat_id: seatId,
                    showtime_id: showtimeId,
                    status: statusObj ? statusObj.status : 'Available',
                    seat: { seat_number: seatNum }
                });
            }
        }
    }
    return seats;
  }

  // --- STUDIOS ---
  async getStudios() {
    const db = await this.readDb();
    return db.studios;
  }

  // --- BOOKINGS (Admin) ---
  async getAllBookings() {
    const db = await this.readDb();
    return db.bookings.map((b: any) => {
        const showtime = db.showtimes.find((s: any) => s.id === b.showtime_id);
        const film = showtime ? db.films.find((f: any) => f.id === showtime.film_id) : null;
        
        return {
            ...b,
            showtime: showtime ? { ...showtime, film } : null,
            // Perlu mock booking_seats untuk tampilan admin
            booking_seats: db.booking_seats
              .filter((bs: any) => bs.booking_id === b.id)
              .map((bs: any) => ({
                 ...bs,
                 seat: { seat_number: bs.seat_id.split('-')[1] || '??' } // Hack parsing ID dummy
              }))
        };
    });
  }

  // Mock ambil detail kursi dari ID (Format ID: "StudioID-NomorKursi")
  async getSeatsByIds(seatIds: string[]) {
    const db = await this.readDb();
    return seatIds.map(id => {
       // Kita generate object kursi on-the-fly karena di db.json kursi mungkin belum di-seed
       const parts = id.split('-');
       const seatNum = parts.length > 1 ? parts[1] : id;
       const studioId = parts[0]; 
       return { 
         id, 
         studio_id: studioId, 
         seat_number: seatNum 
       };
    });
  }

  // Transaksi Booking: Simpan Booking + Simpan Kursi + Update Status
  async createBookingTransaction(bookingData: any, seatIds: string[]) {
    const db = await this.readDb();
    
    // 1. Simpan Booking
    const newBooking = {
        id: Math.random().toString(36).substr(2, 9),
        ...bookingData,
        created_at: new Date().toISOString()
    };
    db.bookings.push(newBooking);

    // 2. Simpan Booking Seats & Update Status Kursi
    seatIds.forEach(seatId => {
        // Masukkan ke tabel booking_seats
        db.booking_seats.push({
            id: Math.random().toString(36).substr(2, 9),
            booking_id: newBooking.id,
            seat_id: seatId
        });

        // Update atau Buat status kursi jadi 'Pending'
        const existingStatusIndex = db.seat_statuses.findIndex(
            (s: any) => s.seat_id === seatId && s.showtime_id === bookingData.showtime_id
        );

        if (existingStatusIndex >= 0) {
            db.seat_statuses[existingStatusIndex].status = 'Pending';
        } else {
            db.seat_statuses.push({
                id: Math.random().toString(36).substr(2, 9),
                seat_id: seatId,
                showtime_id: bookingData.showtime_id,
                status: 'Pending'
            });
        }
    });

    await this.writeDb(db);
    return newBooking;
  }

  async getStats() {
    const db = await this.readDb();
    return {
      totalFilms: db.films.length,
      activeShowtimes: db.showtimes.length,
      pendingBookings: db.bookings.filter((b: any) => b.status === 'Pending').length
    };
  }
}

export const storage = new JsonStorage();