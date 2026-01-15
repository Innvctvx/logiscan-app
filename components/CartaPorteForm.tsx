import React, { useState } from 'react';
import { User, Truck, Shield, Hash, Calendar, FileText, Weight, Map, Clock, Percent, FileCheck, Share2 } from 'lucide-react';
import { ServiceType, Region, STORES, STORE_NAMES, CatalogData } from '../types';
import { ExitTicket } from './ExitTicket';

interface CartaPorteFormProps {
  rfcOperador: string; setRfcOperador: (v: string) => void;
  licencia: string; setLicencia: (v: string) => void;
  operadorName: string; setOperadorName: (v: string) => void;
  numEconomico: string; setNumEconomico: (v: string) => void;
  confVehic: string; setConfVehic: (v: string) => void;
  placa: string; setPlaca: (v: string) => void;
  ano: string; setAno: (v: string) => void;
  poliza: string; setPoliza: (v: string) => void;
  seguro: string; setSeguro: (v: string) => void;
  peso: string; setPeso: (v: string) => void;
  distribuidora: string; setDistribuidora: (v: string) => void;
  proveedorNum: string; setProveedorNum: (v: string) => void;

  // Time & Exit Sheet Props
  entryDate: string; setEntryDate: (v: string) => void;
  entryTime: string; setEntryTime: (v: string) => void;
  exitDate: string; setExitDate: (v: string) => void;
  exitTime: string; setExitTime: (v: string) => void;
  isLoaded: string; setIsLoaded: (v: string) => void;
  loadPercent: string; setLoadPercent: (v: string) => void;
  exitSeal: string; setExitSeal: (v: string) => void;

  serviceType: ServiceType; setServiceType: (t: ServiceType) => void;
  region: Region; setRegion: (r: Region) => void;
  onSave: (storeNum: string) => void;

  catalogs: CatalogData;
}

