import { InjectionToken } from '@angular/core';
import { ExamenEnCurso } from '@shared/interfaces/examen/pregunta.interface';

export const EXAMEN_TOKEN = new InjectionToken<ExamenEnCurso>('ExamenEnCurso');
