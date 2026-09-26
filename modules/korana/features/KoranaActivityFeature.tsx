import {
  NotificationsFeature,
} from "@/modules/communication-core/features/CommunicationFeatures";

export function KoranaActivityFeature() {
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#090a0c] text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#090a0c]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
        <h1 className="text-lg font-black tracking-[-0.025em]">
          Activités
        </h1>

        <p className="mt-1 text-[11px] text-zinc-500">
          Ce qui s&apos;est passé autour de votre compte, de vos échanges et de votre activité Indesy.
        </p>
      </header>

      <NotificationsFeature />
    </div>
  );
}