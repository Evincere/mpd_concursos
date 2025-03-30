export interface ContestDate {
    label: string;
    startDate: Date;
    endDate: Date;
    type: ContestDateType;
}

export type ContestDateType =
    | 'inscription'      // Inscripción
    | 'evaluation'       // Evaluación de antecedentes
    | 'written_exam'     // Examen escrito
    | 'interview'        // Entrevista personal
    | 'results'         // Publicación de resultados
    | 'appointment'     // Toma de posesión
    | 'custom';         // Fecha personalizada
