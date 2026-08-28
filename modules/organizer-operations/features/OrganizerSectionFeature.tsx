'use client';

import { Alert } from '@/components/ui';
import { OrganizerSectionView } from '../components/OrganizerSectionView';
import { useOrganizerSection } from '../hooks/useOrganizerOperations';
import type { OrganizerSection } from '../types';
import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

export function OrganizerSectionFeature({ section }: { section: OrganizerSection }) {
  const { data, loading, error } = useOrganizerSection(section);
  if (loading) {
    return (
      <IndesyDualOrbitLoader
        variant="data"
        label="Chargement des données"
      />
    );
  }
  if (error || !data) return <Alert tone='danger' title='Poste opérationnel indisponible'>{error}</Alert>;
  return <OrganizerSectionView snapshot={data} />;
}
