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
    // Return user info tanpa password
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

  app.post("/api/films", async (req, res) => {
    const film = await storage.createFilm(req.body);
    res.json(film);
  });
  
  app.delete("/api/films/:id", async (req, res) => {
    await storage.deleteFilm(req.params.id);
    res.json({ success: true });
  });

  // --- SHOWTIMES ---
  app.get("/api/showtimes", async (_req, res) => {
    const showtimes = await storage.getShowtimes();
    res.json(showtimes);
  });

  app.post("/api/showtimes", async (req, res) => {
    const showtime = await storage.createShowtime(req.body);
    res.json(showtime);
  });

  // --- STUDIOS ---
  app.get("/api/studios", async (_req, res) => {
    const studios = await storage.getStudios();
    res.json(studios);
  });

  // --- ADMIN STATS ---
  app.get("/api/admin/stats", async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  return httpServer;
}