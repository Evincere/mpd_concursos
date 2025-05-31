export interface ContestDate {
    id?: string;
    contestId?: number | string;
    label?: string;
    startDate?: Date;
    endDate?: Date;
    type?: ContestDateType | string;
    title?: string;
    description?: string;
    date?: Date | string;
    important?: boolean;
    order?: number;
    reminderDays?: number[];
    customReminderDays?: number[];
}

export type ContestDateType =
    | 'inscription'      // Inscripción
    | 'evaluation'       // Evaluación de antecedentes
    | 'written_exam'     // Examen escrito
    | 'interview'        // Entrevista personal
    | 'results'         // Publicación de resultados
    | 'appointment'     // Toma de posesión
    | 'custom';         // Fecha personalizada
