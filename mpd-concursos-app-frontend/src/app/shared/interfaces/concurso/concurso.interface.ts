import { CategoriaEnum } from "../../constants/enums/categoria-enum";

export interface Concurso {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  position: string;
  category: CategoriaEnum;
  dependencia: string;
}