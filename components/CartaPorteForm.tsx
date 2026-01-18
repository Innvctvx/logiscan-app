import React, { useState } from 'react';
import { User, Truck, Shield, Hash, Building2 } from 'lucide-react';
import { ServiceType, Region, STORES, STORE_NAMES, CatalogData } from '../types';
import { playErrorSound } from '../services/soundService';

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
  const availableStores = region === Region.LOCAL ? STORES.LOCAL : STORES.FORANEO;

  const handleProviderSelect = (prov: 'TDR' | 'EASO') => {
    setDistribuidora(prov);
    if (prov === 'TDR') {
      setProveedorNum('4310107');
    } else {
      setProveedorNum('4311384');
    }
  };

  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOperadorName(val);
    const found = catalogs.drivers.find(d => d.name.toUpperCase() === val.toUpperCase());
    if (found) { 
      // Autorellenado forzoso para asegurar consistencia
      setRfcOperador(found.rfc); 
      setLicencia(found.license); 
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNumEconomico(val);
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

  const validateAndSave = (storeNum: string) => {
    if (!rfcOperador || !operadorName || !placa) {
       playErrorSound();
       alert("⚠️ FALTAN DATOS OBLIGATORIOS\n\n- Nombre del Operador\n- RFC\n- Placa del Vehículo\n\nPor favor rellénalos antes de guardar.");
       return;
    }
    onSave(storeNum);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-amber-100">
          <User className="w-5 h-5 text-amber-500" /> Datos del Operador
        </h3>
        <div className="space-y-4">
          <input list="drivers-list" type="text" value={operadorName} onChange={handleDriverChange} className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm uppercase font-bold placeholder:text-slate-400" placeholder="Nombre Operador" />
          <datalist id="drivers-list">{catalogs.drivers.map((d, i) => <option key={i} value={d.name} />)}</datalist>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={rfcOperador} onChange={e => setRfcOperador(e.target.value)} className="w-full p-2.5 bg-white text-slate-900 border rounded-lg text-sm uppercase placeholder:text-slate-400" placeholder="RFC" />
            <input type="text" value={licencia} onChange={e => setLicencia(e.target.value)} className="w-full p-2.5 bg-white text-slate-900 border rounded-lg text-sm placeholder:text-slate-400" placeholder="Licencia" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-amber-100">
          <Truck className="w-5 h-5 text-amber-500" /> Datos del Vehículo
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input list="units-list" type="text" value={numEconomico} onChange={handleUnitChange} className="w-full p-2.5 bg-white text-slate-900 border rounded-lg text-sm placeholder:text-slate-400" placeholder="No. Económico" />
          <datalist id="units-list">{catalogs.units.map((u, i) => <option key={i} value={u.eco} />)}</datalist>
          <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} className="w-full p-2.5 border border-amber-200 bg-amber-50 text-amber-900 rounded-lg text-sm uppercase font-bold placeholder:text-amber-400" placeholder="PLACA" />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
           <input type="text" value={confVehic} onChange={e => setConfVehic(e.target.value)} className="w-full p-2 bg-slate-50 text-slate-900 border rounded text-xs placeholder:text-slate-400" placeholder="Conf" />
           <input type="text" value={ano} onChange={e => setAno(e.target.value)} className="w-full p-2 bg-slate-50 text-slate-900 border rounded text-xs placeholder:text-slate-400" placeholder="Año" />
           <input type="text" value={peso} onChange={e => setPeso(e.target.value)} className="w-full p-2 bg-slate-50 text-slate-900 border rounded text-xs placeholder:text-slate-400" placeholder="Peso" />
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-3">
          <input type="text" value={seguro} onChange={e => setSeguro(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-200 rounded text-xs placeholder:text-slate-400" placeholder="Aseguradora" />
          <input type="text" value={poliza} onChange={e => setPoliza(e.target.value)} className="w-full p-2 bg-white text-slate-900 border border-slate-200 rounded text-xs placeholder:text-slate-400" placeholder="Num Póliza" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 border-b pb-3 border-amber-100">
          <Building2 className="w-5 h-5 text-amber-500" /> Proveedor y Servicio
        </h3>
        <div className="flex gap-2 mb-4">
           <button onClick={() => handleProviderSelect('TDR')} className={`flex-1 py-2 text-xs font-bold border rounded ${distribuidora === 'TDR' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>TDR</button>
           <button onClick={() => handleProviderSelect('EASO')} className={`flex-1 py-2 text-xs font-bold border rounded ${distribuidora === 'EASO' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>EASO</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
           <input type="text" value={distribuidora} onChange={e => setDistribuidora(e.target.value)} className="w-full p-2 bg-slate-50 text-slate-900 border rounded text-xs placeholder:text-slate-400" placeholder="Distribuidora" />
           <input type="text" value={proveedorNum} onChange={e => setProveedorNum(e.target.value)} className="w-full p-2 bg-slate-50 text-slate-900 border rounded text-xs placeholder:text-slate-400" placeholder="Proveedor ID" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
          <button onClick={() => setRegion(Region.LOCAL)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${region === Region.LOCAL ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}>Local</button>
          <button onClick={() => setRegion(Region.FORANEO)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${region === Region.FORANEO ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Foráneo</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {availableStores.map((num) => (
            <button key={num} onClick={() => validateAndSave(num)} className="bg-slate-900 text-white py-4 rounded-xl shadow-md active:scale-95 transition-transform flex flex-col items-center group">
              <span className="text-[10px] uppercase opacity-60 font-bold mb-1">{STORE_NAMES[num]}</span>
              <span className="font-black text-xl">GUARDAR {num}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};