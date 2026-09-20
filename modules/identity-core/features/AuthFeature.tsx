"use client";

import HeroCarousel from "@/components/home/HeroCarousel";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, MapPin, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { createIdentityUseCase } from "../factories/identity.factory";
import { FormMessage } from "../components/IdentityViews";
import { IdentityError, type IdentityRole } from "../types";
import { GeographySelector, type GeographyValue } from "@/modules/geography";
import { useAuthContext } from "@/providers/auth/auth-context";
import { getIdentityDashboard } from "../routing";
import { IDENTITY_ROLE_LABELS, PUBLIC_IDENTITY_ROLES } from "../role-policy";
import { normalizeIdentityError } from "../errors";

export type AuthMode = "login" | "register" | "forgot" | "reset" | "verify" | "callback";
const LOGO_URL = "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo";
const ROLES: Array<{ value: IdentityRole; label: string }> = PUBLIC_IDENTITY_ROLES.map((value) => ({
  value,
  label: IDENTITY_ROLE_LABELS[value],
}));
const fieldClass = "h-11 w-full border border-white/12 bg-[#0e1118] px-3 text-[13px] text-white outline-none transition placeholder:text-zinc-600 focus:border-[#087cff]";

export function AuthFeature({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const reduceMotion = useReducedMotion();
  const useCase = useMemo(() => createIdentityUseCase(), []);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<IdentityRole>("fighter");
  const [geography, setGeography] = useState<GeographyValue>({ regionId: "", districtId: "", cityId: "", communeId: "" });
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (mode === "callback") {
      const code = new URLSearchParams(window.location.search).get("code");
      void useCase.completeCallback(code).then(async (destination) => {
        if (active) {
          const auth = await refreshUser();
          router.replace(destination ?? getIdentityDashboard(auth.primaryRole));
        }
      }).catch(reason => { if (active) setError(normalizeIdentityError(reason).message); });
    } else if (mode === "login" || mode === "register") {
      void useCase.refreshSession().then(async (result) => {
        if (result.session && active) {
          const auth = await refreshUser();
          router.replace(result.destination ?? getIdentityDashboard(auth.primaryRole));
        }
      }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [mode, refreshUser, router, useCase]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "login") { const destination = await useCase.login(email, password); const auth = await refreshUser(); router.replace(destination === "/role-requests" ? destination : getIdentityDashboard(auth.primaryRole)); return; }
      if (mode === "register") {
        const destination = await useCase.register({ fullName, email, password, confirmation, accepted: terms, role, regionId: geography.regionId, cityId: geography.cityId });
        if (destination === "/auth/verify") { router.replace(destination); return; }
        const auth = await refreshUser();
        router.replace(destination === "/role-requests" ? destination : getIdentityDashboard(auth.primaryRole));
        return;
      }
      if (mode === "forgot") { await useCase.forgotPassword(email, `${window.location.origin}/auth/reset-password`); setSuccess("Consultez votre messagerie pour réinitialiser votre mot de passe."); return; }
      if (mode === "reset") { await useCase.resetPassword(password, confirmation); router.replace("/auth"); return; }
      if (mode === "verify") { await useCase.resendVerification(email); setSuccess("Un nouvel email de vérification a été envoyé."); }
    } catch (reason) {
      setError(reason instanceof IdentityError ? reason.message : normalizeIdentityError(reason).message);
    } finally { setLoading(false); }
  };

  const register = mode === "register";
  const title = register ? "Créer mon compte" : mode === "login" ? "Se connecter" : mode === "forgot" ? "Mot de passe oublié" : mode === "reset" ? "Nouveau mot de passe" : mode === "verify" ? "Vérifier mon email" : "Ouverture de votre espace";
  if (mode === "callback") return <main className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white"><div className="border border-white/10 bg-[#10131a] p-8 text-center"><span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-[#087cff] border-t-[#ff1638]"/><p className="mt-4 text-sm">Connexion en cours…</p><FormMessage error={error}/></div></main>;

  return <main className="auth-dark-surface auth-carousel-screen min-h-[100dvh] bg-[#07090d] font-[Arial,'Segoe_UI',Helvetica,sans-serif] text-white">
      <div className="auth-carousel-layer">
        <HeroCarousel />
      </div>
    <div className={`auth-carousel-layout mx-auto grid min-h-[100dvh] max-w-[1800px] ${register ? "lg:grid-cols-3" : "lg:grid-cols-[minmax(0,1fr)_minmax(520px,.82fr)]"}`}>
      <section className={`relative hidden min-h-0 overflow-hidden border-r border-white/10 lg:block ${register ? "lg:col-span-1" : ""}`}>
        <img src="https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo_sans_fond" alt="" aria-hidden="true" className="absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.15] grayscale"/>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,35,60,.18),transparent_42%,rgba(40,118,232,.17))]"/>
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:64px_64px]"/>
        <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex w-max items-center gap-3"><img src={LOGO_URL} alt="Indesy Mialy" className="h-12 w-12 object-contain"/><strong className="text-[13px] tracking-[.18em]">INDESY <span className="text-[#ff1638]">MIALY</span></strong></Link>
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#3d92ff]"><span className="h-px w-10 bg-[#087cff]"/>Votre écosystème</p>
            <h1 className="text-[clamp(52px,6.2vw,96px)] font-black uppercase leading-[.84] tracking-[-.065em]">Passion.<br/><span className="text-[#ff1638]">Carrière.</span><br/><span className="text-[#3d92ff]">Business.</span></h1>
            <p className="mt-7 max-w-lg text-[15px] leading-7 text-zinc-300">Un seul compte pour vivre le sport, développer votre activité et gérer votre parcours.</p>
          </motion.div>
          <p className="text-[10px] uppercase tracking-[.16em] text-zinc-600">Indesy Mialy · Madagascar</p>
        </div>
      </section>

      <section className={`relative flex min-h-[100dvh] items-center justify-center px-4 py-5 sm:px-8 lg:px-10 ${register ? "lg:col-span-2 lg:h-[100dvh] lg:overflow-hidden" : "overflow-y-auto"}`}>
        <div className="absolute left-0 top-0 h-1 w-1/2 bg-[#ff1638]"/><div className="absolute right-0 top-0 h-1 w-1/2 bg-[#087cff]"/>
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`w-full border border-white/10 bg-[#0b0e14] p-5 shadow-[0_30px_80px_rgba(0,0,0,.36)] ${register ? "max-w-[980px] sm:p-6" : "max-w-[560px] sm:p-7"}`}>
          <div className="mb-6 flex items-center justify-between"><Link href="/" aria-label="Retour à l’accueil" className="grid h-9 w-9 place-items-center border border-white/10 text-zinc-400 transition hover:border-[#087cff] hover:text-white"><ArrowLeft size={16}/></Link><div className="flex items-center gap-2 text-[10px] text-zinc-500"><ShieldCheck size={13} className="text-[#3d92ff]"/>Accès sécurisé</div></div>
          <div className="mb-5"><h2 className="text-[25px] font-bold tracking-[-.03em]">{title}</h2>{register && <p className="mt-1 text-[12px] text-zinc-500">Choisissez votre espace et commencez immédiatement.</p>}</div>
          <form onSubmit={submit} className={`grid gap-3 ${register ? "md:grid-cols-2" : ""}`}>
            {register && <label className="grid gap-1.5 text-[11px] font-semibold text-zinc-300">Nom complet<input required autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} className={fieldClass} placeholder="Votre nom et prénom"/></label>}
            <label className="grid gap-1.5 text-[11px] font-semibold text-zinc-300">Adresse email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className={fieldClass} placeholder="nom@exemple.com"/></label>
            {register && <label className="grid gap-1.5 text-[11px] font-semibold text-zinc-300">Mon espace<select value={role} onChange={e=>setRole(e.target.value as IdentityRole)} className={fieldClass}>{ROLES.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
            {register && <fieldset className="border-t border-white/10 pt-3 md:col-span-2"><legend className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-zinc-300"><MapPin size={13} className="text-[#3d92ff]"/>Localité</legend><GeographySelector required value={geography} onChange={setGeography}/></fieldset>}
            {(["login","register","reset"] as AuthMode[]).includes(mode) && <label className="grid gap-1.5 text-[11px] font-semibold text-zinc-300">Mot de passe<div className="relative"><input required minLength={mode === "login" ? undefined : 8} type={showPassword?"text":"password"} autoComplete={register?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} className={`${fieldClass} pr-11`}/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-zinc-500 hover:text-white" aria-label={showPassword?"Masquer le mot de passe":"Afficher le mot de passe"}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></label>}
            {(["register","reset"] as AuthMode[]).includes(mode) && <label className="grid gap-1.5 text-[11px] font-semibold text-zinc-300">Confirmer le mot de passe<input required minLength={8} type={showPassword?"text":"password"} autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} className={fieldClass}/></label>}
            {register && <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-[#0e1118] p-3 text-[11px] leading-5 text-zinc-400 md:col-span-2"><input required type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} className="mt-1 accent-[#087cff]"/><span>J’accepte les <Link href="/legal/terms" className="text-white underline decoration-[#ff1638] underline-offset-4">conditions d’utilisation</Link>.</span></label>}
            <div className={register ? "md:col-span-2" : ""}><FormMessage error={error} success={success}/></div>
            <button disabled={loading} className={`group flex h-12 items-center justify-between border border-[#ff1638] bg-[#ff1638] px-4 text-[11px] font-bold uppercase tracking-[.1em] transition hover:bg-[#d91d35] disabled:opacity-60 ${register ? "md:col-span-2" : ""}`}><span>{loading?"Traitement…":register?"Créer mon compte":mode==="login"?"Accéder à mon espace":mode==="forgot"?"Envoyer le lien":mode==="reset"?"Enregistrer":"Renvoyer l’email"}</span>{loading?<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>:<ArrowRight size={16}/>}</button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px]">
            {mode==="login"&&<><Link href="/auth/forgot-password" className="text-zinc-500 hover:text-white">Mot de passe oublié ?</Link><Link href="/auth/register" className="font-semibold text-[#3d92ff]">Créer un compte</Link></>}
            {register&&<><span className="text-zinc-500">Déjà membre ?</span><Link href="/auth" className="font-semibold text-[#3d92ff]">Se connecter</Link></>}
            {!(["login","register"] as AuthMode[]).includes(mode)&&<Link href="/auth" className="flex items-center gap-2 text-[#3d92ff]"><ArrowLeft size={13}/>Retour à la connexion</Link>}
          </div>
        </motion.div>
      </section>
    </div>
  </main>;
}
