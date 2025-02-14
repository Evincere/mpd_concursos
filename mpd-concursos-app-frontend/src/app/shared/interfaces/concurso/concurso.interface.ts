import { CategoriaEnum } from "../../constants/enums/categoria-enum";

export type ConcursoStatus = 'ACTIVE' | 'PENDING' | 'CLOSED' | 'FINISHED';

export interface Concurso {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: ConcursoStatus;
  position: string;
  category: CategoriaEnum;
  dependencia: string;
}
