import { describe, it, expect } from 'vitest'
import {
  USERNAME_PATTERN,
  USERNAME_REGEX,
  USERNAME_MIN,
  USERNAME_MAX,
} from './Constants'

describe('USERNAME_PATTERN', () => {
  it('is a valid regex under the `v` flag (HTML5 pattern attribute)', () => {
    // Browsers apply the `v` flag to the HTML5 `pattern` attribute. Under `v`,
    // an unescaped `-` between two operands inside a character class is a
    // syntax error, so this anchors that the pattern stays `v`-compatible.
    expect(() => new RegExp(`^${USERNAME_PATTERN}$`, 'v')).not.toThrow()
  })

  it('accepts letters, digits, spaces, hyphens, and underscores', () => {
    expect(USERNAME_REGEX.test('Alice')).toBe(true)
    expect(USERNAME_REGEX.test('Bob_42')).toBe(true)
    expect(USERNAME_REGEX.test('Jean-Luc')).toBe(true)
    expect(USERNAME_REGEX.test('Two Words')).toBe(true)
  })

  it('rejects names shorter than the minimum', () => {
    expect(USERNAME_REGEX.test('a'.repeat(USERNAME_MIN - 1))).toBe(false)
  })

  it('rejects names longer than the maximum', () => {
    expect(USERNAME_REGEX.test('a'.repeat(USERNAME_MAX + 1))).toBe(false)
  })

  it('rejects disallowed characters', () => {
    expect(USERNAME_REGEX.test('bad!')).toBe(false)
    expect(USERNAME_REGEX.test('drop;table')).toBe(false)
    expect(USERNAME_REGEX.test('emoji😀')).toBe(false)
  })
})
