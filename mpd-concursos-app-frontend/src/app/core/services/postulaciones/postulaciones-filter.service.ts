import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Postulacion, PostulationStatus } from '@shared/interfaces/postulacion/postulacion.interface';
import { FiltrosPostulacion } from '@shared/interfaces/filters/filtros-postulaciones.interface';

export interface FilterResult {
  filteredData: Postulacion[];
  totalItems: number;
  hasActiveFilters: boolean;
  isEmpty: boolean;
  isFiltered: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PostulacionesFilterService {

  /**
   * Aplica filtros a la lista de postulaciones
   */
  applyFilters(
    postulaciones: Postulacion[], 
    filtros: FiltrosPostulacion, 
    searchTerm: string = '',
    filtersActive: boolean = false
  ): FilterResult {
    
    let filteredData = [...postulaciones];

    // Aplicar filtros solo si están activos
    if (filtersActive) {
      filteredData = this.applyAdvancedFilters(filteredData, filtros);
    }

    // Aplicar búsqueda si hay un término
    if (searchTerm.trim()) {
      filteredData = this.applySearchFilter(filteredData, searchTerm);
    }

    return {
      filteredData,
      totalItems: filteredData.length,
      hasActiveFilters: filtersActive || !!searchTerm.trim(),
      isEmpty: filteredData.length === 0,
      isFiltered: filtersActive || !!searchTerm.trim()
    };
  }

  /**
   * Aplica filtros avanzados (estado, dependencia, cargo, fechas)
   */
  private applyAdvancedFilters(postulaciones: Postulacion[], filtros: FiltrosPostulacion): Postulacion[] {
    return postulaciones.filter(postulacion => {
      let cumpleFiltros = true;

      // Filtro por estado
      if (filtros.estado !== 'todos' && filtros.estado && postulacion.estado) {
        const estadoApi = this.mapFilterStatusToApiStatus(filtros.estado);
        cumpleFiltros = cumpleFiltros && postulacion.estado === estadoApi;
      }

      // Filtro por dependencia
      if (filtros.dependencia !== 'todas' && filtros.dependencia && postulacion.concurso?.dependencia) {
        cumpleFiltros = cumpleFiltros && postulacion.concurso.dependencia === filtros.dependencia;
      }

      // Filtro por cargo (REFACTORING: Usar terminología unificada)
      if (filtros.cargo !== 'todos' && filtros.cargo && postulacion.concurso?.position) {
        cumpleFiltros = cumpleFiltros && postulacion.concurso.position === filtros.cargo;
      }

      // Filtros por fecha (implementación futura)
      if (filtros.fechaDesde || filtros.fechaHasta) {
        cumpleFiltros = cumpleFiltros && this.applyDateFilters(postulacion, filtros);
      }

      return cumpleFiltros;
    });
  }

  /**
   * Aplica filtro de búsqueda por texto
   */
  private applySearchFilter(postulaciones: Postulacion[], searchTerm: string): Postulacion[] {
    const termino = searchTerm.toLowerCase().trim();
    
    return postulaciones.filter(postulacion => {
      // REFACTORING: Usar terminología unificada en inglés
      const titulo = postulacion.concurso?.title?.toLowerCase() || '';
      const cargo = postulacion.concurso?.position?.toLowerCase() || '';
      const dependencia = postulacion.concurso?.department?.toLowerCase() || '';

      return titulo.includes(termino) ||
             cargo.includes(termino) ||
             dependencia.includes(termino);
    });
  }

  /**
   * Aplica filtros de fecha
   */
  private applyDateFilters(postulacion: Postulacion, filtros: FiltrosPostulacion): boolean {
    const fechaPostulacion = new Date(postulacion.fechaPostulacion);
    
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      if (fechaPostulacion < fechaDesde) return false;
    }
    
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      if (fechaPostulacion > fechaHasta) return false;
    }
    
    return true;
  }

  /**
   * Mapea estados de filtro a estados de API
   */
  private mapFilterStatusToApiStatus(filterStatus: string): PostulationStatus {
    const statusMap: Record<string, PostulationStatus> = {
      'en_proceso': PostulationStatus.ACTIVE,     // Inscripción en proceso (interrumpida)
      'pendiente': PostulationStatus.PENDING,    // Inscripción completada, pendiente de validación
      'aprobado': PostulationStatus.APPROVED,    // Inscripción aprobada
      'rechazado': PostulationStatus.REJECTED,   // Inscripción rechazada
      'cancelado': PostulationStatus.CANCELLED   // Inscripción cancelada
    };

    return statusMap[filterStatus] || PostulationStatus.PENDING;
  }

  /**
   * Verifica si todas las postulaciones están canceladas
   */
  areAllCancelled(postulaciones: Postulacion[]): boolean {
    if (postulaciones.length === 0) return false;
    
    return postulaciones.every(p => p.estado === PostulationStatus.CANCELLED);
  }

  /**
   * Filtra postulaciones activas (no canceladas)
   */
  getActivePostulations(postulaciones: Postulacion[]): Postulacion[] {
    return postulaciones.filter(p => p.estado !== PostulationStatus.CANCELLED);
  }

  /**
   * Determina el tipo de error basado en el estado de los datos
   */
  determineErrorType(
    hasData: boolean, 
    hasFilters: boolean, 
    isFirstQuery: boolean
  ): 'no-results' | 'empty' | null {
    if (hasData) return null;
    
    if (!isFirstQuery) {
      return hasFilters ? 'no-results' : 'empty';
    }
    
    return null;
  }
}
