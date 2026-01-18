import React from 'react';
import { ScanRecord } from '../types';
import { Truck, User, Calendar, X, CheckCircle2 } from 'lucide-react';

interface CartaPorteSelectorProps {
  records: ScanRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (record: ScanRecord) => void;
}

export const CartaPorteSelector: React.FC<CartaPorteSelectorProps> = ({
  records,
  isOpen,
  onClose,
  onSelect
}) => {
  if (!isOpen) return null;

  // Filtrar solo registros de carta porte y ordenarlos del más reciente al más antiguo
  const cpRecords = records
    .filter(r => r.recordCategory === 'CARTA_PORTE')
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
             <h3 className="font-bold text-slate-800 uppercase text-sm">Seleccionar Carta Porte</h3>
             <p className="text-[10px] text-slate-500 font-medium">Elige un registro para autocompletar</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 bg-slate-100 flex-1">
          {cpRecords.length === 0 ? (
            <div className="text-center py-10 opacity-50">
               <Truck className="w-12 h-12 mx-auto mb-2 text-slate-400" />
               <p className="text-sm font-bold text-slate-500">No hay registros de Carta Porte en memoria.</p>
            </div>
          ) : (
            cpRecords.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-violet-500 hover:ring-1 hover:ring-violet-500 transition-all text-left group relative"
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                      <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-800">{r.cp_placa}</p>
                        <p className="text-[10px] font-bold text-slate-400">{r.cp_numEconomico ? `ECO: ${r.cp_numEconomico}` : 'S/N'}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                     {new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                   <User className="w-3 h-3 text-slate-400" />
                   <span className="font-bold uppercase truncate">{r.cp_operador || 'Sin Operador'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                   <Calendar className="w-3 h-3" />
                   <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                   <span className="mx-1">•</span>
                   <span className="uppercase text-violet-600 font-bold">{r.storeLabel}</span>
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <CheckCircle2 className="w-6 h-6 text-violet-500" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};