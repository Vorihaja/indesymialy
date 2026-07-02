"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ErpAuthGuardProps = {
  children: ReactNode;
};

export default function ErpAuthGuard({ children }: ErpAuthGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error || !data?.session) {
        router.replace("/auth");
      } else {
        setChecked(true);
      }
    };

    verifySession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!isMounted) return;
      if (!session) {
        router.replace("/auth");
      } else {
        setChecked(true);
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 text-sm">
        Vérification de la session...
      </div>
    );
  }

  return <>{children}</>;
}
