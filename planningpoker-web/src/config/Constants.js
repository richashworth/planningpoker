export const API_ROOT_URL = ''
// export const API_ROOT_URL = 'http://localhost:9000';

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
