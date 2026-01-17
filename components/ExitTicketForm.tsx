
import React, { useState, useEffect } from 'react';
import { Clock, FileCheck, Truck, Layers, CloudUpload, Loader2, Plus } from 'lucide-react';
import { CatalogData } from '../types';
import { ExitTicket } from './ExitTicket';

interface ExitTicketFormProps {
  operadorName: string; setOperadorName: (v: string) => void;
  placa: string; setPlaca: (v: string) => void; // Internamente sigue siendo 'placa' pero en UI será 'Número de Remolque'
  
  entryDate: string; setEntryDate: (v: string) => void;
  entryTime: string; setEntryTime: (v: string) => void;
  exitDate: string; setExitDate: (v: string) => void;
  exitTime: string; setExitTime: (v: string) => void;
  
  // Remolque 1
  isLoaded: string; setIsLoaded: (v: string) => void;
  loadPercent: string; setLoadPercent: (v: string) => void;
  exitSeal: string; setExitSeal: (v: string) => void;

  // Remolque 2
  placa2: string; setPlaca2: (v: string) => void;
  isLoaded2: string; setIsLoaded2: (v: string) => void;
  loadPercent2: string; setLoadPercent2: (v: string) => void;
  exitSeal2: string; setExitSeal2: (v: string) => void;

  catalogs: CatalogData;
  scriptUrl?: string;
}

