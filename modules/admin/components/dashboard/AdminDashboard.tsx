"use client";

import {
  AdminStatsGrid,
  AdminActivityList,
  AdminAlertList,
} from ".";

import {
  useAdminDashboard,
} from "../../hooks";

import {
  RoleRequestsPanel
} from "../access-control";


export default function AdminDashboard() {

  const {
    data,
    loading,
    error,
  } = useAdminDashboard();


  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="font-mono text-sm text-neutral-400">
          Chargement du tableau de bord...
        </span>
      </div>
    );
  }


  if (error) {
    return (
      <div className="rounded border border-red-700 bg-red-950/30 p-4">
        <p className="font-mono text-sm text-red-400">
          {error}
        </p>
      </div>
    );
  }


  if (!data) {
    return (
      <div className="rounded border border-neutral-800 p-4">
        <p className="font-mono text-sm text-neutral-500">
          Aucune donnée disponible.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-8">


      {/* Statistiques globales */}
      <AdminStatsGrid
        stats={data.stats}
      />



      {/* Widgets rapides */}
      <div className="grid gap-6 xl:grid-cols-2">


        <AdminActivityList
          activities={data.activities}
        />


        <AdminAlertList
          alerts={data.alerts}
        />


      </div>



      {/* Gestion administrative des accès */}
      <RoleRequestsPanel />


    </div>
  );
}