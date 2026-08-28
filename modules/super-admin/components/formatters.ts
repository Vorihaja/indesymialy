export function formatNumber(
  value: number,
): string {
  return value.toLocaleString("fr-FR");
}

export function formatMoney(
  value: number,
): string {
  return `${Math.round(value).toLocaleString(
    "fr-FR",
  )} Ar`;
}

export function formatPercent(
  value: number | null,
): string {
  if (value === null) {
    return "N/D";
  }

  return `${value.toLocaleString("fr-FR")} %`;
}

export function formatBytes(
  bytes: number,
): string {
  if (bytes <= 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.min(
    units.length - 1,
    Math.floor(
      Math.log(bytes) /
        Math.log(1024),
    ),
  );

  const value =
    bytes /
    Math.pow(
      1024,
      index,
    );

  return `${value.toLocaleString(
    "fr-FR",
    {
      maximumFractionDigits: 2,
    },
  )} ${units[index]}`;
}
