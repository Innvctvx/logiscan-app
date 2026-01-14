import React, { useState } from 'react';
import { ScanRecord, STORE_NAMES, RecordCategory } from '../types';
import { FileSpreadsheet, CheckCircle2, Circle, Clock, Download, CloudUpload, Loader2, Lock, Link as LinkIcon, Zap, Truck, Box, AlertTriangle, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HistoryTableProps {
  records: ScanRecord[];
  accessToken: string | null;
  onLoginRequest: () => void;
  masterSheetId: string;
}

type ViewFilter = 'ALL' | 'SCAN' | 'CARTA_PORTE';

export const HistoryTable: React.FC<HistoryTableProps> = ({ records, accessToken, onLoginRequest, masterSheetId }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('ALL');

  // Check if we have a valid Web App URL
  const isScriptMode = masterSheetId && masterSheetId.startsWith('https://');

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSyncToGoogle = async () => {
    if (records.length === 0) return;
    setIsSyncing(true);

    try {
      // 1. Prepare Data
      const groupedData: Record<string, any[]> = {};
      const storeCounters: Record<string, number> = {};
      let cpCounter = 1; // Global counter for Carta Porte tab
      
      records.forEach(r => {
        // Logic: Scans go to Store Tabs (98, 99...), CP goes to 'CARTA PORTE' tab
        
        if (r.recordCategory === 'CARTA_PORTE') {
           const tabName = 'CARTA PORTE';
           if (!groupedData[tabName]) groupedData[tabName] = [];
           
           groupedData[tabName].push([
             cpCounter++,           // A: Consecutivo Global CP
             r.storeLabel,          // B: Almacen (Important for context)
             r.cp_operador || '',   // C: Operador
             r.cp_rfcOperador || '',// D: RFC
             r.cp_licencia || '',   // E: Licencia
             r.cp_placa || '',      // F: Placa
             r.cp_numEconomico || '',
             r.cp_confVehic || '',
             r.cp_ano || '',
             r.cp_poliza || '',
             r.cp_seguro || '',
             r.cp_peso || '',
             r.cp_distribuidora || '-',
             r.cp_proveedorNum || '-',
             formatDateTime(r.timestamp)
           ]);

        } else {
          // Normal Scans Logic
          const match = r.storeLabel.match(/(\d+)/);
          const storeNum = match ? match[0] : 'Otros';
          
          if (!groupedData[storeNum]) groupedData[storeNum] = [];
          if (!storeCounters[storeNum]) storeCounters[storeNum] = 1;

          const consecutivo = storeCounters[storeNum]++;

          groupedData[storeNum].push([
            consecutivo, // Column A: Sequential Number
            r.docType || '', // Column B: Doc Type (EMBARQUE/REMISION)
            r.docNumber,
            r.bultos,
            r.storeLabel,
            r.destination,
            r.huCode,
            r.providerCode,
            formatDateTime(r.timestamp),
            r.status,
            r.verifiedAt ? formatDateTime(r.verifiedAt) : '-'
          ]);
        }
      });

      // 2. Send Data via WebHook (Preferred Method)
      if (isScriptMode) {
        await fetch(masterSheetId, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(groupedData)
        });
        alert("✅ Datos sincronizados correctamente.\n(Se actualizaron las pestañas de Tienda y CARTA PORTE)");
        setIsSyncing(false);
        return;
      }

      // 3. Fallback / Error if no URL is configured
      setIsSyncing(false);
      alert(
        "⚠️ Faltan Ajustes de Conexión ⚠️\n\n" +
        "El sistema no encuentra la URL del Script de Google.\n\n" +
        "1. Abre el archivo App.tsx y pega la URL en 'GOOGLE_SCRIPT_URL'.\n" +
        "2. O toca el botón de engranaje (⚙️) y pégala ahí."
      );

    } catch (error) {
      console.error("Sync Error", error);
      alert("❌ Error de red o de servidor. Intenta de nuevo.");
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    if (records.length === 0) return;

    const wb = XLSX.utils.book_new();
    const targetStores = ['98', '99', '195', '880'];
    
    // Group Data
    const groupedScans: Record<string, ScanRecord[]> = {};
    const cartaPorteRecords: ScanRecord[] = [];

    records.forEach(record => {
      if (record.recordCategory === 'CARTA_PORTE') {
        cartaPorteRecords.push(record);
      } else {
        const match = record.storeLabel.match(/(\d+)/);
        const storeNum = match ? match[0] : 'Otros';
        if (!groupedScans[storeNum]) groupedScans[storeNum] = [];
        groupedScans[storeNum].push(record);
      }
    });

    // 1. Create Sheets for Stores (Scans only)
    [...targetStores, 'Otros'].forEach(storeNum => {
      const storeRecords = groupedScans[storeNum];
      if (storeRecords && storeRecords.length > 0) {
        let counter = 1;
        const excelRows = storeRecords.map((r) => ({
              "No.": counter++,
              "Tipo Doc": r.docType,
              "No. Documento": r.docNumber,
              "Bultos": r.bultos,
              "Almacen": r.storeLabel,
              "Destino": r.destination,
              "HU / LP": r.huCode,
              "Proveedor / Contenedor": r.providerCode,
              "Fecha Escaneo": formatDateTime(r.timestamp),
              "Estado": r.status,
              "Fecha Salida": r.verifiedAt ? formatDateTime(r.verifiedAt) : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const tabName = STORE_NAMES[storeNum] ? `${storeNum} ${STORE_NAMES[storeNum]}` : `Tienda ${storeNum}`;
        XLSX.utils.book_append_sheet(wb, ws, tabName.substring(0, 31));
      }
    });

    // 2. Create Specific Sheet for CARTA PORTE
    if (cartaPorteRecords.length > 0) {
      let cpCounter = 1;
      const cpRows = cartaPorteRecords.map(r => ({
              "No.": cpCounter++,
              "Almacen": r.storeLabel,
              "Operador": r.cp_operador,
              "RFC Operador": r.cp_rfcOperador,
              "Licencia": r.cp_licencia,
              "Placa": r.cp_placa,
              "No. Economico": r.cp_numEconomico,
              "Conf. Vehic": r.cp_confVehic,
              "Año": r.cp_ano,
              "Poliza": r.cp_poliza,
              "Seguro": r.cp_seguro,
              "Peso": r.cp_peso,
              "Distribuidora": r.cp_distribuidora || '-',
              "No. Proveedor": r.cp_proveedorNum || '-',
              "Fecha Registro": formatDateTime(r.timestamp)
      }));
      const wsCP = XLSX.utils.json_to_sheet(cpRows);
      XLSX.utils.book_append_sheet(wb, wsCP, "CARTA PORTE");
    }

    XLSX.writeFile(wb, "LogiScan_Export.xlsx");
  };

  // Filter records for display
  const filteredRecords = records.filter(r => {
    if (viewFilter === 'ALL') return true;
    if (viewFilter === 'CARTA_PORTE') return r.recordCategory === 'CARTA_PORTE';
    if (viewFilter === 'SCAN') return r.recordCategory !== 'CARTA_PORTE';
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-slate-700">Registros</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <>
                <button 
                  onClick={handleSyncToGoogle}
                  disabled={isSyncing}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 ${isScriptMode ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-slate-700 text-white'}`}
                >
                  {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                  {isScriptMode ? 'Sync Central' : 'Sync'}
                </button>
                <button onClick={handleExport} className="bg-slate-100 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-200"><Download className="w-4 h-4 text-slate-600" /></button>
              </>
            )}
          </div>
        </div>

        {/* View Filter Tabs */}
        <div className="flex p-1 bg-slate-200/50 rounded-lg w-full sm:w-fit">
          <button 
            onClick={() => setViewFilter('ALL')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            TODOS ({records.length})
          </button>
          <button 
            onClick={() => setViewFilter('SCAN')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'SCAN' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ESCANEOS
          </button>
          <button 
            onClick={() => setViewFilter('CARTA_PORTE')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'CARTA_PORTE' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            CARTA PORTE
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
            <tr>
              <th className="px-3 py-3 border-b border-slate-200">Tipo</th>
              <th className="px-3 py-3 border-b border-slate-200">Detalle Principal</th>
              <th className="px-3 py-3 border-b border-slate-200">Almacén</th>
              <th className="px-3 py-3 border-b border-slate-200">Info Adicional</th>
              <th className="px-3 py-3 border-b border-slate-200 text-right">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-300 font-medium">
                  {isScriptMode ? (
                     <span className="flex flex-col items-center gap-2">
                       <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-50" />
                       Conectado a Hoja Central. Listo para escanear.
                     </span>
                  ) : (
                     <span className="flex flex-col items-center gap-2">
                       <AlertTriangle className="w-8 h-8 text-amber-400 opacity-50" />
                       Configura la URL para sincronizar.
                     </span>
                  )}
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                  No hay registros en esta categoría.
                </td>
              </tr>
            ) : (
              [...filteredRecords].sort((a, b) => b.timestamp - a.timestamp).map((record) => (
                <tr key={record.id} className={`hover:bg-slate-50 transition-colors border-l-[3px] ${record.status === 'VERIFICADO' ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-transparent'}`}>
                  
                  {/* TIPO COLUMN */}
                  <td className="px-3 py-3 border-r border-slate-100">
                     {record.recordCategory === 'CARTA_PORTE' ? (
                       <span className="flex items-center gap-1 text-[10px] font-black tracking-wide text-amber-700 bg-amber-100 px-2 py-1 rounded-md w-fit shadow-sm">
                         <Truck className="w-3 h-3" /> CP
                       </span>
                     ) : (
                       <span className="flex items-center gap-1 text-[10px] font-black tracking-wide text-violet-700 bg-violet-100 px-2 py-1 rounded-md w-fit shadow-sm">
                         <Box className="w-3 h-3" /> SCAN
                       </span>
                     )}
                  </td>

                  {/* DETALLE PRINCIPAL */}
                  <td className="px-3 py-3 border-r border-slate-100">
                    {record.recordCategory === 'CARTA_PORTE' ? (
                      <div>
                        <div className="font-bold text-slate-700">{record.cp_operador}</div>
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-100 inline-block px-1 rounded mt-1">PLACA: {record.cp_placa}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-slate-700">1 {record.docType}</div>
                        <div className="text-xs text-slate-500">{record.docNumber} <span className="opacity-60">({record.bultos} bultos)</span></div>
                      </div>
                    )}
                  </td>

                  {/* ALMACEN */}
                  <td className="px-3 py-3 text-center border-r border-slate-100 bg-slate-50/50">
                    <span className="font-black text-slate-700 text-xs bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">{record.storeLabel}</span>
                  </td>

                  {/* INFO ADICIONAL */}
                  <td className="px-3 py-3 border-r border-slate-100">
                    {record.recordCategory === 'CARTA_PORTE' ? (
                      <div className="text-xs text-slate-500">
                        <span className="font-bold text-slate-400 text-[10px] uppercase">RFC:</span> {record.cp_rfcOperador} <br/>
                        {record.cp_distribuidora && (
                           <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded text-[10px]">{record.cp_distribuidora} ({record.cp_proveedorNum})</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                         <span className="font-bold text-slate-400 text-[10px] uppercase">HU:</span> <span className="font-mono">{record.huCode}</span> <br/>
                         <span className="font-bold text-slate-400 text-[10px] uppercase">PRV:</span> <span className="font-mono">{record.providerCode}</span>
                      </div>
                    )}
                  </td>

                  {/* FECHA/HORA */}
                  <td className="px-3 py-3 text-right text-[10px] font-mono font-medium text-slate-400">
                    {formatDateTime(record.timestamp)}
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
