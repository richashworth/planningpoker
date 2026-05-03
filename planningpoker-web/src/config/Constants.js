export const API_ROOT_URL = ''

// Username constraint shared by NameInput's HTML pattern attribute and the
// JS-side guard in CreateGame/JoinGame. 2-20 chars: letters, digits, spaces,
// hyphens, underscores. The anchored RegExp is derived from the same source.
export const USERNAME_MIN = 2
export const USERNAME_MAX = 20
export const USERNAME_PATTERN = `[a-zA-Z0-9 _-]{${USERNAME_MIN},${USERNAME_MAX}}`
export const USERNAME_REGEX = new RegExp(`^${USERNAME_PATTERN}$`)
export const USERNAME_HELPER = `${USERNAME_MIN}-${USERNAME_MAX} characters: letters, numbers, spaces, hyphens, underscores`

export const SCHEME_VALUES = {
  fibonacci: ['1', '2', '3', '5', '8', '13'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  simple: ['1', '2', '3', '4', '5'],
  time: ['1h', '½d', '1d', '2d', '1w', '2w', '1mo', '3mo', '6mo+'],
}

export const SCHEME_METADATA = {
  fibonacci: { key: 'fibonacci', name: 'Fibonacci' },
  tshirt: { key: 'tshirt', name: 'T-shirt' },
  simple: { key: 'simple', name: 'Simple' },
  time: { key: 'time', name: 'Time' },
  custom: { key: 'custom', name: 'Custom' },
}

export const SCHEME_ORDER = ['fibonacci', 'tshirt', 'simple', 'time', 'custom']
