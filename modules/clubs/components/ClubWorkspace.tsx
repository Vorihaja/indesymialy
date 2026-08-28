'use client';
import { createContext,useContext } from 'react';
import { Alert,Loader } from '@/components/ui';
import { WorkspaceShell } from '@/modules/platform-workspaces';
import { useRole } from '@/modules/auth/hooks/useRole';
import { useActiveClub } from '../hooks/useActiveClub';
import type { ActiveClub } from '../types';
const ActiveClubContext=createContext<ActiveClub|null>(null);
export function useClubActive(){const value=useContext(ActiveClubContext);if(!value)throw new Error('Club actif indisponible');return value}
export default function ClubWorkspace({children}:{children:React.ReactNode}){const{activeClub,loading,error}=useActiveClub();const{hasRole,hasSystemRole,loading:rolesLoading}=useRole();if(loading||rolesLoading)return <div className='ds-empty'><Loader/><span className='ds-caption'>Chargement du club…</span></div>;if(error)return <Alert tone='danger' title='Impossible de charger le club'>{error}</Alert>;if(!hasRole('club')&&!hasSystemRole('admin')&&!hasSystemRole('super_admin'))return <Alert tone='danger' title='Accès refusé'>Ce workspace nécessite un rôle Club.</Alert>;if(!activeClub)return <Alert tone='warning' title='Aucun club'>Aucun club n’est associé à votre compte.</Alert>;return <ActiveClubContext.Provider value={activeClub}><WorkspaceShell role='club' title={activeClub.club.name}>{children}</WorkspaceShell></ActiveClubContext.Provider>}
