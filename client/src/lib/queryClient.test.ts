import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest, getQueryFn } from './queryClient'

describe('queryClient helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('apiRequest throws when response not ok', async () => {
    const fakeRes = {
      ok: false,
      status: 400,
      statusText: 'Bad',
      text: async () => 'bad body',
    } as unknown as Response

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes))

    await expect(apiRequest('GET', '/x')).rejects.toThrow('400: bad body')
  })

  it('getQueryFn returns null on 401 when configured', async () => {
    const fakeRes = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ foo: 'bar' }),
      text: async () => 'unauth',
    } as unknown as Response

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes))

    const fn = getQueryFn({ on401: 'returnNull' })
    const result = await fn({ queryKey: ['some', 'url'] } as any)
    expect(result).toBeNull()
  })

  it('apiRequest returns response when ok', async () => {
    const fakeRes = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => 'ok',
    } as unknown as Response

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes))

    const res = await apiRequest('GET', '/ok')
    expect(res).toBe(fakeRes)
  })

  it('getQueryFn returns json when ok', async () => {
    const fakeRes = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ hello: 'world' }),
      text: async () => 'ok',
    } as unknown as Response

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes))

    const fn = getQueryFn({ on401: 'throw' })
    const result = await fn({ queryKey: ['some', 'url'] } as any)
    expect(result).toEqual({ hello: 'world' })
  })
})
