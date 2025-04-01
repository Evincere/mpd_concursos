import { CategoriaEnum } from "../../constants/enums/categoria-enum";
import { ContestDate } from './contest-date.interface';

export type ContestStatus = 'ACTIVE' | 'CLOSED' | 'IN_PROGRESS' | 'DRAFT' | 'CANCELLED';

export interface Concurso {
    id: number | string;
    title: string;
    description?: string;
    position: string;
    category: string;
    class: string;
    functions: string;
    status: ContestStatus;
    department: string;
    dependencia: string;
    termsUrl?: string;  // URL del PDF de bases y condiciones (antes basesUrl)
    profileUrl?: string;  // URL del PDF del perfil del puesto (antes descriptionUrl)
    basesUrl?: string;  // Mantener para compatibilidad
    descriptionUrl?: string;  // Mantener para compatibilidad
    startDate: Date | string;
    endDate: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    dates?: ContestDate[];  // Fechas importantes del concurso
}

// Alias para mantener compatibilidad
export type Contest = Concurso;
