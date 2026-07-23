"use client";

import { ReactNode, useEffect, useState } from "react";

import { getUserRoles } from "../services/permissions.service";

import { supabase } from "@/lib/supabase";

interface RoleGuardProps {
  role: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({
  role,
  children,
  fallback = null,
}: RoleGuardProps) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const roles = await getUserRoles(user.id);

      const hasRole = roles.some(
        (item) => item.slug === role
      );

      setAllowed(hasRole);
      setLoading(false);
    }

    checkRole();
  }, [role]);

  if (loading) return null;

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}