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
