
interface ApiResponse {
  result: 'success' | 'error';
  error?: string;
  [key: string]: any;
}

export const api = {
  login: async (scriptUrl: string, username: string, password: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', username, password })
      });
      return await response.json();
    } catch (e) {
      return { result: 'error', error: 'Error de conexión' };
    }
  },

  getCatalogs: async (scriptUrl: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getCatalogs' })
      });
      return await response.json();
    } catch (e) {
      return { result: 'error', error: 'Error obteniendo catálogos' };
    }
  },

  // NUEVA FUNCIÓN: Descargar historial para verificar
  fetchMasterData: async (scriptUrl: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'fetchMasterData' })
      });
      return await response.json();
    } catch (e) {
      return { result: 'error', error: 'Error descargando base de datos' };
    }
  },

  syncRecords: async (scriptUrl: string, payload: any): Promise<ApiResponse> => {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (e) {
      return { result: 'error', error: 'Error de red al sincronizar' };
    }
  },

  saveExitTicket: async (scriptUrl: string, data: any): Promise<ApiResponse> => {
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveExitTicket', data })
      });
      return await response.json();
    } catch (e) {
      return { result: 'error', error: 'Error guardando hoja de salida' };
    }
  }
};
