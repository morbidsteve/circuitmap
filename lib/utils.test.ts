import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'hidden')
    expect(result).toBe('base conditional')
  })

  it('merges Tailwind classes correctly', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('handles undefined and null values', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles empty strings', () => {
    const result = cn('foo', '', 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles array of classes', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('handles object syntax', () => {
    const result = cn({ foo: true, bar: false, baz: true })
    expect(result).toBe('foo baz')
  })

  it('merges conflicting Tailwind utilities', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('preserves non-conflicting Tailwind utilities', () => {
    const result = cn('bg-red-500', 'text-blue-500')
    expect(result).toBe('bg-red-500 text-blue-500')
  })

  it('handles responsive prefixes correctly', () => {
    const result = cn('sm:p-4', 'sm:p-2')
    expect(result).toBe('sm:p-2')
  })
})
