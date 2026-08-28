"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthContext } from "@/providers/auth/auth-context";
import {
  Field,
  FormMessage,
  IdentityFrame,
  identityControlClass,
  identityPanelClass,
  identityPrimaryActionClass,
} from "../components/IdentityViews";
import { normalizeIdentityError } from "../errors";
import { useIdentity } from "../hooks/useIdentity";
import {
  IDENTITY_ROLE_LABELS,
  PUBLIC_IDENTITY_ROLES,
  ROLE_REQUEST_STATUS_LABELS,
  getIdentityRoleLabel,
  isControlledIdentityRole,
  type PublicIdentityRole,
} from "../role-policy";

type Props = {
  mode?: "list" | "new" | "detail";
  requestId?: string;
};

const REQUEST_STATUS_CLASS: Record<keyof typeof ROLE_REQUEST_STATUS_LABELS, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  rejected: "border-red-500/30 bg-red-500/10 text-red-200",
  suspended: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  withdrawn: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

export function RoleRequestsFeature({ mode = "list", requestId }: Props) {
  const api = useIdentity();
  const { refreshUser } = useAuthContext();
  const [role, setRole] = useState<PublicIdentityRole>("coach");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (api.loading) return <IdentityFrame eyebrow="Accès" title="Mes demandes de rôles" description="Chargement des demandes…"><p className={identityPanelClass}>Chargement des demandes…</p></IdentityFrame>;
  if (!api.state) return <IdentityFrame eyebrow="Accès" title="Mes demandes de rôles" description="Impossible de charger les demandes."><FormMessage error={api.error ?? "Impossible de charger les demandes."}/></IdentityFrame>;

  const activeRoles = new Set([
    api.state.draft.profile.primaryRole,
    ...api.state.draft.profile.secondaryRoles,
  ]);
  const pendingRoles = new Set(
    api.state.roleRequests
      .filter((request) => request.status === "pending")
      .map((request) => request.role),
  );
  const requests = requestId
    ? api.state.roleRequests.filter((request) => request.id === requestId)
    : api.state.roleRequests;
  const controlled = isControlledIdentityRole(role);

  const submit = async () => {
    setMessage(null);
    setSubmissionError(null);
    if (controlled && reason.trim().length < 10) {
      setSubmissionError("Le motif doit contenir au moins 10 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      const outcome = await api.useCase.requestRole(role, controlled ? reason : "", []);
      await Promise.all([api.refresh(), refreshUser()]);
      if (outcome.kind === "assigned") {
        setMessage(`Le rôle ${IDENTITY_ROLE_LABELS[role]} est maintenant actif.`);
      } else if (outcome.kind === "already_assigned") {
        setMessage(`Le rôle ${IDENTITY_ROLE_LABELS[role]} est déjà actif.`);
      } else {
        setMessage(`Votre demande ${IDENTITY_ROLE_LABELS[role]} est en attente de validation.`);
      }
      setReason("");
    } catch (error) {
      setSubmissionError(normalizeIdentityError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "new") {
    return (
      <IdentityFrame
        eyebrow="Accès"
        title="Ajouter ou demander un rôle"
        description="Les rôles souples sont activés immédiatement. Fédération et Ligue nécessitent une validation administrative."
        backHref="/role-requests"
        backLabel="Retour aux demandes"
      >
        <section className={`${identityPanelClass} space-y-4`}>
          <label className="block text-[12px] font-semibold text-zinc-300">
            Rôle
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as PublicIdentityRole);
                setMessage(null);
                setSubmissionError(null);
              }}
              className={identityControlClass}
            >
              {PUBLIC_IDENTITY_ROLES.map((availableRole) => {
                const unavailable = activeRoles.has(availableRole) || pendingRoles.has(availableRole);
                const suffix = activeRoles.has(availableRole)
                  ? " — déjà actif"
                  : pendingRoles.has(availableRole)
                    ? " — demande en attente"
                    : "";
                return (
                  <option key={availableRole} value={availableRole} disabled={unavailable}>
                    {IDENTITY_ROLE_LABELS[availableRole]}{suffix}
                  </option>
                );
              })}
            </select>
          </label>

          {controlled ? (
            <>
              <p className="border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                Ce rôle ne sera pas actif immédiatement. Une demande sera enregistrée avec le statut « En attente ».
              </p>
              <Field label="Motif de la demande" value={reason} onChange={setReason} />
            </>
          ) : (
            <p className="border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Ce rôle sera ajouté immédiatement à votre compte.
            </p>
          )}

          <button
            type="button"
            disabled={submitting || activeRoles.has(role) || pendingRoles.has(role)}
            onClick={() => void submit()}
            className={identityPrimaryActionClass}
          >
            {submitting ? "Traitement…" : controlled ? "Envoyer la demande" : "Activer ce rôle"}
          </button>
          <FormMessage error={submissionError} success={message} />
        </section>
      </IdentityFrame>
    );
  }

  return (
    <IdentityFrame
      eyebrow="Accès"
      title={mode === "detail" ? "Détail de la demande" : "Mes demandes de rôles"}
      description="Suivez ici les demandes Fédération et Ligue réellement enregistrées."
      backHref={mode === "detail" ? "/role-requests" : "/account/roles"}
      backLabel={mode === "detail" ? "Retour aux demandes" : "Retour aux rôles du compte"}
    >
      {mode === "list" && requests.some((request) => request.status === "pending") && (
        <p className="border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Votre demande est en attente. Le rôle concerné n’apparaîtra dans le sélecteur qu’après son approbation.
        </p>
      )}
      <div className="space-y-3">
        {requests.length ? requests.map((item) => (
          <Link href={`/role-requests/${item.id}`} key={item.id} className="block border border-[#303238] bg-[#151619] p-4 transition hover:border-[#3d92ff]/60">
            <div className="flex justify-between gap-4">
              <strong>{getIdentityRoleLabel(item.role)}</strong>
              <span className={`border px-2 py-1 text-xs font-semibold ${REQUEST_STATUS_CLASS[item.status]}`}>{ROLE_REQUEST_STATUS_LABELS[item.status]}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{item.reason}</p>
            <ul className="mt-2 text-xs text-zinc-500">
              {item.history.map((entry) => (
                <li key={`${entry.at}-${entry.status}`}>
                  {ROLE_REQUEST_STATUS_LABELS[entry.status]} · {new Date(entry.at).toLocaleString("fr-FR")}
                </li>
              ))}
            </ul>
          </Link>
        )) : (
          <p className="border border-dashed border-[#303238] bg-[#151619] p-5 text-center text-zinc-500">
            {mode === "detail" ? "Demande introuvable." : "Aucune demande Fédération ou Ligue."}
          </p>
        )}
      </div>
      {mode === "list" && (
        <Link href="/role-requests/new" className={identityPrimaryActionClass}>
          Ajouter ou demander un rôle
        </Link>
      )}
    </IdentityFrame>
  );
}
