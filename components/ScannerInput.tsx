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
  const hintColor = expectingContainer ? "text-blue-600" : "text-indigo-600";

  // Auto-focus input on mount and after interactions (unless scanning)
  useEffect(() => {
    if (!isScanning) {
      inputRef.current?.focus();
    }
  }, [currentCodes, isScanning]);

  // Handle Scanner Initialization
  useEffect(() => {
    if (isScanning) {
      // Small timeout to ensure DOM element exists
      const timer = setTimeout(() => {
        // Clear any previous instance if it exists (safety check)
        const element = document.getElementById("reader");
        if(element) element.innerHTML = "";

        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            // Reduce initialization time
            videoConstraints: {
              facingMode: "environment" 
            }
          },
          /* verbose= */ false
        );
        
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            const cleanCode = decodedText.trim().toUpperCase();
            // Prevent duplicate rapid scans of the exact same code
            if (!currentCodes.includes(cleanCode)) {
              onAddCode(cleanCode);
            }
          },
          (errorMessage) => {
            // parse error, ignore
          }
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
            <div className="bg-blue-100 p-2 rounded-lg">
              <Scan className="w-5 h-5 text-blue-600" />
            </div>
            <div>
               <h2 className="text-lg font-semibold text-slate-800 leading-none">Escáner</h2>
               <p className={`text-xs font-bold mt-1 ${hintColor}`}>{hintText}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
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
            className={`w-full pl-4 pr-12 py-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all text-lg font-mono ${expectingContainer ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500' : 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
          />
          <button 
            onClick={() => {
              if (inputValue.trim()) {
                onAddCode(inputValue.trim().toUpperCase());
                setInputValue('');
                inputRef.current?.focus();
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Staging Area Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
            <span>En grupo actual: {currentCodes.length}</span>
            {currentCodes.length > 0 && (
              <button 
                onClick={onClear}
                className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-medium"
              >
                <Trash2 className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
          
          {currentCodes.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm font-medium">Listo para iniciar grupo</span>
              <span className="text-xs">Escanea el Contenedor Principal</span>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-2 max-h-48 overflow-y-auto space-y-2 border border-slate-200">
              {currentCodes.map((code, idx) => (
                <div key={`${code}-${idx}`} className="flex items-center justify-between bg-white p-3 rounded shadow-sm border border-slate-200 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                      {idx === 0 ? 'C' : 'P'}
                    </span>
                    <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-800 leading-none">{code}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{idx === 0 ? 'Contenedor' : 'Paquete'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveCode(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Escáner Activo
              </h3>
              <button 
                onClick={() => setIsScanning(false)}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 bg-white p-2 flex flex-col overflow-y-auto min-h-[400px]">
              <div id="reader" className="w-full"></div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Siguiente escaneo:</p>
              <p className={`text-lg font-bold ${expectingContainer ? 'text-blue-600' : 'text-indigo-600'}`}>
                  {expectingContainer ? "CONTENEDOR" : "PAQUETES"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
