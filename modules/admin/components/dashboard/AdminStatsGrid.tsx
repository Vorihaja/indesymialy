"use client";


import {
  Users,
  Trophy,
  Building2,
  CalendarDays,
  Newspaper,
  ShoppingBag
} from "lucide-react";


import {
  AdminStatCard
} from "./";



import type {
  AdminDashboardStats
} from "../../types";





interface AdminStatsGridProps {

stats: AdminDashboardStats;

}





export default function AdminStatsGrid({

stats

}:AdminStatsGridProps){



return (

<div
className="
grid
grid-cols-1
sm:grid-cols-2
xl:grid-cols-3
gap-4
"
>



<AdminStatCard

title="Utilisateurs"

value={stats.totalUsers}

icon={<Users size={18}/>}

description="Comptes enregistrés"

/>




<AdminStatCard

title="Combattants"

value={stats.totalFighters}

icon={<Trophy size={18}/>}

description="Profils sportifs"

/>




<AdminStatCard

title="Clubs"

value={stats.totalClubs}

icon={<Building2 size={18}/>}

description="Structures affiliées"

/>




<AdminStatCard

title="Événements"

value={stats.totalEvents}

icon={<CalendarDays size={18}/>}

description="Événements créés"

/>




<AdminStatCard

title="Articles"

value={stats.totalArticles}

icon={<Newspaper size={18}/>}

description="Contenus publiés"

/>




<AdminStatCard

title="Marketplace"

value={stats.totalProducts}

icon={<ShoppingBag size={18}/>}

description="Produits disponibles"

/>



</div>

);


}