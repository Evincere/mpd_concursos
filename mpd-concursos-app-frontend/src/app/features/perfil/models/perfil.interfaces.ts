export type TabKey = 'info' | 'cv' | 'docs' | 'linkedin';

export interface ProfileTab {
  key: TabKey;
  label: string;
  icon: string;
}

export const TAB_KEYS = {
  INFO: 'info' as TabKey,
  CV: 'cv' as TabKey,
  DOCS: 'docs' as TabKey,
  LINKEDIN: 'linkedin' as TabKey
} as const;
