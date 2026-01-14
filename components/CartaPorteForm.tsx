import React from 'react';
import { User, Truck, Shield, Hash, Calendar, FileText, Weight, Map } from 'lucide-react';
import { ServiceType, Region, STORES, STORE_NAMES } from '../types';

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
  onSave
}) => {

  const availableStores = region === Region.LOCAL ? STORES.LOCAL : STORES.FORANEO;

  const handleProviderSelect = (prov: 'TDR' | 'EASO') => {
    setDistribuidora(prov);
    if (prov === 'TDR') {
      setProveedorNum('4310107');
    } else {
      setProveedorNum('4311384');
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
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">RFC - Operador</label>
            <input type="text" value={rfcOperador} onChange={e => setRfcOperador(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase font-medium focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Ej. XAXX010101000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">N° Licencia</label>
               <input type="text" value={licencia} onChange={e => setLicencia(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Num. Licencia" />
            </div>
            <div>
               <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Nombre</label>
               <input type="text" value={operadorName} onChange={e => setOperadorName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Nombre Completo" />
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
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase flex items-center gap-1"><Hash className="w-3 h-3"/> No. Económico</label>
            <input type="text" value={numEconomico} onChange={e => setNumEconomico(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Ej. 1734" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Conf. Vehic</label>
            <input type="text" value={confVehic} onChange={e => setConfVehic(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Ej. C2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Placa</label>
            <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg text-sm uppercase font-bold text-amber-900 focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="PLACA" />
          </div>
           <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Año</label>
            <input type="text" value={ano} onChange={e => setAno(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="2023" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase flex items-center gap-1"><FileText className="w-3 h-3"/> Póliza</label>
            <input type="text" value={poliza} onChange={e => setPoliza(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Num Póliza" />
          </div>
           <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase flex items-center gap-1"><Shield className="w-3 h-3"/> Seguro</label>
            <input type="text" value={seguro} onChange={e => setSeguro(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Aseguradora" />
          </div>
        </div>

        <div>
           <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase flex items-center gap-1"><Weight className="w-3 h-3"/> Peso</label>
           <input type="text" value={peso} onChange={e => setPeso(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all" placeholder="Ej. 19" />
        </div>
      </div>

      {/* 3. PROVIDER SECTION (Foraneo - Emerald Theme) */}
      {region === Region.FORANEO && (
        <div className="bg-emerald-50 p-5 rounded-xl shadow-sm border border-emerald-100 animate-fadeIn">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-emerald-200 pb-3">
            <Map className="w-5 h-5 text-emerald-600" /> Distribuidora Foránea
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-emerald-700/70 mb-2 block uppercase">Seleccionar Distribuidora:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleProviderSelect('TDR')}
                  className={`py-3 px-3 rounded-xl text-sm font-black border transition-all ${distribuidora === 'TDR' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200' : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  TDR
                </button>
                <button
                  onClick={() => handleProviderSelect('EASO')}
                  className={`py-3 px-3 rounded-xl text-sm font-black border transition-all ${distribuidora === 'EASO' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200' : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  EASO
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-emerald-700/70 mb-1 block uppercase">No. Proveedor Transporte (Editable)</label>
              <input 
                type="text" 
                value={proveedorNum} 
                onChange={e => setProveedorNum(e.target.value)} 
                className="w-full p-3 border border-emerald-300 rounded-lg text-lg font-mono font-bold text-emerald-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                placeholder="---" 
              />
            </div>
          </div>
        </div>
      )}

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
                 onClick={() => onSave(num)}
                 className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl shadow-md active:scale-95 transition-transform flex flex-col items-center relative overflow-hidden group"
               >
                 <span className="text-[10px] uppercase opacity-60 font-bold mb-1 tracking-wider z-10">{STORE_NAMES[num]}</span>
                 <span className="font-black text-xl z-10 group-hover:scale-105 transition-transform">ASIGNAR {num}</span>
                 
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
               </button>
             );
          })}
        </div>
      </div>
    </div>
  );
};