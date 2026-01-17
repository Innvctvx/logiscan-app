
import React, { useState } from 'react';
import { ScanRecord, STORE_NAMES, ServiceType } from '../types';
import { FileSpreadsheet, CheckCircle2, CloudUpload, Loader2, Download, Box, Truck, User, Trash2, Pencil, X, Save, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface HistoryTableProps {
  records: ScanRecord[];
  accessToken: string | null;
  onLoginRequest: () => void;
  masterSheetId: string;
  onSyncSuccess?: () => void;
  onDeleteRecord?: (id: string) => void;
  onUpdateRecord?: (updated: ScanRecord) => void;
}

type ViewFilter = 'ALL' | 'SCAN' | 'CARTA_PORTE';

export const HistoryTable: React.FC<HistoryTableProps> = ({ 
  records, 
  masterSheetId, 
  onSyncSuccess, 
  onDeleteRecord, 
  onUpdateRecord 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('ALL');
  const [editingRecord, setEditingRecord] = useState<ScanRecord | null>(null);

  const isScriptMode = masterSheetId && masterSheetId.startsWith('https://');

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString('es-MX', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleSyncToGoogle = async () => {
    if (records.length === 0) return alert("⚠️ No hay registros para sincronizar.");
    if (!isScriptMode) return alert("⚠️ URL del Script no configurada. Ve a Configuración.");

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
             cpCounter++, r.storeLabel, r.cp_operador || '', r.cp_rfcOperador || '', 
             r.cp_licencia || '', r.cp_placa || '', r.cp_numEconomico || '', r.cp_confVehic || '', 
             r.cp_ano || '', r.cp_poliza || '', r.cp_seguro || '', r.cp_peso || '', 
             r.cp_distribuidora || '-', r.cp_proveedorNum || '-',
             r.cp_entryDate || '', r.cp_entryTime || '', r.cp_exitDate || '', r.cp_exitTime || '', 
             r.cp_isLoaded || 'NO', r.cp_loadPercent || '0%', r.cp_exitSeal || '-',
             r.cp_placa2 || '-', r.cp_isLoaded2 || 'NO', r.cp_loadPercent2 || '0%', r.cp_exitSeal2 || '-',
             formatDateTime(r.timestamp), r.scannerName || ''
           ]);
        } else {
          // Lógica para pestañas por tienda (ej: "98 Tacubaya")
          const match = r.storeLabel.match(/(\d+)/);
          const storeNum = match ? match[0] : 'General';
          const storeName = STORE_NAMES[storeNum] || '';
          const tabName = `${storeNum} ${storeName}`.trim();
          
          if (!groupedData[tabName]) groupedData[tabName] = [];
          if (!storeCounters[tabName]) storeCounters[tabName] = 1;
          const consecutivo = storeCounters[tabName]++;

          groupedData[tabName].push([
            consecutivo, r.docType || '', r.docNumber, '', r.bultos, r.storeLabel, 'PAQUETERÍA', r.huCode, '', r.providerCode,
            formatDateTime(r.timestamp), r.status, r.verifiedAt ? formatDateTime(r.verifiedAt) : '',
            r.departureDriver || '', r.departureTrailer || '', r.departureSeal || '',
            r.scannerName || '', r.verifierName || ''
          ]);
        }
      });

      const payload = { action: 'sync', sheets: groupedData };
      console.log("Enviando payload:", payload);

      const response = await fetch(masterSheetId, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const resJson = await response.json();
      
      if (resJson.result === 'success') {
        alert("✅ ¡Sincronización Exitosa! Los datos se han subido a Google Sheets.");
        if (onSyncSuccess) onSyncSuccess();
      } else {
        // DETECCIÓN DE SCRIPT DESACTUALIZADO
        if (resJson.error === "Acción desconocida" || resJson.error === "Action unknown") {
            alert("⚠️ ERROR CRÍTICO DE SINCRONIZACIÓN: \n\nEl Script de Google NO tiene la función 'sync'.\n\nSOLUCIÓN:\n1. Ve al editor de Apps Script.\n2. Borra el código viejo.\n3. Pega el código nuevo (que te acabo de dar).\n4. Haz clic en 'Implementar -> Nueva versión'.");
        } else {
            alert("❌ Error del servidor: " + (resJson.error || "Error desconocido."));
        }
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión. Revisa tu internet o la URL del script.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(records.map(r => ({
      ID: r.id, Tipo: r.recordCategory, Destino: r.storeLabel, 
      HU: r.huCode, Prov: r.providerCode, Fecha: formatDateTime(r.timestamp)
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, "LogiScan_Local.xlsx");
  };

  const handleSaveEdit = () => {
    if (editingRecord && onUpdateRecord) {
      onUpdateRecord(editingRecord);
      setEditingRecord(null);
    }
  };

  const filteredRecords = records.filter(r => {
    if (viewFilter === 'ALL') return true;
    if (viewFilter === 'CARTA_PORTE') return r.recordCategory === 'CARTA_PORTE';
    return r.recordCategory === 'SCAN';
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
      <div className="p-4 border-b bg-slate-50 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><FileSpreadsheet className="text-violet-600" /><h3 className="font-bold uppercase text-xs">Registros en Memoria</h3></div>
          <div className="flex gap-2">
            {records.length > 0 && (
              <>
                <button onClick={handleSyncToGoogle} disabled={isSyncing} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black text-white transition-all active:scale-95 ${isScriptMode ? 'bg-violet-600 hover:bg-violet-700 shadow-md' : 'bg-slate-400 cursor-not-allowed'}`}>
                  {isSyncing ? <Loader2 className="animate-spin w-3 h-3" /> : <CloudUpload className="w-3 h-3" />}
                  SUBIR A DRIVE
                </button>
                <button onClick={handleExport} title="Excel Local" className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-200"><Download className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </div>
        <div className="flex p-1 bg-slate-200/50 rounded-lg w-fit">
          <button onClick={() => setViewFilter('ALL')} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'ALL' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>TODOS ({records.length})</button>
          <button onClick={() => setViewFilter('SCAN')} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'SCAN' ? 'bg-white shadow-sm text-violet-700' : 'text-slate-500'}`}>ESCANEOS</button>
          <button onClick={() => setViewFilter('CARTA_PORTE')} className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${viewFilter === 'CARTA_PORTE' ? 'bg-amber-700 text-white' : 'text-slate-500'}`}>CARTA PORTE</button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Tipo</th>
              <th className="px-3 py-3">Detalle</th>
              <th className="px-3 py-3">Responsable</th>
              <th className="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-300 font-medium flex flex-col items-center justify-center gap-2">
                  <Box className="w-8 h-8 opacity-20" />
                  No hay registros pendientes.
                </td>
              </tr>
            ) : filteredRecords.map((r) => (
              <tr key={r.id} className={`hover:bg-slate-50 group transition-colors ${r.status === 'VERIFICADO' ? 'border-l-4 border-emerald-500 bg-emerald-50/20' : ''}`}>
                <td className="px-3 py-3 text-[9px] font-black">{r.status}</td>
                <td className="px-3 py-3">{r.recordCategory === 'CARTA_PORTE' ? <Truck className="w-3 h-3 text-amber-500" /> : <Box className="w-3 h-3 text-violet-500" />}</td>
                <td className="px-3 py-3">
                  <div className="font-bold text-xs uppercase text-slate-700">{r.recordCategory === 'CARTA_PORTE' ? r.cp_operador : r.storeLabel}</div>
                  <div className="text-[10px] text-slate-400 font-mono font-bold">{r.recordCategory === 'CARTA_PORTE' ? r.cp_placa : r.huCode}</div>
                </td>
                <td className="px-3 py-3 text-[10px] text-slate-500 flex items-center gap-1 font-bold"><User className="w-3 h-3" />{r.scannerName}</td>
                <td className="px-3 py-3 text-right">
                   <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingRecord(r); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteRecord?.(r.id); }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
               <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                 <Pencil className="w-4 h-4 text-violet-400" /> Corregir Registro
               </h3>
               <button onClick={() => setEditingRecord(null)} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Destino / Tienda</label>
                 <select 
                    value={editingRecord.storeLabel} 
                    onChange={e => setEditingRecord({...editingRecord, storeLabel: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold uppercase bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                 >
                    {Object.entries(STORE_NAMES).map(([num, name]) => (
                      <React.Fragment key={num}>
                        <option value={`${ServiceType.CC} ${num}`}>{`${ServiceType.CC} ${num} - ${name}`}</option>
                        <option value={`${ServiceType.DOMICILIO} ${num}`}>{`${ServiceType.DOMICILIO} ${num} - ${name}`}</option>
                      </React.Fragment>
                    ))}
                 </select>
               </div>

               {editingRecord.recordCategory === 'SCAN' ? (
                 <>
                   <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">HU / LP (Paquete)</label>
                    <input 
                      type="text" 
                      value={editingRecord.huCode} 
                      onChange={e => setEditingRecord({...editingRecord, huCode: e.target.value.toUpperCase()})}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                   </div>
                   <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Contenedor / Proveedor</label>
                    <input 
                      type="text" 
                      value={editingRecord.providerCode} 
                      onChange={e => setEditingRecord({...editingRecord, providerCode: e.target.value.toUpperCase()})}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                   </div>
                 </>
               ) : (
                 <>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Operador</label>
                        <input 
                          type="text" 
                          value={editingRecord.cp_operador} 
                          onChange={e => setEditingRecord({...editingRecord, cp_operador: e.target.value.toUpperCase()})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Placa 1</label>
                        <input 
                          type="text" 
                          value={editingRecord.cp_placa} 
                          onChange={e => setEditingRecord({...editingRecord, cp_placa: e.target.value.toUpperCase()})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>
                   </div>
                   {editingRecord.cp_placa2 && editingRecord.cp_placa2 !== '-' && (
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Placa 2</label>
                        <input 
                          type="text" 
                          value={editingRecord.cp_placa2} 
                          onChange={e => setEditingRecord({...editingRecord, cp_placa2: e.target.value.toUpperCase()})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>
                   )}
                 </>
               )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex gap-3">
               <button 
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
               >
                 CANCELAR
               </button>
               <button 
                onClick={handleSaveEdit}
                className="flex-1 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg flex justify-center items-center gap-2"
               >
                 <Save className="w-4 h-4" /> GUARDAR CAMBIOS
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
