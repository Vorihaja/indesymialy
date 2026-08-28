"use client";


import Link from "next/link";
import { useNavigation } from "@/modules/auth";

export function AdminSidebar(){
  const { navigation } = useNavigation("admin");
  const adminItems = navigation.filter(
    (item) => item.scope === "admin" && item.target === "sidebar"
  );

  return (
    <aside
      className="
      w-64
      border-r
      border-neutral-800
      bg-neutral-950
      p-4
      "
    >
      <h2
        className="
        font-mono
        text-sm
        tracking-widest
        mb-6
        text-blue-400
        "
      >
        INDESY MIALY ADMIN
      </h2>

      <nav
        className="
        space-y-2
        "
      >
        {adminItems.map((item) => (
          <Link
            key={item.route}
            href={item.route}
            className="
            block
            px-3
            py-2
            text-sm
            font-mono
            text-neutral-300
            hover:bg-neutral-900
            hover:text-white
            transition
            "
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}