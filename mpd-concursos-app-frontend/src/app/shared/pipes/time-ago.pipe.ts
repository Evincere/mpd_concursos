import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para mostrar fechas de manera amigable
 * Ejemplos: "hace 2 minutos", "hace 1 hora", "ayer", "hace 3 días"
 */
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return 'Fecha no disponible';
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    // Si la fecha es futura
    if (diffInMs < 0) {
      return this.formatFutureDate(Math.abs(diffInSeconds));
    }

    // Menos de 1 minuto
    if (diffInSeconds < 60) {
      return 'hace unos segundos';
    }

    // Menos de 1 hora
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? 'hace 1 minuto' : `hace ${diffInMinutes} minutos`;
    }

    // Menos de 1 día
    if (diffInHours < 24) {
      return diffInHours === 1 ? 'hace 1 hora' : `hace ${diffInHours} horas`;
    }

    // Ayer
    if (diffInDays === 1) {
      return 'ayer';
    }

    // Menos de 1 semana
    if (diffInDays < 7) {
      return `hace ${diffInDays} días`;
    }

    // Menos de 1 mes
    if (diffInWeeks < 4) {
      return diffInWeeks === 1 ? 'hace 1 semana' : `hace ${diffInWeeks} semanas`;
    }

    // Menos de 1 año
    if (diffInMonths < 12) {
      return diffInMonths === 1 ? 'hace 1 mes' : `hace ${diffInMonths} meses`;
    }

    // 1 año o más
    if (diffInYears === 1) {
      return 'hace 1 año';
    }

    return `hace ${diffInYears} años`;
  }

  /**
   * Formatea fechas futuras
   */
  private formatFutureDate(diffInSeconds: number): string {
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'en unos segundos';
    }

    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? 'en 1 minuto' : `en ${diffInMinutes} minutos`;
    }

    if (diffInHours < 24) {
      return diffInHours === 1 ? 'en 1 hora' : `en ${diffInHours} horas`;
    }

    if (diffInDays === 1) {
      return 'mañana';
    }

    return `en ${diffInDays} días`;
  }
}

/**
 * Pipe para mostrar fecha completa con formato amigable
 * Incluye tanto el tiempo relativo como la fecha exacta
 */
@Pipe({
  name: 'timeAgoDetailed',
  standalone: true
})
export class TimeAgoDetailedPipe implements PipeTransform {

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return 'Fecha no disponible';
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    const timeAgoPipe = new TimeAgoPipe();
    const timeAgo = timeAgoPipe.transform(value);
    
    // Formatear fecha completa
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    };

    const fullDate = date.toLocaleDateString('es-AR', options);
    
    return `${timeAgo} (${fullDate})`;
  }
}

/**
 * Pipe para mostrar solo la fecha sin tiempo relativo
 * Útil para tooltips o información detallada
 */
@Pipe({
  name: 'formatDate',
  standalone: true
})
export class FormatDatePipe implements PipeTransform {

  transform(
    value: string | Date | null | undefined, 
    format: 'short' | 'medium' | 'long' | 'full' = 'medium'
  ): string {
    if (!value) {
      return 'Fecha no disponible';
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    let options: Intl.DateTimeFormatOptions;

    switch (format) {
      case 'short':
        options = {
          year: '2-digit',
          month: 'numeric',
          day: 'numeric'
        };
        break;
      case 'medium':
        options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        break;
      case 'long':
        options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        };
        break;
      case 'full':
        options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        };
        break;
    }

    options.timeZone = 'America/Argentina/Buenos_Aires';
    
    return date.toLocaleDateString('es-AR', options);
  }
}
