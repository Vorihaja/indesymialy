"use client";

import {
  SuperAdminErrorState,
  SuperAdminLoadingState,
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  useSuperAdminGovernance,
} from "../hooks/useSuperAdminGovernance";

export function SuperAdminAccessLogsFeature() {
  const governance =
    useSuperAdminGovernance();

  if (governance.loading) {
    return <SuperAdminLoadingState />;
  }

  if (governance.error) {
    return (
      <SuperAdminErrorState
        message={governance.error}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
          Governance Audit
        </p>

        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
          Access Logs
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Historique réel des attributions, révocations et changements de permissions administratives.
        </p>
      </header>

      <SuperAdminPanel
        title={`100 dernières opérations · ${governance.logs.length} affichée(s)`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-xs">
            <thead>
              <tr className="border-b border-[#30343c] text-left text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600">
                <th className="p-3">
                  Date
                </th>

                <th className="p-3">
                  Auteur
                </th>

                <th className="p-3">
                  Action
                </th>

                <th className="p-3">
                  Cible
                </th>

                <th className="p-3">
                  Détails
                </th>
              </tr>
            </thead>

            <tbody>
              {governance.logs.map(
                (log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[#202228]"
                  >
                    <td className="whitespace-nowrap p-3 text-zinc-500">
                      {new Date(
                        log.createdAt,
                      ).toLocaleString(
                        "fr-FR",
                      )}
                    </td>

                    <td className="p-3 font-semibold text-zinc-300">
                      {log.actorName ??
                        log.actorProfileId}
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-[10px] font-bold text-[#2588ff]">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3 text-zinc-400">
                      {log.targetName ??
                        log.targetProfileId ??
                        "—"}
                    </td>

                    <td className="max-w-[420px] p-3 font-mono text-[10px] text-zinc-600">
                      {JSON.stringify(
                        log.details,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {!governance.logs.length && (
            <p className="p-8 text-center text-sm text-zinc-600">
              Aucun changement administratif enregistré pour le moment.
            </p>
          )}
        </div>
      </SuperAdminPanel>
    </div>
  );
}
