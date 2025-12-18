import express from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Provide an inline mocked `storage` via factory. Do not reference
// external variables inside this factory because `vi.mock` is hoisted.
vi.mock('./storage', () => {
  return {
    storage: {
      getUserByEmail: vi.fn(),
      createUser: vi.fn(),
      getFilms: vi.fn(),
      getFilm: vi.fn(),
      createFilm: vi.fn(),
      updateFilm: vi.fn(),
      getShowtimes: vi.fn(),
      getShowtime: vi.fn(),
      createShowtime: vi.fn(),
      deleteShowtime: vi.fn(),
      getSeatStatuses: vi.fn(),
      getStudios: vi.fn(),
      createBookingTransaction: vi.fn(),
      updateBookingStatus: vi.fn(),
      getSeatsByIds: vi.fn(),
      getUserBookings: vi.fn(),
      getStats: vi.fn(),
      getAllBookings: vi.fn(),
      deleteFilm: vi.fn(),
    }
  }
})

import { registerRoutes } from './routes'

let mockStorage: any = null

describe('API routes (integration-ish)', () => {
  let app: express.Express

  beforeEach(async () => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    // import mocked storage module so we can control mocks in tests
    const mod = await import('./storage')
    mockStorage = (mod as any).storage
    await registerRoutes(app)
  })

  it('POST /api/auth/register prevents duplicate emails', async () => {
    mockStorage.getUserByEmail.mockResolvedValue({ id: 'u1', email: 'a@b' })

    const res = await request(app).post('/api/auth/register').send({ email: 'a@b', password: 'x' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('POST /api/auth/register creates user', async () => {
    mockStorage.getUserByEmail.mockResolvedValue(null)
    mockStorage.createUser.mockResolvedValue({ id: 'u2', email: 'new@u' })

    const res = await request(app).post('/api/auth/register').send({ email: 'new@u', password: 'p' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('user')
  })

  it('POST /api/auth/login returns 401 when bad creds', async () => {
    mockStorage.getUserByEmail.mockResolvedValue(null)
    const res = await request(app).post('/api/auth/login').send({ email: 'a', password: 'b' })
    expect(res.status).toBe(401)
  })

  it('POST /api/auth/login returns user when ok', async () => {
    mockStorage.getUserByEmail.mockResolvedValue({ id: 'u1', email: 'ok@x', password: 'pw' })
    const res = await request(app).post('/api/auth/login').send({ email: 'ok@x', password: 'pw' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('user')
  })

  it('GET /api/films/:id returns 404 when not found', async () => {
    mockStorage.getFilm.mockResolvedValue(null)
    const res = await request(app).get('/api/films/not-exist')
    expect(res.status).toBe(404)
  })

  it('PATCH /api/films/:id updates film', async () => {
    mockStorage.updateFilm.mockResolvedValue({ id: 'f1', title: 'Updated' })
    const res = await request(app).patch('/api/films/f1').send({ title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('title', 'Updated')
  })

  it('POST /api/bookings returns 400 if seat_ids missing', async () => {
    const res = await request(app).post('/api/bookings').send({ user_id: 'u1' })
    expect(res.status).toBe(400)
  })

  it('POST /api/bookings returns booking when provided', async () => {
    mockStorage.createBookingTransaction.mockResolvedValue({ id: 'b1' })
    const res = await request(app).post('/api/bookings').send({ seat_ids: ['s1-A1'], user_id: 'u1', showtime_id: 'st1' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', 'b1')
  })

  it('GET /api/seat-statuses requires showtime_id', async () => {
    const res = await request(app).get('/api/seat-statuses')
    expect(res.status).toBe(400)
  })

  it('GET /api/studios returns list', async () => {
    mockStorage.getStudios.mockResolvedValue([{ id: 's1' }])
    const res = await request(app).get('/api/studios')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('GET /api/admin/stats and /api/admin/bookings', async () => {
    mockStorage.getStats.mockResolvedValue({ totalFilms: 0, activeShowtimes: 0, pendingBookings: 0 })
    mockStorage.getAllBookings.mockResolvedValue([])

    const s = await request(app).get('/api/admin/stats')
    expect(s.status).toBe(200)

    const b = await request(app).get('/api/admin/bookings')
    expect(b.status).toBe(200)
  })

  it('PATCH /api/bookings/:id updates status', async () => {
    mockStorage.updateBookingStatus.mockResolvedValue({ id: 'b1', status: 'Confirmed' })
    const res = await request(app).patch('/api/bookings/b1').send({ status: 'Confirmed' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'Confirmed')
  })

  it('POST /api/seats/batch returns seats', async () => {
    mockStorage.getSeatsByIds.mockResolvedValue([{ id: 's1-A1' }])
    const res = await request(app).post('/api/seats/batch').send({ ids: ['s1-A1'] })
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('GET /api/bookings requires user_id', async () => {
    const res = await request(app).get('/api/bookings')
    expect(res.status).toBe(400)
  })

  it('GET /api/bookings with user_id returns bookings', async () => {
    mockStorage.getUserBookings.mockResolvedValue([{ id: 'b1' }])
    const res = await request(app).get('/api/bookings').query({ user_id: 'u1' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('GET /api/showtimes can filter by film_id', async () => {
    mockStorage.getShowtimes.mockResolvedValue([{ id: 'st1', film_id: 'f1' }, { id: 'st2', film_id: 'f2' }])
    const res = await request(app).get('/api/showtimes').query({ film_id: 'f1' })
    expect(res.status).toBe(200)
    expect(res.body.every((s: any) => s.film_id === 'f1')).toBe(true)
  })

  it('GET /api/films returns list', async () => {
    mockStorage.getFilms.mockResolvedValue([{ id: 'f1' }])
    const res = await request(app).get('/api/films')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('POST /api/films creates film', async () => {
    mockStorage.createFilm.mockResolvedValue({ id: 'f2', title: 'X' })
    const res = await request(app).post('/api/films').send({ title: 'X' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', 'f2')
  })

  it('DELETE /api/films/:id returns success', async () => {
    mockStorage.deleteFilm.mockResolvedValue(undefined)
    const res = await request(app).delete('/api/films/f1')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
  })

  it('GET /api/showtimes/:id returns 404 and 200', async () => {
    mockStorage.getShowtime.mockResolvedValue(null)
    let res = await request(app).get('/api/showtimes/not')
    expect(res.status).toBe(404)

    mockStorage.getShowtime.mockResolvedValue({ id: 'st1' })
    res = await request(app).get('/api/showtimes/st1')
    expect(res.status).toBe(200)
  })

  it('POST /api/showtimes and DELETE showtime', async () => {
    mockStorage.createShowtime.mockResolvedValue({ id: 'st-new' })
    const p = await request(app).post('/api/showtimes').send({ film_id: 'f1', studio_id: 's1' })
    expect(p.status).toBe(200)

    mockStorage.deleteShowtime.mockResolvedValue(undefined)
    const d = await request(app).delete('/api/showtimes/st-new')
    expect(d.status).toBe(200)
  })

  it('GET /api/seat-statuses with showtime_id returns statuses', async () => {
    mockStorage.getSeatStatuses.mockResolvedValue([{ seat_id: 's1-A1' }])
    const res = await request(app).get('/api/seat-statuses').query({ showtime_id: 'st1' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('POST /api/bookings returns 500 when storage throws', async () => {
    mockStorage.createBookingTransaction.mockRejectedValue(new Error('boom'))
    const res = await request(app).post('/api/bookings').send({ seat_ids: ['s1-A1'], user_id: 'u1', showtime_id: 'st1' })
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('error', 'boom')
  })
})
