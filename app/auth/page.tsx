"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ALL_CITY_OPTIONS, CITY_OPTIONS_BY_REGION, REGION_OPTIONS } from "@/lib/locations";

type ProfileType =
  | "combattant"
  | "organisateur"
  | "arbitre"
  | "juge"
  | "vendeur"
  | "fan"
  | "coach"
  | "club";

type FieldDefinition = {
  key: string;
  label: string;
  type: string;
  placeholder: string;
  optional?: boolean;
};

const PROFILE_META: Record<ProfileType, { label: string; subtitle: string; fields: FieldDefinition[] }> = {
  combattant: {
    label: "Combattant",
    subtitle: "Inscris ton profil athlète pour être visible dans les listes officielles.",
    fields: [
      { key: "club", label: "Club / équipe", type: "text", placeholder: "Tana Fight Club" },
      { key: "discipline", label: "Discipline", type: "text", placeholder: "MMA, Boxe, Moraingy..." },
      { key: "categorie", label: "Catégorie / Poids", type: "text", placeholder: "-77 kg / Moyen" },
      { key: "experience", label: "Niveau / expérience", type: "text", placeholder: "12 combats professionnels" },
    ],
  },
  organisateur: {
    label: "Organisateur",
    subtitle: "Crée ton espace dédié pour piloter événements, billetterie et calendriers.",
    fields: [
      { key: "organization", label: "Organisation", type: "text", placeholder: "Indesy Mialy Events" },
      { key: "region", label: "Région d'exercice", type: "text", placeholder: "Boeny" },
      { key: "city", label: "Ville principale", type: "text", placeholder: "Antananarivo" },
      { key: "phone", label: "Téléphone", type: "tel", placeholder: "+261 34 12 345 67" },
    ],
  },
  arbitre: {
    label: "Arbitre",
    subtitle: "Déclare ta licence et ta spécialité pour officieller les rencontres.",
    fields: [
      { key: "license", label: "Numéro de licence", type: "text", placeholder: "ARB-2026-034" },
      { key: "discipline", label: "Discipline arbitrée", type: "text", placeholder: "MMA, Judo, Boxe..." },
      { key: "experience", label: "Années d'expérience", type: "number", placeholder: "3" },
      { key: "region", label: "Région d'intervention", type: "text", placeholder: "Tananarive" },
    ],
  },
  juge: {
    label: "Juge",
    subtitle: "Accède aux évaluations et au scoring officiel des combats.",
    fields: [
      { key: "commission", label: "Commission", type: "text", placeholder: "Commission nationale" },
      { key: "discipline", label: "Discipline jugée", type: "text", placeholder: "Kickboxing" },
      { key: "experience", label: "Événements notables", type: "text", placeholder: "Finale Catégorie -77kg" },
      { key: "phone", label: "Téléphone", type: "tel", placeholder: "+261 34 12 345 67" },
    ],
  },
  vendeur: {
    label: "Vendeur",
    subtitle: "Présente tes produits ou services aux organisateurs et fans.",
    fields: [
      { key: "company", label: "Boutique / entreprise", type: "text", placeholder: "Gasy Fight Gear" },
      { key: "product", label: "Type d'offre", type: "text", placeholder: "Équipements, restauration..." },
      { key: "city", label: "Ville", type: "text", placeholder: "Mahajanga" },
      { key: "phone", label: "Téléphone", type: "tel", placeholder: "+261 34 12 345 67" },
    ],
  },
  fan: {
    label: "Fan",
    subtitle: "Rejoins la communauté et suis tes combattants préférés.",
    fields: [
      { key: "favoriteClub", label: "Club favori", type: "text", placeholder: "Tana Fight Club" },
      { key: "favoriteFighter", label: "Combattant préféré", type: "text", placeholder: "Razafindrakoto Faly" },
      { key: "city", label: "Ville", type: "text", placeholder: "Tamatave" },
      { key: "interest", label: "Intérêt principal", type: "text", placeholder: "Billetterie, live, merchandising" },
    ],
  },
  coach: {
    label: "Coach",
    subtitle: "Gère ton équipe et ton planning d'entraînement depuis un seul compte.",
    fields: [
      { key: "club", label: "Club / académie", type: "text", placeholder: "Atsimondrano MMA Team" },
      { key: "discipline", label: "Spécialité", type: "text", placeholder: "MMA, Judo, Taekwondo" },
      { key: "experience", label: "Années d'expérience", type: "number", placeholder: "8" },
      { key: "teamSize", label: "Taille de l'équipe", type: "text", placeholder: "12 combattants" },
    ],
  },
  club: {
    label: "Club",
    subtitle: "Déclare ton club pour centraliser tes combattants et vos compétitions.",
    fields: [
      { key: "clubName", label: "Nom du club", type: "text", placeholder: "Northern Grappling" },
      { key: "city", label: "Ville", type: "text", placeholder: "Diégo Suarez" },
      { key: "manager", label: "Responsable", type: "text", placeholder: "M. Rakoto" },
      { key: "rosterSize", label: "Nombre de combattants", type: "number", placeholder: "18" },
    ],
  },
};

