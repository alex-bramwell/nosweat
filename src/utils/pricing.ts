interface LocalizedPrice {
  symbol: string;
  amount: string;
  formatted: string;
  period: string;
  stripePriceId: string;
  currency: string;
}

const PRICES: Record<string, LocalizedPrice> = {
  GBP: {
    symbol: '£',
    amount: '79.99',
    formatted: '£79.99',
    period: '/mo',
    stripePriceId: 'price_1T2V75GeojrLMOPqwGsxf2yg',
    currency: 'gbp',
  },
  USD: {
    symbol: '$',
    amount: '99',
    formatted: '$99',
    period: '/mo',
    stripePriceId: 'price_1T2VEAGeojrLMOPqtCNezQJ5',
    currency: 'usd',
  },
  EUR: {
    symbol: '€',
    amount: '94.99',
    formatted: '€94.99',
    period: '/mo',
    stripePriceId: 'price_1T2VEAGeojrLMOPqpSXIsqpR',
    currency: 'eur',
  },
  ZAR: {
    symbol: 'R',
    amount: '1,899',
    formatted: 'R1,899',
    period: '/mo',
    stripePriceId: 'price_1T2VEAGeojrLMOPqCVJI9YTo',
    currency: 'zar',
  },
};

export function getLocalizedPrice(): LocalizedPrice {
  const locale =
    typeof navigator !== 'undefined' ? navigator.language : 'en-GB';
  const timezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'Europe/London';

  // US
  if (locale.startsWith('en-US') || timezone.startsWith('America/')) {
    return PRICES.USD;
  }

  // South Africa
  if (locale.includes('ZA') || timezone.startsWith('Africa/Johannesburg')) {
    return PRICES.ZAR;
  }

  // UK
  const isUK = locale.includes('GB') || timezone === 'Europe/London';
  if (isUK) {
    return PRICES.GBP;
  }

  // Europe (non-UK)
  if (timezone.startsWith('Europe/')) {
    return PRICES.EUR;
  }

  // Default GBP
  return PRICES.GBP;
}
