"use client";

import {
  type ReactNode,
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuthContext,
} from "@/providers/auth/index";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

type ErpAuthGuardProps = {
  children: ReactNode;
};

export default function ErpAuthGuard({
  children,
}: ErpAuthGuardProps) {
  const router =
    useRouter();

  const {
    loading,
    authenticated,
  } =
    useAuthContext();

  useEffect(() => {
    if (
      !loading &&
      !authenticated
    ) {
      router.replace(
        "/auth",
      );
    }
  }, [
    authenticated,
    loading,
    router,
  ]);

  if (loading) {
    return (
      <IndesyDualOrbitLoader
        variant="page"
        label="Vérification de votre session"
      />
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <>
      {children}
    </>
  );
}