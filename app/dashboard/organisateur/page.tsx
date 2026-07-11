"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AuthPage() {
  // =========================
  // NAVIGATION ONGLETS
  // =========================
  const [isLogin, setIsLogin] = useState(true)

  // =========================
  // INFORMATIONS UTILISATEUR
  // =========================
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")

  // =========================
  // ROLES
  // =========================
  const [roles, setRoles] = useState<{ id: string; role_name: string }[]>([])
  const [selectedRole, setSelectedRole] = useState("")

  // =========================
  // DISCIPLINES
  // =========================
  const [disciplines, setDisciplines] = useState<{ id: string; name: string }[]>([])
  const [selectedDiscipline, setSelectedDiscipline] = useState("")

  // =========================
  // LOCALISATION
  // =========================
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string; region_id: string }[]>([])
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCity, setSelectedCity] = useState("")

  // =========================
  // ETATS INTERFACE
  // =========================
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // =========================
  // CHARGER LES ROLES
  // =========================
  useEffect(() => {
    async function fetchRoles() {
      const { data, error } = await supabase
        .from("roles")
        .select("id, role_name")
        .order("role_name")

      if (error) {
        console.error("Erreur chargement rôles :", error)
        return
      }
      setRoles(data)
      if (data.length > 0) {
        setSelectedRole(data[0].id)
      }
    }
    fetchRoles()
  }, [])

  // =========================
  // CHARGER LES DISCIPLINES
  // =========================
  useEffect(() => {
    async function fetchDisciplines() {
      const { data, error } = await supabase
        .from("disciplines")
        .select("id, name")
        .order("name")

      if (error) {
        console.error("Erreur chargement disciplines :", error)
        return
      }
      setDisciplines(data)
    }
    fetchDisciplines()
  }, [])

  // =========================
  // CHARGER LES REGIONS
  // =========================
  useEffect(() => {
    async function fetchRegions() {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name")
        .order("name")

      if (error) {
        console.error("Erreur chargement régions :", error)
        return
      }
      setRegions(data)
    }
    fetchRegions()
  }, [])

  // =========================
  // CHARGER LES VILLES SELON LA REGION
  // =========================
  useEffect(() => {
    async function fetchCities() {
      if (!selectedRegion) {
        setCities([])
        return
      }

      const { data, error } = await supabase
        .from("cities")
        .select("id, name, region_id")
        .eq("region_id", selectedRegion)
        .order("name")

      if (error) {
        console.error("Erreur chargement villes :", error)
        return
      }
      setCities(data)
    }
    fetchCities()
  }, [selectedRegion])

  // =========================
  // VERIFIER SI DISCIPLINE NECESSAIRE
  // =========================
  const selectedRoleName = roles.find((role) => role.id === selectedRole)?.role_name

  const requiresDiscipline = ["Combattant", "Coach", "Fédération", "Arbitre", "Juge"].includes(
    selectedRoleName || ""
  )

  // =========================
  // CONNEXION
  // =========================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Erreur de connexion : ${error.message}`)
    } else {
      setMessage("Connexion réussie !")
      window.location.href = "/dashboard"
    }
    setLoading(false)
  }

  // =========================
  // INSCRIPTION
  // =========================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    // 1. Création du compte Auth (on y stocke aussi les métadonnées de base)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role_name_at_signup: selectedRoleName // Utile pour les politiques RLS ou triggers
        },
      },
    })

    if (authError) {
      setMessage(`Erreur authentification : ${authError.message}`)
      setLoading(false)
      return
    }

    if (authData.user) {
      const userId = authData.user.id

      // 2. Création ou mise à jour du profil public (géré via upsert pour supporter le trigger d'insertion)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        email: email,
        region_id: selectedRegion || null,
        city_id: selectedCity || null,
      })

      if (profileError) {
        setMessage(`Erreur lors de la création du profil : ${profileError.message}`)
        setLoading(false)
        return
      }

      // 3. Attribution du rôle principal (géré via upsert pour supporter le trigger)
      const { error: roleError } = await supabase.from("profile_roles").upsert({
        profile_id: userId,
        role_id: selectedRole,
      })

      if (roleError) {
        setMessage(`Erreur lors de l'attribution du rôle : ${roleError.message}`)
        setLoading(false)
        return
      }

      // 4. Liaison de la discipline si nécessaire
      if (requiresDiscipline && selectedDiscipline) {
        let targetTable = ""

        // Détermination de la table pivot selon le rôle sélectionné
        if (selectedRoleName === "Combattant") targetTable = "fighter_disciplines"
        else if (selectedRoleName === "Coach") targetTable = "coach_disciplines"
        // Ajoute ici tes autres correspondances (ex: referee_disciplines, etc.)

        if (targetTable) {
          const { error: disciplineError } = await supabase.from(targetTable).insert({
            // Ajuste les clés selon les noms exacts de tes colonnes (ex: fighter_id ou profile_id)
            profile_id: userId, 
            discipline_id: selectedDiscipline,
          })

          if (disciplineError) {
            console.error(`Erreur liaison discipline (${targetTable}) :`, disciplineError.message)
            // On ne bloque pas l'inscription complète pour ça, mais on le signale en console
          }
        }
      }

      setMessage("Inscription réussie ! Vérifiez votre boîte email pour confirmer.")
    }

    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-black px-4 text-white overflow-hidden">
      {/* CARD BRUTE : angles droits (rounded-none), bordure plus marquée */}
      <div className="w-full max-w-md max-h-[95vh] flex flex-col border-2 border-zinc-800 bg-zinc-950 p-6 rounded-none overflow-y-auto scrollbar-none">
        <div>
          <h2 className="text-center text-2xl font-black uppercase tracking-wider text-amber-500">
            {isLogin ? "Connexion" : "Créer votre compte"}
          </h2>
          <p className="mt-1 text-center text-xs uppercase tracking-widest text-zinc-500">
            {isLogin ? "Espace Indesy Mialy" : "Écosystème Indesy Mialy"}
          </p>
        </div>

        {/* SELECTEUR DE MODE BRUT */}
        <div className="grid grid-cols-2 gap-0 bg-zinc-950 border border-zinc-800 mt-5 shrink-0">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setMessage(""); }}
            className={`py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none ${
              isLogin ? "bg-amber-600 text-black font-black" : "text-zinc-500 hover:text-white bg-zinc-900/50"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setMessage(""); }}
            className={`py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none ${
              !isLogin ? "bg-amber-600 text-black font-black" : "text-zinc-500 hover:text-white bg-zinc-900/50"
            }`}
          >
            Inscription
          </button>
        </div>

        <form className="mt-5 space-y-4 flex-1" onSubmit={isLogin ? handleSignIn : handleSignUp}>
          <div className="space-y-3">
            {/* NOM COMPLET : INSCRIPTION UNIQUEMENT */}
            {!isLogin && (
              <div className="transition-all duration-300">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="NOM ET PRÉNOM"
                  className="w-full rounded-none border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EXEMPLE@MAIL.COM"
                className="w-full rounded-none border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            {/* MOT DE PASSE */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-none border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            {/* CHAMPS COMPLÉMENTAIRES CÔTE À CÔTE : INSCRIPTION UNIQUEMENT */}
            {!isLogin && (
              <div className="space-y-3 transition-all duration-300">
                
                {/* LIGNE 1 : REGION ET VILLE */}
                <div className="grid grid-cols-2 gap-4">
                  {/* REGION */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                      Région
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value)
                        setSelectedCity("")
                      }}
                      className="w-full rounded-none border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none appearance-none"
                    >
                      <option value="">RÉGION</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* VILLE */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                      Ville
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={!selectedRegion}
                      className="w-full rounded-none border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-30 appearance-none"
                    >
                      <option value="">VILLE</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LIGNE 2 : ROLE ET DISCIPLINE */}
                <div className={`grid ${requiresDiscipline ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
                  {/* ROLE */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                      Profil principal
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full rounded-none border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none appearance-none"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.role_name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DISCIPLINE CONDITIONNELLE */}
                  {requiresDiscipline && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                        Discipline
                      </label>
                      <select
                        value={selectedDiscipline}
                        onChange={(e) => setSelectedDiscipline(e.target.value)}
                        className="w-full rounded-none border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none appearance-none"
                      >
                        <option value="">DISCIPLINE</option>
                        {disciplines.map((discipline) => (
                          <option key={discipline.id} value={discipline.id}>
                            {discipline.name.toUpperCase()}
                          </option>
                      ))}
                    </select>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* BOUTON DYNAMIQUE BRUT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-none bg-amber-600 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-black hover:bg-amber-500 transition disabled:opacity-50 mt-4 border-b-4 border-amber-800 active:border-b-0 active:mt-[18px]"
          >
            {loading ? (isLogin ? "Connexion..." : "Création...") : (isLogin ? "Se connecter" : "S'inscrire")}
          </button>

          {/* MESSAGE BRUT */}
          {message && (
            <p className="rounded-none border-2 border-amber-900 bg-amber-950/20 p-3 text-center text-xs uppercase tracking-wider text-amber-400 mt-3 font-semibold">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}