import React, { useState } from 'react';
import { User, Truck, Shield, Hash, Map, Building2 } from 'lucide-react';
import { ServiceType, Region, STORES, STORE_NAMES, CatalogData } from '../types';

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

  serviceType, setServiceType,
  region, setRegion,
  onSave,
  catalogs
}) => {
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

  // --- AUTOFILL HANDLERS ---
  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOperadorName(val);
    
    // Attempt auto-fill
    const found = catalogs.drivers.find(d => d.name.toUpperCase() === val.toUpperCase());
    if (found) {
      setRfcOperador(found.rfc);
      setLicencia(found.license);
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNumEconomico(val);

    // Attempt auto-fill
    const found = catalogs.units.find(u => u.eco.toString() === val.toString());
    if (found) {
      setConfVehic(found.conf);
      setPlaca(found.placa);
      setAno(found.year);
      setPoliza(found.policy);
      setSeguro(found.insurance);
      setPeso(found.weight);
    }
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
              onChange={handleDriverChange} 
              className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400 font-bold" 
              placeholder="Escribe para buscar..." 
            />
            <datalist id="drivers-list">
              {catalogs.drivers.map((d, i) => <option key={i} value={d.name} />)}
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
              onChange={handleUnitChange} 
              className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-400" 
              placeholder="Ej. 1734" 
            />
            <datalist id="units-list">
              {catalogs.units.map((u, i) => <option key={i} value={u.eco} />)}
            </datalist>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Placa</label>
            <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg text-sm uppercase font-bold text-amber-900 focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-amber-300" placeholder="PLACA" />
          </div>
        </div>

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

        {/* RESTORED INSURANCE FIELDS */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Seguro y Póliza</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
               <input type="text" value={seguro} onChange={e => setSeguro(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded text-xs" placeholder="Aseguradora" />
             </div>
             <div>
               <input type="text" value={poliza} onChange={e => setPoliza(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded text-xs" placeholder="Num Póliza" />
             </div>
          </div>
        </div>
      </div>

      {/* 3. PROVIDER INFO (RESTORED) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-amber-100">
          <Building2 className="w-5 h-5 text-amber-500" /> Proveedor y Servicio
        </h3>
        
        <div className="flex gap-2 mb-4">
           <button onClick={() => handleProviderSelect('TDR')} className={`flex-1 py-2 text-xs font-bold border rounded ${distribuidora === 'TDR' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>TDR</button>
           <button onClick={() => handleProviderSelect('EASO')} className={`flex-1 py-2 text-xs font-bold border rounded ${distribuidora === 'EASO' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>EASO</button>
           <button onClick={() => setDistribuidora('')} className={`flex-1 py-2 text-xs font-bold border rounded ${!['TDR', 'EASO'].includes(distribuidora) ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200'}`}>OTRO</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
           <input type="text" value={distribuidora} onChange={e => setDistribuidora(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs" placeholder="Nombre Distribuidora" />
           <input type="text" value={proveedorNum} onChange={e => setProveedorNum(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs" placeholder="ID Proveedor" />
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
    </div>
  );
};