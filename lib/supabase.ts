import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation stricte au démarrage de l'application
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 ERREUR CRITIQUE : Les variables d'environnement Supabase sont INTROUVABLES côté client !");
  console.log("Vérifie ton fichier .env.local et assure-toi d'avoir redémarré le serveur.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-to-prevent-crash.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);