"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, CheckCircle2, XCircle, Info, X } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  created_at: string;
  is_read?: boolean;
}

export default function TopbarNotifications() {
  const [session, setSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        void fetchNotifications(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        void fetchNotifications(session.user.id);
      } else {
        setNotifications([]);
        setIsOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotifications = async (userId: string) => {
    const items: NotificationItem[] = [];

    // 1. Charger depuis user_notifications
    const { data: notifs } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (notifs && notifs.length > 0) {
      notifs.forEach((n: any) => {
        items.push({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type === "success" || n.type === "error" ? n.type : "info",
          created_at: n.created_at,
          is_read: n.is_read,
        });
      });
    }

    // 2. Charger les role_requests traitées comme fallback/complément
    const { data: requests } = await supabase
      .from("role_requests")
      .select("id, status, reviewed_at, roles(label, slug)")
      .eq("user_id", userId)
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false });

    if (requests && requests.length > 0) {
      requests.forEach((req: any) => {
        const role = Array.isArray(req.roles) ? req.roles[0] : req.roles;
        const roleName = role?.label || role?.slug || "rôle";
        const alreadyExists = items.some(i => i.id === req.id || i.created_at === req.reviewed_at);

        if (!alreadyExists) {
          if (req.status === "approved") {
            items.push({
              id: req.id,
              title: "Demande de rôle validée",
              message: `Votre demande pour le rôle ${roleName} a été validée.`,
              type: "success",
              created_at: req.reviewed_at || new Date().toISOString(),
              is_read: false,
            });
          } else if (req.status === "rejected") {
            items.push({
              id: req.id,
              title: "Demande de rôle rejetée",
              message: `Votre demande pour le rôle ${roleName} a été rejetée.`,
              type: "error",
              created_at: req.reviewed_at || new Date().toISOString(),
              is_read: false,
            });
          }
        }
      });
    }

    setNotifications(items);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 border border-neutral-800 bg-neutral-900/40 rounded-lg text-neutral-400 hover:text-amber-300 hover:border-amber-500/50 transition-all duration-300"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-mono font-bold text-white shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[300] mt-2 w-80 sm:w-96 border border-neutral-800 bg-neutral-950/95 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Bell size={14} className="text-amber-400" />
              Notifications ({notifications.length})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs font-mono text-zinc-500">
                Aucune notification pour le moment.
              </p>
            ) : (
              notifications.map((item) => {
                const isSuccess = item.type === "success";
                const isError = item.type === "error";

                return (
                  <div
                    key={item.id}
                    className={`p-3 border transition-colors ${
                      isSuccess
                        ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                        : isError
                        ? "border-red-500/30 bg-red-950/20 text-red-300"
                        : "border-neutral-800 bg-neutral-900/40 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
                      {isError && <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                      {!isSuccess && !isError && <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />}

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-mono font-bold uppercase tracking-wide ${
                          isSuccess ? "text-emerald-400" : isError ? "text-red-400" : "text-white"
                        }`}>
                          {item.title}
                        </h4>
                        <p className={`text-xs mt-1 leading-relaxed ${
                          isSuccess ? "text-emerald-300" : isError ? "text-red-300" : "text-zinc-400"
                        }`}>
                          {item.message}
                        </p>
                        <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}