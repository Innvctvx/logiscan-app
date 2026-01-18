import React, { useState, useEffect } from 'react';
import { Clock, FileCheck, Truck, Layers, CloudUpload, Loader2, Plus, AlertTriangle, Search, Zap, MapPin } from 'lucide-react';
import { CatalogData, STORE_NAMES, ServiceType } from '../types';
import { ExitTicket } from './ExitTicket';
import { playErrorSound, playSuccessSound } from '../services/soundService';

interface ExitTicketFormProps {
  operadorName: string; setOperadorName: (v: string) => void;
  placa: string; setPlaca: (v: string) => void;
  
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

  // Almacen Salida (Levantado al padre)
  exitStore: string; setExitStore: (v: string) => void;

  catalogs: CatalogData;
  scriptUrl?: string;
  onRequestAutofill: () => void;
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
  exitStore, setExitStore,
  catalogs,
  scriptUrl,
  onRequestAutofill
}) => {
  const [showExitTicket, setShowExitTicket] = useState(false);
  const [hasSecondTrailer, setHasSecondTrailer] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Estados locales para la búsqueda por Eco en Hoja de Salida
  const [ecoSearch1, setEcoSearch1] = useState('');
  const [ecoSearch2, setEcoSearch2] = useState('');

  // Inicializar fecha/hora si están vacías, SOLO si están vacías
  useEffect(() => {
    if (!entryDate || !entryTime || !exitDate || !exitTime) {
      const now = new Date();
      // Formato local YYYY-MM-DD
      const dateStr = now.toLocaleDateString('en-CA'); 
      // Formato HH:MM
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      if (!entryDate) setEntryDate(dateStr);
      if (!entryTime) setEntryTime(timeStr);
      if (!exitDate) setExitDate(dateStr);
      if (!exitTime) setExitTime(timeStr);
    }
  }, []);

  const validateForm = () => {
    const errors: string[] = [];
    if (!operadorName) errors.push("Nombre del Operador");
    if (!placa) errors.push("Placa / ID Remolque 1");
    // El Almacén se valida que tenga valor, aunque sea el por defecto
    if (!exitStore) errors.push("Almacén / Locación");
    if (!entryDate || !entryTime) errors.push("Fecha/Hora de Entrada");
    if (!exitDate || !exitTime) errors.push("Fecha/Hora de Salida");

    if (errors.length > 0) {
      playErrorSound();
      alert("⚠️ NO SE PUEDE GENERAR LA HOJA.\n\nFaltan los siguientes datos:\n- " + errors.join("\n- "));
      return false;
    }
    return true;
  };

  const sendToGoogleSheet = async () => {
    if (!scriptUrl) return alert("⚠️ Error de Configuración: URL del script no encontrada.");
    
    // VALIDACIÓN PREVIA
    if (!validateForm()) return;

    setIsSending(true);
    
    // Construcción de la data para el script
    // Usamos mapeo directo a celdas de Excel para evitar errores
    const payload = {
      action: 'saveExitTicket',
      data: {
        D11: placa || 'S/N',
        F11: isLoaded || 'NO',
        I11: loadPercent || '0%',
        
        D13: placa2 || '',
        F13: (hasSecondTrailer || placa2) ? (isLoaded2 || 'NO') : '',
        I13: (hasSecondTrailer || placa2) ? (loadPercent2 || '0%') : '',
        
        E15: operadorName || 'S/N',
        E17: `${entryDate} ${entryTime}`,
        E19: `${exitDate} ${exitTime}`,
        
        H25: exitSeal || '',
        H26: exitSeal2 || '',
        
        // IMPORTANTE: Mapear el almacén a una celda visible (ej. D9)
        // Si tu hoja usa otra celda para el título/locación, cambia 'D9' aquí.
        D9: exitStore 
      }
    };

    try {
      console.log("Enviando a script:", payload);
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const res = await response.json();
      
      if (res.result === 'success') {
        playSuccessSound();
        alert("✅ HOJA DE SALIDA GUARDADA EN GOOGLE SHEETS.");
      } else {
        playErrorSound();
        console.error("Error Script:", res);
        alert("❌ RECHAZADO POR EL SCRIPT:\n\n" + (res.error || JSON.stringify(res)));
      }
    } catch (e) {
      playErrorSound();
      console.error(e);
      alert("❌ ERROR DE CONEXIÓN.\n\nNo se pudo contactar con Google Sheets. Verifica tu internet o la URL del script.");
    } finally {
      setIsSending(false);
    }
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowExitTicket(true);
    }
  };

  // Manejador de cambio de Eco para Remolque 1
  const handleEcoChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEcoSearch1(val);
    const found = catalogs.units.find(u => u.eco.toString() === val.toString());
    if (found) {
      setPlaca(found.placa);
    }
  };

  // Manejador de cambio de Eco para Remolque 2
  const handleEcoChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEcoSearch2(val);
    const found = catalogs.units.find(u => u.eco.toString() === val.toString());
    if (found) {
      setPlaca2(found.placa);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      
      {/* Aviso Manual + Botón Importar */}
      <div className="flex flex-col gap-2">
         <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            <p className="text-xs text-blue-800 font-bold">Modo Manual: Ingrese los datos directamente.</p>
         </div>
         <button 
           onClick={onRequestAutofill}
           className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg shadow active:scale-95 transition-all flex justify-center items-center gap-2"
         >
           <Zap className="w-4 h-4" /> IMPORTAR DE CARTA PORTE
         </button>
      </div>

      {/* 1. Datos de la Unidad */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-blue-100">
          <Truck className="w-5 h-5 text-blue-500" /> Datos de la Unidad
        </h3>
        
        <div className="space-y-4">
           <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Nombre del Operador</label>
            <input 
              list="drivers-list-exit"
              type="text" 
              value={operadorName} 
              onChange={e => setOperadorName(e.target.value)} 
              className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all font-bold placeholder:text-slate-300" 
              placeholder="ESCRIBA EL NOMBRE AQUÍ" 
            />
            {/* Datalist conectado correctamente */}
            <datalist id="drivers-list-exit">
               {catalogs.drivers.map((d, i) => <option key={i} value={d.name} />)}
            </datalist>
          </div>

          {/* Sección Remolque 1 con Búsqueda de Eco */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
             <div className="flex justify-between mb-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase">Remolque 1</label>
             </div>
             <div className="grid grid-cols-10 gap-2">
                 <div className="col-span-3">
                    <div className="relative">
                        <input 
                           list="units-list-exit"
                           type="text" 
                           value={ecoSearch1} 
                           onChange={handleEcoChange1} 
                           className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg text-sm uppercase font-bold text-center focus:ring-2 focus:ring-blue-400 outline-none placeholder:text-slate-400" 
                           placeholder="# ECO" 
                        />
                        <Search className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
                 <div className="col-span-7">
                    <input 
                      type="text" 
                      value={placa} 
                      onChange={e => setPlaca(e.target.value)} 
                      className="w-full p-3 border-2 border-blue-200 bg-blue-50 rounded-lg text-sm uppercase font-bold text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-blue-300" 
                      placeholder="PLACA" 
                    />
                 </div>
             </div>
          </div>

          {/* Sección Remolque 2 con Búsqueda de Eco */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
             <div className="flex justify-between mb-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase">Remolque 2 (Opcional)</label>
             </div>
             <div className="grid grid-cols-10 gap-2">
                 <div className="col-span-3">
                    <div className="relative">
                        <input 
                           list="units-list-exit"
                           type="text" 
                           value={ecoSearch2} 
                           onChange={handleEcoChange2} 
                           className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg text-sm uppercase font-bold text-center focus:ring-2 focus:ring-blue-400 outline-none placeholder:text-slate-400" 
                           placeholder="# ECO" 
                        />
                        <Search className="absolute right-2 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
                 <div className="col-span-7">
                    <input 
                      type="text" 
                      value={placa2} 
                      onChange={e => setPlaca2(e.target.value)} 
                      className={`w-full p-3 border-2 rounded-lg text-sm uppercase font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all ${placa2 ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-400'}`} 
                      placeholder="PLACA (OPCIONAL)" 
                    />
                 </div>
             </div>
          </div>
          
          {/* Datalist compartido para Unidades */}
          <datalist id="units-list-exit">
             {catalogs.units.map((u, i) => <option key={i} value={u.eco} />)}
          </datalist>

        </div>
      </div>

      {/* 2. Tiempos (NATIVOS) */}
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
               className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
             />
           </div>
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Hora Entrada</label>
             <input 
               type="time" 
               value={entryTime} 
               onChange={e => setEntryTime(e.target.value)} 
               className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
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
               className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
             />
           </div>
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Hora Salida</label>
             <input 
               type="time" 
               value={exitTime} 
               onChange={e => setExitTime(e.target.value)} 
               className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
             />
           </div>
        </div>
      </div>

      {/* 3. Carga Remolque 1 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-blue-100">
          <Layers className="w-5 h-5 text-blue-500" /> Detalle de Carga (Remolque 1)
        </h3>
        <div className="grid grid-cols-3 gap-3">
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">¿Cargado?</label>
             <select value={isLoaded} onChange={e => setIsLoaded(e.target.value)} className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-bold bg-white text-slate-900">
               <option value="SI">SI</option><option value="NO">NO</option>
             </select>
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">% Carga</label>
             <input type="text" value={loadPercent} onChange={e => setLoadPercent(e.target.value)} className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-bold bg-white text-slate-900" />
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Sello</label>
             <input type="text" value={exitSeal} onChange={e => setExitSeal(e.target.value)} className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-bold text-blue-600 bg-white" placeholder="SIN SELLO" />
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
              <button onClick={() => setHasSecondTrailer(true)} className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1 border border-blue-100">
                <Plus className="w-3 h-3" /> AGREGAR
              </button>
            )}
         </div>
        <div className="grid grid-cols-3 gap-3">
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">¿Cargado?</label>
             <select disabled={!(hasSecondTrailer || placa2)} value={isLoaded2} onChange={e => setIsLoaded2(e.target.value)} className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-bold bg-white text-slate-900 disabled:bg-slate-100">
               <option value="SI">SI</option><option value="NO">NO</option>
             </select>
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">% Carga</label>
             <input disabled={!(hasSecondTrailer || placa2)} type="text" value={loadPercent2} onChange={e => setLoadPercent2(e.target.value)} className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-bold bg-white text-slate-900 disabled:bg-slate-100" />
           </div>
           <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Sello</label>
             <input disabled={!(hasSecondTrailer || placa2)} type="text" value={exitSeal2} onChange={e => setExitSeal2(e.target.value)} className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm font-bold text-blue-600 bg-white disabled:bg-slate-100" />
           </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
         <div className="flex items-center gap-2 mb-2">
           <MapPin className="w-4 h-4 text-violet-500" />
           <label className="text-[10px] font-bold text-slate-400 uppercase block">Almacén de Origen (Fijo)</label>
         </div>
         <input 
            type="text"
            readOnly
            value={exitStore} 
            className="w-full p-3 border-2 border-slate-200 rounded-lg text-sm font-bold bg-slate-100 text-slate-500 cursor-not-allowed uppercase"
         />
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={sendToGoogleSheet}
          disabled={isSending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:active:scale-100"
        >
          {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <CloudUpload className="w-6 h-6" />}
          GENERAR HOJA EN SHEETS
        </button>

        <button 
          onClick={handlePreview}
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
            store: exitStore
          }}
        />
      )}
    </div>
  );
};