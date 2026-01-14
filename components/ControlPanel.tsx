import React from 'react';
import { ServiceType, Region, DocType, STORES, STORE_NAMES } from '../types';
import { Truck, MapPin, Box, Home, FileText, Hash, Layers } from 'lucide-react';

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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Datos de Ruta
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => setDocType('EMBARQUE')}
            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${docType === 'EMBARQUE' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            EMBARQUE
          </button>
          <button
            onClick={() => setDocType('REMISIÓN')}
            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${docType === 'REMISIÓN' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            REMISIÓN
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">No. Documento</label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="text" 
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Ej. 7608801"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">No. Bultos</label>
            <div className="relative">
              <Layers className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="number" 
                value={bultos}
                onChange={(e) => setBultos(e.target.value)}
                placeholder="Ej. 130"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Routing & Assignment Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4" /> Asignación de Tienda
        </h3>

        {/* Region Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setRegion(Region.LOCAL)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
              region === Region.LOCAL ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            <MapPin className="w-3 h-3" /> Local
          </button>
          <button
            onClick={() => setRegion(Region.FORANEO)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
              region === Region.FORANEO ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Truck className="w-3 h-3" /> Foráneo
          </button>
        </div>

        {/* Service Type Toggle */}
        <div className="flex gap-4 mb-4">
          <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex flex-col items-center transition-all ${serviceType === ServiceType.CC ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <input 
              type="radio" 
              name="service" 
              className="hidden" 
              checked={serviceType === ServiceType.CC} 
              onChange={() => setServiceType(ServiceType.CC)} 
            />
            <Box className={`w-5 h-5 mb-1 ${serviceType === ServiceType.CC ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className={`text-sm font-bold ${serviceType === ServiceType.CC ? 'text-blue-700' : 'text-slate-500'}`}>C&C</span>
          </label>

          <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex flex-col items-center transition-all ${serviceType === ServiceType.DOMICILIO ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
            <input 
              type="radio" 
              name="service" 
              className="hidden" 
              checked={serviceType === ServiceType.DOMICILIO} 
              onChange={() => setServiceType(ServiceType.DOMICILIO)} 
            />
            <Home className={`w-5 h-5 mb-1 ${serviceType === ServiceType.DOMICILIO ? 'text-orange-600' : 'text-slate-400'}`} />
            <span className={`text-sm font-bold ${serviceType === ServiceType.DOMICILIO ? 'text-orange-700' : 'text-slate-500'}`}>DOMICILIO</span>
          </label>
        </div>

        {/* Action Buttons (Store Numbers) */}
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Seleccionar Almacén para Guardar:</p>
        <div className="grid grid-cols-2 gap-3">
          {availableStores.map((num) => {
            const label = `${serviceType} ${num}`;
            const name = STORE_NAMES[num] || '';
            const btnColor = serviceType === ServiceType.CC ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700';
            
            return (
              <button
                key={num}
                onClick={() => onSave(num)}
                disabled={disabled}
                className={`
                  relative overflow-hidden
                  py-3 px-3 rounded-xl text-white shadow-md transition-all transform active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  ${btnColor}
                `}
              >
                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase opacity-90 font-semibold mb-1">{name}</span>
                  <span className="text-xl font-black tracking-wider leading-none">{label}</span>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white opacity-10 rounded-full"></div>
              </button>
            );
          })}
        </div>
        
        {disabled && (
          <p className="text-center text-xs text-red-400 mt-2 font-medium">
            * Escanea códigos primero
          </p>
        )}
      </div>
    </div>
  );
};