import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs/promises'
import { JsonStorage } from './storage'

vi.mock('fs/promises')

describe('JsonStorage (unit)', () => {
  let storage: JsonStorage

  beforeEach(() => {
    storage = new JsonStorage()
    vi.clearAllMocks()
  })

  it('getSeatStatuses returns seats for a studio capacity of 15', async () => {
    const mockDb = {
      studios: [{ id: 's1', capacity: 15 }],
      showtimes: [{ id: 'st1', studio_id: 's1' }],
      seat_statuses: [],
      users: [], films: [], bookings: [], booking_seats: []
    }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const seats = await storage.getSeatStatuses('st1')
    expect(seats).toHaveLength(15)
    expect(seats[0].seat_id).toBe('s1-A1')
    expect(seats[14].seat_id).toBe('s1-B5')
  })

  it('createBookingTransaction writes booking and pending seat_statuses', async () => {
    const mockDb = {
      studios: [],
      showtimes: [{ id: 'st1', studio_id: 's1' }],
      seat_statuses: [],
      users: [], films: [], bookings: [], booking_seats: []
    }

    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))
    ;(fs.writeFile as any).mockImplementation(async (_path: string, data: string) => {
      lastWritten = JSON.parse(data)
      return Promise.resolve()
    })

    const bookingData = { user_id: 'u1', showtime_id: 'st1', status: 'Pending' }
    const seatIds = ['s1-A1', 's1-A2']

    const created = await storage.createBookingTransaction(bookingData, seatIds)

    expect(created).toHaveProperty('id')
    expect(lastWritten.bookings.length).toBe(1)
    expect(lastWritten.booking_seats.length).toBe(2)
    expect(lastWritten.seat_statuses.every((s: any) => s.status === 'Pending')).toBe(true)
  })

  it('updateBookingStatus releases seats when status is Rejected', async () => {
    const booking = { id: 'b1', showtime_id: 'st1', user_id: 'u1', status: 'Pending' }
    const mockDb = {
      studios: [],
      showtimes: [{ id: 'st1', studio_id: 's1' }],
      seat_statuses: [ { id: 'ss1', seat_id: 's1-A1', showtime_id: 'st1', status: 'Pending' } ],
      users: [], films: [], bookings: [booking], booking_seats: [ { id: 'bs1', booking_id: 'b1', seat_id: 's1-A1' } ]
    }

    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))
    ;(fs.writeFile as any).mockImplementation(async (_path: string, data: string) => {
      lastWritten = JSON.parse(data)
      return Promise.resolve()
    })

    const updated = await storage.updateBookingStatus('b1', 'Rejected')
    expect(updated).not.toBeNull()
    expect(lastWritten.seat_statuses.find((s: any) => s.seat_id === 's1-A1').status).toBe('Available')
  })

  it('updateBookingStatus sets seats to Booked when Confirmed', async () => {
    const booking = { id: 'b2', showtime_id: 'st1', user_id: 'u1', status: 'Pending' }
    const mockDb = {
      studios: [],
      showtimes: [{ id: 'st1', studio_id: 's1' }],
      seat_statuses: [ { id: 'ss2', seat_id: 's1-A1', showtime_id: 'st1', status: 'Pending' } ],
      users: [], films: [], bookings: [booking], booking_seats: [ { id: 'bs2', booking_id: 'b2', seat_id: 's1-A1' } ]
    }

    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))
    ;(fs.writeFile as any).mockImplementation(async (_path: string, data: string) => {
      lastWritten = JSON.parse(data)
      return Promise.resolve()
    })

    const updated = await storage.updateBookingStatus('b2', 'Confirmed')
    expect(updated).not.toBeNull()
    expect(lastWritten.seat_statuses.find((s: any) => s.seat_id === 's1-A1').status).toBe('Booked')
  })

  it('getSeatsByIds parses ids with and without hyphen', async () => {
    const mockDb = { users: [], films: [], studios: [], showtimes: [], bookings: [], seat_statuses: [], booking_seats: [] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const result = await storage.getSeatsByIds(['s1-A1', 's2A2'])
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('studio_id', 's1')
    expect(result[0]).toHaveProperty('seat_number', 'A1')
    expect(result[1]).toHaveProperty('studio_id', 's2A2')
  })

  it('getStats returns counts', async () => {
    const mockDb = { films: [{}, {}], showtimes: [{}], bookings: [{ status: 'Pending' }], users: [], seat_statuses: [], booking_seats: [] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const stats = await storage.getStats()
    expect(stats).toEqual({ totalFilms: 2, activeShowtimes: 1, pendingBookings: 1 })
  })

  it('initializeSeats generates seats when missing', async () => {
    const mockDb = { studios: [{ id: 'sA', capacity: 12 }], seats: [], users: [], films: [], showtimes: [], bookings: [], seat_statuses: [], booking_seats: [] }
    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))
    ;(fs.writeFile as any).mockImplementation(async (_p: string, data: string) => { lastWritten = JSON.parse(data); return Promise.resolve() })

    await storage.initializeSeats()
    expect(lastWritten.seats.length).toBe(12)
  })

  it('create/get/update/delete film works', async () => {
    const mockDb = { films: [], users: [], studios: [], showtimes: [], bookings: [], seat_statuses: [], booking_seats: [] }
    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))
    ;(fs.writeFile as any).mockImplementation(async (_p: string, data: string) => { lastWritten = JSON.parse(data); return Promise.resolve() })

    const newFilm = await storage.createFilm({ title: 'X' })
    expect(newFilm).toHaveProperty('id')
    // simulate readFile returning db with film
    const dbWithFilm = { ...mockDb, films: [newFilm] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(dbWithFilm))

    const films = await storage.getFilms()
    expect(films).toHaveLength(1)

    const got = await storage.getFilm(newFilm.id)
    expect(got).not.toBeNull()

    const updated = await storage.updateFilm(newFilm.id, { title: 'Y' })
    expect(updated).toHaveProperty('title')

    await storage.deleteFilm(newFilm.id)
  })

  it('create/get/showtime endpoints logic', async () => {
    const mockDb = { films: [], users: [], studios: [{ id: 's1' }], showtimes: [], bookings: [], seat_statuses: [], booking_seats: [] }
    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))
    ;(fs.writeFile as any).mockImplementation(async (_p: string, data: string) => { lastWritten = JSON.parse(data); return Promise.resolve() })

    const newShow = await storage.createShowtime({ film_id: 'f1', studio_id: 's1' })
    expect(newShow).toHaveProperty('id')

    const dbWithShow = { ...mockDb, showtimes: [newShow], films: [{ id: 'f1', title: 'F' }], studios: [{ id: 's1' }] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(dbWithShow))

    const showtimes = await storage.getShowtimes()
    expect(showtimes[0]).toHaveProperty('film')

    const st = await storage.getShowtime(newShow.id)
    expect(st).toHaveProperty('studio')

    await storage.deleteShowtime(newShow.id)
  })

  it('getAllBookings maps booking_seats seat_number correctly', async () => {
    const booking = { id: 'b1', showtime_id: 'st1', user_id: 'u1', status: 'Pending' }
    const mockDb = {
      films: [{ id: 'f1' }],
      showtimes: [{ id: 'st1', film_id: 'f1', studio_id: 's1' }],
      studios: [{ id: 's1' }],
      bookings: [booking],
      booking_seats: [{ id: 'bs1', booking_id: 'b1', seat_id: 's1-A1' }],
      seat_statuses: [], users: []
    }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const all = await storage.getAllBookings()
    expect(all[0]).toHaveProperty('booking_seats')
    expect(all[0].booking_seats[0].seat).toHaveProperty('seat_number')
  })

  it('getStudios returns studios array', async () => {
    const mockDb = { studios: [{ id: 'st1', name: 'Studio 1' }], users: [], films: [], showtimes: [], bookings: [], seat_statuses: [], booking_seats: [] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const studios = await storage.getStudios()
    expect(studios).toHaveLength(1)
    expect(studios[0]).toHaveProperty('id', 'st1')
  })

  it('getUserByEmail returns a user by email and createUser persists new user', async () => {
    const existing = { id: 'u1', email: 'a@x.com', name: 'A' }
    const mockDb = { users: [existing], films: [], studios: [], showtimes: [], bookings: [], seat_statuses: [], booking_seats: [] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const found = await storage.getUserByEmail('a@x.com')
    expect(found).toMatchObject({ email: 'a@x.com' })

    // Test createUser writes and returns a new user with role
    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify({ users: [] , films: [], studios: [], showtimes: [], bookings: [], seat_statuses: [], booking_seats: [] }))
    ;(fs.writeFile as any).mockImplementation(async (_p: string, data: string) => { lastWritten = JSON.parse(data); return Promise.resolve() })

    const newUser = await storage.createUser({ email: 'new@x.com', name: 'New' })
    expect(newUser).toHaveProperty('id')
    expect(newUser).toHaveProperty('role', 'user')
    expect(lastWritten.users[0]).toMatchObject({ email: 'new@x.com' })
  })

  it('getUserBookings returns bookings for a user with mapped showtime and seat numbers', async () => {
    const booking = { id: 'bUser1', showtime_id: 'stZ', user_id: 'uZ', status: 'Pending' }
    const mockDb = {
      films: [{ id: 'fZ', title: 'FZ' }],
      showtimes: [{ id: 'stZ', film_id: 'fZ', studio_id: 'sZ' }],
      studios: [{ id: 'sZ' }],
      bookings: [booking],
      booking_seats: [{ id: 'bsx', booking_id: 'bUser1', seat_id: 'sZ-A1' }],
      seat_statuses: [], users: []
    }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const userBookings = await storage.getUserBookings('uZ')
    expect(userBookings).toHaveLength(1)
    expect(userBookings[0]).toHaveProperty('showtime')
    expect(userBookings[0].booking_seats[0].seat).toHaveProperty('seat_number', 'A1')
  })

  it('readDb returns default structure when readFile fails', async () => {
    ;(fs.readFile as any).mockRejectedValue(new Error('fail'))
    const films = await storage.getFilms()
    expect(films).toEqual([])
  })

  it('getSeatStatuses returns empty when showtime missing or studio missing', async () => {
    const mockDb = { studios: [], showtimes: [], seat_statuses: [], users: [], films: [], bookings: [], booking_seats: [] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const seats = await storage.getSeatStatuses('no-show')
    expect(seats).toHaveLength(0)

    // showtime exists but studio missing
    const mockDb2 = { studios: [], showtimes: [{ id: 's1', studio_id: 'missing' }], seat_statuses: [], users: [], films: [], bookings: [], booking_seats: [] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb2))
    const seats2 = await storage.getSeatStatuses('s1')
    expect(seats2).toHaveLength(0)
  })

  it('createBookingTransaction updates existing seat_status to Pending', async () => {
    const mockDb = {
      studios: [],
      showtimes: [{ id: 'st1', studio_id: 's1' }],
      seat_statuses: [ { id: 'ssx', seat_id: 's1-A1', showtime_id: 'st1', status: 'Available' } ],
      users: [], films: [], bookings: [], booking_seats: []
    }

    let lastWritten: any = null
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))
    ;(fs.writeFile as any).mockImplementation(async (_path: string, data: string) => {
      lastWritten = JSON.parse(data)
      return Promise.resolve()
    })

    const bookingData = { user_id: 'u1', showtime_id: 'st1', status: 'Pending' }
    const seatIds = ['s1-A1']

    const created = await storage.createBookingTransaction(bookingData, seatIds)
    expect(created).toHaveProperty('id')
    expect(lastWritten.seat_statuses.find((s: any) => s.seat_id === 's1-A1').status).toBe('Pending')
  })

  it('updateBookingStatus returns null when booking not found', async () => {
    const mockDb = { bookings: [], showtimes: [], seat_statuses: [], users: [], films: [], booking_seats: [] }
    ;(fs.readFile as any).mockResolvedValue(JSON.stringify(mockDb))

    const res = await storage.updateBookingStatus('does-not-exist', 'Confirmed')
    expect(res).toBeNull()
  })
})
