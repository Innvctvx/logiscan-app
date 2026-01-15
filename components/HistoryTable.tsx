import React, { useState } from 'react';
import { ScanRecord, STORE_NAMES, RecordCategory } from '../types';
import { FileSpreadsheet, CheckCircle2, Circle, Clock, Download, CloudUpload, Loader2, Lock, Link as LinkIcon, Zap, Truck, Box, AlertTriangle, Filter, User, ShieldCheck } from 'lucide-react';
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
      const groupedData: Record<string, any[]> = {};
      const storeCounters: Record<string, number> = {};
      let cpCounter = 1; 
      
      records.forEach(r => {
        if (r.recordCategory === 'CARTA_PORTE') {
           const tabName = 'CARTA PORTE'; 
           if (!groupedData[tabName]) groupedData[tabName] = [];
           
           groupedData[tabName].push([
             cpCounter++,             // A: Consecutivo
             r.storeLabel,            // B: Almacen
             r.cp_operador || '',     // C: Operador
             r.cp_rfcOperador || '',  // D: RFC
             r.cp_licencia || '',     // E: Licencia
             r.cp_placa || '',        // F: Placa
             r.cp_numEconomico || '', // G: Num Economico
             r.cp_confVehic || '',    // H: Conf
             r.cp_ano || '',          // I: Año
             r.cp_poliza || '',       // J: Poliza
             r.cp_seguro || '',       // K: Seguro
             r.cp_peso || '',         // L: Peso
             r.cp_distribuidora || '-', // M: Distribuidora
             r.cp_proveedorNum || '-',  // N: Proveedor
             
             // --- NUEVOS CAMPOS HOJA SALIDA ---
             r.cp_entryDate || '',    // O: Fecha Entrada
             r.cp_entryTime || '',    // P: Hora Entrada
             r.cp_exitDate || '',     // Q: Fecha Salida
             r.cp_exitTime || '',     // R: Hora Salida
             r.cp_isLoaded || '',     // S: Cargado
             r.cp_loadPercent || '',  // T: % Carga
             r.cp_exitSeal || '',     // U: Sello Salida
             
             formatDateTime(r.timestamp), // V: Fecha Registro
             r.scannerName || ''          // W: Responsable
           ]);

        } else {
          // Normal Scans
          const match = r.storeLabel.match(/(\d+)/);
          const storeNum = match ? match[0] : 'General';
          const storeName = STORE_NAMES[storeNum] || '';
          const tabName = `${storeNum} ${storeName}`.trim();

          if (!groupedData[tabName]) groupedData[tabName] = [];
          if (!storeCounters[tabName]) storeCounters[tabName] = 1;

          const consecutivo = storeCounters[tabName]++;

          groupedData[tabName].push([
            consecutivo,      // A
            r.docType || '',  // B
            r.docNumber,      // C
            '',               // D
            r.bultos,         // E
            r.storeLabel,     // F
            'PAQUETERÍA',     // G
            r.huCode,         // H
            '',               // I
            r.providerCode,   // J
            formatDateTime(r.timestamp), // K (Fecha Escaneo)
            r.status,         // L (Estado)
            r.verifiedAt ? formatDateTime(r.verifiedAt) : '', // M (Fecha Salida)
            r.departureDriver || '',  // N
            r.departureTrailer || '', // O
            r.departureSeal || '',    // P
            r.scannerName || '',      // Q (Resp Escaneo)
            r.verifierName || ''      // R (Resp Verificacion)
          ]);
        }
      });

      if (isScriptMode) {
        await fetch(masterSheetId, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ 
            action: 'sync',
            sheets: groupedData 
          })
        });
        alert("✅ Datos sincronizados con éxito.");
        setIsSyncing(false);
        return;
      }

      setIsSyncing(false);
      alert("⚠️ Faltan Ajustes de Conexión.");

    } catch (error) {
      console.error("Sync Error", error);
      alert("❌ Error de red.");
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    if (records.length === 0) return;

    const wb = XLSX.utils.book_new();
    const targetStores = ['98', '99', '185', '880'];
    
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

    [...targetStores, 'Otros'].forEach(storeNum => {
      const storeRecords = groupedScans[storeNum];
      if (storeRecords && storeRecords.length > 0) {
        let counter = 1;
        
        const excelRows = storeRecords.map((r) => ({
              "No.": counter++,                                  // A
              "No. Manifiesto o Remision": r.docType,            // B
              "No. Documento": r.docNumber,                      // C
              "No. Pedido": "",                                  // D
              "No. Bultos": r.bultos,                            // E
              "No. Alm.": r.storeLabel,                          // F
              "Nombre Alm. destino": "PAQUETERÍA",               // G
              "No. Contenedor (HU)": r.huCode,                   // H
              "No. Proveedor": "",                               // I
              "Razon social del proveedor": r.providerCode,      // J
              "Fecha Escaneo": formatDateTime(r.timestamp),      // K
              "Estado": r.status,                                // L
              "Fecha Salida": r.verifiedAt ? formatDateTime(r.verifiedAt) : '', // M
              "Conductor Salida": r.departureDriver || '',       // N
              "Remolque": r.departureTrailer || '',              // O
              "Sello": r.departureSeal || '',                    // P
              "Resp. Escaneo": r.scannerName || '',              // Q
              "Resp. Verificación": r.verifierName || ''         // R
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const storeName = STORE_NAMES[storeNum] || '';
        const tabName = `${storeNum} ${storeName}`.trim().substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, tabName);
      }
    });

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
              // NEW FIELDS FOR EXCEL
              "Fecha Entrada": r.cp_entryDate,
              "Hora Entrada": r.cp_entryTime,
              "Fecha Salida": r.cp_exitDate,
              "Hora Salida": r.cp_exitTime,
              "Cargado": r.cp_isLoaded,
              "% Carga": r.cp_loadPercent,
              "Sello Salida": r.cp_exitSeal,
              
              "Fecha Registro": formatDateTime(r.timestamp),
              "Responsable": r.scannerName
      }));
      const wsCP = XLSX.utils.json_to_sheet(cpRows);
      XLSX.utils.book_append_sheet(wb, wsCP, "CARTA PORTE");
    }

    XLSX.writeFile(wb, "LogiScan_Export.xlsx");
  };

  const filteredRecords = records.filter(r => {
    if (viewFilter === 'ALL') return true;
    if (viewFilter === 'CARTA_PORTE') return r.recordCategory === 'CARTA_PORTE';
    if (viewFilter === 'SCAN') return r.recordCategory !== 'CARTA_PORTE';
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
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
        <div className="flex p-1 bg-slate-200/50 rounded-lg w-full sm:w-fit">
          <button onClick={() => setViewFilter('ALL')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>TODOS ({records.length})</button>
          <button onClick={() => setViewFilter('SCAN')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'SCAN' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ESCANEOS</button>
          <button onClick={() => setViewFilter('CARTA_PORTE')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'CARTA_PORTE' ? 'bg-amber-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>CARTA PORTE</button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
            <tr>
              <th className="px-3 py-3 border-b border-slate-200">Estado</th>
              <th className="px-3 py-3 border-b border-slate-200">Tipo</th>
              <th className="px-3 py-3 border-b border-slate-200">Detalle</th>
              <th className="px-3 py-3 border-b border-slate-200">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-300 font-medium">
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
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">No hay registros en esta categoría.</td></tr>
            ) : (
              [...filteredRecords].sort((a, b) => b.timestamp - a.timestamp).map((record) => (
                <tr key={record.id} className={`hover:bg-slate-50 transition-colors border-l-[3px] ${record.status === 'VERIFICADO' ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-transparent'}`}>
                  
                  {/* Status & Time */}
                  <td className="px-3 py-3 border-r border-slate-100 w-24">
                     <div className="flex flex-col gap-1">
                       {record.status === 'VERIFICADO' ? (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded w-fit">VERIF.</span>
                       ) : (
                          <span className="text-[9px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded w-fit">PEND.</span>
                       )}
                       <span className="text-[9px] font-mono text-slate-400">{formatDateTime(record.timestamp).split(',')[1]}</span>
                     </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3 border-r border-slate-100">
                     {record.recordCategory === 'CARTA_PORTE' ? (
                       <span className="flex items-center gap-1 text-[10px] font-black tracking-wide text-amber-700 bg-amber-100 px-2 py-1 rounded-md w-fit shadow-sm"><Truck className="w-3 h-3" /> CP</span>
                     ) : (
                       <span className="flex items-center gap-1 text-[10px] font-black tracking-wide text-violet-700 bg-violet-100 px-2 py-1 rounded-md w-fit shadow-sm"><Box className="w-3 h-3" /> SCAN</span>
                     )}
                  </td>

                  {/* Details */}
                  <td className="px-3 py-3 border-r border-slate-100">
                    {record.recordCategory === 'CARTA_PORTE' ? (
                      <div>
                        <div className="font-bold text-slate-700 text-xs">{record.cp_operador}</div>
                        <div className="text-[10px] text-slate-500 font-mono">PLACA: {record.cp_placa}</div>
                        {(record.cp_entryTime || record.cp_exitTime) && (
                           <div className="mt-1 flex gap-2 text-[9px] text-slate-400">
                              {record.cp_entryTime && <span>IN: {record.cp_entryTime}</span>}
                              {record.cp_exitTime && <span>OUT: {record.cp_exitTime}</span>}
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-700 text-xs">{record.storeLabel}</div>
                        <div className="text-[10px] text-slate-500">
                           HU: <span className="font-mono font-bold">{record.huCode}</span>
                        </div>
                        {record.status === 'VERIFICADO' && (
                          <div className="text-[9px] text-emerald-600 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Salida: {record.departureSeal}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* Responsible */}
                  <td className="px-3 py-3 text-[10px] text-slate-500 font-medium">
                     <div className="flex items-center gap-1">
                       <User className="w-3 h-3 text-slate-300" />
                       {record.scannerName}
                     </div>
                     {record.verifierName && (
                       <div className="flex items-center gap-1 mt-1 text-emerald-600">
                         <CheckCircle2 className="w-3 h-3" />
                         {record.verifierName}
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