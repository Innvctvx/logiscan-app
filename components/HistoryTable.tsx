import React, { useState } from 'react';
import { ScanRecord, STORE_NAMES } from '../types';
import { FileSpreadsheet, CheckCircle2, Circle, Clock, Download, CloudUpload, Loader2, Lock, Link as LinkIcon, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HistoryTableProps {
  records: ScanRecord[];
  accessToken: string | null;
  onLoginRequest: () => void;
  masterSheetId: string;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ records, accessToken, onLoginRequest, masterSheetId }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if we are in "Script Mode" (URL instead of ID)
  const isScriptMode = masterSheetId && masterSheetId.startsWith('https://');

  // Format timestamp to HH:MM
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const getSheetTitle = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `LogiScan Ruta ${day}-${month}-${year}`;
  };

  const handleSyncToGoogle = async () => {
    if (records.length === 0) return;
    setIsSyncing(true);

    try {
      // 1. Prepare Data for Export
      const groupedData: Record<string, any[]> = {};
      
      // We process the records to basic values
      records.forEach(r => {
        const match = r.storeLabel.match(/(\d+)/);
        const storeNum = match ? match[0] : 'Otros';
        if (!groupedData[storeNum]) groupedData[storeNum] = [];
        groupedData[storeNum].push([
          '', // Empty for status check box in sheet
          `1 ${r.docType}`,
          r.docNumber,
          r.bultos,
          r.storeLabel,
          r.destination,
          r.huCode,
          r.providerCode,
          formatTime(r.timestamp),
          r.status,
          r.verifiedAt ? formatTime(r.verifiedAt) : '-'
        ]);
      });

      // --- STRATEGY A: WEBHOOK (NO LOGIN) ---
      if (isScriptMode) {
        // Use text/plain to avoid CORS preflight complex checks, data sent as stringified JSON
        await fetch(masterSheetId, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(groupedData)
        });
        
        alert("✅ Datos sincronizados correctamente (Auto-Mode).");
        setIsSyncing(false);
        return;
      }

      // --- STRATEGY B: OAUTH2 (LOGIN REQUIRED) ---
      
      if (!accessToken) {
        setIsSyncing(false);
        onLoginRequest();
        return;
      }

      const targetStores = ['98', '99', '195', '880'];
      let spreadsheetId = '';

      if (masterSheetId && !isScriptMode) {
        // Use provided Sheet ID
        spreadsheetId = masterSheetId;
        
        // Ensure tabs exist
        try {
          const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (!metaRes.ok) throw new Error("Acceso denegado a la hoja. Verifica ID y permisos.");

          const metaData = await metaRes.json();
          const existingTitles = metaData.sheets.map((s: any) => s.properties.title);
          
          const requests = [];
          const neededTabs = [...Object.keys(groupedData)];
          
          for (const tab of neededTabs) {
            if (!existingTitles.includes(tab)) {
               requests.push({ addSheet: { properties: { title: tab } } });
            }
          }

          if (requests.length > 0) {
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
              method: 'POST',
              headers: { 
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ requests })
            });
          }
        } catch (err: any) {
          alert(`Error: ${err.message}`);
          setIsSyncing(false);
          return;
        }

      } else {
        // Create Daily Sheet
        const title = getSheetTitle();
        const searchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${title}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const searchData = await searchRes.json();

        if (searchData.files && searchData.files.length > 0) {
          spreadsheetId = searchData.files[0].id;
        } else {
          const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              properties: { title: title },
              sheets: [
                  ...targetStores.map(id => ({ properties: { title: id } })),
                  { properties: { title: 'Otros' } }
              ]
            })
          });
          const createData = await createRes.json();
          spreadsheetId = createData.spreadsheetId;
        }
      }

      // Append Data
      for (const storeNum of Object.keys(groupedData)) {
        const rows = groupedData[storeNum];
        if (rows.length === 0) continue;
        const range = `${storeNum}!A1`; 
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: rows })
        });
      }

      alert("✅ Datos sincronizados correctamente.");

    } catch (error) {
      console.error("Sync Error", error);
      alert("Error al sincronizar. Intenta nuevamente.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    if (records.length === 0) return;

    const wb = XLSX.utils.book_new();
    const targetStores = ['98', '99', '195', '880'];
    const groupedData: Record<string, ScanRecord[]> = {};

    records.forEach(record => {
      const match = record.storeLabel.match(/(\d+)/);
      const storeNum = match ? match[0] : 'Otros';
      if (!groupedData[storeNum]) groupedData[storeNum] = [];
      groupedData[storeNum].push(record);
    });

    [...targetStores, 'Otros'].forEach(storeNum => {
      const storeRecords = groupedData[storeNum];
      if (storeRecords && storeRecords.length > 0) {
        const excelRows = storeRecords.map((r, index) => ({
          "No.": index + 1,
          "No. Manifiesto / Remision": `1 ${r.docType}`,
          "No. Documento": r.docNumber,
          "No. Bultos": r.bultos,
          "No. Alm": r.storeLabel,
          "Nombre Alm. Destino": r.destination,
          "No. Contenedor (HU)": r.huCode,
          "Razon Social (Prov)": r.providerCode,
          "Hora Escaneo": formatTime(r.timestamp),
          "Estado": r.status,
          "Hora Salida": r.verifiedAt ? formatTime(r.verifiedAt) : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wscols = [
          {wch: 5}, {wch: 25}, {wch: 15}, {wch: 10}, {wch: 15}, 
          {wch: 15}, {wch: 20}, {wch: 20}, {wch: 10}, {wch: 12}, {wch: 12}
        ];
        ws['!cols'] = wscols;

        const tabName = STORE_NAMES[storeNum] ? `${storeNum} ${STORE_NAMES[storeNum]}` : `Tienda ${storeNum}`;
        const safeTabName = tabName.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, safeTabName);
      }
    });

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const filename = `Salidas a Ruta ${day}-${month}-${year}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center bg-slate-50 gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <div className="flex flex-col">
            <h3 className="font-semibold text-slate-700 leading-none">Hoja de Ruta</h3>
            {isScriptMode && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <Zap className="w-3 h-3" /> Auto-Sync Activo
              </span>
            )}
            {!isScriptMode && masterSheetId && (
               <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-1">
                <LinkIcon className="w-3 h-3" /> Modo Centralizado
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {records.length > 0 && (
             <>
              <button 
                onClick={handleSyncToGoogle}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 ${isScriptMode || accessToken ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-700 text-white hover:bg-slate-800'}`}
              >
                {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : (isScriptMode || accessToken) ? <CloudUpload className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isScriptMode ? 'Enviar Todo' : accessToken ? (masterSheetId ? 'Enviar Central' : 'Sync Drive') : 'Login Sync'}
              </button>

              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                title="Descargar respaldo local"
              >
                <Download className="w-3 h-3" />
              </button>
            </>
          )}

          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 ml-2">
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {records.filter(r => r.status === 'VERIFICADO').length}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total: {records.length}
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-3 py-3 font-bold border-b text-center w-10">Estado</th>
              <th className="px-3 py-3 font-bold border-b">Documento</th>
              <th className="px-3 py-3 font-bold border-b text-center bg-green-50 text-green-800">Almacén</th>
              <th className="px-3 py-3 font-bold border-b">Contenedor / LP</th>
              <th className="px-3 py-3 font-bold border-b">Detalles</th>
              <th className="px-3 py-3 font-bold border-b text-right">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <p className="mb-2">No hay datos.</p>
                  <p className="text-xs">Usa el modo "Registro" para crear grupos.</p>
                </td>
              </tr>
            ) : (
              [...records]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((record) => (
                <tr 
                  key={record.id} 
                  className={`transition-colors border-l-4 ${record.status === 'VERIFICADO' ? 'bg-green-50 border-l-green-500' : 'hover:bg-slate-50 border-l-transparent'}`}
                >
                  <td className="px-3 py-2 text-center border-r border-slate-100">
                    {record.status === 'VERIFICADO' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-3 py-2 border-r border-slate-100">
                    <div className="font-medium text-slate-700">1 {record.docType}</div>
                    <div className="text-xs text-slate-500 font-mono">{record.docNumber}</div>
                  </td>
                  <td className="px-3 py-2 text-center border-r border-slate-100 bg-green-50/30">
                    <span className="font-bold text-green-700">{record.storeLabel}</span>
                    <div className="text-[10px] text-slate-500">PAQUETERÍA</div>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-blue-600 font-bold mb-1">PROV: {record.providerCode}</span>
                      <span className="font-mono font-medium text-slate-900">HU: {record.huCode}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-100">
                    <span className="text-xs text-slate-500">Bultos: {record.bultos}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-mono text-slate-500">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(record.timestamp)}
                    </div>
                    {record.verifiedAt && (
                      <div className="text-green-600 font-bold mt-1">
                        Salida: {formatTime(record.verifiedAt)}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};