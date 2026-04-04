import { getConfig } from '../config';

export interface PriceResult {
  supplier: string;
  title: string;
  price: number;
  originalPrice?: number;
  url: string;
  imageUrl?: string;
  shipping?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
}

interface SerpShoppingResult {
  title?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  old_price?: string;
  extracted_old_price?: number;
  link?: string;
  thumbnail?: string;
  delivery?: string;
  rating?: number;
  reviews?: number;
}

/**
 * Search Google Shopping for dental supply prices via SerpAPI.
 * Falls back to mock results if no API key is configured.
 */
export async function searchPrices(query: string): Promise<PriceResult[]> {
  const config = getConfig();
  const apiKey = config.priceSearch?.serpApiKey || process.env.SERPAPI_KEY || '';

  if (!apiKey) {
    return generateMockResults(query);
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: `dental ${query}`,
      api_key: apiKey,
      num: '15',
      gl: 'us',
      hl: 'en',
    });

    const response = await fetch(`https://serpapi.com/search.json?${params}`);

    if (!response.ok) {
      console.error(`[priceSearch] SerpAPI returned ${response.status}`);
      return generateMockResults(query);
    }

    const data = await response.json() as { shopping_results?: SerpShoppingResult[] };
    const results = data.shopping_results || [];

    return results
      .filter((r) => r.extracted_price && r.extracted_price > 0)
      .map((r) => ({
        supplier: r.source || 'Unknown',
        title: r.title || query,
        price: r.extracted_price!,
        originalPrice: r.extracted_old_price || undefined,
        url: r.link || '',
        imageUrl: r.thumbnail || undefined,
        shipping: r.delivery || undefined,
        rating: r.rating || undefined,
        reviews: r.reviews || undefined,
        inStock: true,
      }))
      .sort((a, b) => a.price - b.price);
  } catch (err) {
    console.error('[priceSearch] Failed to fetch from SerpAPI:', err);
    return generateMockResults(query);
  }
}

/**
 * Generate realistic mock price results for demo mode.
 */
function generateMockResults(query: string): PriceResult[] {
  const suppliers = [
    { name: 'Henry Schein', domain: 'henryschein.com' },
    { name: 'Patterson Dental', domain: 'pattersondental.com' },
    { name: 'Amazon Business', domain: 'amazon.com' },
    { name: 'Net32 Dental', domain: 'net32.com' },
    { name: 'Darby Dental', domain: 'dfrybydental.com' },
    { name: 'Benco Dental', domain: 'benco.com' },
    { name: 'Dental City', domain: 'dentalcity.com' },
    { name: 'Safco Dental Supply', domain: 'safcodental.com' },
  ];

  // Derive a seed from query string for consistent-ish mock prices
  const seed = query.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const basePrice = 5 + (seed % 200);

  return suppliers
    .map((sup, i) => {
      const variance = 0.7 + ((seed * (i + 1)) % 60) / 100;
      const price = Math.round(basePrice * variance * 100) / 100;
      const hasDiscount = i % 3 === 0;

      return {
        supplier: sup.name,
        title: `${query} — ${sup.name}`,
        price,
        originalPrice: hasDiscount ? Math.round(price * 1.2 * 100) / 100 : undefined,
        url: `https://www.${sup.domain}/search?q=${encodeURIComponent(query)}`,
        shipping: i % 2 === 0 ? 'Free shipping' : `$${(4.99 + i).toFixed(2)} shipping`,
        rating: 3.5 + ((seed + i) % 15) / 10,
        reviews: 10 + ((seed * i) % 500),
        inStock: i !== 5, // one supplier out of stock for realism
      };
    })
    .sort((a, b) => a.price - b.price);
}
