import type { Metadata } from 'next';
import { DiscoveryFeature } from '@/modules/discovery-core/features/DiscoveryFeature';
type Props = { params: Promise<{ discipline: string; category: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const value = await params; const discipline = value.discipline.replaceAll('-', ' '); const category = value.category.replaceAll('-', ' '); return { title: `Classement ${discipline} ${category} — Indesy Mialy`, description: `Classement public ${discipline}, catégorie ${category}.`, alternates: { canonical: `/rankings/${value.discipline}/${value.category}` } }; }
export default async function Page({ params }: Props) { const value = await params; return <DiscoveryFeature view='rankings' id={value.discipline} categoryId={value.category} />; }
