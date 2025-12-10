# CinemaBook 🎬

A full-stack cinema ticket booking web application built with React, TypeScript, TailwindCSS, and Supabase.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📖 Overview

CinemaBook is a modern web platform that streamlines the movie ticket booking process. It features a responsive user interface for browsing films and selecting seats in real-time, alongside a powerful admin dashboard for managing cinema operations.

## ✨ Features

### 👤 For Users
* **Authentication**: Secure user registration and login.
* **Film Browsing**: Explore movies with advanced search and genre filters.
* **Interactive Seat Selection**: Visual seat map with real-time availability updates.
* **Booking System**: easy checkout process with payment proof upload.
* **My Bookings**: Dashboard to track booking history and status.

### 🛡️ For Admins
* **Dashboard**: Overview statistics of films, bookings, and revenue.
* **Film Management**: Add, edit, and publish films with poster uploads.
* **Showtime Scheduling**: Manage screening times and studio assignments.
* **Booking Verification**: Review payment proofs and approve/reject reservations.

## 🛠️ Tech Stack

**Frontend**
* React 18 & TypeScript
* Vite
* Tailwind CSS & Shadcn/ui
* TanStack Query
* Wouter (Routing)

**Backend**
* Node.js & Express
* Supabase (Auth, Database, Storage)
* Drizzle ORM
* PostgreSQL

## 🚀 Getting Started

### Installation

Install the project dependencies:

```bash
npm install
```

### Running the App

Start the development server:

```bash
npm run dev
```

The application will start, and you can access it in your browser (typically at `http://localhost:5000` or the port shown in your terminal).

## 📜 Scripts

* `npm run dev`: Starts the development server with hot-reload.
* `npm run build`: Builds the frontend and server for production.
* `npm start`: Runs the production server.
* `npm run check`: Runs TypeScript type checking.
* `npm run db:push`: Pushes schema changes to the database (Drizzle).

## 📄 License

This project is licensed under the [MIT License](LICENSE).