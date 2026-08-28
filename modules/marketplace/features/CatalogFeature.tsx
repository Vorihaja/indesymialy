'use client';

import { Button, Loader, PublicEmpty, PublicFilterBar, PublicHero, PublicPage, SearchBar, Select } from '@/components/ui';
import { useMarketplaceStore } from '@/modules/marketplace-core';
import { useCatalog } from '../hooks/useCatalog';
import { ProductCard } from '../components/ProductCard';

export function CatalogFeature({ category, search }: { category?: string; search?: string }) {
  const catalog = useCatalog({ category: category ?? '', search: search ?? '' });
  const store = useMarketplaceStore();

  if (catalog.loading) return <div className='public-container grid min-h-80 place-items-center'><Loader label='Chargement du catalogue' /></div>;
  if (catalog.error) return <div className='public-container'><PublicEmpty title='Catalogue indisponible' description={catalog.error} /></div>;

  return (
    <PublicPage>
      <PublicHero eyebrow='Indesy Marketplace' title='Équipez votre ambition' description='Matériel, équipements et services sélectionnés pour la pratique des sports de combat.' compact />
      <main className='public-container'>
        <PublicFilterBar className='mb-10 md:grid-cols-6'>
          <SearchBar value={catalog.filters.search} onChange={(event) => catalog.setFilters({ ...catalog.filters, search: event.target.value, page: 1 })} placeholder='Rechercher un produit' aria-label='Rechercher dans le catalogue' className='md:col-span-2' />
          <Select value={catalog.filters.type} onChange={(event) => catalog.setFilters({ ...catalog.filters, type: event.target.value as typeof catalog.filters.type, page: 1 })} aria-label='Type de transaction'>
            <option value='all'>Tous types</option><option value='sale'>Vente</option><option value='rental'>Location</option><option value='used'>Occasion</option>
          </Select>
          <input value={catalog.filters.category} onChange={(event) => catalog.setFilters({ ...catalog.filters, category: event.target.value, page: 1 })} placeholder='Catégorie' aria-label='Filtrer par catégorie' className='ds-input' />
          <input value={catalog.filters.location} onChange={(event) => catalog.setFilters({ ...catalog.filters, location: event.target.value, page: 1 })} placeholder='Localisation' aria-label='Filtrer par localisation' className='ds-input' />
          <Select value={catalog.filters.sort} onChange={(event) => catalog.setFilters({ ...catalog.filters, sort: event.target.value as typeof catalog.filters.sort })} aria-label='Trier les produits'>
            <option value='recent'>Récents</option><option value='popular'>Populaires</option><option value='price-asc'>Prix croissant</option><option value='price-desc'>Prix décroissant</option>
          </Select>
        </PublicFilterBar>
        {catalog.result.items.length ? (
          <div className='public-grid'>
            {catalog.result.items.map((product) => (
              <ProductCard key={product.id} product={product} favorite={catalog.favorites.includes(product.id)} onFavorite={() => void catalog.toggleFavorite(product.id)} onAdd={() => void store.run(() => store.useCase.addToCart(product.id, 1, product.type === 'rental' ? 'rental' : 'sale'))} />
            ))}
          </div>
        ) : <PublicEmpty title='Aucun produit publié' description='Modifiez vos filtres pour élargir la sélection.' />}
        <nav className='mt-10 flex items-center justify-center gap-3' aria-label='Pagination du catalogue'>
          <Button variant='outline' size='sm' disabled={catalog.filters.page <= 1} onClick={() => catalog.setFilters({ ...catalog.filters, page: catalog.filters.page - 1 })}>Précédent</Button>
          <span className='ds-caption' aria-current='page'>{catalog.result.page}/{catalog.result.pageCount}</span>
          <Button variant='outline' size='sm' disabled={catalog.filters.page >= catalog.result.pageCount} onClick={() => catalog.setFilters({ ...catalog.filters, page: catalog.filters.page + 1 })}>Suivant</Button>
        </nav>
      </main>
    </PublicPage>
  );
}
