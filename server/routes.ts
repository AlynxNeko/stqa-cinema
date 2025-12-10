import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // --- AUTH ---
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: _, ...userInfo } = user;
    res.json({ user: userInfo, session: { user: userInfo } });
  });

  app.post("/api/auth/register", async (req, res) => {
    const existing = await storage.getUserByEmail(req.body.email);
    if (existing) return res.status(400).json({ error: "User exists" });
    const user = await storage.createUser(req.body);
    res.json({ user });
  });

  // --- FILMS ---
  app.get("/api/films", async (_req, res) => {
    const films = await storage.getFilms();
    res.json(films);
  });

  // [BARU] Route Get Film by ID (Ini solusi untuk masalah Anda)
  app.get("/api/films/:id", async (req, res) => {
    const film = await storage.getFilm(req.params.id);
    if (!film) return res.status(404).json({ error: "Film not found" });
    res.json(film);
  });

  app.post("/api/films", async (req, res) => {
    const film = await storage.createFilm(req.body);
    res.json(film);
  });

  // [BARU] Patch film
  app.patch("/api/films/:id", async (req, res) => {
    const updated = await storage.updateFilm(req.params.id, req.body);
    res.json(updated);
  });
  
  app.delete("/api/films/:id", async (req, res) => {
    await storage.deleteFilm(req.params.id);
    res.json({ success: true });
  });

  // --- SHOWTIMES ---
  app.get("/api/showtimes", async (req, res) => {
    let showtimes = await storage.getShowtimes();
    
    // Filter by film_id if provided (penting untuk halaman detail film)
    if (req.query.film_id) {
        showtimes = showtimes.filter((s: any) => s.film_id === req.query.film_id);
    }
    
    res.json(showtimes);
  });

  // [BARU] Get Single Showtime
  app.get("/api/showtimes/:id", async (req, res) => {
    const showtime = await storage.getShowtime(req.params.id);
    if (!showtime) return res.status(404).json({ error: "Showtime not found" });
    res.json(showtime);
  });

  app.post("/api/showtimes", async (req, res) => {
    const showtime = await storage.createShowtime(req.body);
    res.json(showtime);
  });

  app.delete("/api/showtimes/:id", async (req, res) => {
    await storage.deleteShowtime(req.params.id);
    res.json({ success: true });
  });

  // --- SEAT STATUSES (Untuk halaman Select Seats) ---
  app.get("/api/seat-statuses", async (req, res) => {
    const showtimeId = req.query.showtime_id as string;
    if (!showtimeId) return res.status(400).json({ error: "showtime_id required" });
    
    const statuses = await storage.getSeatStatuses(showtimeId);
    res.json(statuses);
  });

  // --- STUDIOS ---
  app.get("/api/studios", async (_req, res) => {
    const studios = await storage.getStudios();
    res.json(studios);
  });

  // --- ADMIN ---
  app.get("/api/admin/stats", async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.get("/api/admin/bookings", async (_req, res) => {
    const bookings = await storage.getAllBookings();
    res.json(bookings);
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    const updated = await storage.updateBookingStatus(req.params.id, req.body.status);
    res.json(updated);
  });

  // 1. Endpoint untuk ambil detail banyak kursi sekaligus
  app.post("/api/seats/batch", async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "Invalid IDs" });
    const seats = await storage.getSeatsByIds(ids);
    res.json(seats);
  });

  // 2. Endpoint Create Booking (Menggantikan supabase.insert)
  app.post("/api/bookings", async (req, res) => {
    try {
        // Pisahkan seat_ids dari data booking lainnya
        const { seat_ids, ...bookingData } = req.body;
        
        if (!seat_ids || seat_ids.length === 0) {
            return res.status(400).json({ error: "No seats selected" });
        }

        const booking = await storage.createBookingTransaction(bookingData, seat_ids);
        res.json(booking);
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  });

  return httpServer;
}