const defaultFormData: Record<string, string> = {
  profileType: "combattant",
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  club: "",
  discipline: "",
  categorie: "",
  experience: "",
  organization: "",
  city: "",
  region: "",
  phone: "",
  license: "",
  commission: "",
  product: "",
  favoriteClub: "",
  favoriteFighter: "",
  interest: "",
  company: "",
  teamSize: "",
  clubName: "",
  manager: "",
  rosterSize: "",
};

const AUTH_FIELDS: FieldDefinition[] = [
  { key: "email", label: "Email", type: "email", placeholder: "adresse@email.com" },
  { key: "password", label: "Mot de passe", type: "password", placeholder: "••••••••" },
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [profileType, setProfileType] = useState<ProfileType>("combattant");
  const [formData, setFormData] = useState<Record<string, string>>({
    ...defaultFormData,
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  const router = useRouter();
  const selectedProfile = PROFILE_META[profileType];
  const roleOptions = Object.entries(PROFILE_META).map(([value, meta]) => ({
    value: value as ProfileType,
    label: meta.label,
  }));

  const signupFields = useMemo<FieldDefinition[]>(() => {
    return [
      { key: "fullName", label: "Nom complet", type: "text", placeholder: "Razafindrabe Faly" },
      ...selectedProfile.fields,
      ...AUTH_FIELDS,
      { key: "confirmPassword", label: "Confirmer le mot de passe", type: "password", placeholder: "••••••••" },
    ];
  }, [selectedProfile]);

  const activeFields = mode === "login" ? AUTH_FIELDS : signupFields;

  const handleInputChange = (key: string, value: string) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
      ...(key === "region" ? { city: "" } : {}),
    }));
  };

  const handleProfileTypeChange = (type: ProfileType) => {
    setProfileType(type);
    setFormData((current) => ({ ...current, profileType: type }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusType(null);

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

    if (mode === "signup" && formData.password !== formData.confirmPassword) {
      setStatusMessage("Les mots de passe ne correspondent pas.");
      setStatusType("error");
      return;
    }

    if (!formData.email || !formData.password) {
      setStatusMessage("Email et mot de passe sont requis.");
      setStatusType("error");
      return;
    }

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("confirm") || error.message.includes("confirmed")) {
          setStatusMessage("Cette adresse e-mail doit encore être confirmée. Vérifie ta boîte mail ou demande un nouveau lien.");
          setStatusType("error");
          return;
        }

        setStatusMessage(`Erreur de connexion : ${error.message}`);
        setStatusType("error");
        return;
      }

      const actualRole =
        (data.user?.user_metadata?.role as string | undefined) ||
        (data.user?.user_metadata?.profile?.type as string | undefined) ||
        null;

      if (actualRole && actualRole !== profileType) {
        await supabase.auth.signOut();
        setStatusMessage(`Ce compte n'est pas associé au rôle ${selectedProfile.label}. Choisis le bon rôle pour continuer.`);
        setStatusType("error");
        return;
      }

      setStatusMessage("Connexion réussie. Redirection en cours...");
      setStatusType("success");
      router.push("/");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          role: profileType,
          profile: {
            type: profileType,
            fullName: formData.fullName,
            region: formData.region ?? "",
            city: formData.city ?? "",
            extra: PROFILE_META[profileType].fields.reduce((acc, field) => {
              acc[field.key] = formData[field.key] ?? "";
              return acc;
            }, {} as Record<string, string>),
          },
        },
      },
    });

    if (error) {
      setStatusMessage(`Erreur d'inscription : ${error.message}`);
      setStatusType("error");
      return;
    }

    if (!data.session && data.user) {
      setStatusMessage("Inscription enregistrée. Vérifie ton e-mail pour confirmer ton compte puis connecte-toi.");
      setStatusType("success");
      setFormData({ ...defaultFormData, profileType });
      return;
    }

    setStatusMessage("Inscription réussie ! Redirection en cours...");
    setStatusType("success");
    setFormData({ ...defaultFormData, profileType });
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#05050a_100%)] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_24%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-72 bg-[radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_24%)] blur-3xl" />

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <div className="space-y-8">
              <div className="max-w-2xl space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-400">Connexion & inscription</p>
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Accède à ton espace avec un formulaire adapté à ton profil.</h1>
                <p className="text-base leading-8 text-slate-300">Que tu sois combattant, organisateur, arbitre, juge, vendeur, fan, coach ou club, le formulaire d’inscription s’ajuste automatiquement à ton rôle.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Avantages</p>
                  <ul className="mt-6 space-y-4 text-slate-300 text-sm">
                    <li>• Formulaire intelligent selon le rôle sélectionné.</li>
                    <li>• Une seule entrée pour te connecter ou créer un compte.</li>
                    <li>• Design uniforme avec le reste de la plateforme.</li>
                    <li>• Prêt à intégrer une authentification Supabase ou serveur.</li>
                  </ul>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Fonctionnalité</p>
                  <div className="mt-6 space-y-4 text-slate-300 text-sm">
                    <p>Choisis ton rôle lors de l'inscription pour voir immédiatement les champs nécessaires :</p>
                    <p className="rounded-3xl border border-white/10 bg-white/5 p-4">Combattant, organisateur, arbitre, juge, vendeur, fan, coach ou club.</p>
                    <p>Lorsque tu passes à la connexion, seuls les champs Email + Mot de passe restent visibles.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_32px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-400">Espace sécurisé</p>
                  <h2 className="mt-3 text-3xl font-black text-white">{mode === "login" ? "Connexion" : "Inscription"}</h2>
                </div>
                <div className="inline-flex rounded-full bg-slate-900/80 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"}`}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:text-white"}`}
                  >
                    Inscription
                  </button>
                </div>
              </div>

              <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Profil</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {mode === "signup"
                          ? "Sélectionne ton type avant de remplir le formulaire."
                          : "Choisis le rôle de ton compte pour te connecter à l’espace correspondant."}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-slate-300">{selectedProfile.label}</span>
                  </div>
                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-slate-300">Rôle</span>
                    <select
                      value={profileType}
                      onChange={(event) => handleProfileTypeChange(event.target.value as ProfileType)}
                      className="w-full rounded-3xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-slate-950 text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-sm text-slate-400">{selectedProfile.subtitle}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "signup" && (
                  <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                    Les champs de profil, région et ville seront enregistrés dans votre compte Supabase après l’inscription.
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeFields.map((field) => {
                    const isRegionField = field.key === "region";
                    const isCityField = field.key === "city";
                    const selectOptions = isRegionField
                      ? REGION_OPTIONS
                      : isCityField
                        ? (formData.region ? CITY_OPTIONS_BY_REGION[formData.region] ?? ALL_CITY_OPTIONS : ALL_CITY_OPTIONS)
                        : [];

                    return (
                      <label key={field.key} className="space-y-2">
                        <span className="block text-sm font-semibold text-slate-300">{field.label}</span>
                        {isRegionField || isCityField ? (
                          <select
                            value={formData[field.key] ?? ""}
                            onChange={(event) => handleInputChange(field.key, event.target.value)}
                            className="w-full rounded-3xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                          >
                            <option value="">Sélectionner</option>
                            {selectOptions.map((option) => (
                              <option key={option} value={option} className="bg-slate-950 text-white">
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={formData[field.key] ?? ""}
                            onChange={(event) => handleInputChange(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            type={field.type}
                            className="w-full rounded-3xl border border-white/10 bg-[#0B1220] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>

                <button className="inline-flex w-full items-center justify-center rounded-3xl bg-amber-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                </button>

                {statusMessage && (
                  <div className={`rounded-3xl border px-4 py-3 text-sm ${statusType === "success" ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-rose-400 bg-rose-500/10 text-rose-200"}`}>
                    {statusMessage}
                  </div>
                )}
                <p className="text-center text-sm text-slate-400">
                  {mode === "login" ? (
                    <>
                      Nouveau ici ? <button type="button" onClick={() => setMode("signup")} className="font-semibold text-white hover:text-amber-300">Inscris-toi</button>
                    </>
                  ) : (
                    <>
                      Déjà inscrit ? <button type="button" onClick={() => setMode("login")} className="font-semibold text-white hover:text-amber-300">Connecte-toi</button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
