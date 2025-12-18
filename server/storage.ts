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
      const db = JSON.parse(data);
      
      // Ensure all arrays exist to prevent "undefined" errors
      if (!db.users) db.users = [];
      if (!db.films) db.films = [];
      if (!db.studios) db.studios = [];
      if (!db.showtimes) db.showtimes = [];
      if (!db.bookings) db.bookings = [];
      if (!db.seat_statuses) db.seat_statuses = [];
      if (!db.booking_seats) db.booking_seats = []; // Critical fix
      
      return db;
    } catch (e) {
      // Default structure if file read fails
      return { 
        users: [], 
        films: [], 
        studios: [], 
        showtimes: [], 
        bookings: [], 
        seat_statuses: [], 
        booking_seats: [] 
      };
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
    await this.writeDb(db);
    return newShowtime;
  }

  async deleteShowtime(id: string) {
    const db = await this.readDb();
    db.showtimes = db.showtimes.filter((s: any) => s.id !== id);
    await this.writeDb(db);
  }

  // --- SEAT STATUSES ---
  async getSeatStatuses(showtimeId: string) {
    const db = await this.readDb();
    const statuses = db.seat_statuses.filter((s: any) => s.showtime_id === showtimeId);
    
    const showtime = db.showtimes.find((s: any) => s.id === showtimeId);
    if (!showtime) return [];

    const studio = db.studios.find((s: any) => s.id === showtime.studio_id);
    const seats = [];
    if (studio) {
        const rows = Math.ceil(studio.capacity / 10);
        for (let i = 0; i < rows; i++) {
            const rowLetter = String.fromCharCode(65 + i);
            for (let j = 1; j <= 10; j++) {
                if ((i * 10 + j) > studio.capacity) break;
                const seatNum = `${rowLetter}${j}`;
                const seatId = `${studio.id}-${seatNum}`; 
                
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
            booking_seats: db.booking_seats
              .filter((bs: any) => bs.booking_id === b.id)
              .map((bs: any) => {
                 // FIX: Handle cases where ID might not have a hyphen
                 const parts = bs.seat_id.split('-');
                 const seatNum = parts.length > 1 ? parts[1] : bs.seat_id;
                 return {
                   ...bs,
                   seat: { seat_number: seatNum }
                 };
              })
        };
    });
  }

  async getUserBookings(userId: string) {
    const db = await this.readDb();
    // Filter bookings by user_id
    const userBookings = db.bookings.filter((b: any) => b.user_id === userId);

    return userBookings.map((b: any) => {
        const showtime = db.showtimes.find((s: any) => s.id === b.showtime_id);
        const film = showtime ? db.films.find((f: any) => f.id === showtime.film_id) : null;
        
        return {
            ...b,
            showtime: showtime ? { ...showtime, film } : null,
            booking_seats: db.booking_seats
              .filter((bs: any) => bs.booking_id === b.id)
              .map((bs: any) => {
                 const parts = bs.seat_id.split('-');
                 const seatNum = parts.length > 1 ? parts[1] : bs.seat_id;
                 return {
                   ...bs,
                   seat: { seat_number: seatNum }
                 };
              })
        };
    });
  }

  async updateBookingStatus(id: string, status: string) {
    const db = await this.readDb();
    const booking = db.bookings.find((b: any) => b.id === id);
    if (booking) {
      booking.status = status;
      
      // If rejected or expired, release seats
      if (status === 'Rejected' || status === 'Expired') {
         // Find booking seats
         const bookingSeats = db.booking_seats.filter((bs: any) => bs.booking_id === id);
         bookingSeats.forEach((bs: any) => {
             // Find status entry
             const statusEntry = db.seat_statuses.find(
                 (s: any) => s.seat_id === bs.seat_id && s.showtime_id === booking.showtime_id
             );
             if (statusEntry) {
                 statusEntry.status = 'Available';
             }
         });
      }
      
      // If confirmed, make sure seats are booked
      if (status === 'Confirmed') {
         const bookingSeats = db.booking_seats.filter((bs: any) => bs.booking_id === id);
         bookingSeats.forEach((bs: any) => {
             const statusEntry = db.seat_statuses.find(
                 (s: any) => s.seat_id === bs.seat_id && s.showtime_id === booking.showtime_id
             );
             if (statusEntry) {
                 statusEntry.status = 'Booked';
             }
         });
      }

      await this.writeDb(db);
      return booking;
    }
    return null;
  }

  async getSeatsByIds(seatIds: string[]) {
    const db = await this.readDb();
    return seatIds.map(id => {
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
        // Safe push to booking_seats
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

  async initializeSeats() {
    const db = await this.readDb();
    
    // If seats table is empty but studios exist, generate seats
    if ((!db.seats || db.seats.length === 0) && db.studios && db.studios.length > 0) {
        console.log("Initializing real seats data into database...");
        db.seats = []; 
        
        db.studios.forEach((studio: any) => {
            const rows = Math.ceil(studio.capacity / 10);
            for (let i = 0; i < rows; i++) {
                const rowLetter = String.fromCharCode(65 + i); // A, B, C...
                for (let j = 1; j <= 10; j++) {
                    if ((i * 10 + j) > studio.capacity) break;
                    
                    const seatNumber = `${rowLetter}${j}`;
                    // Create distinct Seat ID
                    const newSeat = {
                        id: `${studio.id}_${seatNumber}`, 
                        studio_id: studio.id,
                        seat_number: seatNumber
                    };
                    db.seats.push(newSeat);
                }
            }
        });
        await this.writeDb(db);
        console.log(`Generated ${db.seats.length} seats.`);
    }
  }
}

export const storage = new JsonStorage();