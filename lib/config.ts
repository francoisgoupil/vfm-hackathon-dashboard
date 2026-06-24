export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const CONFIG = {
  WORKSHOP_TITLE: 'Breast Cancer',
  WORKSHOP_SUBTITLE: 'Probabl × IBM · Skore skills lab',
  REPO_SLUG: 'probabl-ai/ibm-workshop',
  POLL_INTERVAL_MS: 3000,
  COUNTDOWN_SEC: 1800,
  SCORE_LABEL: 'ROC-AUC',
  PRIMARY_SCORE: 'roc_auc' as const,
  SCORE_HIGHER_IS_BETTER: true,
  FEED_VISIBLE: 14,
  SPARKLINE_POINTS: 10,
  TOP_MODELS: 6,
  SKORE_SKILLS: [
    'explore-ml-data',
    'organize-ml-workspace',
    'build-ml-pipeline',
    'evaluate-ml-pipeline',
    'iterate-from-skore',
    'iterate-from-user',
    'iterate-ml-experiment',
    'workshop-submit-private',
  ],
};
