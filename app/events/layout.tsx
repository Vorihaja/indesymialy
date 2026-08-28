import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Événements — Indesy Mialy',
  description: 'Événements, programmes, fight cards, billets et résultats.',
  alternates: { canonical: '/events' },
  openGraph: { title: 'Événements Indesy Mialy', description: 'Le calendrier public des sports de combat.', type: 'website' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className='public-page events-experience'>{children}</div>;
}
