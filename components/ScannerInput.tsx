import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Camera, X, Pencil, Check, Box, Container, AlertTriangle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { playErrorSound } from '../services/soundService';

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

  // --- REGLAS DE NEGOCIO ---
  const CONTAINER_PREFIXES = ['Q', 'F', 'V', 'S', 'I', 'P', 'A'];
  
  // Estado: ¿Esperamos padre o hijos?
  const expectingContainer = currentCodes.length === 0;
  
  const hintText = expectingContainer 
    ? `PASO 1: Escanea CONTENEDOR (${CONTAINER_PREFIXES.join(', ')}...)` 
    : `PASO 2: Escanea PAQUETES / LP (Cualquier formato)`;
  
  const themeColor = expectingContainer ? "text-violet-600" : "text-amber-600";
  const borderColor = expectingContainer ? "border-violet-300 focus:border-violet-500" : "border-amber-300 focus:border-amber-500";
  const icon = expectingContainer ? <Container className="w-6 h-6 text-violet-600" /> : <Box className="w-6 h-6 text-amber-600" />;

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

  // --- FUNCIÓN DE VALIDACIÓN PRINCIPAL ---
  const validateAndAdd = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Detectar si parece un contenedor
    const isContainerLike = CONTAINER_PREFIXES.some(prefix => cleanCode.startsWith(prefix));

    // REGLA 1: La lista está vacía -> Debe ser Contenedor
    if (currentCodes.length === 0) {
      if (isContainerLike) {
        onAddCode(cleanCode);
      } else {
        playErrorSound();
        alert(`⚠️ ORDEN INCORRECTO\n\nEl primer código debe ser un CONTENEDOR.\nDebe iniciar con alguna de estas letras: ${CONTAINER_PREFIXES.join(', ')}.\n\nEscaneaste: ${cleanCode}`);
      }
    } 
    // REGLA 2: Ya hay un Padre -> Los siguientes son Hijos (LP)
    // Los hijos pueden ser cualquier cosa, PERO no deben ser un contenedor nuevo.
    else {
      if (!isContainerLike) {
        onAddCode(cleanCode);
      } else {
        playErrorSound();
        // Bloquear escaneo de otro padre si ya hay uno abierto
        alert(`⛔ NO PUEDES MEZCLAR CONTENEDORES\n\nYa abriste el contenedor ${currentCodes[0]}.\n\nEl código ${cleanCode} parece ser otro CONTENEDOR.\nPara escanearlo, primero GUARDA o REINICIA el grupo actual.`);
      }
    }
  };

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
             // Usar la validación inteligente
             validateAndAdd(decodedText);
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
      validateAndAdd(inputValue);
      setInputValue('');
    }
  };

  const startEditing = (index: number, code: string) => {
    setEditingIndex(index);
    setEditValue(code);
  };

  const saveEdit = (index: number) => {
    if (editValue.trim() && onEditCode) {
      const val = editValue.trim().toUpperCase();
      
      // Validar edición también
      const isContainerLike = CONTAINER_PREFIXES.some(prefix => val.startsWith(prefix));

      if (index === 0 && !isContainerLike) {
         playErrorSound();
         alert(`El código principal debe ser un CONTENEDOR (Inicia con ${CONTAINER_PREFIXES.join(', ')})`);
         return;
      }
      if (index > 0 && isContainerLike) {
         playErrorSound();
         alert(`Un código HIJO no puede tener formato de Contenedor (${CONTAINER_PREFIXES.join(', ')})`);
         return;
      }

      onEditCode(index, val);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <>
      <div className={`bg-white p-4 rounded-xl shadow-sm border mb-4 transition-colors ${expectingContainer ? 'border-violet-200 shadow-violet-100' : 'border-amber-200 shadow-amber-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg shadow-sm ${expectingContainer ? 'bg-violet-100' : 'bg-amber-100'}`}>
              {icon}
            </div>
            <div>
               <h2 className="text-lg font-black text-slate-800 leading-none tracking-tight">AGRUPAMIENTO</h2>
               <p className={`text-[10px] font-bold mt-1 uppercase tracking-wide ${themeColor}`}>
                  {hintText}
               </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold shadow-md active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">CÁMARA</span>
          </button>
        </div>

        <div className="relative mb-4 group">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={expectingContainer ? `CONTENEDOR (${CONTAINER_PREFIXES.join('/')}...)` : "PAQUETE / LP"}
            className={`w-full pl-4 pr-12 py-4 bg-slate-50 border-2 rounded-xl text-lg font-mono font-bold uppercase text-slate-900 focus:ring-4 focus:ring-opacity-20 outline-none transition-all placeholder:text-slate-300 ${borderColor}`}
          />
          <button
            onClick={() => {
              validateAndAdd(inputValue);
              setInputValue('');
              inputRef.current?.focus();
            }}
            disabled={!inputValue.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* LISTA DE CÓDIGOS */}
        {currentCodes.length > 0 ? (
          <div className="space-y-2 mt-4">
             {/* 1. EL PADRE (Siempre index 0) */}
             <div className="flex items-center justify-between p-3 bg-violet-50 border border-violet-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="bg-violet-200 text-violet-700 w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shrink-0">
                     {currentCodes[0].charAt(0)}
                   </div>
                   <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">CONTENEDOR PADRE</span>
                      {editingIndex === 0 ? (
                        <div className="flex items-center gap-2">
                           <input 
                              ref={editInputRef}
                              type="text" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)} 
                              onBlur={() => saveEdit(0)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(0)}
                              className="w-full bg-white text-slate-900 border border-violet-300 rounded px-1 text-sm font-mono font-bold uppercase"
                           />
                           <button onClick={() => saveEdit(0)} className="text-emerald-600"><Check className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-violet-900 text-lg truncate">{currentCodes[0]}</span>
                      )}
                   </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                   {onEditCode && (
                      <button onClick={() => startEditing(0, currentCodes[0])} className="p-2 text-violet-400 hover:bg-violet-100 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                   )}
                   <button onClick={() => onRemoveCode(0)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
             </div>

             {/* 2. LOS HIJOS (Resto de la lista) */}
             {currentCodes.slice(1).map((code, index) => {
               const realIndex = index + 1;
               return (
                <div key={realIndex} className="flex items-center justify-between p-2 bg-amber-50/50 border border-amber-100 rounded-lg hover:bg-amber-50 transition-colors animate-fadeIn">
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className="text-amber-400 w-6 text-center text-[10px] font-bold shrink-0">{realIndex}</div>
                      {editingIndex === realIndex ? (
                        <div className="flex items-center gap-2 w-full">
                           <input 
                              ref={editInputRef}
                              type="text" 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)} 
                              onBlur={() => saveEdit(realIndex)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(realIndex)}
                              className="w-full bg-white text-slate-900 border border-amber-300 rounded px-1 text-sm font-mono font-bold uppercase"
                           />
                           <button onClick={() => saveEdit(realIndex)} className="text-emerald-600"><Check className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-slate-700 truncate">{code}</span>
                      )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                      {onEditCode && (
                        <button onClick={() => startEditing(realIndex, code)} className="p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-600 rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => onRemoveCode(realIndex)} className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
               );
             })}
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
             <Container className="w-8 h-8 mb-2 opacity-30" />
             <span className="text-xs font-bold uppercase opacity-60">Listo para escanear</span>
             <span className="text-[10px] opacity-40 mt-1">Formatos: {CONTAINER_PREFIXES.join(', ')}...</span>
          </div>
        )}

        {currentCodes.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClear}
              className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              LIMPIAR TODO
            </button>
          </div>
        )}

        {isScanning && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
             <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <button 
                  onClick={() => setIsScanning(false)}
                  className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md"
                >
                  <X className="w-6 h-6" />
                </button>
                <div id="reader" className="w-full h-full min-h-[400px]"></div>
                <div className="absolute bottom-6 left-0 right-0 text-center z-20 pointer-events-none">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 ${expectingContainer ? 'bg-violet-600/90 text-white' : 'bg-amber-600/90 text-white'}`}>
                    {expectingContainer ? "BUSCANDO CONTENEDOR (Q/F/V...)" : "BUSCANDO PAQUETES / LP"}
                  </span>
                </div>
             </div>
          </div>
        )}
      </div>
    </>
  );
};