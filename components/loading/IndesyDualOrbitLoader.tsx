import styles from "./IndesyDualOrbitLoader.module.css";

const LOGO_URL =
  "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo";

export type IndesyDualOrbitLoaderVariant =
  | "page"
  | "section"
  | "data"
  | "compact";

interface IndesyDualOrbitLoaderProps {
  label?: string;
  variant?: IndesyDualOrbitLoaderVariant;
}

export default function IndesyDualOrbitLoader({
  label = "Chargement de Indesy Mialy",
  variant = "page",
}: IndesyDualOrbitLoaderProps) {
  return (
    <div
      className={styles.screen}
      data-variant={variant}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={styles.backgroundGrid} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.stage} aria-hidden="true">
          {/* Cercle structurel */}
          <div className={styles.outerRing} />
          <div className={styles.innerRing} />

          {/* Tensions successives avant la fusion */}
          <div className={styles.tensionRing} />
          <div className={styles.tensionRingSecondary} />

          {/* ÉNERGIE ROUGE */}
          <div className={`${styles.orbit} ${styles.redOrbit}`}>
            <div className={`${styles.orbitTrail} ${styles.redTrail}`} />

            <span className={`${styles.energyCore} ${styles.redEnergy}`}>
              <span className={styles.energySpark} />
            </span>
          </div>

          {/* ÉNERGIE BLEUE */}
          <div className={`${styles.orbit} ${styles.blueOrbit}`}>
            <div className={`${styles.orbitTrail} ${styles.blueTrail}`} />

            <span className={`${styles.energyCore} ${styles.blueEnergy}`}>
              <span className={styles.energySpark} />
            </span>
          </div>

          {/* Fusion */}
          <div className={styles.fusionHalo} />
          <div className={styles.fusionCore} />
          <div className={styles.impactWave} />
          <div className={styles.flash} />

          {/* Révélation de l'identité */}
          <div className={styles.logoReveal}>
            <div className={styles.logoEnergy} />

            <img
              className={styles.logo}
              src={LOGO_URL}
              alt=""
              width={320}
              height={250}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.brand}>
            INDESY
            <span> MIALY</span>
          </div>

          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressEnergy} />
          </div>

          <div className={styles.loadingText}>
            Chargement
            <span className={styles.dots} aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
