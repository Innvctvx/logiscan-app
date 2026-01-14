
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

export interface ScanRecord {
  id: string;
  timestamp: number;
  verifiedAt?: number;
  status: RecordStatus;
  docType: DocType;      // Col: 1/EMBARQUE
  docNumber: string;     // Col: No. Documento
  bultos: string;        // Col: No. Bultos
  storeLabel: string;    // Col: No. Alm (e.g., C&C 880)
  destination: string;   // Col: Nombre Alm. Destino (Fixed: PAQUETERÍA)
  huCode: string;        // Col: No. Contenedor (HU) -> The LP
  providerCode: string;  // Col: Razon social -> The Container (Q...)
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
