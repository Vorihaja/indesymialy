"use client";

import { ReactNode, useEffect, useState } from "react";

import { getUserPermissions } from "../services/permissions.service";

import { supabase } from "@/lib/supabase";

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const permissions = await getUserPermissions(user.id);

      const hasPermission = permissions.some(
        (item) => item.code === permission
      );

      setAllowed(hasPermission);
      setLoading(false);
    }

    checkPermission();
  }, [permission]);

  if (loading) return null;

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}