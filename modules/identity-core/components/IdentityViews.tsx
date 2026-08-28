"use client";
import Link from "next/link";
import { getIdentityRoleLabel } from "../role-policy";
import type {
  AccountSection,
  IdentityRole,
  IdentitySnapshot,
  OnboardingStep,
} from "../types";

export const identityPanelClass = "border border-[#303238] bg-[#151619] p-4";
export const identityControlClass =
  "mt-1.5 h-10 w-full border border-[#303238] bg-[#0f1012] px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#3d92ff]";
export const identityPrimaryActionClass =
  "inline-flex min-h-10 items-center justify-center border border-[#ff1638] bg-[#ff1638] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d91d35] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff1638]/50 disabled:cursor-not-allowed disabled:opacity-50";
export const identitySecondaryActionClass =
  "inline-flex min-h-10 items-center justify-center border border-[#3d92ff] bg-[#3d92ff]/10 px-4 py-2 text-sm font-semibold text-[#78b5ff] transition hover:bg-[#3d92ff]/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d92ff]/50";
type IdentityFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function IdentityFrame({
  eyebrow,
  title,
  description,
  children,
  backHref,
  backLabel,
}: IdentityFrameProps) {
  return (
    <main className="min-h-[calc(100vh-84px)] bg-[#090a0c] px-4 py-6 text-white sm:py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        {backHref && backLabel && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#78b5ff] transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            {backLabel}
          </Link>
        )}
        <header className="border-l-2 border-[#3d92ff] pl-4">
          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#3d92ff]">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-[-.025em]">{title}</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
export function Field({label,type="text",value,onChange,required=false}:{label:string;type?:string;value:string;onChange:(value:string)=>void;required?:boolean}) {
  return <label className="block text-[12px] font-semibold text-zinc-300">{label}<input type={type} value={value} required={required} onChange={event=>onChange(event.target.value)} className={identityControlClass}/></label>;
}
export function FormMessage({error,success}:{error?:string|null;success?:string|null}) {
  return <>{error&&<p role="alert" className="border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}{success&&<p className="border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-300">{success}</p>}</>;
}
export const onboardingSteps:Array<{step:OnboardingStep;label:string;href:string}>=[{step:"profile",label:"Profil",href:"/account/profile?onboarding=1"},{step:"disciplines",label:"Disciplines",href:"/onboarding/disciplines"},{step:"role",label:"Rôles",href:"/onboarding/role"},{step:"organization",label:"Organisation",href:"/onboarding/organization"},{step:"documents",label:"Documents",href:"/onboarding/documents"},{step:"review",label:"Validation",href:"/onboarding/review"}];
export function OnboardingProgress({active}:{active:OnboardingStep}) {
  return <nav aria-label="Progression de l’onboarding" className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-6">{onboardingSteps.map((item,index)=>{const current=item.step===active;return <Link href={item.href} key={item.step} aria-current={current?"step":undefined} className={"border px-2 py-2.5 text-center text-xs font-semibold transition "+(current?"border-[#3d92ff] bg-[#3d92ff]/10 text-white":"border-[#303238] bg-[#151619] text-zinc-400 hover:border-[#3d92ff]/60 hover:text-white")}>{index+1}. {item.label}</Link>;})}</nav>;
}
export function AccountNavigation({active}:{active:AccountSection}) {
  const items:Array<[AccountSection,string,string]>=[["overview","Compte","/account"],["profile","Profil","/account/profile"],["security","Sécurité","/account/security"],["roles","Rôles","/account/roles"],["organizations","Organisations","/account/organizations"],["preferences","Préférences","/account/preferences"],["notifications","Notifications","/account/notifications"],["privacy","Confidentialité","/account/privacy"],["sessions","Sessions","/account/sessions"]];
  return <nav aria-label="Sections du compte" className="flex gap-1 overflow-x-auto border-b border-[#303238] pb-2">{items.map(([section,label,href])=>{const current=active===section;return <Link key={section} href={href} aria-current={current?"page":undefined} className={"shrink-0 border px-3 py-2 text-xs font-semibold transition "+(current?"border-[#3d92ff] bg-[#3d92ff]/10 text-white":"border-[#303238] bg-[#151619] text-zinc-400 hover:border-[#3d92ff]/60 hover:text-white")}>{label}</Link>;})}</nav>;
}
export function RoleSpecificFields({role,values,onChange}:{role:IdentityRole;values:Record<string,string>;onChange:(key:string,value:string)=>void}){const fields:Record<IdentityRole,string[]>={fighter:["Surnom","Club","Coach","Catégorie","Poids","Taille","Allonge","Garde","Record initial","Licence préparée"],coach:["Club","Expérience","Certifications préparées"],club:["Nom organisation","Description","Adresse","Propriétaire"],organizer:["Organisation","Expérience","Zones d’activité","Contacts"],referee:["Niveau","Licences","Disponibilité"],judge:["Niveau","Licences","Disponibilité"],sponsor:["Organisation","Secteur","Budget préparé","Types de partenariat"],seller:["Organisation","Adresse","Catégories produits","Livraison / retrait"],fan:["Disciplines favorites","Combattants favoris préparés","Régions suivies"],federation:["Organisation","Territoire","Documents préparés"],league:["Organisation","Territoire","Documents préparés"],admin:[],super_admin:[]};return <div className="grid gap-3 sm:grid-cols-2">{fields[role].map(label=><Field key={label} label={label} value={values[label]??""} onChange={value=>onChange(label,value)}/>)}</div>;}
export function IdentitySummary({state}:{state:IdentitySnapshot}) {
  const{profile}=state.draft;
  const panel=identityPanelClass;
  return <div className="grid gap-3 sm:grid-cols-2"><section className={panel}><h2 className="font-black">Profil privé</h2><p className="mt-2 text-sm">{profile.fullName} · {profile.email}</p><p className="text-sm text-zinc-500">{profile.phone??"Téléphone non renseigné"}</p></section><section className={panel}><h2 className="font-black">Rôles et disciplines</h2><p className="mt-2 text-sm">{getIdentityRoleLabel(profile.primaryRole)}</p><p className="text-sm text-zinc-500">{profile.disciplineIds.join(", ")||"Aucune discipline"}</p></section><section className={panel}><h2 className="font-black">Organisation active</h2><p className="mt-2 text-sm">{state.organizations.find(item=>item.id===state.activeOrganizationId)?.name??"Aucune"}</p></section><section className={panel}><h2 className="font-black">Données publiques</h2><p className="mt-2 text-sm text-zinc-500">Seuls identité publique, rôle, disciplines, statistiques autorisées et médias publics seront exposés.</p></section></div>;
}
