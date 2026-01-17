
import React from 'react';
import { X, Printer } from 'lucide-react';

interface ExitTicketProps {
  onClose: () => void;
  data: {
    trailer: string;
    isLoaded: string;
    percent: string;
    trailer2: string;
    isLoaded2: string;
    percent2: string;
    driver: string;
    entryDate: string;
    entryTime: string;
    exitDate: string;
    exitTime: string;
    seal: string;
    seal2: string;
    store: string;
  }
}

export const ExitTicket: React.FC<ExitTicketProps> = ({ onClose, data }) => {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative print:shadow-none print:w-full print:max-w-none print:max-h-none print:rounded-none">
        
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b print:hidden sticky top-0">
          <h2 className="font-bold text-slate-800 uppercase text-xs">Confirmación de Control de Salida</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
               <Printer className="w-4 h-4" /> IMPRIMIR
            </button>
            <button onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">
               <X className="w-4 h-4" /> CERRAR
            </button>
          </div>
        </div>

        <div className="p-8 print:p-0 font-sans text-black">
          <div className="flex mb-6">
             <div className="w-48">
               <div className="text-2xl font-sans tracking-tight text-slate-600 border-b-2 border-slate-300 pb-1">
                 <span className="font-bold">Liverpool</span>
                 <span className="text-[10px] block text-right italic">es parte de mi vida</span>
               </div>
             </div>
             <div className="flex-1 text-center">
                <h1 className="text-2xl font-bold uppercase tracking-wide">CONTROL DE SALIDA</h1>
             </div>
          </div>

          <h2 className="text-center font-bold text-lg mb-4 uppercase">CONFIRMACIÓN DE ENTREGA DE DOCUMENTO</h2>

          <div className="mb-6">
             <div className="grid grid-cols-12 gap-0 border-b border-black">
                <div className="col-span-3 font-bold text-center py-2">LOCACIÓN</div>
                <div className="col-span-9 font-bold text-center underline text-xl py-2 uppercase">{data.store}</div>
             </div>
          </div>

          <div className="border-t-2 border-b-2 border-black my-4">
             {/* Remolque 1 */}
             <div className="flex border-b border-slate-300">
                <div className="w-32 font-bold p-2 bg-slate-50 border-r border-slate-300 flex items-center">REMOLQUE 1:</div>
                <div className="w-40 font-bold p-2 flex items-center justify-center text-lg">{data.trailer}</div>
                <div className="w-24 font-bold p-2 bg-slate-50 border-r border-l border-slate-300 flex items-center justify-center">CARGADO:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center underline">{data.isLoaded}</div>
                <div className="flex-1"></div>
                <div className="w-32 font-bold p-2 bg-slate-50 border-l border-slate-300 flex items-center justify-end underline">PORCENTAJE:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center text-lg">{data.percent}</div>
             </div>

             {/* Remolque 2 */}
             <div className="flex border-b border-slate-300">
                <div className="w-32 font-bold p-2 bg-slate-50 border-r border-slate-300 flex items-center">REMOLQUE 2:</div>
                <div className="w-40 font-bold p-2 flex items-center justify-center text-lg">{data.trailer2 || '-'}</div>
                <div className="w-24 font-bold p-2 bg-slate-50 border-r border-l border-slate-300 flex items-center justify-center">CARGADO:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center">{data.trailer2 ? data.isLoaded2 : 'N/A'}</div>
                <div className="flex-1"></div>
                <div className="w-32 font-bold p-2 bg-slate-50 border-l border-slate-300 flex items-center justify-end underline">PORCENTAJE:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center">{data.trailer2 ? data.percent2 : 'N/A%'}</div>
             </div>

             <div className="flex border-b border-slate-300 bg-slate-100">
                <div className="w-48 font-bold p-3 flex items-center">NOMBRE DEL OPERADOR</div>
                <div className="flex-1 font-bold text-xl p-2 flex items-center justify-center uppercase tracking-wide bg-slate-200 mx-4 my-1 rounded-sm border border-slate-400">
                   {data.driver}
                </div>
             </div>

             <div className="flex border-b border-slate-300">
                <div className="w-1/2 font-bold p-2 border-r border-slate-300 flex items-center">HORA DE ENTREGA DE DOCUMENTO</div>
                <div className="w-1/2 font-bold underline text-lg p-2 text-center uppercase">
                   {data.entryTime} {data.entryDate}
                </div>
             </div>

             <div className="flex">
                <div className="w-1/2 font-bold p-2 border-r border-slate-300 flex items-center">HORA DE SALIDA DE ANDEN</div>
                <div className="w-1/2 font-bold underline text-lg p-2 text-center uppercase">
                   {data.exitTime} {data.exitDate}
                </div>
             </div>
          </div>

          <div className="mt-16 flex justify-between gap-12">
             <div className="flex-1 text-center">
                <div className="border-t-2 border-black pt-2 font-bold uppercase text-[10px]">
                   FIRMA DE PERSONAL DE LIVERPOOL
                </div>
             </div>
             <div className="flex-1 text-center">
                <div className="border-t-2 border-black pt-2 font-bold uppercase text-[10px]">
                   NOMBRE Y FIRMA DEL OPERADOR
                </div>
             </div>
          </div>

          <div className="mt-8 flex justify-end gap-6">
             <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase">Sello 1</span>
                <div className="border-2 border-blue-500 px-6 py-2 min-w-[120px] text-center font-bold text-lg text-blue-700">
                   {data.seal}
                </div>
             </div>
             {data.trailer2 && (
               <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase">Sello 2</span>
                  <div className="border-2 border-blue-500 px-6 py-2 min-w-[120px] text-center font-bold text-lg text-blue-700">
                     {data.seal2}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
