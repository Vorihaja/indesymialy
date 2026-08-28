import Link from 'next/link';
import type { HTMLAttributes, ReactNode } from 'react';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export type ErpTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type ErpTabItem = { href: string; label: ReactNode; active?: boolean };

export function ErpPanel({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cx('erp-panel', className)} {...props}>{children}</section>;
}

export function ErpPanelHeader({ label, title, action, className, ...props }: HTMLAttributes<HTMLElement> & { label?: ReactNode; title: ReactNode; action?: ReactNode }) {
  return <header className={cx('erp-panel-header', className)} {...props}>
    <div>{label && <div className='erp-panel-label'>{label}</div>}<h2 className='erp-panel-title'>{title}</h2></div>
    {action && <div className='erp-panel-action'>{action}</div>}
  </header>;
}

export function ErpKpi({ label, value, detail, tone = 'neutral', className, ...props }: HTMLAttributes<HTMLElement> & { label: ReactNode; value: ReactNode; detail?: ReactNode; tone?: ErpTone }) {
  return <article className={cx('erp-kpi-compact', className)} data-tone={tone} {...props}>
    <div className='erp-kpi-compact-label'>{label}</div>
    <div className='erp-kpi-compact-value'>{value}</div>
    {detail && <div className='erp-kpi-compact-detail'>{detail}</div>}
  </article>;
}

export function ErpKpiGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('erp-kpi-grid-compact', className)} {...props} />;
}

function Tabs({ items, label, sub = false, className }: { items: ErpTabItem[]; label: string; sub?: boolean; className?: string }) {
  return <nav aria-label={label} className={cx(sub ? 'erp-subtabs' : 'erp-business-tabs', className)}>
    {items.map((item) => <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined} className={sub ? 'erp-subtab' : 'erp-business-tab'}>{item.label}</Link>)}
  </nav>;
}

export function ErpTabs(props: Omit<Parameters<typeof Tabs>[0], 'sub'>) { return <Tabs {...props} />; }
export function ErpSubTabs(props: Omit<Parameters<typeof Tabs>[0], 'sub'>) { return <Tabs {...props} sub />; }
export function ErpToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('erp-toolbar', className)} {...props} />; }
export function ErpSection({ className, ...props }: HTMLAttributes<HTMLElement>) { return <section className={cx('erp-section', className)} {...props} />; }

export function ErpFormSection({ title, description, children, className, ...props }: HTMLAttributes<HTMLElement> & { title: ReactNode; description?: ReactNode }) {
  return <section className={cx('erp-form-section', className)} {...props}>
    <header><h2>{title}</h2>{description && <p>{description}</p>}</header>
    <div className='erp-form-section-body'>{children}</div>
  </section>;
}

export function ErpDataRegion({ label = 'Données', className, ...props }: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return <div role='region' aria-label={label} tabIndex={0} className={cx('erp-data-region', className)} {...props} />;
}

export function ErpStatus({ children, tone = 'neutral', live = false, className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: ErpTone; live?: boolean }) {
  return <span className={cx('erp-status', live && 'is-live', className)} data-tone={tone} {...props}><span aria-hidden='true' />{children}</span>;
}
