import type { Metadata } from 'next';
import { PublicNewsFeature } from '@/modules/public-news/features/PublicNewsFeature';
export const metadata: Metadata = { title: 'Actualités — Indesy Mialy', description: 'Communiqués publics de la scène des sports de combat malagasy.', alternates: { canonical: '/actualites' }, openGraph: { title: 'Actualités Indesy Mialy', description: 'Communiqués publics de la scène des sports de combat malagasy.', type: 'website' } };
export default function Page() { return <PublicNewsFeature />; }
