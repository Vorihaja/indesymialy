'use client';

import { useEffect, useState } from 'react';
import MessageWorkspace from '@/components/messaging/MessageWorkspace';
import { Badge, PublicHero, PublicPage } from '@/components/ui';

export default function DiscussionPage() {
  const [latency, setLatency] = useState(24);
  const [online, setOnline] = useState(127);

  useEffect(() => {
    const id = setInterval(() => {
      setLatency((value) => Math.max(12, Math.min(89, value + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4))));
      setOnline((value) => Math.max(90, Math.min(180, value + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2))));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <PublicPage className='discussion-experience'>
      <PublicHero
        eyebrow='Communauté'
        title='Le vestiaire public'
        description='Analyses, questions et échanges entre passionnés, athlètes, clubs et officiels.'
        compact
        aside={
          <div className='public-card public-card-body grid gap-4' aria-label='État du réseau'>
            <div className='flex items-center justify-between gap-4'><span className='ds-caption'>Membres en ligne</span><Badge tone='success'>{online}</Badge></div>
            <div className='flex items-center justify-between gap-4'><span className='ds-caption'>Latence réseau</span><strong>{latency} ms</strong></div>
          </div>
        }
      />
      <main className='public-container pt-8'>
        <div className='public-card min-h-[680px] overflow-hidden'><MessageWorkspace /></div>
      </main>
    </PublicPage>
  );
}
