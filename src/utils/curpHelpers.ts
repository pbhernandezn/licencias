// src/utils/curpHelpers.ts

// Validar formato con Regex Oficial
export const validateCurpFormat = (curp: string): boolean => {
  const re = /^([A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM](?:AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d])(\d)$/;
  return re.test(curp.toUpperCase());
};

// Base de Datos Simulada (Para la Demo)
const MOCK_DB: Record<string, any> = {
  // Datos de "Juan Pérez" (Usuario Existente)
  'PEPJ880101HDFRXX05': {
    firstName: 'JUAN',
    lastName: 'PEREZ GARCIA',
    birthDate: '1988-01-01',
    gender: 'H',
    state: 'DF'
  },
  // Otro ejemplo
  'ROGA950520HDFRXX02': {
    firstName: 'ROBERTO',
    lastName: 'GOMEZ ARRIAGA',
    birthDate: '1995-05-20',
    gender: 'H',
    state: 'DF'
  }
};

// Función auxiliar para decodificar fecha desde el string (Tu lógica original mejorada)
export const decodeCurpData = (curp: string) => {
  const c = curp.toUpperCase();
  
  try {
      // Extraer fecha (Formato YYMMDD)
      const yearStr = c.substring(4, 6);
      const month = c.substring(6, 8);
      const day = c.substring(8, 10);
      
      // Calcular siglo (Lógica simple para demo: >40 es 1900, si no 2000)
      const yearInt = parseInt(yearStr);
      const fullYear = yearInt > 40 ? `19${yearStr}` : `20${yearStr}`; 
      
      const birthDate = `${fullYear}-${month}-${day}`;
    
      return {
        success: true,
        data: {
          firstName: '', 
          lastName: '',
          birthDate,
          found: false
        }
      };
  } catch (e) {
      return { success: false };
  }
};

// --- ESTA ES LA FUNCIÓN QUE TE FALTABA ---
export const fetchCurpData = async (curp: string) => {
  // 1. Simulamos tiempo de espera de red (1.5 segundos)
  await new Promise(resolve => setTimeout(resolve, 1500));

  const upperCurp = curp.toUpperCase().trim();

  // 2. Buscamos en la Base de Datos Mock (Prioridad)
  if (MOCK_DB[upperCurp]) {
    return {
      success: true,
      data: {
          ...MOCK_DB[upperCurp],
          found: true
      }
    };
  }

  // 3. Si no está en la DB, usamos el decodificador para sacar al menos la fecha
  if (validateCurpFormat(upperCurp)) {
      return decodeCurpData(upperCurp);
  }

  // 4. Si no es válida
  return { success: false };
};