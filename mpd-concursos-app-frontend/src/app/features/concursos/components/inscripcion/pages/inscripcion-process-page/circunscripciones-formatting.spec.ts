import { 
  SeleccionCircunscripcion, 
  convertirFormatoASeleccion,
  DEPARTAMENTOS_MAP 
} from '@shared/constants/circunscripciones.constants';

/**
 * Tests para la función de formateo de circunscripciones
 * Verifica que las circunscripciones se muestren correctamente en el paso 4
 */
describe('Formateo de Circunscripciones para Visualización', () => {
  
  /**
   * Función auxiliar que simula el método del componente
   */
  function formatearCircunscripcionesParaVisualizacion(selecciones: SeleccionCircunscripcion[]): string {
    const resultado: string[] = [];
    
    // Agrupar selecciones por circunscripción para manejo de departamentos
    const agrupadas = new Map<string, SeleccionCircunscripcion[]>();
    
    selecciones.forEach(seleccion => {
      const key = seleccion.circunscripcion;
      if (!agrupadas.has(key)) {
        agrupadas.set(key, []);
      }
      agrupadas.get(key)!.push(seleccion);
    });
    
    // Formatear cada circunscripción
    agrupadas.forEach((seleccionesCirc, circunscripcion) => {
      const seleccionCompleta = seleccionesCirc.find(s => s.esCompleta);
      
      if (seleccionCompleta) {
        // Circunscripción completa seleccionada
        resultado.push(`${circunscripcion} Circunscripción`);
      } else {
        // Solo departamentos específicos seleccionados
        const todosDepartamentos: string[] = [];
        
        seleccionesCirc.forEach(seleccion => {
          if (seleccion.departamentos && seleccion.departamentos.length > 0) {
            seleccion.departamentos.forEach(deptId => {
              const departamento = DEPARTAMENTOS_MAP[deptId];
              if (departamento && !todosDepartamentos.includes(departamento.nombre)) {
                todosDepartamentos.push(departamento.nombre);
              }
            });
          }
        });
        
        if (todosDepartamentos.length > 0) {
          resultado.push(`${circunscripcion} Circunscripción (${todosDepartamentos.join(', ')})`);
        }
      }
    });
    
    return resultado.join(', ');
  }

  describe('Casos de Selección Simple', () => {
    it('debería formatear una sola circunscripción completa', () => {
      // Arrange
      const valores = ['Primera'];
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toBe('Primera Circunscripción');
    });

    it('debería formatear múltiples circunscripciones completas', () => {
      // Arrange
      const valores = ['Primera', 'Tercera', 'Cuarta'];
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toBe('Primera Circunscripción, Tercera Circunscripción, Cuarta Circunscripción');
    });
  });

  describe('Casos de Selección con Departamentos', () => {
    it('debería formatear departamentos específicos de Segunda Circunscripción', () => {
      // Arrange
      const valores = ['Segunda:San Rafael', 'Segunda:General Alvear'];
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toBe('Segunda Circunscripción (San Rafael, General Alvear)');
    });

    it('debería formatear un solo departamento de Segunda Circunscripción', () => {
      // Arrange
      const valores = ['Segunda:Malargüe'];
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toBe('Segunda Circunscripción (Malargüe)');
    });
  });

  describe('Casos de Selección Mixta', () => {
    it('debería formatear circunscripciones completas y departamentos específicos', () => {
      // Arrange
      const valores = ['Primera', 'Segunda:San Rafael', 'Tercera'];
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toContain('Primera Circunscripción');
      expect(resultado).toContain('Segunda Circunscripción (San Rafael)');
      expect(resultado).toContain('Tercera Circunscripción');
    });

    it('debería formatear Segunda Circunscripción completa cuando se selecciona toda', () => {
      // Arrange
      const valores = ['Primera', 'Segunda', 'Tercera'];
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toBe('Primera Circunscripción, Segunda Circunscripción, Tercera Circunscripción');
    });
  });

  describe('Casos Edge', () => {
    it('debería manejar array vacío', () => {
      // Arrange
      const selecciones: SeleccionCircunscripcion[] = [];
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toBe('');
    });

    it('debería manejar departamentos duplicados', () => {
      // Arrange
      const valores = ['Segunda:San Rafael', 'Segunda:San Rafael']; // Duplicado
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Act
      const resultado = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(resultado).toBe('Segunda Circunscripción (San Rafael)');
      // No debería aparecer duplicado
      expect(resultado.split('San Rafael').length - 1).toBe(1);
    });
  });

  describe('Comparación con Formato Anterior', () => {
    it('debería mejorar la legibilidad comparado con join simple', () => {
      // Arrange
      const valores = ['Primera', 'Segunda:San Rafael', 'Segunda:General Alvear', 'Tercera'];
      const selecciones = convertirFormatoASeleccion(valores);
      
      // Formato anterior (problemático)
      const formatoAnterior = valores.join(', ');
      
      // Formato nuevo (mejorado)
      const formatoNuevo = formatearCircunscripcionesParaVisualizacion(selecciones);
      
      // Assert
      expect(formatoAnterior).toBe('Primera, Segunda:San Rafael, Segunda:General Alvear, Tercera');
      expect(formatoNuevo).toContain('Primera Circunscripción');
      expect(formatoNuevo).toContain('Segunda Circunscripción (San Rafael, General Alvear)');
      expect(formatoNuevo).toContain('Tercera Circunscripción');
      expect(formatoNuevo).not.toContain(':'); // No debe contener formato técnico
    });
  });
});
