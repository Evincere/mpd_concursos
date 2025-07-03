/**
 * Datos oficiales de provincias y municipios de Argentina
 * Fuente: INDEC - Instituto Nacional de Estadística y Censos
 */

export interface Province {
  id: string;
  name: string;
  code: string;
  region: string;
}

export interface Municipality {
  id: string;
  name: string;
  provinceId: string;
  postalCode?: string;
}

/**
 * Provincias de Argentina (24 jurisdicciones)
 */
export const ARGENTINA_PROVINCES: Province[] = [
  // Región Metropolitana
  { id: 'CABA', name: 'Ciudad Autónoma de Buenos Aires', code: 'CABA', region: 'Metropolitana' },
  { id: 'BA', name: 'Buenos Aires', code: 'BA', region: 'Metropolitana' },
  
  // Región Pampeana
  { id: 'CB', name: 'Córdoba', code: 'CB', region: 'Pampeana' },
  { id: 'SF', name: 'Santa Fe', code: 'SF', region: 'Pampeana' },
  { id: 'ER', name: 'Entre Ríos', code: 'ER', region: 'Pampeana' },
  { id: 'LP', name: 'La Pampa', code: 'LP', region: 'Pampeana' },
  
  // Región Patagónica
  { id: 'NQ', name: 'Neuquén', code: 'NQ', region: 'Patagónica' },
  { id: 'RN', name: 'Río Negro', code: 'RN', region: 'Patagónica' },
  { id: 'CH', name: 'Chubut', code: 'CH', region: 'Patagónica' },
  { id: 'SC', name: 'Santa Cruz', code: 'SC', region: 'Patagónica' },
  { id: 'TF', name: 'Tierra del Fuego', code: 'TF', region: 'Patagónica' },
  
  // Región Cuyo
  { id: 'MZ', name: 'Mendoza', code: 'MZ', region: 'Cuyo' },
  { id: 'SJ', name: 'San Juan', code: 'SJ', region: 'Cuyo' },
  { id: 'SL', name: 'San Luis', code: 'SL', region: 'Cuyo' },
  
  // Región NOA (Noroeste Argentino)
  { id: 'JY', name: 'Jujuy', code: 'JY', region: 'NOA' },
  { id: 'SA', name: 'Salta', code: 'SA', region: 'NOA' },
  { id: 'TU', name: 'Tucumán', code: 'TU', region: 'NOA' },
  { id: 'CT', name: 'Catamarca', code: 'CT', region: 'NOA' },
  { id: 'LR', name: 'La Rioja', code: 'LR', region: 'NOA' },
  { id: 'SG', name: 'Santiago del Estero', code: 'SG', region: 'NOA' },
  
  // Región NEA (Noreste Argentino)
  { id: 'MI', name: 'Misiones', code: 'MI', region: 'NEA' },
  { id: 'CO', name: 'Corrientes', code: 'CO', region: 'NEA' },
  { id: 'CH_NEA', name: 'Chaco', code: 'CH', region: 'NEA' },
  { id: 'FO', name: 'Formosa', code: 'FO', region: 'NEA' }
];

/**
 * Municipios principales de Argentina (muestra representativa)
 * En una implementación real, esto vendría de una API o base de datos
 */
