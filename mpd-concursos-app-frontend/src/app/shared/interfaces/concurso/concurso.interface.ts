import { CategoriaEnum } from "../../constants/enums/categoria-enum";

export interface Concurso {
  id: number;
  titulo: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  requisitos?: string[];
  area?: string;
  cargo: string;
  categoria: CategoriaEnum;
  dependencia: string;
  vacantes: number;
}