import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './supabase'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('supabase api helper', () => {
  it('api.get returns json when ok', async () => {
    const fake = { ok: true, json: async () => ({ a: 1 }) } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fake))
    const res = await api.get('/x')
    expect(res).toEqual({ a: 1 })
  })

  it('api.get throws when not ok', async () => {
    const fake = { ok: false } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fake))
    await expect(api.get('/x')).rejects.toThrow('API Error')
  })

  it('api.post throws API error message when provided', async () => {
    const fake = { ok: false, json: async () => ({ error: 'bad' }) } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fake))
    await expect(api.post('/x', { a: 1 })).rejects.toThrow('bad')
  })

  it('api.post returns json when ok', async () => {
    const fake = { ok: true, json: async () => ({ ok: true }) } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fake))
    const res = await api.post('/x', { b: 2 })
    expect(res).toEqual({ ok: true })
  })

  it('api.post throws default API Error when json has no error field', async () => {
    const fake = { ok: false, json: async () => ({}) } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fake))
    await expect(api.post('/x', { a: 1 })).rejects.toThrow('API Error')
  })

  it('api.delete and api.patch behavior', async () => {
    const fakeDel = { ok: true, json: async () => ({ d: 1 }) } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeDel))
    const d = await api.delete('/x')
    expect(d).toEqual({ d: 1 })

    const fakePatch = { ok: true, json: async () => ({ p: 1 }) } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakePatch))
    const p = await api.patch('/x', { hello: 'y' })
    expect(p).toEqual({ p: 1 })
  })
})
