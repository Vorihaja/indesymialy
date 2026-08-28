export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'review' | 'done';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskSource = 'manual' | 'template' | 'automation';

export interface ErpTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  owner: string;
  ownerInitials: string;
  participants: string[];
  dueAt: string;
  context: { type: string; label: string; reference: string; href: string; detail: string };
  estimatedMinutes: number;
  actualMinutes: number;
  progress: number;
  dependencies: string[];
  validationCriteria: string[];
  attachments: number;
  comments: number;
  sla?: string;
  priorityScore: { urgency: number; impact: number; risk: number; customerValue: number; effort: number };
  audit: Array<{ actor: string; action: string; at: string }>;
}
