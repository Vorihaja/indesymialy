"use client";

import type {
  AdminActivity,
} from "../../types";

interface AdminActivityListProps {
  activities: AdminActivity[] | null;
}

export default function AdminActivityList({
  activities,
}: AdminActivityListProps) {
  return (
    <section className="border border-neutral-800 bg-neutral-950 p-5">
      <h2 className="mb-4 text-xs font-mono uppercase tracking-widest text-neutral-400">
        Activité récente
      </h2>

      {activities === null ? (
        <p className="text-sm font-mono text-neutral-500">
          Source d’activité récente non implémentée.
        </p>
      ) : activities.length === 0 ? (
        <p className="text-sm font-mono text-neutral-500">
          Aucune activité récente
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border-b border-neutral-800 pb-3 last:border-none"
            >
              <p className="text-sm font-mono text-white">
                {activity.title}
              </p>

              {activity.description ? (
                <p className="mt-1 text-xs font-mono text-neutral-500">
                  {activity.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}