import { FormControl } from "@angular/forms";

export interface EducacionFormControls {
    id: FormControl<number | null>;
    tipo: FormControl<string>;
    institucion: FormControl<string>;
    titulo: FormControl<string>;
    comentarios: FormControl<string>;
    fechaEmision?: FormControl<Date | null>;
    documentoId?: FormControl<number | null>;
    cargaHoraria?: FormControl<number | null>;
    evaluacionFinal?: FormControl<boolean>;
    fechaInicio?: FormControl<Date | null>;
    fechaFin?: FormControl<Date | null>;
    tipoActividad?: FormControl<string | null>;
    caracter?: FormControl<string | null>;
    lugarFechaExposicion?: FormControl<string | null>;
  }