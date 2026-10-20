"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import {
  useRealErpData,
  type RealErpRole,
} from "@/modules/erp-core/real-data";
import {
  resolveCanonicalErpRole,
  resolveErpModuleEntry,
} from "@/modules/erp-dispatch-registry";
import { normalizeBackendError } from "@/shared/errors/backend-error";
import { RealDataTable } from "./RealDataTable";
import { OrganizerEventsTable } from "./OrganizerEventsTable";
import {
  OrganizerToast,
  organizerButtonClass,
  type OrganizerToastState,
} from "./OrganizerFeedback";
import {
  calculateEventReadiness,
  EventCreationWizard,
  type EventWizardDraft,
} from "./EventCreationWizard";
import { useOrganizerEventWorkflow } from "../real-data/useOrganizerEventWorkflow";
import { CoorganizationView } from "./CoorganizationView";

type RealModuleDataViewProps = {
  role: RealErpRole;
  moduleId: string;
  moduleLabel: string;
  tab: string;
  onTabChange?: (tab: string) => void;
  autoOpenCreate?: boolean;
  initialEventId?: string;
};

export function RealModuleDataView(props: RealModuleDataViewProps) {
  const {
    role,
    moduleId,
    moduleLabel,
    tab,
  } = props;
  const resolvedRegistryEntry = resolveErpModuleEntry(
    resolveCanonicalErpRole(role) ?? role,
    moduleId,
  );

  if (!resolvedRegistryEntry) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `[ERP dispatch] Missing registry entry for ${role}/${moduleId}`,
      );
    }

    return (
      <section
        role="status"
        className="grid min-h-56 place-items-center border border-red-500/30 bg-[#151619] p-6 text-center"
      >
        <div>
          <TriangleAlert className="mx-auto text-red-400" size={22} />
          <p className="mt-3 text-[12px] font-semibold text-zinc-100">
            Module non modifiable
          </p>
          <p className="mt-1 max-w-lg text-[11px] leading-5 text-zinc-500">
            Ce module n’a pas encore de registre ERP valide et ne peut pas être
            exposé en production.
          </p>
        </div>
      </section>
    );
  }

  if (resolvedRegistryEntry.implementationStatus === "unavailable") {
    return (
      <section
        role="status"
        className="grid min-h-56 place-items-center border border-amber-500/30 bg-[#151619] p-6 text-center"
      >
        <div>
          <TriangleAlert className="mx-auto text-amber-400" size={22} />
          <p className="mt-3 text-[12px] font-semibold text-zinc-100">
            Module en cours de développement
          </p>
          <p className="mt-1 max-w-lg text-[11px] leading-5 text-zinc-500">
            La section {moduleLabel} · {tab} n’a pas encore de handler métier
            explicite. Aucune donnée ne peut être créée ou modifiée depuis cet
            écran.
          </p>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-300">
            Référence : {role}/{moduleId}
          </p>
        </div>
      </section>
    );
  }

  return <AvailableRealModuleDataView {...props} />;
}

