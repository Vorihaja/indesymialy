"use client";

import {
  useEffect,
} from "react";
import {
  useRouter,
} from "next/navigation";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import {
  useOfficialFunction,
} from "../function-context";

export function LegacyJudgeRedirect({
  target,
}: {
  target: string;
}) {
  const router = useRouter();
  const {
    setOfficialFunction,
  } = useOfficialFunction();

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setOfficialFunction("judge");
        router.replace(target);
      },
      0,
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    router,
    setOfficialFunction,
    target,
  ]);

  return (
    <IndesyDualOrbitLoader
      variant="section"
      label="Ouverture de l'espace Officiel"
    />
  );
}
