"use client";

import Link from "next/link";
import { useNotifications } from "@/modules/communication-core/hooks/useCommunication";
import type { CommunicationNotification } from "@/modules/communication-core/types";
import { projectKoranaActivities } from "../activities/activity-projection.mjs";

function activityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function KoranaActivityFeature() {
  const { items, loading } = useNotifications();
  const activities = projectKoranaActivities(items);

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#090a0c] text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#090a0c]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
        <h1 className="text-lg font-black tracking-[-0.025em]">
          Activités
        </h1>

        <p className="mt-1 text-[11px] text-zinc-500">
          Ce qui s&apos;est passé autour de votre compte, de vos échanges et de votre activité Indesy.
        </p>
      </header>

      <section className="space-y-3 p-4 sm:p-6" aria-label="Événements récents">
        {loading ? (
          <p className="border border-white/[0.07] bg-[#101216] p-5 text-sm text-zinc-500">
            Chargement des activités…
          </p>
        ) : activities.length === 0 ? (
          <p className="border border-dashed border-white/[0.12] p-5 text-sm text-zinc-500">
            Aucune activité récente.
          </p>
        ) : (
          activities.map((activity: CommunicationNotification) => (
            <article
              key={activity.id}
              className="border-l-2 border-[#3d92ff] border-y border-r border-white/[0.07] bg-[#101216] px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {activity.title}
                </h2>
                <time
                  dateTime={activity.createdAt}
                  className="text-xs text-zinc-500"
                >
                  {activityDate(activity.createdAt)}
                </time>
              </div>
              {activity.content && (
                <p className="mt-1 text-sm leading-5 text-zinc-400">
                  {activity.content}
                </p>
              )}
              {activity.actionUrl && (
                <Link
                  href={activity.actionUrl}
                  className="mt-2 inline-flex text-xs font-semibold text-[#9ccaff] hover:text-white"
                >
                  Voir l’événement
                </Link>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}