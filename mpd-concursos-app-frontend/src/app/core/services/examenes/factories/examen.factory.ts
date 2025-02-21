import { Injectable } from "@angular/core";
import { IExamen } from "@core/interfaces/examenes/examen.interface";
import { TipoExamen } from "@shared/interfaces/examen/examen.interface";

@Injectable({
  providedIn: 'root'
})
export class ExamenFactory {
  createExamen(tipo: TipoExamen, data: any): IExamen {
    switch (tipo) {
      case TipoExamen.TECNICO_JURIDICO:
        return new ExamenTecnicoJuridico(data);
      case TipoExamen.TECNICO_ADMINISTRATIVO:
        return new ExamenTecnicoAdministrativo(data);
      default:
        throw new Error(`Tipo de examen no soportado: ${tipo}`);
    }
  }
}