function AvailableRealModuleDataView({
  role,
  moduleId,
  moduleLabel,
  tab,
  autoOpenCreate = false,
  initialEventId,
}: RealModuleDataViewProps) {
  const query = {
    role,
    moduleId,
    moduleLabel,
    tab,
  };

  const {
    data,
    loading,
    mutating,
    error,
    refresh,
    create,
    update,
    remove,
  } = useRealErpData(query);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardEventId, setWizardEventId] = useState<string | null>(null);
  const [wizardInitial, setWizardInitial] = useState<EventWizardDraft | undefined>();
  const [feedback, setFeedback] = useState<OrganizerToastState>(null);

  const workflow = useOrganizerEventWorkflow(refresh);
  const automaticOpenHandled = useRef(false);

  useEffect(() => {
    if (role === "organizer" && data?.entity === "events") {
      void workflow.loadCandidates().catch((reason) =>
        setFeedback({
          message: normalizeBackendError(reason).message,
          tone: "warning",
        }),
      );
    }
  // The workflow object is intentionally excluded because its method identities
  // are recreated by the legacy hook on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.entity, role]);

  useEffect(() => {
    if (
      automaticOpenHandled.current ||
      role !== "organizer" ||
      data?.entity !== "events"
    ) {
      return;
    }

    if (initialEventId) {
      automaticOpenHandled.current = true;

      void workflow
        .load(initialEventId)
        .then((draft) => {
          setWizardEventId(initialEventId);
          setWizardInitial(draft);
          setWizardOpen(true);
        })
        .catch((reason) => {
          automaticOpenHandled.current = false;
          setFeedback({
            message: normalizeBackendError(reason).message,
            tone: "error",
          });
        });

      return;
    }

    if (autoOpenCreate) {
      automaticOpenHandled.current = true;
      // This one-shot route intent deliberately initializes the existing wizard.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWizardEventId(null);
      setWizardInitial(undefined);
      setWizardOpen(true);
    }
  // The workflow object is intentionally excluded because its method identities
  // are recreated by the legacy hook on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoOpenCreate,
    data?.entity,
    initialEventId,
    role,
  ]);

  const enhancedData = useMemo(() => {
    if (!data || role !== "organizer") {
      return data;
    }

    const officialEntity =
      data.entity === "event_official_assignments" ||
      data.entity === "fight_official_assignments";

    if (!officialEntity) {
      return data;
    }

    return {
      ...data,
      fields: data.fields.map((field) => {
        if (field.name !== "role") {
          return field;
        }

        const options = field.options ?? [];

        if (options.some((option) => option.value === "announcer")) {
          return field;
        }

        return {
          ...field,
          options: [
            ...options,
            {
              label: "Annonceur",
              value: "announcer",
            },
          ],
        };
      }),
    };
  }, [data, role]);

  if (
    role === "organizer" &&
    moduleId === "events" &&
    tab === "coorganizations"
  ) {
    return <CoorganizationView onChanged={refresh} />;
  }

  if (loading) {
    return (
      <IndesyDualOrbitLoader
        variant="section"
        label={`Chargement du module ${moduleLabel}`}
      />
    );
  }

  if (error || !data || !enhancedData) {
    return (
      <div className="grid min-h-56 place-items-center border border-red-500/30 bg-[#151619] p-6 text-center">
        <div>
          <TriangleAlert className="mx-auto text-red-400" size={22} />

          <p className="mt-3 text-[12px] font-semibold text-zinc-200">
            Données indisponibles
          </p>

          <p className="mt-1 max-w-lg text-[11px] text-zinc-500">
            {error ?? "La source de données n’a renvoyé aucune réponse."}
          </p>

          <button
            type="button"
            onClick={() => void refresh()}
            className={`${organizerButtonClass} mt-4`}
          >
            <RefreshCw size={13} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (
    enhancedData.implementationStatus ===
    "unavailable"
  ) {
    return (
      <section
        role="status"
        className="grid min-h-56 place-items-center border border-amber-500/30 bg-[#151619] p-6 text-center"
      >
        <div>
          <TriangleAlert
            className="mx-auto text-amber-400"
            size={22}
          />

          <p className="mt-3 text-[12px] font-semibold text-zinc-100">
            Module en cours de développement
          </p>

          <p className="mt-1 max-w-lg text-[11px] leading-5 text-zinc-500">
            La section {moduleLabel} · {tab} ne possède pas encore
            de handler métier explicite. Aucune donnée ne peut
            être créée ou modifiée depuis cet écran.
          </p>

          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-300">
            Référence : {role}/{moduleId}
          </p>
        </div>
      </section>
    );
  }

  const richEventWorkflow =
    role === "organizer" && data.entity === "events";

  const organizerEventList =
    richEventWorkflow &&
    moduleId === "events" &&
    tab === "all-events";

  const openCreate = richEventWorkflow
    ? () => {
        setWizardEventId(null);
        setWizardInitial(undefined);
        setWizardOpen(true);
      }
    : undefined;

  const openEdit = richEventWorkflow
    ? async (id: string) => {
        try {
          const draft = await workflow.load(id);
          setWizardEventId(id);
          setWizardInitial(draft);
          setWizardOpen(true);
        } catch (reason) {
          setFeedback({
            message: normalizeBackendError(reason).message,
            tone: "error",
          });
        }
      }
    : undefined;

  return (
    <>
      <OrganizerToast toast={feedback} onClose={() => setFeedback(null)} />

      {organizerEventList ? (
        <OrganizerEventsTable
          eventIds={data.rowIds}
          kpis={data.kpis}
          mutating={mutating || workflow.loading}
          onCreate={() => openCreate?.()}
          onEdit={(id) => openEdit?.(id)}
          onDelete={(id) => remove(data.entity, id)}
          onChanged={refresh}
        />
      ) : (
        <RealDataTable
          data={enhancedData}
          tab={tab}
          mutating={mutating || workflow.loading}
          onCreate={(values) =>
            create({
              entity: data.entity,
              values,
              scope: {
                role,
                moduleId,
                tab,
              },
            })
          }
          onUpdate={(id, values) =>
            update(id, {
              entity: data.entity,
              values,
            })
          }
          onDelete={(id) => remove(data.entity, id)}
          onCreateRequest={openCreate}
          onEditRequest={openEdit}
        />
      )}

      {richEventWorkflow && (
        <EventCreationWizard
          key={`${wizardEventId ?? "new"}-${wizardOpen}`}
          open={wizardOpen}
          initialValue={wizardInitial}
          coorganizerCandidates={workflow.candidates}
          searchOfficialCandidates={workflow.searchOfficialCandidates}
          onClose={() => setWizardOpen(false)}
          onSave={async (_row, mode, draft) => {
            await workflow.save(
              wizardEventId,
              draft,
              mode,
              calculateEventReadiness(draft),
            );

            setWizardOpen(false);

            setFeedback({
              message: wizardEventId
                ? "Événement mis à jour."
                : "Événement créé avec succès.",
              tone: "success",
            });
          }}
        />
      )}
    </>
  );
}