export const ARGENTINA_MUNICIPALITIES: Municipality[] = [
  // Ciudad Autónoma de Buenos Aires
  { id: 'CABA_01', name: 'Comuna 1', provinceId: 'CABA' },
  { id: 'CABA_02', name: 'Comuna 2', provinceId: 'CABA' },
  { id: 'CABA_03', name: 'Comuna 3', provinceId: 'CABA' },
  { id: 'CABA_04', name: 'Comuna 4', provinceId: 'CABA' },
  { id: 'CABA_05', name: 'Comuna 5', provinceId: 'CABA' },
  { id: 'CABA_06', name: 'Comuna 6', provinceId: 'CABA' },
  { id: 'CABA_07', name: 'Comuna 7', provinceId: 'CABA' },
  { id: 'CABA_08', name: 'Comuna 8', provinceId: 'CABA' },
  { id: 'CABA_09', name: 'Comuna 9', provinceId: 'CABA' },
  { id: 'CABA_10', name: 'Comuna 10', provinceId: 'CABA' },
  { id: 'CABA_11', name: 'Comuna 11', provinceId: 'CABA' },
  { id: 'CABA_12', name: 'Comuna 12', provinceId: 'CABA' },
  { id: 'CABA_13', name: 'Comuna 13', provinceId: 'CABA' },
  { id: 'CABA_14', name: 'Comuna 14', provinceId: 'CABA' },
  { id: 'CABA_15', name: 'Comuna 15', provinceId: 'CABA' },

  // Buenos Aires - Principales municipios
  { id: 'BA_001', name: 'La Plata', provinceId: 'BA', postalCode: '1900' },
  { id: 'BA_002', name: 'General Pueyrredón (Mar del Plata)', provinceId: 'BA', postalCode: '7600' },
  { id: 'BA_003', name: 'La Matanza', provinceId: 'BA', postalCode: '1754' },
  { id: 'BA_004', name: 'Lomas de Zamora', provinceId: 'BA', postalCode: '1832' },
  { id: 'BA_005', name: 'Quilmes', provinceId: 'BA', postalCode: '1878' },
  { id: 'BA_006', name: 'Almirante Brown', provinceId: 'BA', postalCode: '1846' },
  { id: 'BA_007', name: 'Morón', provinceId: 'BA', postalCode: '1708' },
  { id: 'BA_008', name: 'San Isidro', provinceId: 'BA', postalCode: '1642' },
  { id: 'BA_009', name: 'Avellaneda', provinceId: 'BA', postalCode: '1870' },
  { id: 'BA_010', name: 'Lanús', provinceId: 'BA', postalCode: '1824' },
  { id: 'BA_011', name: 'San Martín', provinceId: 'BA', postalCode: '1650' },
  { id: 'BA_012', name: 'Tres de Febrero', provinceId: 'BA', postalCode: '1678' },
  { id: 'BA_013', name: 'Vicente López', provinceId: 'BA', postalCode: '1602' },
  { id: 'BA_014', name: 'Tigre', provinceId: 'BA', postalCode: '1648' },
  { id: 'BA_015', name: 'Malvinas Argentinas', provinceId: 'BA', postalCode: '1613' },
  { id: 'BA_016', name: 'Florencio Varela', provinceId: 'BA', postalCode: '1888' },
  { id: 'BA_017', name: 'Berazategui', provinceId: 'BA', postalCode: '1884' },
  { id: 'BA_018', name: 'Esteban Echeverría', provinceId: 'BA', postalCode: '1842' },
  { id: 'BA_019', name: 'Moreno', provinceId: 'BA', postalCode: '1744' },
  { id: 'BA_020', name: 'Merlo', provinceId: 'BA', postalCode: '1722' },

  // Córdoba - Principales municipios
  { id: 'CB_001', name: 'Córdoba', provinceId: 'CB', postalCode: '5000' },
  { id: 'CB_002', name: 'Río Cuarto', provinceId: 'CB', postalCode: '5800' },
  { id: 'CB_003', name: 'Villa María', provinceId: 'CB', postalCode: '5900' },
  { id: 'CB_004', name: 'San Francisco', provinceId: 'CB', postalCode: '2400' },
  { id: 'CB_005', name: 'Villa Carlos Paz', provinceId: 'CB', postalCode: '5152' },
  { id: 'CB_006', name: 'Río Tercero', provinceId: 'CB', postalCode: '5850' },
  { id: 'CB_007', name: 'Alta Gracia', provinceId: 'CB', postalCode: '5186' },
  { id: 'CB_008', name: 'Jesús María', provinceId: 'CB', postalCode: '5220' },
  { id: 'CB_009', name: 'Villa Dolores', provinceId: 'CB', postalCode: '5870' },
  { id: 'CB_010', name: 'La Falda', provinceId: 'CB', postalCode: '5172' },

  // Santa Fe - Principales municipios
  { id: 'SF_001', name: 'Rosario', provinceId: 'SF', postalCode: '2000' },
  { id: 'SF_002', name: 'Santa Fe', provinceId: 'SF', postalCode: '3000' },
  { id: 'SF_003', name: 'Rafaela', provinceId: 'SF', postalCode: '2300' },
  { id: 'SF_004', name: 'Reconquista', provinceId: 'SF', postalCode: '3560' },
  { id: 'SF_005', name: 'Venado Tuerto', provinceId: 'SF', postalCode: '2600' },
  { id: 'SF_006', name: 'Esperanza', provinceId: 'SF', postalCode: '3080' },
  { id: 'SF_007', name: 'Santo Tomé', provinceId: 'SF', postalCode: '3016' },
  { id: 'SF_008', name: 'Casilda', provinceId: 'SF', postalCode: '2170' },
  { id: 'SF_009', name: 'Villa Gobernador Gálvez', provinceId: 'SF', postalCode: '2252' },
  { id: 'SF_010', name: 'Funes', provinceId: 'SF', postalCode: '2132' },

  // Mendoza - Principales municipios
  { id: 'MZ_001', name: 'Mendoza', provinceId: 'MZ', postalCode: '5500' },
  { id: 'MZ_002', name: 'San Rafael', provinceId: 'MZ', postalCode: '5600' },
  { id: 'MZ_003', name: 'Godoy Cruz', provinceId: 'MZ', postalCode: '5501' },
  { id: 'MZ_004', name: 'Guaymallén', provinceId: 'MZ', postalCode: '5519' },
  { id: 'MZ_005', name: 'Maipú', provinceId: 'MZ', postalCode: '5515' },
  { id: 'MZ_006', name: 'Las Heras', provinceId: 'MZ', postalCode: '5539' },
  { id: 'MZ_007', name: 'Luján de Cuyo', provinceId: 'MZ', postalCode: '5507' },
  { id: 'MZ_008', name: 'Rivadavia', provinceId: 'MZ', postalCode: '5577' },
  { id: 'MZ_009', name: 'San Martín', provinceId: 'MZ', postalCode: '5570' },
  { id: 'MZ_010', name: 'Tunuyán', provinceId: 'MZ', postalCode: '5560' },

  // Tucumán - Principales municipios
  { id: 'TU_001', name: 'San Miguel de Tucumán', provinceId: 'TU', postalCode: '4000' },
  { id: 'TU_002', name: 'Banda del Río Salí', provinceId: 'TU', postalCode: '4101' },
  { id: 'TU_003', name: 'Concepción', provinceId: 'TU', postalCode: '4146' },
  { id: 'TU_004', name: 'Tafí Viejo', provinceId: 'TU', postalCode: '4103' },
  { id: 'TU_005', name: 'Yerba Buena', provinceId: 'TU', postalCode: '4107' },
  { id: 'TU_006', name: 'Aguilares', provinceId: 'TU', postalCode: '4124' },
  { id: 'TU_007', name: 'Monteros', provinceId: 'TU', postalCode: '4142' },
  { id: 'TU_008', name: 'Famaillá', provinceId: 'TU', postalCode: '4132' },
  { id: 'TU_009', name: 'Lules', provinceId: 'TU', postalCode: '4128' },
  { id: 'TU_010', name: 'Bella Vista', provinceId: 'TU', postalCode: '4178' }
];

/**
 * Función para obtener municipios por provincia
 */
export function getMunicipalitiesByProvince(provinceId: string): Municipality[] {
  return ARGENTINA_MUNICIPALITIES.filter(municipality => municipality.provinceId === provinceId);
}

/**
 * Función para buscar provincias por nombre
 */
export function searchProvinces(query: string): Province[] {
  if (!query || query.length < 2) return ARGENTINA_PROVINCES;
  
  const normalizedQuery = query.toLowerCase().trim();
  return ARGENTINA_PROVINCES.filter(province => 
    province.name.toLowerCase().includes(normalizedQuery) ||
    province.code.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Función para buscar municipios por nombre dentro de una provincia
 */
export function searchMunicipalities(query: string, provinceId?: string): Municipality[] {
  let municipalities = provinceId 
    ? getMunicipalitiesByProvince(provinceId)
    : ARGENTINA_MUNICIPALITIES;
    
  if (!query || query.length < 2) return municipalities;
  
  const normalizedQuery = query.toLowerCase().trim();
  return municipalities.filter(municipality => 
    municipality.name.toLowerCase().includes(normalizedQuery)
  );
}
