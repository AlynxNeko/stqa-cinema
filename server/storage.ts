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

  async createFilm(film: any) {
    const db = await this.readDb();
    const newFilm = { ...film, id: Math.random().toString(36).substr(2, 9) };
    db.films.push(newFilm);
    await this.writeDb(db);
    return newFilm;
  }

  async deleteFilm(id: string) {
    const db = await this.readDb();
    db.films = db.films.filter((f: any) => f.id !== id);
    await this.writeDb(db);
  }

  // --- SHOWTIMES ---
  async getShowtimes() {
    const db = await this.readDb();
    // Manual Join untuk frontend
    return db.showtimes.map((s: any) => ({
      ...s,
      film: db.films.find((f: any) => f.id === s.film_id),
      studio: db.studios.find((st: any) => st.id === s.studio_id)
    }));
  }

  async createShowtime(showtime: any) {
    const db = await this.readDb();
    const newShowtime = { ...showtime, id: Math.random().toString(36).substr(2, 9) };
    db.showtimes.push(newShowtime);
    await this.writeDb(db);
    return newShowtime;
  }

  // --- STUDIOS ---
  async getStudios() {
    const db = await this.readDb();
    return db.studios;
  }

  // --- DASHBOARD STATS ---
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