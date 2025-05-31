import { ContestDate } from '../interfaces/concurso/contest-date.interface';
import { ConcursoDate } from '../interfaces/concurso/concurso-date.interface';

/**
 * Adaptador para convertir entre ContestDate y ConcursoDate
 */
export class DateAdapter {
  /**
   * Convierte un array de ContestDate a ConcursoDate
   * @param dates Array de ContestDate
   * @returns Array de ConcursoDate
   */
  static toConursoDates(dates: ContestDate[] | undefined): ConcursoDate[] {
    if (!dates || !Array.isArray(dates)) {
      return [];
    }

    return dates.map(date => ({
      id: date?.id || '',
      title: date?.title || '',
      label: date?.label || '',
      description: date?.description,
      date: date?.date,
      startDate: date?.startDate,
      endDate: date?.endDate,
      important: date?.important || false,
      type: date?.type || '',
      order: date?.order || 0,
      reminderDays: date?.reminderDays || [],
      customReminderDays: Array.isArray(date?.customReminderDays) ? date.customReminderDays : []
    }));
  }

  /**
   * Convierte un array de ConcursoDate a ContestDate
   * @param dates Array de ConcursoDate
   * @returns Array de ContestDate
   */
  static toContestDates(dates: ConcursoDate[]): ContestDate[] {
    return dates.map(date => ({
      id: date.id,
      title: date.title,
      label: date.label,
      description: date.description,
      date: date.date,
      startDate: date.startDate as Date,
      endDate: date.endDate as Date,
      important: date.important,
      type: date.type,
      order: date.order,
      reminderDays: date.reminderDays,
      customReminderDays: date.customReminderDays
    }));
  }
}