export const ExitTicketForm: React.FC<ExitTicketFormProps> = ({
  operadorName, setOperadorName,
  placa, setPlaca,
  entryDate, setEntryDate,
  entryTime, setEntryTime,
  exitDate, setExitDate,
  exitTime, setExitTime,
  isLoaded, setIsLoaded,
  loadPercent, setLoadPercent,
  exitSeal, setExitSeal,
  placa2, setPlaca2,
  isLoaded2, setIsLoaded2,
  loadPercent2, setLoadPercent2,
  exitSeal2, setExitSeal2,
  catalogs,
  scriptUrl
}) => {
  const [showExitTicket, setShowExitTicket] = useState(false);
  const [storeInput, setStoreInput] = useState('5');
  const [hasSecondTrailer, setHasSecondTrailer] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Inicializar fecha/hora si están vacías
  useEffect(() => {
    const now = new Date();
    // Formato YYYY-MM-DD
    const dateStr = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
    // Formato HH:mm
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    if (!entryDate) setEntryDate(dateStr);
    if (!entryTime) setEntryTime(timeStr);
    if (!exitDate) setExitDate(dateStr);
    if (!exitTime) setExitTime(timeStr);
  }, []);

  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOperadorName(e.target.value);
  };

  const sendToGoogleSheet = async () => {
    if (!scriptUrl) return alert("URL del script no configurada");
    
    setIsSending(true);
    
    const payload = {
      action: 'saveExitTicket',
      data: {
        D11: placa,
        F11: isLoaded,
        I11: loadPercent,
        
        D13: placa2 || '',
        F13: hasSecondTrailer || placa2 ? isLoaded2 : '',
        I13: hasSecondTrailer || placa2 ? loadPercent2 : '',
        
        E15: operadorName,
        E17: `${entryDate} ${entryTime}`,
        E19: `${exitDate} ${exitTime}`,
        
        H25: exitSeal,
        H26: exitSeal2
      }
    };

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      if (res.result === 'success') {
        alert("✅ Hoja de Salida Generada en Google Sheets Correctamente");
      } else {
        alert("❌ Error al generar en Sheets: " + (res.error || "Desconocido"));
      }
    } catch (e) {
      alert("❌ Error de conexión");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* 1. Datos de la Unidad */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-blue-100">
          <Truck className="w-5 h-5 text-blue-500" /> Datos de la Unidad
        </h3>
        
        <div className="space-y-4">
           <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Operador</label>
            <input 
              list="drivers-list-exit"
              type="text" 
              value={operadorName} 
              onChange={handleDriverChange} 
              className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-slate-400 font-bold" 
              placeholder="Nombre operador" 
            />
            <datalist id="drivers-list-exit">
              {catalogs.drivers.map((d, i) => <option key={i} value={d.name} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Número de Remolque 1</label>
                <input 
                  type="text" 
                  value={placa} 
                  onChange={e => setPlaca(e.target.value)} 
                  className="w-full p-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm uppercase font-bold text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                  placeholder="REMOLQUE 1" 
                />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Número de Remolque 2</label>
                <input 
                  type="text" 
                  value={placa2} 
                  onChange={e => setPlaca2(e.target.value)} 
                  className={`w-full p-2.5 border rounded-lg text-sm uppercase font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all ${placa2 ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-400'}`} 
                  placeholder="REMOLQUE 2 (Opcional)" 
                />
             </div>
          </div>
        </div>
      </div>

      {/* 2. Tiempos (INPUTS NATIVOS) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-blue-100">
          <Clock className="w-5 h-5 text-blue-500" /> Tiempos de Patio
        </h3>
        
        {/* Entrada */}
        <div className="grid grid-cols-2 gap-4 mb-4 border-b border-slate-100 pb-4">
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Fecha Entrada</label>
             <input 
               type="date" 
               value={entryDate} 
               onChange={e => setEntryDate(e.target.value)} 
               className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 uppercase focus:ring-2 focus:ring-blue-400 outline-none"
             />
           </div>
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Hora Entrada</label>
             <input 
               type="time" 
               value={entryTime} 
               onChange={e => setEntryTime(e.target.value)} 
               className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 uppercase focus:ring-2 focus:ring-blue-400 outline-none"
             />
           </div>
        </div>

        {/* Salida */}
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Fecha Salida</label>
             <input 
               type="date" 
               value={exitDate} 
               onChange={e => setExitDate(e.target.value)} 
               className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 uppercase focus:ring-2 focus:ring-blue-400 outline-none"
             />
           </div>
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Hora Salida</label>
             <input 
               type="time" 
               value={exitTime} 
               onChange={e => setExitTime(e.target.value)} 
               className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50 uppercase focus:ring-2 focus:ring-blue-400 outline-none"
             />
           </div>
        </div>
      </div>

      {/* 3. Carga Remolque 1 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-blue-100">
          <Layers className="w-5 h-5 text-blue-500" /> Remolque 1
        </h3>
        <div className="grid grid-cols-3 gap-3">
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Cargado</label>
             <select value={isLoaded} onChange={e => setIsLoaded(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold">
               <option value="SI">SI</option><option value="NO">NO</option>
             </select>
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">% Carga</label>
             <input type="text" value={loadPercent} onChange={e => setLoadPercent(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold" />
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Sello</label>
             <input type="text" value={exitSeal} onChange={e => setExitSeal(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-600" />
           </div>
        </div>
      </div>

      {/* 4. Carga Remolque 2 (Activable) */}
      <div className={`bg-white p-5 rounded-xl shadow-sm border transition-all ${hasSecondTrailer || placa2 ? 'border-blue-400 opacity-100' : 'border-slate-200 opacity-60'}`}>
         <div className="flex justify-between items-center border-b pb-3 border-blue-100 mb-5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" /> Remolque 2
            </h3>
            {!(hasSecondTrailer || placa2) && (
              <button onClick={() => setHasSecondTrailer(true)} className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1">
                <Plus className="w-3 h-3" /> AGREGAR SEGUNDO
              </button>
            )}
         </div>
        <div className="grid grid-cols-3 gap-3">
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Cargado</label>
             <select disabled={!(hasSecondTrailer || placa2)} value={isLoaded2} onChange={e => setIsLoaded2(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold">
               <option value="SI">SI</option><option value="NO">NO</option>
             </select>
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">% Carga</label>
             <input disabled={!(hasSecondTrailer || placa2)} type="text" value={loadPercent2} onChange={e => setLoadPercent2(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold" />
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Sello</label>
             <input disabled={!(hasSecondTrailer || placa2)} type="text" value={exitSeal2} onChange={e => setExitSeal2(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-600" />
           </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
         <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Almacén / Locación</label>
         <input type="text" value={storeInput} onChange={e => setStoreInput(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold" />
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={sendToGoogleSheet}
          disabled={isSending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:active:scale-100"
        >
          {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <CloudUpload className="w-6 h-6" />}
          GENERAR EN GOOGLE SHEETS
        </button>

        <button 
          onClick={() => setShowExitTicket(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-3"
        >
          <FileCheck className="w-6 h-6" />
          VISTA PREVIA E IMPRESIÓN
        </button>
      </div>

      {showExitTicket && (
        <ExitTicket 
          onClose={() => setShowExitTicket(false)}
          data={{
            trailer: placa,
            isLoaded: isLoaded,
            percent: loadPercent,
            trailer2: placa2,
            isLoaded2: isLoaded2,
            percent2: loadPercent2,
            driver: operadorName,
            entryDate,
            entryTime,
            exitDate,
            exitTime,
            seal: exitSeal,
            seal2: exitSeal2,
            store: storeInput
          }}
        />
      )}
    </div>
  );
};
