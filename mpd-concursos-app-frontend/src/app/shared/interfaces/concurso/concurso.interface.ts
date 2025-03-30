import { CategoriaEnum } from "../../constants/enums/categoria-enum";
import { ContestDate } from './contest-date.interface';

export type ContestStatus = 'ACTIVE' | 'CLOSED' | 'IN_PROGRESS' | 'DRAFT' | 'CANCELLED';

export interface Concurso {
    id: string | number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: ContestStatus;
    position: string;
    category: string;
    class: string;
    department: string;
    dependencia: string;
    functions?: string;
    basesUrl?: string;
    descriptionUrl?: string;
    dates?: ContestDate[];
}

// Alias para mantener compatibilidad
export type Contest = Concurso;
