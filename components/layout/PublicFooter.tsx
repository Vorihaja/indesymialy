import Link from 'next/link';
import { Brand } from '@/components/ui';

const groups = [
  { title:'Plateforme', links:[['Actualités','/actualites'],['Événements','/events'],['Classements','/rankings'],['Combattants','/fighters'],['Clubs','/clubs'],['Médias','/media'],['Marketplace','/marketplace']] },
  { title:'Disciplines', links:[['MMA','/disciplines/mma'],['Boxe','/disciplines/boxe'],['Judo','/disciplines/judo'],['Karaté','/disciplines/karate'],['Taekwondo','/disciplines/taekwondo']] },
  { title:'Aide', links:[['Centre d’aide','/help'],['FAQ','/faq'],['Support','/support'],['Contact','/contact'],['Signaler un bug','/report-bug']] },
  { title:'Légal', links:[['Confidentialité','/legal/privacy'],['Conditions','/legal/terms'],['Cookies','/legal/cookies'],['Sécurité','/legal/safety'],['Communauté','/legal/community-guidelines']] },
] as const;

export default function PublicFooter(){
  return <footer className='public-footer'><div className='public-footer-grid'><div className='public-footer-brand'><Brand/><p className='ds-caption'>La plateforme professionnelle des arts martiaux et sports de combat à Madagascar.</p><div className='ds-actions' aria-label='Réseaux sociaux — bientôt disponibles'><span className='ds-badge'>Instagram</span><span className='ds-badge'>YouTube</span><span className='ds-badge'>Facebook</span></div></div>{groups.map(group=><section key={group.title}><h2>{group.title}</h2><nav aria-label={group.title}>{group.links.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav></section>)}</div><div className='public-footer-bottom'><span>© {new Date().getFullYear()} Indesy Mialy. Tous droits réservés.</span><span>Plateforme v0.1 · Madagascar</span></div></footer>;
}
