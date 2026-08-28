"use client";

import {
  Activity,
  Database,
  Radio,
} from "lucide-react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  SuperAdminAuthObservabilityFeature,
} from "./SuperAdminAuthObservabilityFeature";

import {
  SuperAdminRealtimeObservabilityFeature,
} from "./SuperAdminRealtimeObservabilityFeature";

import {
  SuperAdminSystemFeature,
} from "./SuperAdminSystemFeature";


type SystemTab =
  | "infrastructure"
  | "auth"
  | "realtime";


interface TabDefinition {
  id:
    SystemTab;

  label:
    string;

  description:
    string;
}


const TABS:
  TabDefinition[] = [

  {
    id:
      "infrastructure",

    label:
      "Infrastructure",

    description:
      "PostgreSQL, Supabase, HTTP et Storage",
  },

  {
    id:
      "auth",

    label:
      "Auth Observability",

    description:
      "Connexions, échecs et latence Auth",
  },

  {
    id:
      "realtime",

    label:
      "Realtime Observability",

    description:
      "Communication, Fight Live et canaux",
  },

];


function isSystemTab(
  value:
    string | null,
): value is SystemTab {

  return (
    value ===
      "infrastructure" ||
    value ===
      "auth" ||
    value ===
      "realtime" ||
    value ===
      "observability"
  );
}


function normalizeTab(
  value:
    string | null,
): SystemTab {

  /*
   * Preserve compatibility with the URL created by 3G-B:
   * ?tab=observability
   */
  if (
    value ===
    "observability"
  ) {

    return "auth";
  }


  if (
    isSystemTab(
      value,
    )
  ) {

    return value as SystemTab;
  }


  return "infrastructure";
}


export function SuperAdminSystemObservabilityFeature() {

  const router =
    useRouter();


  const pathname =
    usePathname();


  const searchParams =
    useSearchParams();


  const activeTab =
    normalizeTab(
      searchParams.get(
        "tab",
      ),
    );


  function selectTab(
    tab:
      SystemTab,
  ) {

    const params =
      new URLSearchParams(
        searchParams.toString(),
      );


    if (
      tab ===
      "infrastructure"
    ) {

      params.delete(
        "tab",
      );

    } else {

      params.set(
        "tab",
        tab,
      );
    }


    const query =
      params.toString();


    router.replace(
      query
        ? `${pathname}?${query}`
        : pathname,
      {
        scroll:
          false,
      },
    );
  }


  return (
    <div className="space-y-6">

      <div className="sticky top-0 z-30 border-b border-[#272a31] bg-[#090a0d]/95 pt-1 backdrop-blur-xl">

        <div className="flex min-w-0 gap-1 overflow-x-auto">

          {TABS.map(
            (
              tab,
            ) => {

              const selected =
                activeTab ===
                tab.id;


              const Icon =
                tab.id ===
                "infrastructure"
                  ? Database
                  : tab.id ===
                      "auth"
                    ? Activity
                    : Radio;


              return (
                <button
                  key={
                    tab.id
                  }
                  type="button"
                  onClick={() =>
                    selectTab(
                      tab.id,
                    )
                  }
                  aria-selected={
                    selected
                  }
                  className={[
                    "group relative min-w-[220px] flex-1 border-x border-t px-5 py-4 text-left transition-all duration-200",

                    selected
                      ? "border-[#30343c] bg-[#111318] text-white"
                      : "border-transparent bg-transparent text-zinc-600 hover:border-[#242832] hover:bg-[#0f1115] hover:text-zinc-300",

                  ].join(
                    " ",
                  )}
                >

                  <div className="flex items-start gap-3">

                    <div
                      className={[
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border transition-colors",

                        selected
                          ? "border-[#2588ff]/30 bg-[#2588ff]/10 text-[#2588ff]"
                          : "border-[#272a31] bg-[#111318] text-zinc-600 group-hover:text-zinc-400",

                      ].join(
                        " ",
                      )}
                    >

                      <Icon
                        size={
                          15
                        }
                      />

                    </div>


                    <div className="min-w-0">

                      <p
                        className={[
                          "text-xs font-black uppercase tracking-[0.12em]",

                          selected
                            ? "text-white"
                            : "text-zinc-500 group-hover:text-zinc-300",

                        ].join(
                          " ",
                        )}
                      >
                        {tab.label}
                      </p>


                      <p className="mt-1 hidden text-[10px] leading-4 text-zinc-600 sm:block">
                        {tab.description}
                      </p>

                    </div>

                  </div>


                  {selected && (

                    <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#2588ff]" />

                  )}

                </button>
              );
            },
          )}

        </div>

      </div>


      <div
        key={
          activeTab
        }
        className="animate-in fade-in duration-200"
      >

        {activeTab ===
        "infrastructure" ? (

          <SuperAdminSystemFeature />

        ) : activeTab ===
          "auth" ? (

          <SuperAdminAuthObservabilityFeature />

        ) : (

          <SuperAdminRealtimeObservabilityFeature />

        )}

      </div>

    </div>
  );
}