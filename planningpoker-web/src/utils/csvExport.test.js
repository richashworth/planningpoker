import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCsv, downloadCsv } from './csvExport'

describe('generateCsv', () => {
  const rounds = [
    {
      label: 'Login page',
      consensus: '5',
      timestamp: '2026-04-08T10:00:00.000Z',
      mode: '5',
      min: '3',
      max: '8',
      variance: '2.00',
      votes: [
        { userName: 'Alice', estimateValue: '5' },
        { userName: 'Bob', estimateValue: '3' },
      ],
    },
    {
      label: 'Dashboard',
      consensus: '8',
      timestamp: '2026-04-08T10:05:00.000Z',
      mode: '8',
      min: '5',
      max: '13',
      variance: '10.67',
      votes: [
        { userName: 'Alice', estimateValue: '8' },
        { userName: 'Bob', estimateValue: '8' },
      ],
    },
  ]

  it('produces correct header row', () => {
    const playerNames = ['Alice', 'Bob']
    const csv = generateCsv(rounds, playerNames)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Label,Consensus,Timestamp,Mode,Min,Max,Variance,Alice,Bob')
  })

  it('produces correct data rows', () => {
    const playerNames = ['Alice', 'Bob']
    const csv = generateCsv(rounds, playerNames)
    const lines = csv.split('\n')
    expect(lines[1]).toBe('Login page,5,2026-04-08T10:00:00.000Z,5,3,8,2.00,5,3')
    expect(lines[2]).toBe('Dashboard,8,2026-04-08T10:05:00.000Z,8,5,13,10.67,8,8')
  })

  it('uses empty string for missing numeric stats', () => {
    const nonNumericRound = [
      {
        label: 'T-shirt item',
        consensus: 'M',
        timestamp: '2026-04-08T10:00:00.000Z',
        mode: 'M',
        min: null,
        max: null,
        variance: null,
        votes: [{ userName: 'Alice', estimateValue: 'M' }],
      },
    ]
    const csv = generateCsv(nonNumericRound, ['Alice'])
    const lines = csv.split('\n')
    expect(lines[1]).toBe('T-shirt item,M,2026-04-08T10:00:00.000Z,M,,,,' + 'M')
  })

  it('uses empty string for missing player vote', () => {
    const roundWithMissingPlayer = [
      {
        label: 'Item 1',
        consensus: '5',
        timestamp: '2026-04-08T10:00:00.000Z',
        mode: '5',
        min: '5',
        max: '5',
        variance: '0.00',
        votes: [{ userName: 'Alice', estimateValue: '5' }],
      },
    ]
    const csv = generateCsv(roundWithMissingPlayer, ['Alice', 'Bob'])
    const lines = csv.split('\n')
    expect(lines[1]).toBe('Item 1,5,2026-04-08T10:00:00.000Z,5,5,5,0.00,5,')
  })

  it('escapes values with commas in double quotes', () => {
    const roundWithComma = [
      {
        label: 'Fix login, signup flow',
        consensus: '5',
        timestamp: '2026-04-08T10:00:00.000Z',
        mode: '5',
        min: '5',
        max: '5',
        variance: '0.00',
        votes: [{ userName: 'Alice', estimateValue: '5' }],
      },
    ]
    const csv = generateCsv(roundWithComma, ['Alice'])
    const lines = csv.split('\n')
    expect(lines[1].startsWith('"Fix login, signup flow"')).toBe(true)
  })

  it('escapes double quotes in values', () => {
    const roundWithQuote = [
      {
        label: 'He said "hello"',
        consensus: '5',
        timestamp: '2026-04-08T10:00:00.000Z',
        mode: '5',
        min: '5',
        max: '5',
        variance: '0.00',
        votes: [{ userName: 'Alice', estimateValue: '5' }],
      },
    ]
    const csv = generateCsv(roundWithQuote, ['Alice'])
    const lines = csv.split('\n')
    expect(lines[1].startsWith('"He said ""hello"""')).toBe(true)
  })

  it('prefixes formula injection characters with single quote', () => {
    const formulaLabel = '=SUM(A1)'
    const round = [
      {
        label: formulaLabel,
        consensus: '5',
        timestamp: '2026-04-08T10:00:00.000Z',
        mode: '5',
        min: '5',
        max: '5',
        variance: '0.00',
        votes: [{ userName: 'Alice', estimateValue: '5' }],
      },
    ]
    const csv = generateCsv(round, ['Alice'])
    const lines = csv.split('\n')
    // Should be wrapped and start with ' prefix
    expect(lines[1].startsWith("\"'=SUM(A1)\"")||lines[1].startsWith("'=SUM(A1)")).toBe(true)
  })
})

describe('downloadCsv', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock document.createElement and document.body
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      style: {},
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
  })

  it('creates a Blob with text/csv type', () => {
    const BlobSpy = vi.spyOn(global, 'Blob').mockImplementation(function (content, options) {
      this.content = content
      this.options = options
    })
    downloadCsv('label,value\ntest,1')
    expect(BlobSpy).toHaveBeenCalledWith(['label,value\ntest,1'], { type: 'text/csv;charset=utf-8;' })
    BlobSpy.mockRestore()
  })

  it('uses default filename when none provided', () => {
    const mockLink = { href: '', download: '', click: vi.fn(), style: {} }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    downloadCsv('test,csv')
    expect(mockLink.download).toBe('planning-poker-export.csv')
  })

  it('uses provided filename', () => {
    const mockLink = { href: '', download: '', click: vi.fn(), style: {} }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    downloadCsv('test,csv', 'my-export.csv')
    expect(mockLink.download).toBe('my-export.csv')
  })
})
