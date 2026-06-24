export interface ReportMetric {
  name: string;
  verbose_name: string;
  greater_is_better: boolean | null;
  position: number | null;
  data_source: string | null;
  value: number;
  is_builtin: boolean;
}

export interface SkoreProject {
  id: string;
  name: string;
  displayName: string;
  created_at: string | null;
  estimator_report_count: number | null;
}

export interface NormalizedReport {
  id: string | number | null;
  urn: string | null;
  created_at: string;
  estimator_name: string | null;
  key: string | null;
  ml_task: string | null;
  report_type: 'estimator' | 'cross-validation';
  metrics: {
    score: { mean: number | null };
    roc_auc: { mean: number | null };
    accuracy: { mean: number | null };
    mae: { mean: number | null };
    r2: { mean: number | null };
    rmse: { mean: number | null };
  };
  steps: unknown[];
  metadata: Record<string, string>;
}

export interface PushEvent {
  participantName: string;
  experiment: string;
  hubKey: string | null;
  model: string;
  reportType: 'estimator' | 'cross-validation';
  score: number | null;
  rocAuc: number | null;
  llm: string | null;
  skill: string | null;
  reportId: string | number | null;
  ts: number;
}

export interface Submission {
  id: string;
  reportNumericId: number;
  participantName: string;
  experiment: string;
  hubKey: string | null;
  model: string;
  reportType: 'estimator' | 'cross-validation';
  score: number;
  prevScore: number | null;
  submissionNumber: number;
  ts: number;
  llm: string | null;
  skill: string | null;
}

export interface FeedItem {
  id: string;
  participantName: string;
  experiment: string;
  model: string;
  reportType: 'estimator' | 'cross-validation';
  score: number;
  llm: string | null;
  skill: string | null;
  ts: number;
  isParticipantBest: boolean;
  isGlobalBest: boolean;
  fading: boolean;
}

export interface DashboardState {
  submissions: Submission[];
  feed: FeedItem[];
  globalBestScore: number | null;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  countdownRemaining: number;
  flashSubmissionId: string | null;
  flashBestId: string | null;
}

export interface SkoreMeta {
  workspace: string | null;
  hasKey: boolean;
  projectCount: number;
  error: string | null;
  connected: boolean;
}