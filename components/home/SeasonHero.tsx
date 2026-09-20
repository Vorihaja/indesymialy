"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Swords,
  Trophy,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import { useHomeSeason, type HomeSeasonEvent } from "@/modules/home-season";

import styles from "./SeasonHero.module.css";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-MG", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Indian/Antananarivo",
});

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  scheduled: "Programmé",
  confirmed: "Confirmé",
  ongoing: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  postponed: "Reporté",
};

function statusLabel(status: string | null) {
  if (!status) return "Publié";
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

function EventPanel({ event }: { event: HomeSeasonEvent }) {
  return (
    <article className={styles.eventCard} aria-labelledby="next-event-title">
      <div className={styles.eventHeader}>
        <span>Prochain rendez-vous</span>
        <span className={styles.status}>
          <CheckCircle2 aria-hidden="true" size={14} />
          {statusLabel(event.status)}
        </span>
      </div>

      <div className={styles.eventBody}>
        <p className={styles.eventType}>{event.type ?? "Événement sportif"}</p>
        <h2 id="next-event-title">{event.title}</h2>

        <dl className={styles.eventMeta}>
          <div>
            <dt><CalendarDays aria-hidden="true" /> Date</dt>
            <dd>{DATE_FORMATTER.format(new Date(event.startsAt))}</dd>
          </div>
          {event.venue ? (
            <div>
              <dt><MapPin aria-hidden="true" /> Lieu</dt>
              <dd>{event.venue}</dd>
            </div>
          ) : null}
        </dl>

        <Link href={`/events/${event.id}`} className={styles.eventLink}>
          Voir l’événement <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function SeasonHero() {
  const { snapshot, loading, error, refresh } = useHomeSeason();
  const statistics = snapshot
    ? [
        ["Événements", snapshot.statistics.events],
        ["À venir", snapshot.statistics.upcoming],
        ["Terminés", snapshot.statistics.completed],
        ["Combats programmés", snapshot.statistics.fights],
      ] as const
    : [];

  return (
    <section className={styles.hero} aria-labelledby="season-hero-title">
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <Trophy aria-hidden="true" size={15} />
            {snapshot ? `Saison ${snapshot.season}` : "Calendrier national"}
          </p>
          <h1 id="season-hero-title">Saison en cours</h1>
          <p className={styles.lead}>
            Le prochain rendez-vous public et l’activité sportive de l’année,
            directement issus des données Indesy Mialy.
          </p>

          <div className={styles.actions}>
            <Link href="/events" className={styles.primaryAction}>
              Voir les événements <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link href="/fighters" className={styles.secondaryAction}>
              Découvrir les combattants <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>

          {snapshot ? (
            <div className={styles.statistics} aria-label={`Statistiques de la saison ${snapshot.season}`}>
              {statistics.map(([label, value]) => (
                <div key={label}>
                  <strong>{value.toLocaleString("fr-MG")}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.dataPanel} aria-live="polite">
          {loading ? (
            <IndesyDualOrbitLoader variant="data" label="Chargement des données de la saison" />
          ) : error ? (
            <div className={styles.feedback} role="status">
              <Clock3 aria-hidden="true" />
              <h2>Données momentanément indisponibles</h2>
              <p>
                La page reste accessible. Réessayez pour actualiser le prochain
                événement et les statistiques de saison.
              </p>
              <button type="button" onClick={() => void refresh()}>
                <RefreshCw aria-hidden="true" size={15} /> Réessayer
              </button>
            </div>
          ) : snapshot?.nextEvent ? (
            <EventPanel event={snapshot.nextEvent} />
          ) : (
            <div className={styles.feedback} role="status">
              <Swords aria-hidden="true" />
              <h2>Aucun événement à venir</h2>
              <p>
                Aucun rendez-vous public n’est encore programmé. Le calendrier
                sera mis à jour dès la prochaine publication.
              </p>
              <Link href="/events">Consulter le calendrier</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
