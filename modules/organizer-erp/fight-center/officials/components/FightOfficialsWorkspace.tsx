'use client';

import {
  useMemo,
  useState,
} from 'react';
import {
  Loader2,
  TriangleAlert,
} from 'lucide-react';
import { FightOfficialEditor } from './FightOfficialEditor';
import { FightOfficialsBoard } from './FightOfficialsBoard';
import { useFightOfficials } from '../hooks/useFightOfficials';
import type {
  FightOfficialAssignment,
  FightOfficialRole,
  FightOfficialsFight,
} from '../types';

type EditorState = {
  fight: FightOfficialsFight;
  role: FightOfficialRole;
  position: number | null;
  current: FightOfficialAssignment | null;
} | null;

export function FightOfficialsWorkspace({
  eventId,
}: {
  eventId: string;
}) {
  const officials = useFightOfficials(eventId);
  const [editor, setEditor] = useState<EditorState>(null);

  const eventName = useMemo(
    () => officials.data?.eventName ?? 'Événement actif',
    [officials.data?.eventName],
  );

  if (officials.loading) {
    return (
      <section className="grid min-h-[280px] place-items-center border border-[#303238] bg-[#151619]">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <Loader2 size={15} className="animate-spin text-[#3d92ff]" />
          Chargement des officiels du Fight Center…
        </div>
      </section>
    );
  }

  if (officials.error && !officials.data) {
    return (
      <section className="border border-red-500/30 bg-[#151214] p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert size={18} className="mt-0.5 text-[#ff4058]" />
          <div>
            <strong className="text-[11px] font-semibold text-white">
              Officiels indisponibles
            </strong>
            <p className="mt-1 text-[9px] leading-5 text-zinc-500">
              {officials.error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const data = officials.data;

  if (!data) return null;

  return (
    <>
      {officials.error && (
        <section className="mb-3 flex items-start gap-3 border border-red-500/30 bg-red-500/5 p-3">
          <TriangleAlert size={15} className="mt-0.5 text-[#ff4058]" />
          <p className="text-[9px] leading-5 text-red-300/80">
            {officials.error}
          </p>
        </section>
      )}

      <FightOfficialsBoard
        eventName={eventName}
        fights={data.fights}
        candidates={data.candidates}
        unlinkedMentions={data.unlinkedMentions}
        mutating={officials.mutating}
        onRefresh={officials.refresh}
        onEdit={(fight, role, position, current) => {
          setEditor({
            fight,
            role,
            position,
            current,
          });
        }}
        onConfirm={(assignmentId) =>
          officials.setStatus(assignmentId, 'confirmed')
        }
        onCancel={(assignmentId) =>
          officials.setStatus(assignmentId, 'cancelled')
        }
      />

      <FightOfficialEditor
        open={Boolean(editor)}
        fight={editor?.fight ?? null}
        role={editor?.role ?? 'referee'}
        position={editor?.position ?? null}
        current={editor?.current ?? null}
        candidates={data.candidates}
        saving={officials.mutating}
        onClose={() => {
          if (officials.mutating) return;
          setEditor(null);
        }}
        onSave={async (userId) => {
          if (!editor) return;

          await officials.assign({
            fightId: editor.fight.fightId,
            userId,
            role: editor.role,
            position: editor.position,
          });

          setEditor(null);
        }}
      />
    </>
  );
}