export const CartaPorteForm: React.FC<CartaPorteFormProps> = ({
  rfcOperador, setRfcOperador,
  licencia, setLicencia,
  operadorName, setOperadorName,
  numEconomico, setNumEconomico,
  confVehic, setConfVehic,
  placa, setPlaca,
  ano, setAno,
  poliza, setPoliza,
  seguro, setSeguro,
  peso, setPeso,
  distribuidora, setDistribuidora,
  proveedorNum, setProveedorNum,

  entryDate, setEntryDate,
  entryTime, setEntryTime,
  exitDate, setExitDate,
  exitTime, setExitTime,
  isLoaded, setIsLoaded,
  loadPercent, setLoadPercent,
  exitSeal, setExitSeal,

  serviceType, setServiceType,
  region, setRegion,
  onSave,
  catalogs
}) => {
  const [showExitTicket, setShowExitTicket] = useState(false);
  const [selectedStoreNum, setSelectedStoreNum] = useState('');

  const availableStores = region === Region.LOCAL ? STORES.LOCAL : STORES.FORANEO;

  const handleProviderSelect = (prov: 'TDR' | 'EASO') => {
    setDistribuidora(prov);
    if (prov === 'TDR') {
      setProveedorNum('4310107');
    } else {
      setProveedorNum('4311384');
    }
  };

  const handleWhatsApp = () => {
     if (!operadorName || !placa) {
       alert("Faltan datos del operador o placa.");
       return;
     }
     
     const message = `*LOGISCAN - REPORTE DE SALIDA* 🚚\n\n` +
       `👤 *Operador:* ${operadorName}\n` +
       `🚛 *Unidad:* ${numEconomico} [${placa}]\n` +
       `📦 *Remolque:* ${placa}\n` + // Usually trailer same as placa in quick checks, or add specific field if needed
       `🔒 *Sello:* ${exitSeal || 'N/A'}\n` +
       `🕒 *Entrada:* ${entryDate} ${entryTime}\n` +
       `🕒 *Salida:* ${exitDate} ${exitTime}\n` +
       `📊 *Estatus:* ${isLoaded === 'SI' ? 'Cargado' : 'Vacío'} (${loadPercent})\n\n` +
       `✅ *Verificado por LogiScan*`;

     const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
     window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. OPERADOR SECTION */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-amber-100">
          <User className="w-5 h-5 text-amber-500" /> Datos del Operador
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Nombre (Autocompletar)</label>
            <input 
              list="drivers-list"
              type="text" 
              value={operadorName} 
              onChange={e => setOperadorName(e.target.value)} 
              className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400 font-bold" 
              placeholder="Escribe para buscar..." 
            />
            <datalist id="drivers-list">
              {catalogs.drivers.map((d, i) => <option key={i} value={d} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">RFC</label>
              <input type="text" value={rfcOperador} onChange={e => setRfcOperador(e.target.value)} className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm uppercase font-medium focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400" placeholder="XAXX010101000" />
            </div>
            <div>
               <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">N° Licencia</label>
               <input type="text" value={licencia} onChange={e => setLicencia(e.target.value)} className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400" placeholder="Num. Licencia" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. VEHICLE SECTION */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-amber-100">
          <Truck className="w-5 h-5 text-amber-500" /> Datos del Vehículo
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase flex items-center gap-1"><Hash className="w-3 h-3"/> No. Económico (Auto)</label>
            <input 
              list="units-list"
              type="text" 
              value={numEconomico} 
              onChange={e => setNumEconomico(e.target.value)} 
              className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400" 
              placeholder="Ej. 1734" 
            />
            <datalist id="units-list">
              {catalogs.units.map((u, i) => <option key={i} value={u} />)}
            </datalist>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Placa</label>
            <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg text-sm uppercase font-bold text-amber-900 focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-amber-300" placeholder="PLACA" />
          </div>
        </div>

        {/* Extra Vehicle Info Collapsible could go here, keeping simple for now */}
        <div className="grid grid-cols-3 gap-2 mb-4">
           <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Conf</label>
              <input type="text" value={confVehic} onChange={e => setConfVehic(e.target.value)} className="w-full p-2 bg-slate-50 border rounded text-xs" placeholder="C2" />
           </div>
           <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Año</label>
              <input type="text" value={ano} onChange={e => setAno(e.target.value)} className="w-full p-2 bg-slate-50 border rounded text-xs" placeholder="2024" />
           </div>
           <div>
              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Peso</label>
              <input type="text" value={peso} onChange={e => setPeso(e.target.value)} className="w-full p-2 bg-slate-50 border rounded text-xs" placeholder="Ton" />
           </div>
        </div>
      </div>

      {/* 3. CONTROL DE SALIDA & TIEMPOS (NEW) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-amber-100">
          <Clock className="w-5 h-5 text-amber-500" /> Control de Tiempos y Salida
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
      </div>

      {/* 4. DESTINATION SELECTOR */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Destino de la Unidad</h3>
        
        {/* Region Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
          <button onClick={() => setRegion(Region.LOCAL)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${region === Region.LOCAL ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}>Local</button>
          <button onClick={() => setRegion(Region.FORANEO)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${region === Region.FORANEO ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Foráneo</button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {availableStores.map((num) => {
             const label = `${serviceType} ${num}`;
             return (
               <button
                 key={num}
                 onClick={() => {
                   setSelectedStoreNum(num);
                   onSave(num);
                 }}
                 className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl shadow-md active:scale-95 transition-transform flex flex-col items-center relative overflow-hidden group"
               >
                 <span className="text-[10px] uppercase opacity-60 font-bold mb-1 tracking-wider z-10">{STORE_NAMES[num]}</span>
                 <span className="font-black text-xl z-10 group-hover:scale-105 transition-transform">GUARDAR {num}</span>
                 
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
               </button>
             );
          })}
        </div>
      </div>

      {/* EXTRA TOOLS */}
      <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setShowExitTicket(true)}
            className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-100 transition-colors"
          >
            <FileCheck className="w-5 h-5" />
            Hoja Salida
          </button>
          
          <button 
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-3 rounded-xl font-bold hover:bg-green-100 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            WhatsApp
          </button>
      </div>

      {/* RENDER EXIT TICKET MODAL */}
      {showExitTicket && (
        <ExitTicket 
          onClose={() => setShowExitTicket(false)}
          data={{
            trailer: placa, // Using Placa as Trailer based on typical usage, or add trailer field if distinct
            isLoaded: isLoaded,
            percent: loadPercent,
            driver: operadorName,
            entryDate,
            entryTime,
            exitDate,
            exitTime,
            seal: exitSeal,
            store: '5' // Can be dynamic based on selection
          }}
        />
      )}

    </div>
  );
};
