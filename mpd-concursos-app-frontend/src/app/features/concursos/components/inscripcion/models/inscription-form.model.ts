import { InscriptionStep } from '@shared/enums/inscription-step.enum';

/**
 * Interfaz para los datos del formulario de inscripción
 */
export interface InscriptionFormData {
  termsAccepted: boolean;
  centroDeVida: string;
  selectedCircunscripciones: string[];
  documentosCompletos: boolean;
  confirmedPersonalData: boolean;
}

/**
 * Interfaz para el estado completo del formulario de inscripción
 */
export interface InscriptionFormState {
  inscriptionId: string;
  contestId: number;
  currentStep: InscriptionStep;
  formData: InscriptionFormData;
  timestamp: string;
  contestTitle?: string;
}

/**
 * Interfaz para los datos de dirección seleccionada
 */
export interface AddressData {
  formattedAddress: string;
  placeId: string;
  coordinates: { lat: number; lng: number };
  components: Record<string, unknown>;
}

/**
 * Interfaz para los documentos requeridos
 */
export interface RequiredDocument {
  title: string;
  completed: boolean;
  tipoDocumentoId: string;
}

/**
 * Interfaz para las circunscripciones
 */
export interface Circunscripcion {
  value: string;
  label: string;
}
