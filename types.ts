
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
  recordCategory: RecordCategory; // New field to distinguish type
  
  // Fields for Scanning
  docType?: DocType;
  docNumber?: string;
  bultos?: string;
  storeLabel: string;
  destination: string;
  huCode?: string;        // LP or Paquete
  providerCode?: string;  // Container or Proveedor

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
  
  // New Fields for Foraneo Provider
  cp_distribuidora?: string;
  cp_proveedorNum?: string;
}

export const STORE_NAMES: Record<string, string> = {
  '98': 'Tacubaya',
  '195': '195',
  '99': 'Tultitlán',
  '880': 'Plan N5'
};

export const STORES = {
  LOCAL: ['98', '195'],
  FORANEO: ['99', '880']
};

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}
