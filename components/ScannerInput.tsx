
import React, { useState, useRef, useEffect } from 'react';
import { Scan, Plus, Trash2, Camera, X, AlertCircle, Pencil, Check, Box, Container } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerInputProps {
  currentCodes: string[];
  onAddCode: (code: string) => void;
  onClear: () => void;
  onRemoveCode: (index: number) => void;
  onEditCode?: (index: number, newCode: string) => void; 
}

export const ScannerInput: React.FC<ScannerInputProps> = ({ 
  currentCodes, 
  onAddCode, 
  onClear,
  onRemoveCode,
  onEditCode
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // LÓGICA DE AGRUPAMIENTO:
  // Índice 0 = Contenedor (Padre)
  // Índice 1+ = Paquetes (Hijos)
  const expectingContainer = currentCodes.length === 0;
  
  const hintText = expectingContainer 
    ? "PASO 1: Escanea el CONTENEDOR (Ej: Q009...)" 
    : `PASO 2: Escanea los PAQUETES (Llevas ${currentCodes.length - 1})`;
  
  const hintColor = expectingContainer ? "text-violet-600" : "text-amber-600";
  const borderColor = expectingContainer ? "border-violet-300 focus:border-violet-500" : "border-amber-300 focus:border-amber-500";
  const icon = expectingContainer ? <Container className="w-5 h-5 text-violet-600" /> : <Box className="w-5 h-5 text-amber-600" />;

  useEffect(() => {
    if (!isScanning && editingIndex === null) {
      inputRef.current?.focus();
    }
  }, [currentCodes, isScanning, editingIndex]);

  useEffect(() => {
    if (editingIndex !== null) {
      editInputRef.current?.focus();
    }
  }, [editingIndex]);

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

  const startEditing = (index: number, code: string) => {
    setEditingIndex(index);
    setEditValue(code);
  };

  const saveEdit = (index: number) => {
    if (editValue.trim() && onEditCode) {
      onEditCode(index, editValue.trim().toUpperCase());
    }
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <>
      <div className={`bg-white p-4 rounded-xl shadow-sm border mb-4 transition-colors ${expectingContainer ? 'border-violet-200' : 'border-amber-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${expectingContainer ? 'bg-violet-100' : 'bg-amber-100'}`}>
              {icon}
            </div>
            <div>
               <h2 className="text-lg font-bold text-slate-800 leading-none">Escáner de Agrupamiento</h2>
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
            placeholder={expectingContainer ? "1. Escanea CONTENEDOR..." : "2. Escanea PAQUETES..."}
            className={`w-full pl-4 pr-12 py-3 bg-white text-slate-900 border rounded-lg focus:ring-2 outline-none transition-all text-lg font-mono font-bold placeholder:text-slate-400 ${borderColor}`}
          />
          <button 
            onClick={() => {
              if (inputValue.trim()) {
                onAddCode(inputValue.trim().toUpperCase());
                setInputValue('');
                inputRef.current?.focus();
              }
            }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white rounded-md transition-colors shadow-sm ${expectingContainer ? 'bg-violet-600 hover:bg-violet-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Staging Area Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
            <span className="font-medium">Grupo Actual: {currentCodes.length > 0 ? `${currentCodes.length} Items` : 'Vacío'}</span>
            {currentCodes.length > 0 && (
              <button 
                onClick={onClear}
                className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-bold bg-red-50 px-2 py-1 rounded"
              >
                <Trash2 className="w-3 h-3" /> REINICIAR GRUPO
              </button>
            )}
          </div>
          
          {currentCodes.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-violet-100 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-violet-50/30">
              <Container className="w-8 h-8 mb-2 opacity-50 text-violet-300" />
              <span className="text-sm font-bold text-violet-900/50">Listo para agrupar</span>
              <span className="text-xs text-violet-800/40">El primer escaneo será el Contenedor</span>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-2 max-h-48 overflow-y-auto space-y-2 border border-slate-200">
              {currentCodes.map((code, idx) => (
                <div key={`${code}-${idx}`} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-slate-200 animate-fadeIn">
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black shadow-sm shrink-0 ${idx === 0 ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                      {idx === 0 ? 'C' : 'P'}
                    </span>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                        {editingIndex === idx ? (
                          <div className="flex items-center gap-2">
                            <input 
                              ref={editInputRef}
                              type="text" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(idx);
                              }}
                              onBlur={() => saveEdit(idx)}
                              className="w-full p-1 text-sm bg-white text-slate-900 border border-violet-400 rounded outline-none font-mono font-bold uppercase"
                            />
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => saveEdit(idx)} className="text-emerald-500"><Check className="w-4 h-4"/></button>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono font-bold text-slate-800 leading-none truncate">{code}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{idx === 0 ? 'Contenedor Principal' : 'Paquete Agrupado'}</span>
                          </>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {editingIndex !== idx && (
                      <button 
                        onClick={() => startEditing(idx, code)}
                        className="text-slate-300 hover:text-violet-500 transition-colors p-1.5 rounded-md hover:bg-slate-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onRemoveCode(idx)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
