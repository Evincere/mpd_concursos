export interface ConcursoDate {
  id: string;
  title?: string;
  label?: string;
  description?: string;
  date?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  important?: boolean;
  type?: string;
  order?: number;
  reminderDays?: number[];
  customReminderDays?: number[];
}
