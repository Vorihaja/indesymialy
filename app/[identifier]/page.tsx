import type { Metadata } from 'next';
import { DiscoveryFeature } from '@/modules/discovery-core/features/DiscoveryFeature';
type Props = { params: Promise<{ identifier: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { identifier } = await params; const clean = identifier.replace(/^@+/, ''); return { title: `${clean} — Indesy Mialy`, description: `Profil public ${clean} sur Indesy Mialy.`, alternates: { canonical: `/${clean}` } }; }
export default async function Page({ params }: Props) { const { identifier } = await params; return <DiscoveryFeature view='profile' id={identifier.replace(/^@+/, '')} />; }
