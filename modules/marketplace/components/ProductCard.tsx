'use client';

import Link from 'next/link';
import { Badge, Button } from '@/components/ui';
import type { MarketplaceProduct } from '../types';

export function ProductCard({ product, favorite, onFavorite, onAdd }: { product: MarketplaceProduct; favorite: boolean; onFavorite: () => void; onAdd: () => void }) {
  const price = product.type === 'rental'
    ? (product.rentalPricePerDay ?? 0).toLocaleString('fr-FR') + ' Ar/jour'
    : (product.salePrice ?? 0).toLocaleString('fr-FR') + ' Ar';

  return (
    <article className='public-card group'>
      <div className='public-media-tile grid place-items-center text-[var(--ds-muted)]'>
        {product.images[0]
          // Product media can come from external marketplace providers.
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={product.images[0]} alt={product.title} className='h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]' />
          : <span>Aucune image</span>}
      </div>
      <div className='public-card-body'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <div className='mb-3 flex flex-wrap gap-2'><Badge tone='info'>{product.type}</Badge><Badge>{product.condition}</Badge></div>
            <Link href={'/marketplace/products/' + product.id} className='public-card-title block'>{product.title}</Link>
          </div>
          <button onClick={onFavorite} aria-label={(favorite ? 'Retirer ' : 'Ajouter ') + product.title + ' des favoris'} aria-pressed={favorite} className='grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-[var(--ds-hover)]'>{favorite ? '♥' : '♡'}</button>
        </div>
        <p className='public-card-copy line-clamp-2'>{product.description}</p>
        <div className='mt-6 flex items-center justify-between gap-3 border-t border-[var(--ds-border)] pt-4'>
          <strong>{price}</strong>
          <Button onClick={onAdd} disabled={product.stock <= 0} size='sm'>{product.stock > 0 ? 'Ajouter' : 'Épuisé'}</Button>
        </div>
      </div>
    </article>
  );
}
