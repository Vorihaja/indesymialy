import { Badge, ErpKpi, ErpKpiGrid } from '@/components/ui';
import type { OrganizerMetric } from '../types';

const toneLabels = { neutral: 'Stable', success: 'Avance', warning: 'Attention', danger: 'Critique', info: 'En cours' } as const;

export function OrganizerKpiGrid({ metrics }: { metrics: OrganizerMetric[] }) {
  return <ErpKpiGrid aria-label='Indicateurs opérationnels'>
    {metrics.map((metric) => {
      const tone = metric.connected === false ? 'warning' : metric.tone ?? 'neutral';
      return <ErpKpi key={metric.id} tone={tone} label={<span className='flex items-center justify-between gap-2'><span>{metric.label}</span><Badge tone={tone}>{metric.connected === false ? 'Non connecté' : toneLabels[metric.tone ?? 'neutral']}</Badge></span>} value={metric.value} detail={<><span>{metric.detail}</span>{metric.source && <span className='organizer-kpi-source block'>Source · {metric.source}</span>}</>} />;
    })}
  </ErpKpiGrid>;
}
