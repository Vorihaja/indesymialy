import type { MarketProduct } from './types';

export const MARKETPLACE_PUBLISHED_KEY = 'indesy-mialy.marketplace.published.v1';

export function readPublishedProducts(): MarketProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(MARKETPLACE_PUBLISHED_KEY) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function publishProduct(product: MarketProduct) {
  const products = readPublishedProducts();
  const next = [product, ...products.filter((item) => item.id !== product.id)];
  window.localStorage.setItem(MARKETPLACE_PUBLISHED_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('indesy-marketplace-updated'));
}
