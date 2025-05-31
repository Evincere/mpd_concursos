import { InjectionToken } from '@angular/core';
import { ExamenEnCurso } from '@shared/interfaces/examen/pregunta.interface';

// Definimos el token de inyección para el examen en curso
export const EXAMEN_TOKEN = new InjectionToken<ExamenEnCurso>('ExamenEnCurso');
