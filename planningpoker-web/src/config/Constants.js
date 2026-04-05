export const API_ROOT_URL = '';
// export const API_ROOT_URL = 'http://localhost:9000';

export const SCHEME_VALUES = {
  fibonacci: ['1', '2', '3', '5', '8', '13'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  simple: ['1', '2', '3', '4', '5'],
  time: ['1h', '½d', '1d', '2d', '1w', '2w', '1mo', '3mo', '6mo+'],
}

export const SCHEME_METADATA = {
  fibonacci: {
    key: 'fibonacci',
    icon: '\uD83D\uDD22',
    name: 'Fibonacci',
    description: 'Classic exponential scale for relative sizing',
  },
  tshirt: {
    key: 'tshirt',
    icon: '\uD83D\uDC55',
    name: 'T-shirt',
    description: 'Simple size labels from XS to XXL',
  },
  simple: {
    key: 'simple',
    icon: '\u2B50',
    name: 'Simple',
    description: 'Linear 1-5 scale for quick estimates',
  },
  time: {
    key: 'time',
    icon: '\u23F1\uFE0F',
    name: 'Time',
    description: 'Duration-based estimates from hours to months',
  },
  custom: {
    key: 'custom',
    icon: '\u270F\uFE0F',
    name: 'Custom',
    description: 'Define your own estimation values',
  },
}

export const SCHEME_ORDER = ['fibonacci', 'tshirt', 'simple', 'time', 'custom']
