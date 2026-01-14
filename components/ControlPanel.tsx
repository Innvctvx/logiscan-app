import React from 'react';
import { ServiceType, Region, DocType, STORES, STORE_NAMES } from '../types';
import { Truck, MapPin, Box, Home, FileText, Hash, Layers, Globe } from 'lucide-react';

interface ControlPanelProps {
  docType: DocType;
  setDocType: (t: DocType) => void;
  docNumber: string;
  setDocNumber: (s: string) => void;
  bultos: string;
  setBultos: (s: string) => void;
  
  serviceType: ServiceType;
  setServiceType: (t: ServiceType) => void;
  region: Region;
  setRegion: (r: Region) => void;
  
  onSave: (storeNumber: string) => void;
  disabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  docType, setDocType,
  docNumber, setDocNumber,
  bultos, setBultos,
  serviceType, setServiceType,
  region, setRegion,
  onSave,
  disabled
}) => {
  
  const availableStores = region === Region.LOCAL ? STORES.LOCAL : STORES.FORANEO;

  return (
    <div className="space-y-4">
      
      {/* 1. Document Configuration Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-500" /> Datos de Ruta
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setDocType('EMBARQUE')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${docType === 'EMBARQUE' ? 'bg-violet-50 border-violet-200 text-violet-700 ring-1 ring-violet-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            EMBARQUE
          </button>
          <button
            onClick={() => setDocType('REMISIÓN')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${docType === 'REMISIÓN' ? 'bg-violet-50 border-violet-200 text-violet-700 ring-1 ring-violet-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            REMISIÓN
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">No. Documento</label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-300" />
              <input 
                type="text" 
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Ej. 7608801"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none font-mono font-medium transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">No. Bultos</label>
            <div className="relative">
              <Layers className="w-4 h-4 absolute left-3 top-2.5 text-slate-300" />
              <input 
                type="number" 
                value={bultos}
                onChange={(e) => setBultos(e.target.value)}
                placeholder="Ej. 130"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none font-mono font-medium transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Routing & Assignment Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-violet-500" /> Asignación de Tienda
        </h3>

        {/* Region Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setRegion(Region.LOCAL)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
              region === Region.LOCAL ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin className="w-3 h-3" /> Local
          </button>
          <button
            onClick={() => setRegion(Region.FORANEO)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
              region === Region.FORANEO ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-3 h-3" /> Foráneo
          </button>
        </div>

        {/* Service Type Toggle */}
        <div className="flex gap-3 mb-5">
          <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${serviceType === ServiceType.CC ? 'bg-violet-50 border-violet-200 ring-1 ring-violet-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <input 
              type="radio" 
              name="service" 
              className="hidden" 
              checked={serviceType === ServiceType.CC} 
              onChange={() => setServiceType(ServiceType.CC)} 
            />
            <Box className={`w-6 h-6 mb-2 ${serviceType === ServiceType.CC ? 'text-violet-600' : 'text-slate-300'}`} />
            <span className={`text-xs font-black ${serviceType === ServiceType.CC ? 'text-violet-700' : 'text-slate-400'}`}>C&C</span>
          </label>

          <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${serviceType === ServiceType.DOMICILIO ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <input 
              type="radio" 
              name="service" 
              className="hidden" 
              checked={serviceType === ServiceType.DOMICILIO} 
              onChange={() => setServiceType(ServiceType.DOMICILIO)} 
            />
            <Home className={`w-6 h-6 mb-2 ${serviceType === ServiceType.DOMICILIO ? 'text-amber-500' : 'text-slate-300'}`} />
            <span className={`text-xs font-black ${serviceType === ServiceType.DOMICILIO ? 'text-amber-600' : 'text-slate-400'}`}>DOMICILIO</span>
          </label>
        </div>

        {/* Action Buttons (Store Numbers) */}
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Seleccionar Almacén:</p>
        <div className="grid grid-cols-2 gap-3">
          {availableStores.map((num) => {
            const label = `${serviceType} ${num}`;
            const name = STORE_NAMES[num] || '';
            
            return (
              <button
                key={num}
                onClick={() => onSave(num)}
                disabled={disabled}
                className={`
                  relative overflow-hidden group
                  py-4 px-3 rounded-xl text-white shadow-sm transition-all transform active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                  bg-slate-900 hover:bg-slate-800
                `}
              >
                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase opacity-60 font-bold mb-1 tracking-wider">{name}</span>
                  <span className="text-xl font-black tracking-tight leading-none group-hover:scale-110 transition-transform">{label}</span>
                </div>
                
                {/* Decorative gradients */}
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full`}></div>
                <div className={`absolute bottom-0 left-0 w-8 h-8 rounded-tr-full ${serviceType === ServiceType.CC ? 'bg-violet-500' : 'bg-amber-500'}`}></div>
              </button>
            );
          })}
        </div>
        
        {disabled && (
          <p className="text-center text-xs text-red-400 mt-3 font-bold bg-red-50 py-1 rounded">
            ⚠️ Escanea códigos primero
          </p>
        )}
      </div>
    </div>
  );
};