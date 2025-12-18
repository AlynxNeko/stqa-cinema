import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reducer } from './use-toast'

describe('use-toast reducer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ADD_TOAST respects TOAST_LIMIT and places newest first', () => {
    const initialState = {
      toasts: [{ id: '1', open: true, title: 'Old' } as any],
    }

    const action = {
      type: 'ADD_TOAST',
      toast: { id: '2', open: true, title: 'New' } as any,
    } as any

    const next = reducer(initialState as any, action)
    expect(next.toasts).toHaveLength(1)
    expect(next.toasts[0].id).toBe('2')
  })

  it('DISMISS_TOAST sets open:false for given id', () => {
    const initialState = {
      toasts: [
        { id: '1', open: true } as any,
        { id: '2', open: true } as any,
      ],
    }

    const action = { type: 'DISMISS_TOAST', toastId: '2' } as any
    const next = reducer(initialState as any, action)

    expect(next.toasts.find((t: any) => t.id === '2')!.open).toBe(false)
    expect(next.toasts.find((t: any) => t.id === '1')!.open).toBe(true)
  })

  it('DISMISS_TOAST with no id dismisses all', () => {
    const initialState = {
      toasts: [
        { id: '1', open: true } as any,
        { id: '2', open: true } as any,
      ],
    }

    const action = { type: 'DISMISS_TOAST' } as any
    const next = reducer(initialState as any, action)

    expect(next.toasts.every((t: any) => t.open === false)).toBe(true)
  })

  it('UPDATE_TOAST merges properties for matching id', () => {
    const initialState = { toasts: [{ id: '1', open: true, title: 'Old' } as any] }
    const action = { type: 'UPDATE_TOAST', toast: { id: '1', title: 'New' } } as any
    const next = reducer(initialState as any, action)
    expect(next.toasts[0].title).toBe('New')
  })

  it('REMOVE_TOAST without id removes all, with id removes one', () => {
    const initialState = { toasts: [{ id: '1' } as any, { id: '2' } as any] }
    let next = reducer(initialState as any, { type: 'REMOVE_TOAST' } as any)
    expect(next.toasts).toHaveLength(0)

    const state2 = { toasts: [{ id: '1' } as any, { id: '2' } as any] }
    next = reducer(state2 as any, { type: 'REMOVE_TOAST', toastId: '1' } as any)
    expect(next.toasts).toHaveLength(1)
    expect(next.toasts[0].id).toBe('2')
  })
})
