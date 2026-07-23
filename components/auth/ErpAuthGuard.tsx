"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ErpAuthGuardProps = {
  children: ReactNode;
};

export default function ErpAuthGuard({ children }: ErpAuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error || !session) {
        setIsAuthenticated(false);
        router.replace("/auth");
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    }

    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (!session) {
        setIsAuthenticated(false);
        router.replace("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#060a14] grid place-items-center text-white font-mono text-xs tracking-widest">
        VÉRIFICATION DE L'AUTHENTIFICATION...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
