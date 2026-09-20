"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, QrCode, ShieldCheck } from "lucide-react";

import {
  challengeSuperAdminMfa,
  enrollSuperAdminMfa,
  verifySuperAdminMfaEnrollment,
} from "@/app/auth/private-actions";
import {
  IndesyBrandMark,
  IndesyButton,
  IndesyPanel,
  IndesyThemeToggle,
} from "@/components/ui/indesy";
import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import { claimSubmission } from "./mfa-flow";
import { INITIAL_PRIVATE_MFA_STATE } from "./types";

type Props = {
  mode: "challenge" | "enroll";
  next: string;
  configurationError?: boolean;
};

function useSingleSubmission(pending: boolean) {
  const lock = useRef(false);

  useEffect(() => {
    if (!pending) lock.current = false;
  }, [pending]);

  return (event: FormEvent<HTMLFormElement>) => {
    if (pending || !claimSubmission(lock)) event.preventDefault();
  };
}

export function PrivateMfaScreen({ mode, next, configurationError = false }: Props) {
  const router = useRouter();
  const [challengeState, challengeAction, challengePending] = useActionState(
    challengeSuperAdminMfa,
    INITIAL_PRIVATE_MFA_STATE,
  );
  const [enrollState, enrollAction, enrollPending] = useActionState(
    enrollSuperAdminMfa,
    INITIAL_PRIVATE_MFA_STATE,
  );
  const [verificationState, verificationAction, verificationPending] = useActionState(
    verifySuperAdminMfaEnrollment,
    INITIAL_PRIVATE_MFA_STATE,
  );
  const guardChallengeSubmission = useSingleSubmission(challengePending);
  const guardEnrollmentSubmission = useSingleSubmission(enrollPending || verificationPending);

  const completion = mode === "challenge" ? challengeState : verificationState;
  const qrCodeSrc = enrollState.qrCode?.trimEnd() || null;
  useEffect(() => {
    if (completion.status === "success" && completion.destination) {
      router.replace(completion.destination);
      router.refresh();
    }
  }, [completion.destination, completion.status, router]);

  return (
    <main className="im-private-auth im-private-auth--restricted">
      <div className="im-private-auth__grid" aria-hidden="true" />
      <section className="im-private-auth__shell im-private-auth__shell--mfa">
        <header className="im-private-auth__topbar">
          <div className="im-private-auth__brand">
            <IndesyBrandMark size={30} />
            <span><strong>INDESY</strong><small>VERIFICATION LAYER</small></span>
          </div>
          <IndesyThemeToggle />
        </header>

        <IndesyPanel
          accent
          kicker="Super Admin · MFA"
          title={mode === "enroll" ? "Activer l’authentification renforcée" : "Confirmer votre identité"}
          className="im-private-auth__mfa-panel"
        >
          {configurationError ? (
            <p className="im-private-auth__message" role="alert">
              Le service MFA Supabase n’est pas disponible. Vérifiez la configuration distante avant de réessayer.
            </p>
          ) : mode === "challenge" ? (
            <form action={challengeAction} className="im-private-auth__form" onSubmit={guardChallengeSubmission}>
              <input type="hidden" name="next" value={next} />
              <p className="im-private-auth__hint">Saisissez le code à six chiffres généré par votre application d’authentification.</p>
              <label htmlFor="mfa-code">Code de vérification</label>
              <input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
              {challengeState.message ? <p className="im-private-auth__message" role="alert">{challengeState.message}</p> : null}
              {challengePending ? <IndesyDualOrbitLoader variant="compact" label="Vérification du second facteur" /> : null}
              <IndesyButton type="submit" scale="lg" className="w-full" disabled={challengePending} icon={<ShieldCheck size={16} aria-hidden="true" />}>
                {challengePending ? "Vérification…" : "Valider le second facteur"}
              </IndesyButton>
            </form>
          ) : enrollState.status !== "ready" ? (
            <form action={enrollAction} className="im-private-auth__form" onSubmit={guardEnrollmentSubmission}>
              <input type="hidden" name="intent" value="enroll" />
              <p className="im-private-auth__hint">Associez une application TOTP. Aucun code simulé ni secret applicatif n’est utilisé.</p>
              {enrollState.message ? <p className="im-private-auth__message" role="alert">{enrollState.message}</p> : null}
              {enrollPending ? <IndesyDualOrbitLoader variant="compact" label="Préparation de l’enrôlement MFA" /> : null}
              <IndesyButton type="submit" scale="lg" className="w-full" disabled={enrollPending} icon={<QrCode size={16} aria-hidden="true" />}>
                {enrollPending ? "Préparation…" : "Configurer l’Authenticator"}
              </IndesyButton>
            </form>
          ) : (
            <div className="im-private-auth__enrollment">
              <p className="im-private-auth__hint">Scannez ce QR code, puis confirmez avec le code généré. La clé ci-dessous n’est affichée que pour la saisie manuelle.</p>
              {qrCodeSrc ? (
                <Image
                  src={qrCodeSrc}
                  alt="QR code d’enrôlement TOTP"
                  className="im-private-auth__qr"
                  width={230}
                  height={230}
                  unoptimized
                />
              ) : (
                <p role="status">Génération du QR code…</p>
              )}
              <code>{enrollState.secret}</code>
              <form action={verificationAction} className="im-private-auth__form" onSubmit={guardEnrollmentSubmission}>
                <input type="hidden" name="factorId" value={enrollState.factorId ?? ""} />
                <input type="hidden" name="next" value={next} />
                <label htmlFor="mfa-enroll-code">Code de vérification</label>
                <input id="mfa-enroll-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
                {verificationState.message ? <p className="im-private-auth__message" role="alert">{verificationState.message}</p> : null}
                {verificationPending ? <IndesyDualOrbitLoader variant="compact" label="Activation du second facteur" /> : null}
                <IndesyButton type="submit" scale="lg" className="w-full" disabled={verificationPending} icon={<KeyRound size={16} aria-hidden="true" />}>
                  {verificationPending ? "Activation…" : "Activer et continuer"}
                </IndesyButton>
              </form>
              <form action={enrollAction} className="im-private-auth__form" onSubmit={guardEnrollmentSubmission}>
                <input type="hidden" name="intent" value="regenerate" />
                <input type="hidden" name="factorId" value={enrollState.factorId ?? ""} />
                <IndesyButton
                  type="submit"
                  tone="secondary"
                  className="w-full"
                  disabled={enrollPending || verificationPending}
                  icon={<QrCode size={16} aria-hidden="true" />}
                >
                  {enrollPending ? "Génération…" : "Générer un nouveau QR"}
                </IndesyButton>
              </form>
            </div>
          )}
        </IndesyPanel>
      </section>
    </main>
  );
}
