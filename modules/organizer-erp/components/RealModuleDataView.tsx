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
import {
  useRealErpData,
  type RealErpRole,
} from "@/modules/erp-core/real-data";
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

export function RealModuleDataView({
  role,
  moduleId,
  moduleLabel,
  tab,
  autoOpenCreate = false,
  initialEventId,
}: {
  role: RealErpRole;
  moduleId: string;
  moduleLabel: string;
  tab: string;
  onTabChange?: (tab: string) => void;
  autoOpenCreate?: boolean;
  initialEventId?: string;
}) {
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
      setWizardEventId(null);
      setWizardInitial(undefined);
      setWizardOpen(true);
    }
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
    tab === "Coorganisations"
  ) {
    return <CoorganizationView onChanged={refresh} />;
  }

  if (loading) {
    return (
      <div
        className="grid min-h-56 place-items-center border border-[#303238] bg-[#151619]"
        aria-busy="true"
      >
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <RefreshCw
            size={15}
            className="animate-spin text-[#3d92ff]"
          />
          Chargement des données…
        </div>
      </div>
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

  const richEventWorkflow =
    role === "organizer" && data.entity === "events";

  const organizerEventList =
    richEventWorkflow &&
    moduleId === "events" &&
    tab === "Tous les événements";

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
