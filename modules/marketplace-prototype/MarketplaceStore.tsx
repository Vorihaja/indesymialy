'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initialMarketOrders, marketProducts } from './mocks';
import { readPublishedProducts } from './published-products';
import type { MarketCartLine, MarketOrder, MarketProduct } from './types';

type Store = {
  products: MarketProduct[]; cart: MarketCartLine[]; favorites: string[]; orders: MarketOrder[]; toast: string;
  addToCart: (productId: string, variant?: string, mode?: 'sale' | 'rental', startDate?: string, endDate?: string) => void;
  updateQuantity: (id: string, quantity: number) => void; removeFromCart: (id: string) => void; clearCart: () => void;
  toggleFavorite: (id: string) => void; checkout: (delivery: string, payment: string) => MarketOrder | null; notify: (message: string) => void;
};

const Context = createContext<Store | null>(null);

export function MarketplacePrototypeProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<MarketProduct[]>(marketProducts);
  const [cart, setCart] = useState<MarketCartLine[]>([{ id: 'cart-demo', productId: 'rashguard-boeny', quantity: 1, variant: 'M · Bleu', mode: 'sale' }]);
  const [favorites, setFavorites] = useState(['gants-mfn-pro', 'cage-location']);
  const [orders, setOrders] = useState(initialMarketOrders);
  const [toast, setToast] = useState('');
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  useEffect(() => { const refresh = () => setProducts([...readPublishedProducts(), ...marketProducts]); window.addEventListener('storage', refresh); window.addEventListener('indesy-marketplace-updated', refresh); return () => { window.removeEventListener('storage', refresh); window.removeEventListener('indesy-marketplace-updated', refresh); }; }, []);
  const addToCart: Store['addToCart'] = (productId, variant, mode = 'sale', startDate, endDate) => { const product = products.find((item) => item.id === productId); if (!product || product.stock <= 0) return; setCart((current) => { const existing = current.find((item) => item.productId === productId && item.variant === (variant ?? product.variants[0]) && item.mode === mode); return existing ? current.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { id: `cart-${Date.now()}`, productId, quantity: 1, variant: variant ?? product.variants[0] ?? 'Standard', mode, startDate, endDate }]; }); notify(`${product.title} ajouté au panier.`); };
  const checkout: Store['checkout'] = (delivery, payment) => { if (!cart.length) return null; const subtotal = cart.reduce((sum, line) => { const product = products.find((item) => item.id === line.productId)!; const days = line.mode === 'rental' && line.startDate && line.endDate ? Math.max(1, Math.ceil((new Date(line.endDate).getTime() - new Date(line.startDate).getTime()) / 86400000) + 1) : 1; return sum + (line.mode === 'rental' ? product.rentalPrice ?? 0 : product.price) * line.quantity * days; }, 0); const deliveryFee = delivery === 'Livraison express' ? 35000 : delivery === 'Livraison standard' && subtotal < 500000 ? 18000 : 0; const total = subtotal + deliveryFee + Math.round(subtotal * .015); const order: MarketOrder = { id: `IM-${Math.floor(8500 + Math.random() * 400)}`, date: '12 août 2026', total, status: 'Confirmée', lines: cart, delivery, payment }; setOrders((current) => [order, ...current]); setCart([]); notify(`Commande ${order.id} confirmée.`); return order; };
  const value = useMemo<Store>(() => ({ products, cart, favorites, orders, toast, addToCart, updateQuantity: (id, quantity) => setCart((current) => quantity <= 0 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item)), removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)), clearCart: () => setCart([]), toggleFavorite: (id) => { setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); notify(favorites.includes(id) ? 'Retiré des favoris.' : 'Ajouté aux favoris.'); }, checkout, notify }), [products, cart, favorites, orders, toast]);
  return <Context.Provider value={value}>{children}{toast && <div className='fixed bottom-4 right-4 z-[230] border border-emerald-700 bg-emerald-950 px-4 py-3 text-[10px] text-emerald-100 shadow-xl'>{toast}</div>}</Context.Provider>;
}

export function useMarketplacePrototype() { const value = useContext(Context); if (!value) throw new Error('MarketplacePrototypeProvider manquant'); return value; }
