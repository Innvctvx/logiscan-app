import React from 'react';
import { X, Printer } from 'lucide-react';

interface ExitTicketProps {
  onClose: () => void;
  data: {
    trailer: string;
    isLoaded: string;
    percent: string;
    driver: string;
    entryDate: string;
    entryTime: string;
    exitDate: string;
    exitTime: string;
    seal: string;
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
        
        {/* Header Controls (Hidden on Print) */}
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b print:hidden sticky top-0">
          <h2 className="font-bold text-slate-800">Vista Previa: Hoja de Salida</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
               <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">
               <X className="w-4 h-4" /> Cerrar
            </button>
          </div>
        </div>

        {/* The Exact Excel Template Replica */}
        <div className="p-8 print:p-0 font-sans text-black">
          
          {/* Logo Area */}
          <div className="flex mb-6">
             <div className="w-48">
               {/* Placeholder for Liverpool Logo - Using text styling to mimic it */}
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
                <div className="col-span-9 font-bold text-center underline text-xl py-2">{data.store}</div>
             </div>
             <div className="text-center font-black text-2xl uppercase mt-2 underline">
                L.PERISUR {/* This seems hardcoded in the template image, or should be dynamic? keeping as image for now or dynamic if preferred */}
             </div>
          </div>

          {/* Main Grid Table */}
          <div className="border-t-2 border-b-2 border-black my-4">
             {/* Row 1 */}
             <div className="flex border-b border-slate-300">
                <div className="w-32 font-bold p-2 bg-slate-50 border-r border-slate-300 flex items-center">REMOLQUE No.:</div>
                <div className="w-40 font-bold p-2 flex items-center justify-center text-lg">{data.trailer}</div>
                <div className="w-24 font-bold p-2 bg-slate-50 border-r border-l border-slate-300 flex items-center justify-center">CARGADO:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center underline">{data.isLoaded}</div>
                <div className="flex-1"></div>
                <div className="w-32 font-bold p-2 bg-slate-50 border-l border-slate-300 flex items-center justify-end underline">PORCENTAJE:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center text-lg">{data.percent}</div>
             </div>

             {/* Row 2 (Second Trailer - Empty per image logic mostly) */}
             <div className="flex border-b border-slate-300">
                <div className="w-32 font-bold p-2 bg-slate-50 border-r border-slate-300 flex items-center">REMOLQUE No:</div>
                <div className="w-40 font-bold p-2 flex items-center justify-center"></div>
                <div className="w-24 font-bold p-2 bg-slate-50 border-r border-l border-slate-300 flex items-center justify-center">CARGADO:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center">NO</div>
                <div className="flex-1"></div>
                <div className="w-32 font-bold p-2 bg-slate-50 border-l border-slate-300 flex items-center justify-end underline">PORCENTAJE:</div>
                <div className="w-24 font-bold p-2 flex items-center justify-center">N/A%</div>
             </div>

             {/* Driver Row */}
             <div className="flex border-b border-slate-300 bg-slate-100">
                <div className="w-48 font-bold p-3 flex items-center">NOMBRE DEL OPERADOR</div>
                <div className="flex-1 font-bold text-xl p-2 flex items-center justify-center uppercase tracking-wide bg-slate-200 mx-4 my-1 rounded-sm border border-slate-400 shadow-sm">
                   {data.driver}
                </div>
             </div>

             {/* Entry Time */}
             <div className="flex border-b border-slate-300">
                <div className="w-1/2 font-bold p-2 border-r border-slate-300 flex items-center">HORA DE ENTREGA DE DOCUMENTO</div>
                <div className="w-1/2 font-bold underline text-lg p-2 text-center">
                   {data.entryTime} {data.entryDate}
                </div>
             </div>

             {/* Exit Time */}
             <div className="flex">
                <div className="w-1/2 font-bold p-2 border-r border-slate-300 flex items-center">HORA DE SALIDA DE ANDEN</div>
                <div className="w-1/2 font-bold underline text-lg p-2 text-center">
                   {data.exitTime} {data.exitDate}
                </div>
             </div>
          </div>

          {/* Signatures */}
          <div className="mt-16 flex justify-between gap-12">
             <div className="flex-1 text-center">
                <div className="border-t-2 border-black pt-2 font-bold uppercase text-sm">
                   FIRMA DE PERSONAL DE LIVERPOOL
                </div>
             </div>
             <div className="flex-1 text-center">
                <div className="border-t-2 border-black pt-2 font-bold uppercase text-sm">
                   NOMBRE Y FIRMA DEL OPERADOR
                </div>
             </div>
          </div>

          {/* Seal */}
          <div className="mt-8 flex justify-end">
             <div className="flex items-center gap-2">
                <span className="font-bold">Sello de salida</span>
                <div className="border-2 border-blue-500 px-6 py-2 w-48 text-center font-bold text-lg">
                   {data.seal}
                </div>
                {/* Small blue dot handle mimic */}
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div> 
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
