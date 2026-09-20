"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import {
  changePrivateAccount,
  loginAdmin,
  loginSuperAdmin,
} from "@/app/auth/private-actions";
import {
  IndesyBrandMark,
  IndesyButton,
  IndesyPanel,
  IndesyThemeToggle,
} from "@/components/ui/indesy";
import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import type { PrivateAccessKind, PrivateLoginState } from "./types";

type Props = {
  kind: PrivateAccessKind;
  next: string;
  hasSession: boolean;
  initialMessage?: string | null;
};

export function PrivateAuthScreen({ kind, next, hasSession, initialMessage = null }: Props) {
  const router = useRouter();
  const action = kind === "admin" ? loginAdmin : loginSuperAdmin;
  const initialState: PrivateLoginState = {
    status: hasSession ? "unauthorized" : "idle",
    message: initialMessage,
    destination: null,
    hasSession,
  };
  const [state, formAction, pending] = useActionState(action, initialState);
  const [changingAccount, setChangingAccount] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.destination) {
      router.replace(state.destination);
      router.refresh();
    }
  }, [router, state.destination, state.status]);

  const sessionBlocked = hasSession || state.hasSession;
  const superAdmin = kind === "super_admin";

  async function changeAccount() {
    setChangingAccount(true);
    try {
      await changePrivateAccount();
      router.replace(`${superAdmin ? "/auth/vh-teck" : "/auth/admin"}?next=${encodeURIComponent(next)}`);
      router.refresh();
    } finally {
      setChangingAccount(false);
    }
  }

  return (
    <main className={`im-private-auth ${superAdmin ? "im-private-auth--restricted" : ""}`}>
      <div className="im-private-auth__grid" aria-hidden="true" />
      <section className="im-private-auth__shell">
        <header className="im-private-auth__topbar">
          <Link href="/" className="im-private-auth__brand" aria-label="Retour à l’accueil Indesy">
            <IndesyBrandMark size={30} />
            <span><strong>INDESY</strong><small>PRIVATE ACCESS</small></span>
          </Link>
          <IndesyThemeToggle />
        </header>

        <div className="im-private-auth__content">
          <div className="im-private-auth__statement">
            <p className="im-kicker">{superAdmin ? "Périmètre hautement restreint" : "Administration privée"}</p>
            <h1>{superAdmin ? "Control Center" : "Espace administration"}</h1>
            <p>
              {superAdmin
                ? "Authentification renforcée et contrôle d’accès système obligatoires."
                : "Accès réservé aux comptes administratifs actifs de la plateforme."}
            </p>
            <div className="im-private-auth__signal">
              {superAdmin ? <LockKeyhole aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
              <span>Supabase Auth · session vérifiée côté serveur</span>
            </div>
          </div>

          <IndesyPanel
            accent
            kicker={superAdmin ? "Super Admin" : "Administration"}
            title={sessionBlocked ? "Session non autorisée" : "Connexion sécurisée"}
            className="im-private-auth__panel"
          >
            {sessionBlocked ? (
              <div className="im-private-auth__blocked">
                <p role="alert">{state.message ?? initialMessage ?? "Cette session ne permet pas d’ouvrir cet espace privé."}</p>
                <IndesyButton
                  scale="lg"
                  className="w-full"
                  disabled={changingAccount}
                  onClick={changeAccount}
                  icon={<KeyRound size={16} aria-hidden="true" />}
                >
                  {changingAccount ? "Déconnexion…" : "Changer de compte"}
                </IndesyButton>
              </div>
            ) : (
              <form action={formAction} className="im-private-auth__form">
                <input type="hidden" name="next" value={next} />
                <label htmlFor={`${kind}-email`}>Adresse email</label>
                <input
                  id={`${kind}-email`}
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  required
                />
                <label htmlFor={`${kind}-password`}>Mot de passe</label>
                <input
                  id={`${kind}-password`}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                {state.message ? <p className="im-private-auth__message" role="alert">{state.message}</p> : null}
                {pending ? <IndesyDualOrbitLoader variant="compact" label="Vérification de l’accès privé" /> : null}
                <IndesyButton
                  type="submit"
                  scale="lg"
                  className="w-full"
                  disabled={pending}
                  icon={<ShieldCheck size={16} aria-hidden="true" />}
                >
                  {pending ? "Vérification…" : "Ouvrir l’espace privé"}
                </IndesyButton>
                <Link href="/auth/forgot-password" className="im-private-auth__recovery">
                  Mot de passe oublié ?
                </Link>
              </form>
            )}
          </IndesyPanel>
        </div>

        <footer className="im-private-auth__footer">
          <span>Accès surveillé</span>
          <span>Aucune inscription sur cette interface</span>
        </footer>
      </section>
    </main>
  );
}
