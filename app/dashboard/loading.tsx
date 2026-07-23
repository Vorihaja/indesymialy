export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-black text-zinc-100 animate-pulse">
      
      {/* Skeleton Sidebar (Gauche) */}
      <aside className="fixed bottom-0 left-0 top-[var(--platform-header-height)] z-20 w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-900">
            <div className="h-9 w-9 bg-zinc-800 rounded-sm" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 bg-zinc-800 rounded-sm" />
              <div className="h-2 w-16 bg-zinc-800/60 rounded-sm" />
            </div>
          </div>
          
          {/* Profil utilisateur miniature */}
          <div className="mt-4 flex items-center gap-3 border border-zinc-900 bg-zinc-900/20 p-3 rounded-sm">
            <div className="h-10 w-10 bg-zinc-800 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 bg-zinc-800 rounded-sm" />
              <div className="h-2 w-14 bg-zinc-800/60 rounded-sm" />
            </div>
          </div>
          
          {/* Menu Items */}
          <nav className="mt-6 space-y-3 px-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <div className="h-4 w-4 bg-zinc-800 rounded-sm" />
                <div className="h-3 w-32 bg-zinc-800/80 rounded-sm" />
              </div>
            ))}
          </nav>
        </div>
        
        <div className="h-10 bg-zinc-900/40 border border-zinc-900 rounded-sm" />
      </aside>

      {/* Main Content Skeleton (Droite) */}
      <div className="pl-64 flex flex-col flex-1">
        
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between px-8">
          <div className="h-8 w-80 bg-zinc-900 border border-zinc-800 rounded-sm" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-28 bg-zinc-900/60 rounded-sm hidden md:block" />
            <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 rounded-sm" />
            <div className="h-8 w-32 bg-amber-500/20 border border-amber-500/10 rounded-sm" />
          </div>
        </header>

        {/* Espace de contenu des modules */}
        <main className="flex-1 p-8 space-y-6">
          
          {/* Grille de 4 cartes statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-zinc-900 bg-zinc-950/50 p-4 space-y-3 h-24 rounded-sm">
                <div className="h-2.5 w-16 bg-zinc-800 rounded-sm" />
                <div className="h-5 w-24 bg-zinc-800 rounded-sm" />
                <div className="h-2 w-28 bg-zinc-800/50 rounded-sm" />
              </div>
            ))}
          </div>
          
          {/* Blocs de listes inférieurs */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 border border-zinc-900 bg-zinc-950/50 p-5 h-48 rounded-sm space-y-3">
              <div className="h-3.5 w-40 bg-zinc-800 rounded-sm" />
              <div className="h-12 bg-zinc-900/60 rounded-sm" />
              <div className="h-12 bg-zinc-900/60 rounded-sm" />
            </div>
            
            <div className="border border-zinc-900 bg-zinc-950/50 p-5 h-48 rounded-sm space-y-3">
              <div className="h-3.5 w-28 bg-zinc-800 rounded-sm" />
              <div className="h-2 w-20 bg-zinc-800/60 rounded-sm" />
              <div className="h-3 w-full bg-zinc-900 rounded-sm mt-4" />
              <div className="h-2 w-full bg-zinc-900/60 rounded-sm" />
            </div>
          </div>
          
        </main>
      </div>
    </div>
  )
}
