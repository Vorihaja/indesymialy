"use client";

import { useEffect, useState } from "react";
import MessageWorkspace from "@/components/messaging/MessageWorkspace";

export default function DiscussionPage() {
  const [latency, setLatency] = useState(24);
  const [online, setOnline] = useState(127);
  const [now] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setLatency((l) => Math.max(12, Math.min(89, l + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4))));
      setOnline((o) => Math.max(90, Math.min(180, o + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2))));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="w-full min-h-[calc(100vh-64px)] bg-[#050505] font-mono text-white flex flex-col relative overflow-hidden selection:bg-white selection:text-black">
      {/* Background cyber grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.25]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[400px] w-[800px] bg-white/[0.03] blur-[80px] rounded-full" />
      </div>
      {/* WORKSPACE */}
      <div className="relative z-10 flex-1 w-full flex flex-col min-h-0">
        {/* Inner glow border */}
        <div className="flex-1 relative m-0 sm:m-3 sm:mb-0 border-0 sm:border border-[#1a1a1a] bg-[#0a0a0a] sm:bg-[#0a0a0a]/90 backdrop-blur-sm overflow-hidden flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_80px_rgba(0,0,0,0.6)]">
          {/* Top inner highlight */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="flex-1 w-full relative min-h-0">
            <MessageWorkspace />
          </div>
        </div>
       
      </div>
    </main>
  );
}