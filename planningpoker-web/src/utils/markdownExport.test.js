// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMarkdownTable, copyToClipboard } from './markdownExport'

const round = (overrides = {}) => ({
  label: 'Login page',
  consensus: '5',
  timestamp: '2026-04-08T10:00:00.000Z',
  votes: [
    { userName: 'Alice', estimateValue: '5' },
    { userName: 'Bob', estimateValue: '5' },
  ],
  ...overrides,
})

describe('generateMarkdownTable', () => {
  it('renders the header and separator rows', () => {
    const md = generateMarkdownTable([])
    expect(md.split('\n')).toEqual(['| Label | Estimate |', '| --- | --- |'])
  })

  it('renders one body row per round with consensus values', () => {
    const md = generateMarkdownTable([
      round({ label: 'Login', consensus: '5' }),
      round({ label: 'Dashboard', consensus: '8' }),
    ])
    const lines = md.split('\n')
    expect(lines[2]).toBe('| Login | 5 |')
    expect(lines[3]).toBe('| Dashboard | 8 |')
  })

  it('escapes pipe characters in labels so they do not break the table', () => {
    const md = generateMarkdownTable([round({ label: 'Login | Auth', consensus: '5' })])
    expect(md).toContain('| Login \\| Auth | 5 |')
  })

  it('escapes backslashes in labels', () => {
    const md = generateMarkdownTable([round({ label: 'a\\b', consensus: '5' })])
    expect(md).toContain('| a\\\\b | 5 |')
  })

  it('collapses newlines in labels to spaces to keep the row on one line', () => {
    const md = generateMarkdownTable([round({ label: 'line1\nline2', consensus: '5' })])
    expect(md).toContain('| line1 line2 | 5 |')
  })

  it('renders "_No label_" for rounds without a label', () => {
    const md = generateMarkdownTable([round({ label: '' })])
    expect(md).toContain('| _No label_ |')
  })

  it('falls back to vote breakdown when consensus is empty', () => {
    const md = generateMarkdownTable([
      round({
        label: 'Split',
        consensus: '',
        votes: [
          { userName: 'Alice', estimateValue: '3' },
          { userName: 'Bob', estimateValue: '8' },
        ],
      }),
    ])
    expect(md).toContain('| Split | Alice: 3, Bob: 8 |')
  })

  it('falls back to vote breakdown when consensus is null', () => {
    const md = generateMarkdownTable([
      round({
        label: 'Split',
        consensus: null,
        votes: [{ userName: 'Carol', estimateValue: '13' }],
      }),
    ])
    expect(md).toContain('| Split | Carol: 13 |')
  })

  it('renders an em-dash when there is no consensus and no votes', () => {
    const md = generateMarkdownTable([round({ label: 'Empty', consensus: null, votes: [] })])
    expect(md).toContain('| Empty | — |')
  })

  it('escapes pipes inside vote breakdown values', () => {
    const md = generateMarkdownTable([
      round({
        label: 'Split',
        consensus: null,
        votes: [{ userName: 'A|B', estimateValue: '5|8' }],
      }),
    ])
    expect(md).toContain('A\\|B: 5\\|8')
  })
})

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    })
    await copyToClipboard('hello')
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('falls back to a hidden textarea + execCommand when clipboard API is missing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    const exec = vi.fn(() => true)
    document.execCommand = exec
    await copyToClipboard('fallback')
    expect(exec).toHaveBeenCalledWith('copy')
  })
})
