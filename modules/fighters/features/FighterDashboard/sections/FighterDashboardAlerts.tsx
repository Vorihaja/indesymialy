interface Props {
  alerts?: string[];
}

export function FighterDashboardAlerts({
  alerts = [],
}: Props) {
  return (
    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">

      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        Alertes
      </p>

      {alerts.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-neutral-300">
          {alerts.map((alert, index) => (
            <li
              key={index}
              className="border-l-2 border-red-500 pl-3"
            >
              {alert}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-neutral-400">
          Aucune alerte.
        </p>
      )}

    </div>
  );
}