import Link from 'next/link';

type PublicProfileRole = 'combattant' | 'club' | 'coach' | 'organisateur' | 'arbitre' | 'juge' | 'sponsor' | 'vendeur' | 'fan';

function profileSlug(value: string) {
  return value.replace(/^@/, '').trim().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '') || 'demo';
}

export function OrganizerProfileLink({ name, role = 'fan', className = '' }: { name: string; role?: PublicProfileRole; className?: string }) {
  return <Link href={`/social/profils/${role}/${profileSlug(name)}`} target='_blank' rel='noreferrer' className={`underline-offset-2 hover:text-[#3d92ff] hover:underline ${className}`} title={`Voir le profil public de ${name}`}>{name}</Link>;
}

export function getProfileRoleForCell(column: string, row: string[]): PublicProfileRole | null {
  const label = column.toLocaleLowerCase('fr').normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
  const rowText = row.join(' ').toLocaleLowerCase('fr').normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
  if (label.includes('coin rouge') || label.includes('coin bleu') || label.includes('combattant') || label.includes('participant') || label.includes('vainqueur') || label.includes('adversaire') || label.includes('forfait') || label.includes('remplacant')) return 'combattant';
  if (label.includes('sponsor') || label.includes('partenaire')) return 'sponsor';
  if (label.includes('club')) return 'club';
  if (label.includes('arbitre')) return 'arbitre';
  if (label.includes('juge')) return 'juge';
  if (label.includes('coach')) return 'coach';
  if (label.includes('personne') || label === 'nom' || label.includes('responsable') || label.includes('utilisateur') || label.includes('agent') || label.includes('contact') || label.includes('invite') || label.includes('acheteur') || label.includes('beneficiaire') || label.includes('validateur') || label.includes('signataire') || label.includes('staff') || label.includes('chef') || label.includes('proprietaire') || label.includes('analyste') || label.includes('auteur') || label.includes('superviseur')) {
    if (rowText.includes('arbitre')) return 'arbitre';
    if (rowText.includes('juge')) return 'juge';
    if (rowText.includes('coach')) return 'coach';
    if (rowText.includes('sponsor')) return 'sponsor';
    return 'fan';
  }
  return null;
}
