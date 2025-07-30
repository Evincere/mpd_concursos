import { Injectable } from '@angular/core';

/**
 * Interfaz para definir una acción disponible en la tabla de inscripciones
 */
export interface InscriptionAction {
  id: string;
  label: string;
  icon: string;
  color: 'primary' | 'success' | 'danger' | 'warn' | 'accent';
  tooltip: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

/**
 * Servicio para gestionar las acciones disponibles según el estado de la inscripción
 */
export class InscriptionActionsService {

  /**
   * Obtiene las acciones disponibles para una inscripción según su estado
   */
  getAvailableActions(state: string, userRole: string = 'admin'): InscriptionAction[] {
    const actions: InscriptionAction[] = [];

    // Acción "Ver detalles" - siempre disponible
    actions.push({
      id: 'view',
      label: 'Ver',
      icon: 'fas fa-eye',
      color: 'accent',
      tooltip: 'Ver detalles de la inscripción'
    });

    // Acciones específicas según el estado
    switch (state) {
      case 'ACTIVE':
        actions.push(
          {
            id: 'edit',
            label: 'Editar',
            icon: 'fas fa-edit',
            color: 'primary',
            tooltip: 'Editar inscripción en proceso'
          },
          {
            id: 'cancel',
            label: 'Cancelar',
            icon: 'fas fa-times',
            color: 'danger',
            tooltip: 'Cancelar inscripción',
            requiresConfirmation: true,
            confirmationMessage: '¿Está seguro de que desea cancelar esta inscripción?'
          }
        );
        break;

      case 'PENDING':
      case 'COMPLETED_WITH_DOCS':
        if (userRole === 'admin') {
          actions.push(
            {
              id: 'approve',
              label: 'Aprobar',
              icon: 'fas fa-check',
              color: 'success',
              tooltip: 'Aprobar inscripción',
              requiresConfirmation: true,
              confirmationMessage: '¿Está seguro de que desea aprobar esta inscripción?'
            },
            {
              id: 'reject',
              label: 'Rechazar',
              icon: 'fas fa-times',
              color: 'danger',
              tooltip: 'Rechazar inscripción',
              requiresConfirmation: true,
              confirmationMessage: '¿Está seguro de que desea rechazar esta inscripción?'
            }
          );
        }
        actions.push({
          id: 'download-docs',
          label: 'Documentos',
          icon: 'fas fa-download',
          color: 'accent',
          tooltip: 'Descargar documentos de la inscripción'
        });
        break;

      case 'COMPLETED_PENDING_DOCS':
        actions.push({
          id: 'notify-docs',
          label: 'Notificar',
          icon: 'fas fa-bell',
          color: 'warn',
          tooltip: 'Notificar al usuario sobre documentos pendientes'
        });

        if (userRole === 'admin') {
          actions.push(
            {
              id: 'approve',
              label: 'Aprobar',
              icon: 'fas fa-check',
              color: 'success',
              tooltip: 'Aprobar inscripción (documentos pendientes)',
              requiresConfirmation: true,
              confirmationMessage: '¿Está seguro de que desea aprobar esta inscripción con documentos pendientes?'
            },
            {
              id: 'freeze',
              label: 'Congelar',
              icon: 'fas fa-snowflake',
              color: 'warn',
              tooltip: 'Congelar inscripción por documentos pendientes',
              requiresConfirmation: true,
              confirmationMessage: '¿Está seguro de que desea congelar esta inscripción?'
            }
          );
        }
        break;

      case 'FROZEN':
        if (userRole === 'admin') {
          actions.push(
            {
              id: 'unfreeze',
              label: 'Descongelar',
              icon: 'fas fa-fire',
              color: 'warn',
              tooltip: 'Descongelar inscripción',
              requiresConfirmation: true,
              confirmationMessage: '¿Está seguro de que desea descongelar esta inscripción?'
            },
            {
              id: 'reject',
              label: 'Rechazar',
              icon: 'fas fa-times',
              color: 'danger',
              tooltip: 'Rechazar inscripción congelada',
              requiresConfirmation: true,
              confirmationMessage: '¿Está seguro de que desea rechazar esta inscripción congelada?'
            }
          );
        }
        break;

      case 'APPROVED':
        actions.push({
          id: 'download-certificate',
          label: 'Certificado',
          icon: 'fas fa-certificate',
          color: 'success',
          tooltip: 'Descargar certificado de aprobación'
        });

        if (userRole === 'admin') {
          actions.push({
            id: 'revoke',
            label: 'Revocar',
            icon: 'fas fa-undo',
            color: 'danger',
            tooltip: 'Revocar aprobación',
            requiresConfirmation: true,
            confirmationMessage: '¿Está seguro de que desea revocar la aprobación de esta inscripción?'
          });
        }
        break;

      case 'REJECTED':
        if (userRole === 'admin') {
          actions.push({
            id: 'reconsider',
            label: 'Reconsiderar',
            icon: 'fas fa-redo',
            color: 'warn',
            tooltip: 'Reconsiderar inscripción rechazada',
            requiresConfirmation: true,
            confirmationMessage: '¿Está seguro de que desea reconsiderar esta inscripción rechazada?'
          });
        }
        break;

      case 'CANCELLED':
        if (userRole === 'admin') {
          actions.push({
            id: 'restore',
            label: 'Restaurar',
            icon: 'fas fa-undo',
            color: 'primary',
            tooltip: 'Restaurar inscripción cancelada',
            requiresConfirmation: true,
            confirmationMessage: '¿Está seguro de que desea restaurar esta inscripción cancelada?'
          });
        }
        break;
    }

    // Acción de historial - siempre disponible para admins
    if (userRole === 'admin') {
      actions.push({
        id: 'history',
        label: 'Historial',
        icon: 'fas fa-history',
        color: 'accent',
        tooltip: 'Ver historial de cambios de la inscripción'
      });
    }

    return actions;
  }

  /**
   * Verifica si una acción específica está disponible para un estado
   */
  isActionAvailable(actionId: string, state: string, userRole: string = 'admin'): boolean {
    const availableActions = this.getAvailableActions(state, userRole);
    return availableActions.some(action => action.id === actionId);
  }

  /**
   * Obtiene una acción específica por su ID
   */
  getAction(actionId: string, state: string, userRole: string = 'admin'): InscriptionAction | undefined {
    const availableActions = this.getAvailableActions(state, userRole);
    return availableActions.find(action => action.id === actionId);
  }

  /**
   * Obtiene el número máximo de acciones a mostrar en la tabla
   * Las acciones adicionales se mostrarán en un menú desplegable
   */
  getMaxVisibleActions(): number {
    return 3; // Mostrar máximo 3 acciones directamente, el resto en menú
  }
}
