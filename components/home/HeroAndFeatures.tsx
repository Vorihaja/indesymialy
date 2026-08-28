"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Radio,
  Shield,
  Store,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  tag: string;
  href: string;
  accent: "red" | "blue";
}

const FEATURES: FeatureCardProps[] = [
  {
    title: "Profils de combattants",
    description:
      "Records, classements, disciplines, clubs, palmarès et parcours publics réunis dans une identité sportive vérifiable.",
    icon: <Shield aria-hidden="true" />,
    tag: "Athlètes",
    href: "/fighters",
    accent: "red",
  },
  {
    title: "Gestion d’événements",
    description:
      "Compétitions, inscriptions, fight cards, officiels, billetterie et organisation opérationnelle depuis un seul environnement.",
    icon: <Target aria-hidden="true" />,
    tag: "Organisation",
    href: "/events",
    accent: "blue",
  },
  {
    title: "Workspaces professionnels",
    description:
      "Des ERP spécialisés pour les clubs, coachs, organisateurs, officiels, fédérations, sponsors et vendeurs.",
    icon: <Zap aria-hidden="true" />,
    tag: "ERP",
    href: "/auth/register",
    accent: "red",
  },
  {
    title: "Marketplace spécialisée",
    description:
      "Équipements, produits, locations et occasions proposés par les vendeurs de l’écosystème des sports de combat.",
    icon: <Store aria-hidden="true" />,
    tag: "Commerce",
    href: "/marketplace",
    accent: "blue",
  },
];

function FeatureCard({
  title,
  description,
  icon,
  tag,
  href,
  accent,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const pointerXSpring = useSpring(pointerX, {
    stiffness: 180,
    damping: 24,
  });

  const pointerYSpring = useSpring(pointerY, {
    stiffness: 180,
    damping: 24,
  });

  const glowXSpring = useSpring(glowX, {
    stiffness: 280,
    damping: 28,
  });

  const glowYSpring = useSpring(glowY, {
    stiffness: 280,
    damping: 28,
  });

  const rotateX = useTransform(
    pointerYSpring,
    [-0.5, 0.5],
    reduceMotion ? ["0deg", "0deg"] : ["3deg", "-3deg"],
  );

  const rotateY = useTransform(
    pointerXSpring,
    [-0.5, 0.5],
    reduceMotion ? ["0deg", "0deg"] : ["-3deg", "3deg"],
  );

  const handlePointerMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const element = cardRef.current;

    if (!element || reduceMotion) {
      return;
    }

    const bounds = element.getBoundingClientRect();
    const relativeX = event.clientX - bounds.left;
    const relativeY = event.clientY - bounds.top;

    pointerX.set(relativeX / bounds.width - 0.5);
    pointerY.set(relativeY / bounds.height - 0.5);

    glowX.set(relativeX);
    glowY.set(relativeY);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.a
      ref={cardRef}
      href={href}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
      onBlur={resetPointer}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`home-capability-card home-capability-card-${accent}`}
    >
      <motion.span
        aria-hidden="true"
        className="home-capability-glow"
        style={{
          left: glowXSpring,
          top: glowYSpring,
        }}
      />

      <span className="home-capability-topline">
        <span className="home-capability-icon">{icon}</span>
        <span className="home-capability-tag">{tag}</span>
      </span>

      <span className="home-capability-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>

      <span className="home-capability-link">
        Explorer
        <ArrowRight size={16} aria-hidden="true" />
      </span>
    </motion.a>
  );
}

export default function HeroAndFeatures() {
  const reduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 22,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.55,
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      className="home-platform-capabilities"
      aria-labelledby="home-platform-capabilities-title"
    >
      <div className="home-platform-capabilities-grid" aria-hidden="true" />

      <motion.div
        className="home-platform-capabilities-inner"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true,
          amount: 0.16,
        }}
      >
        <motion.header
          className="home-platform-capabilities-header"
          variants={itemVariants}
        >
          <div>
            <div className="public-eyebrow">
              L’écosystème Indesy Mialy
            </div>

            <h2
              id="home-platform-capabilities-title"
              className="ds-h2"
            >
              Toute la scène des sports de combat.
              <span> Une seule plateforme.</span>
            </h2>

            <p>
              Indesy Mialy relie les athlètes, les clubs, les organisateurs,
              les officiels, les supporters et les acteurs économiques autour
              d’un environnement numérique national.
            </p>
          </div>

          <div className="home-platform-capabilities-status">
            <Radio aria-hidden="true" />
            <span>
              Plateforme nationale
              <strong>Écosystème actif</strong>
            </span>
          </div>
        </motion.header>

        <motion.div
          className="home-platform-capabilities-cards"
          variants={containerVariants}
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="home-platform-capabilities-footer"
          variants={itemVariants}
        >
          <div className="home-platform-capabilities-proof">
            <span>
              <Users aria-hidden="true" />
              Profils sportifs
            </span>

            <span>
              <Trophy aria-hidden="true" />
              Compétitions
            </span>

            <span>
              <Radio aria-hidden="true" />
              Fight Live
            </span>
          </div>

          <div className="home-platform-capabilities-actions">
            <Link
              href="/annuaire"
              className="ds-button ds-outline"
            >
              Explorer l’annuaire
            </Link>

            <Link
              href="/auth/register"
              className="ds-button ds-primary"
            >
              Rejoindre la plateforme
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}