import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export type SemanticTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type BoxProps = HTMLAttributes<HTMLDivElement> & { glass?: boolean; interactive?: boolean };

export function Card({ className, glass, interactive, ...props }: BoxProps) {
  return <div className={cx('ds-card', glass && 'ds-glass', interactive && 'ds-interactive', className)} {...props} />;
}
export const Panel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cx('ds-panel', className)} {...props} />;
export const Widget = Card;
export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cx('ds-pad', className)} {...props} />;
export const CardContent = CardHeader;
export const CardFooter = CardHeader;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'info' | 'success' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg'; loading?: boolean; leftIcon?: ReactNode; rightIcon?: ReactNode;
};
export function Button({ variant='primary', size='md', loading, leftIcon, rightIcon, className, children, disabled, ...props }: ButtonProps) {
  return <button className={cx('ds-button', 'ds-'+variant, size !== 'md' && 'ds-button-'+size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{leftIcon}<span>{loading ? 'Chargement…' : children}</span>{!loading && rightIcon}</button>;
}
export function IconButton({ children, 'aria-label': label, className, ...props }: ButtonProps) {
  return <Button className={cx('ds-icon-button', className)} aria-label={label} {...props}>{children}</Button>;
}

export function Badge({ tone='neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: SemanticTone }) {
  return <span data-tone={tone} className={cx('ds-badge', tone !== 'neutral' && 'ds-'+tone+'-text', className)} {...props} />;
}
export function Avatar({ src, alt='', fallback, size='md', className }: { src?: string; alt?: string; fallback?: ReactNode; size?: 'sm'|'md'|'lg'; className?: string }) {
  // External avatar URLs are intentionally supported by this primitive.
  // eslint-disable-next-line @next/next/no-img-element
  return <span className={cx('ds-avatar','ds-avatar-'+size,className)}>{src ? <img src={src} alt={alt} /> : fallback}</span>;
}
export function Alert({ tone='info', title, children, className, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: SemanticTone; title?: ReactNode }) {
  return <div role={tone === 'danger' ? 'alert' : 'status'} data-tone={tone} className={cx('ds-alert',className)} {...props}><div><div className='ds-label'>{title}</div>{children && <div className='ds-caption'>{children}</div>}</div></div>;
}
export function Progress({ value, label='Progression', className }: { value:number; label?:string; className?:string }) {
  const safe=Math.max(0,Math.min(100,value)); return <div className={cx('ds-progress',className)} role='progressbar' aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}><span style={{width:safe+'%'}} /></div>;
}
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div aria-hidden='true' className={cx('ds-skeleton',className)} {...props} />; }
export function Loader({ label='Chargement', className }: { label?:string; className?:string }) { return <span role='status'><span className={cx('ds-loader',className)} /><span className='ds-sr-only'>{label}</span></span>; }

export function Metric({ label, value, trend, direction, tone='neutral' }: { label:ReactNode; value:ReactNode; trend?:ReactNode; direction?:'up'|'down'; tone?:SemanticTone }) {
  return <div className='ds-metric' data-tone={tone}><div className='ds-metric-label'>{label}</div><div className='ds-metric-value' data-kpi-value>{value}</div>{trend && <div className={direction === 'up' ? 'ds-success-text' : direction === 'down' ? 'ds-danger-text' : 'ds-caption'}>{trend}</div>}</div>;
}
export function MetricCard(props: Parameters<typeof Metric>[0]) { return <Card className='ds-metric-card' data-tone={props.tone ?? 'neutral'} interactive><div className='ds-pad'><Metric {...props} /></div></Card>; }
export const StatCard = MetricCard;

export function Section({ className, children, ...props }: HTMLAttributes<HTMLElement>) { return <section className={cx('ds-section',className)} {...props}><div className='ds-section-inner'>{children}</div></section>; }
export const Hero = Section;
export function EmptyState({ icon, title, description, action, className }: { icon?:ReactNode; title:ReactNode; description?:ReactNode; action?:ReactNode; className?:string }) { return <div className={cx('ds-empty',className)}>{icon}<h3 className='ds-h3'>{title}</h3>{description && <p className='ds-caption'>{description}</p>}{action}</div>; }
export function DashboardGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('ds-grid',className)} {...props} />; }
export function SectionHeader({ eyebrow, title, description, actions }: { eyebrow?:ReactNode; title:ReactNode; description?:ReactNode; actions?:ReactNode }) { return <header className='ds-section-header'><div>{eyebrow && <div className='ds-label'>{eyebrow}</div>}<h1 className='ds-h1'>{title}</h1>{description && <p className='ds-caption'>{description}</p>}</div>{actions && <div className='ds-actions'>{actions}</div>}</header>; }
export const QuickActions = ({ className,...props }:HTMLAttributes<HTMLDivElement>) => <div className={cx('ds-actions',className)} {...props}/>;
export const ActivityFeed = ({ className,...props }:HTMLAttributes<HTMLDivElement>) => <div className={cx('ds-panel',className)} {...props}/>;

export function DashboardShell({ topbar, sidebar, children, className }: { topbar?:ReactNode; sidebar?:ReactNode; children:ReactNode; className?:string }) { return <div className={cx('ds-shell',className)}>{topbar}<div className='ds-workspace'>{sidebar}<main className='ds-shell-content'>{children}</main></div></div>; }
export const WorkspaceShell = DashboardShell;
export const Sidebar = ({ className,...props }:HTMLAttributes<HTMLElement>) => <aside className={cx('ds-sidebar',className)} {...props}/>;
export const Topbar = ({ className,...props }:HTMLAttributes<HTMLElement>) => <header className={cx('ds-topbar',className)} {...props}/>;

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) { return <div className='ds-table-wrap'><table className={cx('ds-table',className)} {...props}/></div>; }
export const DataGrid = Table;
export function Pagination({ children, label='Pagination', className }: { children:ReactNode; label?:string; className?:string }) { return <nav aria-label={label} className={cx('ds-actions',className)}>{children}</nav>; }
export const Timeline = ({ className,...props }:HTMLAttributes<HTMLOListElement>) => <ol className={cx('ds-panel',className)} {...props}/>;
export const NotificationItem = ({ className,...props }:HTMLAttributes<HTMLDivElement>) => <div className={cx('ds-panel',className)} {...props}/>;
export const Chart = ({ label='Graphique', className,...props }:HTMLAttributes<HTMLDivElement> & {label?:string}) => <div role='img' aria-label={label} className={cx('ds-panel',className)} {...props}/>;
export const Calendar = ({ className,...props }:HTMLAttributes<HTMLDivElement>) => <div className={cx('ds-panel',className)} {...props}/>;
