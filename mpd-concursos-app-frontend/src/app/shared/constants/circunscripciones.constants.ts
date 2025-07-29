/**
 * Constantes y tipos para el manejo de circunscripciones judiciales
 * Incluye soporte para departamentos específicos en la segunda circunscripción
 */

// ===== TIPOS Y INTERFACES =====

/**
 * Interfaz para un departamento dentro de una circunscripción
 */
export interface DepartamentoCircunscripcion {
  id: string;
  nombre: string;
  circunscripcion: string;
}

/**
 * Interfaz para una circunscripción judicial
 */
export interface CircunscripcionJudicial {
  id: string;
  nombre: string;
  departamentos?: DepartamentoCircunscripcion[];
  permiteDepartamentos: boolean;
}

/**
 * Interfaz para la selección de circunscripciones del usuario
 */
export interface SeleccionCircunscripcion {
  circunscripcion: string;
  departamentos?: string[];
  esCompleta: boolean; // true si selecciona toda la circunscripción, false si solo departamentos específicos
}

// ===== CONSTANTES =====

/**
 * Departamentos de la Segunda Circunscripción Judicial
 */
export const DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION: DepartamentoCircunscripcion[] = [
  {
    id: 'san-rafael',
    nombre: 'San Rafael',
    circunscripcion: 'Segunda'
  },
  {
    id: 'general-alvear',
    nombre: 'General Alvear',
    circunscripcion: 'Segunda'
  },
  {
    id: 'malargue',
    nombre: 'Malargüe',
    circunscripcion: 'Segunda'
  }
];

/**
 * Definición de todas las circunscripciones judiciales
 */
export const CIRCUNSCRIPCIONES_JUDICIALES: CircunscripcionJudicial[] = [
  {
    id: 'primera',
    nombre: 'Primera',
    permiteDepartamentos: false
  },
  {
    id: 'segunda',
    nombre: 'Segunda',
    departamentos: DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION,
    permiteDepartamentos: true
  },
  {
    id: 'tercera',
    nombre: 'Tercera',
    permiteDepartamentos: false
  },
  {
    id: 'cuarta',
    nombre: 'Cuarta',
    permiteDepartamentos: false
  }
];

/**
 * Mapeo de IDs a nombres para compatibilidad con el sistema actual
 */
export const CIRCUNSCRIPCIONES_MAP = {
  'primera': 'Primera',
  'segunda': 'Segunda',
  'tercera': 'Tercera',
  'cuarta': 'Cuarta'
} as const;

/**
 * Mapeo de departamentos por ID
 */
export const DEPARTAMENTOS_MAP = DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION.reduce((map, dept) => {
  map[dept.id] = dept;
  return map;
}, {} as Record<string, DepartamentoCircunscripcion>);

// ===== FUNCIONES UTILITARIAS =====

/**
 * Obtiene una circunscripción por su ID
 */
export function getCircunscripcionById(id: string): CircunscripcionJudicial | undefined {
  return CIRCUNSCRIPCIONES_JUDICIALES.find(c => c.id === id);
}

/**
 * Obtiene los departamentos de una circunscripción
 */
export function getDepartamentosByCircunscripcion(circunscripcionId: string): DepartamentoCircunscripcion[] {
  const circunscripcion = getCircunscripcionById(circunscripcionId);
  return circunscripcion?.departamentos || [];
}

/**
 * Verifica si una circunscripción permite selección de departamentos específicos
 */
export function circunscripcionPermiteDepartamentos(circunscripcionId: string): boolean {
  const circunscripcion = getCircunscripcionById(circunscripcionId);
  return circunscripcion?.permiteDepartamentos || false;
}

/**
 * Convierte la selección del usuario al formato de almacenamiento
 * Formato: "Segunda:San Rafael", "Segunda:General Alvear", etc.
 * O simplemente "Primera", "Tercera", "Cuarta" para circunscripciones completas
 */
export function convertirSeleccionAFormato(selecciones: SeleccionCircunscripcion[]): string[] {
  const resultado: string[] = [];
  
  selecciones.forEach(seleccion => {
    if (seleccion.esCompleta || !seleccion.departamentos || seleccion.departamentos.length === 0) {
      // Selección completa de la circunscripción
      resultado.push(seleccion.circunscripcion);
    } else {
      // Selección de departamentos específicos
      seleccion.departamentos.forEach(deptId => {
        const departamento = DEPARTAMENTOS_MAP[deptId];
        if (departamento) {
          resultado.push(`${seleccion.circunscripcion}:${departamento.nombre}`);
        }
      });
    }
  });
  
  return resultado;
}

/**
 * Convierte el formato de almacenamiento a la selección del usuario
 */
export function convertirFormatoASeleccion(valores: string[]): SeleccionCircunscripcion[] {
  const seleccionesMap = new Map<string, SeleccionCircunscripcion>();
  
  valores.forEach(valor => {
    if (valor.includes(':')) {
      // Formato "Circunscripción:Departamento"
      const [circunscripcion, departamento] = valor.split(':');
      const deptId = Object.keys(DEPARTAMENTOS_MAP).find(
        id => DEPARTAMENTOS_MAP[id].nombre === departamento
      );
      
      if (deptId) {
        if (!seleccionesMap.has(circunscripcion)) {
          seleccionesMap.set(circunscripcion, {
            circunscripcion,
            departamentos: [],
            esCompleta: false
          });
        }
        seleccionesMap.get(circunscripcion)!.departamentos!.push(deptId);
      }
    } else {
      // Formato simple "Circunscripción"
      seleccionesMap.set(valor, {
        circunscripcion: valor,
        esCompleta: true
      });
    }
  });
  
  return Array.from(seleccionesMap.values());
}

/**
 * Valida que la selección de circunscripciones sea válida
 */
export function validarSeleccionCircunscripciones(selecciones: SeleccionCircunscripcion[]): {
  esValida: boolean;
  errores: string[];
} {
  const errores: string[] = [];
  
  if (selecciones.length === 0) {
    errores.push('Debe seleccionar al menos una circunscripción');
  }
  
  selecciones.forEach(seleccion => {
    const circunscripcion = getCircunscripcionById(seleccion.circunscripcion.toLowerCase());
    
    if (!circunscripcion) {
      errores.push(`Circunscripción inválida: ${seleccion.circunscripcion}`);
      return;
    }
    
    if (!seleccion.esCompleta && seleccion.departamentos) {
      if (seleccion.departamentos.length === 0) {
        errores.push(`Debe seleccionar al menos un departamento para ${seleccion.circunscripcion}`);
      }
      
      seleccion.departamentos.forEach(deptId => {
        if (!DEPARTAMENTOS_MAP[deptId]) {
          errores.push(`Departamento inválido: ${deptId}`);
        }
      });
    }
  });
  
  return {
    esValida: errores.length === 0,
    errores
  };
}
