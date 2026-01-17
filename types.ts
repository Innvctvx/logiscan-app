
export enum ServiceType {
  CC = 'C&C',
  DOMICILIO = 'DOM'
}

export enum Region {
  LOCAL = 'Local',
  FORANEO = 'Foráneo'
}

export type DocType = 'EMBARQUE' | 'REMISIÓN';

export type RecordStatus = 'PENDIENTE' | 'VERIFICADO';

export type RecordCategory = 'SCAN' | 'CARTA_PORTE';

export interface ScanRecord {
  id: string;
  timestamp: number;
  verifiedAt?: number;
  status: RecordStatus;
  recordCategory: RecordCategory; 
  
  // Responsible Parties
  scannerName: string;      // Columna Q (Quien escaneó entrada)
  verifierName?: string;    // Columna R (Quien verificó salida)

  // Fields for Scanning
  docType?: DocType;
  docNumber?: string;
  bultos?: string;
  storeLabel: string;
  destination: string;
  huCode?: string;        // LP or Paquete
  providerCode?: string;  // Container or Proveedor

  // Fields for Departure / Verification
  departureDriver?: string; // Columna N
  departureTrailer?: string;// Columna O
  departureSeal?: string;   // Columna P

  // Fields for Carta Porte
  cp_rfcOperador?: string;
  cp_licencia?: string;
  cp_operador?: string;
  cp_numEconomico?: string;
  cp_confVehic?: string;
  cp_placa?: string;
  cp_ano?: string;
  cp_poliza?: string;
  cp_seguro?: string;
  cp_peso?: string;
  
  // Time Fields for Carta Porte / Exit Ticket
  cp_entryDate?: string; // Fecha Ingreso
  cp_entryTime?: string; // Hora Ingreso
  cp_exitDate?: string;  // Fecha Salida
  cp_exitTime?: string;  // Hora Salida
  
  // Exit Ticket Specifics (Trailer 1)
  cp_isLoaded?: string;  // SI / NO
  cp_loadPercent?: string; // 30%, 100%, etc
  cp_exitSeal?: string; // Sello de Salida (H25)

  // Exit Ticket Specifics (Trailer 2)
  cp_placa2?: string;
  cp_isLoaded2?: string;
  cp_loadPercent2?: string;
  cp_exitSeal2?: string;

  // Fields for Foraneo Provider
  cp_distribuidora?: string;
  cp_proveedorNum?: string;
}

// Nueva interfaz para datos descargados del Excel
export interface MasterRecord {
  code: string;       // El código (HU o Proveedor)
  store: string;      // En qué tienda está (98, 99...)
  sheetRow: number;   // Fila en el Excel (para actualizar rápido)
  originalDate: string; // Fecha de entrada
}

export const STORE_NAMES: Record<string, string> = {
  '98': 'Tacubaya',
  '185': '185',
  '99': 'Tultitlán',
  '880': 'Plan N5'
};

export const STORES = {
  LOCAL: ['98', '185'],
  FORANEO: ['99', '880']
};

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export interface CatalogDriver {
  rfc: string;
  license: string;
  name: string;
}

export interface CatalogUnit {
  eco: string;
  conf: string;
  placa: string;
  year: string;
  policy: string;
  insurance: string;
  weight: string;
}

export interface CatalogData {
  drivers: CatalogDriver[];
  units: CatalogUnit[];
}
