import React, { useState, useRef, useEffect } from 'react';
import { Scan, Plus, Trash2, Camera, X, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerInputProps {
  currentCodes: string[];
  onAddCode: (code: string) => void;
  onClear: () => void;
  onRemoveCode: (index: number) => void;
}

export const ScannerInput: React.FC<ScannerInputProps> = ({ 
  currentCodes, 
  onAddCode, 
  onClear,
  onRemoveCode
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Determine what we expect next
  const expectingContainer = currentCodes.length === 0;
  const hintText = expectingContainer 
    ? "Escanea el CONTENEDOR Principal" 
    : "Escanea los PAQUETES (HU)";
  
  // Use Violet for Container, Amber for Packages
  const hintColor = expectingContainer ? "text-violet-600" : "text-amber-600";
  const borderColor = expectingContainer ? "border-violet-300 focus:border-violet-500 focus:ring-violet-500" : "border-amber-300 focus:border-amber-500 focus:ring-amber-500";

  // Auto-focus input on mount and after interactions (unless scanning)
  useEffect(() => {
    if (!isScanning) {
      inputRef.current?.focus();
    }
  }, [currentCodes, isScanning]);

  // Handle Scanner Initialization
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        const element = document.getElementById("reader");
        if(element) element.innerHTML = "";

        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            videoConstraints: {
              facingMode: "environment" 
            }
          },
          false
        );
        
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            const cleanCode = decodedText.trim().toUpperCase();
            if (!currentCodes.includes(cleanCode)) {
              onAddCode(cleanCode);
            }
          },
          (errorMessage) => {}
        );
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
             scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
          } catch (e) {
             console.error("Error clearing scanner", e);
          }
          scannerRef.current = null;
        }
      };
    }
  }, [isScanning, onAddCode, currentCodes]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onAddCode(inputValue.trim().toUpperCase());
        setInputValue('');
      }
    }
  };

  return (
    <>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="bg-violet-100 p-2 rounded-lg">
              <Scan className="w-5 h-5 text-violet-600" />
            </div>
            <div>
               <h2 className="text-lg font-bold text-slate-800 leading-none">Escáner</h2>
               <p className={`text-xs font-bold mt-1 uppercase ${hintColor}`}>{hintText}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-bold shadow-sm"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Cámara</span>
          </button>
        </div>

        <div className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={expectingContainer ? "Código Contenedor..." : "Código Paquete..."}
            className={`w-full pl-4 pr-12 py-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all text-lg font-mono font-medium ${borderColor}`}
          />
          <button 
            onClick={() => {
              if (inputValue.trim()) {
                onAddCode(inputValue.trim().toUpperCase());
                setInputValue('');
                inputRef.current?.focus();
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Staging Area Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
            <span className="font-medium">En grupo actual: {currentCodes.length}</span>
            {currentCodes.length > 0 && (
              <button 
                onClick={onClear}
                className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-bold bg-red-50 px-2 py-1 rounded"
              >
                <Trash2 className="w-3 h-3" /> BORRAR TODO
              </button>
            )}
          </div>
          
          {currentCodes.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-violet-100 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-violet-50/30">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50 text-violet-300" />
              <span className="text-sm font-bold text-violet-900/50">Listo para iniciar grupo</span>
              <span className="text-xs text-violet-800/40">Escanea el Contenedor Principal</span>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-2 max-h-48 overflow-y-auto space-y-2 border border-slate-200">
              {currentCodes.map((code, idx) => (
                <div key={`${code}-${idx}`} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-slate-200 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black shadow-sm ${idx === 0 ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                      {idx === 0 ? 'C' : 'P'}
                    </span>
                    <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-800 leading-none">{code}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{idx === 0 ? 'Contenedor Principal' : 'Paquete Agregado'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveCode(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scanner Overlay Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-violet-400" />
                Escáner Activo
              </h3>
              <button 
                onClick={() => setIsScanning(false)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 bg-black p-0 flex flex-col overflow-hidden relative">
               <div id="reader" className="w-full h-full object-cover"></div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Modo de Detección:</p>
              <p className={`text-xl font-black ${expectingContainer ? 'text-violet-600' : 'text-amber-600'}`}>
                  {expectingContainer ? "BUSCANDO CONTENEDOR" : "AGREGANDO PAQUETES"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};