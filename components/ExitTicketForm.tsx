import React, { useState } from 'react';
import { Clock, FileCheck, Truck, User, Hash } from 'lucide-react';
import { CatalogData } from '../types';
import { ExitTicket } from './ExitTicket';

interface ExitTicketFormProps {
  operadorName: string; setOperadorName: (v: string) => void;
  placa: string; setPlaca: (v: string) => void;
  
  entryDate: string; setEntryDate: (v: string) => void;
  entryTime: string; setEntryTime: (v: string) => void;
  exitDate: string; setExitDate: (v: string) => void;
  exitTime: string; setExitTime: (v: string) => void;
  isLoaded: string; setIsLoaded: (v: string) => void;
  loadPercent: string; setLoadPercent: (v: string) => void;
  exitSeal: string; setExitSeal: (v: string) => void;

  catalogs: CatalogData;
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
  catalogs
}) => {
  const [showExitTicket, setShowExitTicket] = useState(false);
  const [storeInput, setStoreInput] = useState('5'); // Default store

  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOperadorName(e.target.value);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only updating placa if unit is selected, simple behavior
    const val = e.target.value;
    const found = catalogs.units.find(u => u.eco.toString() === val.toString());
    if (found) {
      setPlaca(found.placa);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Header Information */}
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
              placeholder="Buscar operador..." 
            />
            <datalist id="drivers-list-exit">
              {catalogs.drivers.map((d, i) => <option key={i} value={d.name} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Num Eco. (Búsqueda)</label>
                <input 
                  list="units-list-exit"
                  type="text" 
                  onChange={handleUnitChange} 
                  className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-slate-400" 
                  placeholder="Ej. 1734"
                />
                <datalist id="units-list-exit">
                  {catalogs.units.map((u, i) => <option key={i} value={u.eco} />)}
                </datalist>
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Placa / Remolque</label>
                <input 
                  type="text" 
                  value={placa} 
                  onChange={e => setPlaca(e.target.value)} 
                  className="w-full p-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm uppercase font-bold text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none transition-all" 
                  placeholder="PLACA" 
                />
             </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROL DE TIEMPOS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-blue-100">
          <Clock className="w-5 h-5 text-blue-500" /> Tiempos y Carga
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
           <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Fecha Entrada</label>
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700" />
           </div>
           <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Hora Entrada</label>
              <input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700" />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
           <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Fecha Salida</label>
              <input type="date" value={exitDate} onChange={e => setExitDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700" />
           </div>
           <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Hora Salida</label>
              <input type="time" value={exitTime} onChange={e => setExitTime(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700" />
           </div>
        </div>

        <hr className="my-4 border-slate-100"/>

        <div className="grid grid-cols-3 gap-3 mb-4">
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Cargado</label>
             <select value={isLoaded} onChange={e => setIsLoaded(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold">
               <option value="SI">SI</option>
               <option value="NO">NO</option>
             </select>
           </div>
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">% Carga</label>
             <input type="text" value={loadPercent} onChange={e => setLoadPercent(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold" placeholder="30%" />
           </div>
           <div>
             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Sello Salida</label>
             <input type="text" value={exitSeal} onChange={e => setExitSeal(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-600" placeholder="H25" />
           </div>
        </div>
        
        <div className="mb-4">
           <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Almacén (Número)</label>
           <input type="text" value={storeInput} onChange={e => setStoreInput(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold" placeholder="5" />
        </div>
      </div>

      <button 
        onClick={() => setShowExitTicket(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-3"
      >
        <FileCheck className="w-6 h-6" />
        GENERAR HOJA DE SALIDA
      </button>

      {/* RENDER EXIT TICKET MODAL */}
      {showExitTicket && (
        <ExitTicket 
          onClose={() => setShowExitTicket(false)}
          data={{
            trailer: placa,
            isLoaded: isLoaded,
            percent: loadPercent,
            driver: operadorName,
            entryDate,
            entryTime,
            exitDate,
            exitTime,
            seal: exitSeal,
            store: storeInput
          }}
        />
      )}
    </div>
  );
};