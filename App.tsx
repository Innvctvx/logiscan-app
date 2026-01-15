import React, { useState, useCallback, useEffect } from 'react';
import { ScannerInput } from './components/ScannerInput';
import { ControlPanel } from './components/ControlPanel';
import { HistoryTable } from './components/HistoryTable';
import { CartaPorteForm } from './components/CartaPorteForm';
import { ExitTicketForm } from './components/ExitTicketForm';
import { ScanRecord, ServiceType, DocType, Region, GoogleUser, RecordCategory, CatalogData } from './types';
import { PackageCheck, ClipboardList, Settings, Truck, Code, ClipboardCheck, Lock, Loader2, LogOut, FileCheck } from 'lucide-react';

// --- CONFIGURACIÓN ---
// IMPORTANTE: Asegúrate que esta URL sea la de TU implementación "Aplicación Web" -> "Cualquier usuario"
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlhw656fqVrapR-QDfyYwnoXhFvcTgNUltHXG2BxhBLHi97jsTaw8QbPqyBJmzje0V/exec"; 

declare global {
  interface Window {
    google: any;
  }
}

type AppMode = 'REGISTER' | 'VERIFY' | 'CARTA_PORTE' | 'EXIT_TICKET';

const App: React.FC = () => {
  // --- SESSION STATE ---
  const [sessionUser, setSessionUser] = useState<string>('');
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [appMode, setAppMode] = useState<AppMode>('REGISTER');

  // Scanner State
  const [activeCodes, setActiveCodes] = useState<string[]>([]);
  
  // Document Configuration State (Scanning)
  const [docType, setDocType] = useState<DocType>('EMBARQUE');
  const [docNumber, setDocNumber] = useState<string>('');
  const [bultos, setBultos] = useState<string>('');

  // Carta Porte State
  const [rfcOperador, setRfcOperador] = useState('');
  const [licencia, setLicencia] = useState('');
  const [operadorName, setOperadorName] = useState('');
  const [numEconomico, setNumEconomico] = useState('');
  const [confVehic, setConfVehic] = useState('');
  const [placa, setPlaca] = useState('');
  const [ano, setAno] = useState('');
  const [poliza, setPoliza] = useState('');
  const [seguro, setSeguro] = useState('');
  const [peso, setPeso] = useState('');
  const [distribuidora, setDistribuidora] = useState('');
  const [proveedorNum, setProveedorNum] = useState('');

  // Exit Ticket State (Control de Salida)
  const [entryDate, setEntryDate] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [isLoaded, setIsLoaded] = useState('SI');
  const [loadPercent, setLoadPercent] = useState('0%');
  const [exitSeal, setExitSeal] = useState('');

  // --- VERIFICATION STATE (Departure Details) ---
  const [verifyDriver, setVerifyDriver] = useState('');
  const [verifyTrailer, setVerifyTrailer] = useState('');
  const [verifySeal, setVerifySeal] = useState('');

  // Assignment State (Shared)
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DOMICILIO);
  const [region, setRegion] = useState<Region>(Region.FORANEO);
  
  // Data State
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogData>({ drivers: [], units: [] });

  // --- GOOGLE AUTH & SETTINGS STATE ---
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  
  const [masterSheetId, setMasterSheetId] = useState<string>(GOOGLE_SCRIPT_URL);

  useEffect(() => {
    const savedClientId = localStorage.getItem('logiscan_client_id');
    if (savedClientId) setClientId(savedClientId);
    
    if (!GOOGLE_SCRIPT_URL) {
      const savedSheetId = localStorage.getItem('logiscan_master_sheet_id');
      if (savedSheetId) setMasterSheetId(savedSheetId);
    }
  }, []);

  const handleSettings = () => {
    // Permitir editar incluso si hay URL hardcoded, por si acaso cambió
    const input = prompt(
      "CONFIGURACIÓN DE CONEXIÓN\n\nPegar URL de la Aplicación Web (Script):", 
      masterSheetId
    );

    if (input !== null) {
      const cleanVal = input.trim();
      setMasterSheetId(cleanVal);
      localStorage.setItem('logiscan_master_sheet_id', cleanVal);
      
      if(cleanVal.startsWith('https://')) {
        alert("✅ Conexión Configurada.");
      } else {
        alert("⚠️ La URL parece inválida. Debe empezar con https://script.google.com/...");
      }
    }
  };

  // Fetch Catalogs function
  const fetchCatalogs = async () => {
    if (!masterSheetId) return;
    try {
      const response = await fetch(masterSheetId, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getCatalogs' })
      });
      const data = await response.json();
      if (data.result === 'success') {
        // Ensure data exists before setting
        setCatalogs({
          drivers: data.drivers || [],
          units: data.units || []
        });
      }
    } catch (e) {
      console.error("Error fetching catalogs", e);
    }
  };

  // --- REAL LOGIN LOGIC ---
  const performLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      alert("Por favor ingresa usuario y contraseña.");
      return;
    }

    if (!masterSheetId || !masterSheetId.startsWith('https://')) {
      alert("❌ ERROR: No se ha configurado la URL del Script en el engranaje.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(masterSheetId, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'login',
          username: loginUser,
          password: loginPass,
          device: navigator.userAgent // Send device info for logging
        })
      });

      const textResponse = await response.text();
      let data;
      
      try {
        data = JSON.parse(textResponse);
      } catch (jsonError) {
        console.error("Respuesta no JSON:", textResponse);
        alert("❌ ERROR DE PERMISOS DE GOOGLE\n\nEl script devolvió una página de error (HTML). Revisa la configuración de implementación (Deploy).");
        setIsLoggingIn(false);
        return;
      }

      if (data.result === 'success') {
        setSessionUser(data.name); 
        setIsLoggingIn(false);
        // Once logged in, fetch catalogs
        fetchCatalogs();
      } else if (data.result === 'active_session') {
        alert("⚠️ ACCESO DENEGADO\n\nEste usuario ya tiene una sesión activa en otro dispositivo.\nPor seguridad, cierra sesión en el otro dispositivo primero.");
        setIsLoggingIn(false);
      } else {
        alert("❌ Acceso Denegado: " + (data.message || "Usuario o contraseña incorrectos."));
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error de red o conexión. Verifica tu internet.");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("¿Cerrar sesión actual y liberar el acceso?")) {
      try {
         // Notify backend to release lock
         await fetch(masterSheetId, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
              action: 'logout',
              username: loginUser
            })
         });
      } catch (e) {
        console.error("Logout sync failed", e);
      }
      setSessionUser('');
      setLoginPass('');
    }
  };

  const handleLogin = () => {
    setSessionUser('');
    setLoginPass('');
  };

  // Sound effects
  const playSuccessSound = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playErrorSound = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.type = 'sawtooth';
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const playDeleteSound = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.type = 'triangle';
    osc.connect(ctx.destination);
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    osc.stop(ctx.currentTime + 0.2);
  };

  const handleAddCode = useCallback((code: string) => {
    if (appMode === 'VERIFY') {
      if (!verifyTrailer || !verifySeal || !verifyDriver) {
        alert("⚠️ ATENCIÓN ⚠️\n\nDebes llenar los DATOS DE SALIDA (Conductor, Remolque, Sello) antes de verificar mercancía.");
        playErrorSound();
        return;
      }

      setRecords(prevRecords => {
        let found = false;
        const updatedRecords = prevRecords.map(record => {
          if (record.status === 'PENDIENTE') {
            if (record.huCode === code || record.providerCode === code) {
              found = true;
              return { 
                ...record, 
                status: 'VERIFICADO', 
                verifiedAt: Date.now(),
                verifierName: sessionUser, // Col R
                departureDriver: verifyDriver, // Col N
                departureTrailer: verifyTrailer, // Col O
                departureSeal: verifySeal // Col P
              } as ScanRecord;
            }
          }
          return record;
        });
        if (found) playSuccessSound(); else playErrorSound();
        return updatedRecords;
      });
      setActiveCodes([]); 
    } else if (appMode === 'REGISTER') {
      setActiveCodes(prev => {
        if (prev.includes(code)) {
          playDeleteSound();
          return prev.filter(c => c !== code);
        }
        playSuccessSound();
        return [...prev, code];
      });
    }
  }, [appMode, sessionUser, verifyDriver, verifyTrailer, verifySeal]);

  const handleRemoveCode = useCallback((index: number) => {
    setActiveCodes(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleEditCode = useCallback((index: number, newCode: string) => {
    setActiveCodes(prev => {
      const updated = [...prev];
      updated[index] = newCode;
      return updated;
    });
  }, []);

  const handleClearCodes = useCallback(() => {
    setActiveCodes([]);
  }, []);

  const handleSaveGroup = useCallback((storeNumber: string) => {
    if (activeCodes.length === 0) return;

    const providerCode = activeCodes[0];
    const lpCodes = activeCodes.slice(1);
    const storeLabel = `${serviceType} ${storeNumber}`;
    
    const newRecords: ScanRecord[] = [];

    const baseRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'PENDIENTE' as const,
      recordCategory: 'SCAN' as RecordCategory,
      scannerName: sessionUser, // Col Q
      docType,
      docNumber,
      bultos,
      storeLabel,
      destination: 'PAQUETERÍA',
      providerCode: providerCode
    };

    if (lpCodes.length > 0) {
      lpCodes.forEach(lp => {
        newRecords.push({ ...baseRecord, id: crypto.randomUUID(), huCode: lp });
      });
    } else {
       newRecords.push({ ...baseRecord, id: crypto.randomUUID(), huCode: 'SIN_LP' });
    }

    setRecords(prev => [...prev, ...newRecords]);
    setActiveCodes([]);
    setDocNumber('');
    setBultos('');
    
  }, [activeCodes, docType, docNumber, bultos, serviceType, sessionUser]);

  const handleSaveCartaPorte = useCallback((storeNumber: string) => {
    if(!rfcOperador || !placa) {
      alert("Por favor llena al menos el RFC y la Placa");
      return;
    }

    const storeLabel = `${serviceType} ${storeNumber}`;
    const newRecord: ScanRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'PENDIENTE',
      recordCategory: 'CARTA_PORTE',
      scannerName: sessionUser,
      storeLabel,
      destination: 'CARTA PORTE',
      
      cp_rfcOperador: rfcOperador,
      cp_licencia: licencia,
      cp_operador: operadorName,
      cp_numEconomico: numEconomico,
      cp_confVehic: confVehic,
      cp_placa: placa,
      cp_ano: ano,
      cp_poliza: poliza,
      cp_seguro: seguro,
      cp_peso: peso,
      cp_distribuidora: region === Region.FORANEO ? distribuidora : '',
      cp_proveedorNum: region === Region.FORANEO ? proveedorNum : '',

      // Reset Exit Ticket Fields for Carta Porte log only
      cp_entryDate: '',
      cp_entryTime: '',
      cp_exitDate: '',
      cp_exitTime: '',
      cp_isLoaded: '',
      cp_loadPercent: '',
      cp_exitSeal: ''
    };

    setRecords(prev => [...prev, newRecord]);
    playSuccessSound();
    alert("Carta Porte guardada para " + storeLabel);

    // Reset basics
    setRfcOperador('');
    setLicencia('');
    setOperadorName('');
    setPlaca('');
  }, [rfcOperador, licencia, operadorName, numEconomico, confVehic, placa, ano, poliza, seguro, peso, distribuidora, proveedorNum, serviceType, region, sessionUser]);

  const getHeaderColor = () => {
    switch (appMode) {
      case 'REGISTER': return 'bg-violet-700 border-violet-800'; 
      case 'VERIFY': return 'bg-emerald-600 border-emerald-700'; 
      case 'CARTA_PORTE': return 'bg-amber-500 border-amber-600'; 
      case 'EXIT_TICKET': return 'bg-blue-600 border-blue-700';
      default: return 'bg-white border-slate-200';
    }
  };

  const getHeaderTextColor = () => {
     return appMode === 'CARTA_PORTE' ? 'text-slate-900' : 'text-white';
  };

  // --- LOGIN SCREEN ---
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        
        {/* Settings button for initial setup */}
        <div className="absolute top-4 right-4">
          <button onClick={handleSettings} className="p-2 text-slate-500 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
           <div className="bg-violet-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <Lock className="w-10 h-10 text-violet-600" />
           </div>
           <h1 className="text-2xl font-black text-slate-800 mb-2">Acceso LogiScan</h1>
           <p className="text-slate-500 mb-8 text-sm">Ingresa tus credenciales registradas.</p>
           
           <form onSubmit={performLogin} className="space-y-4">
             <div className="text-left">
               <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">Usuario</label>
               <input 
                 type="text" 
                 value={loginUser}
                 onChange={(e) => setLoginUser(e.target.value)}
                 className="w-full text-lg p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                 placeholder="Ej. juan.perez"
                 autoFocus
               />
             </div>
             
             <div className="text-left">
               <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">Contraseña</label>
               <input 
                 type="password" 
                 value={loginPass}
                 onChange={(e) => setLoginPass(e.target.value)}
                 className="w-full text-lg p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                 placeholder="••••••••"
               />
             </div>

             <button 
               type="submit" 
               disabled={isLoggingIn}
               className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg active:scale-95 transform disabled:opacity-70 disabled:cursor-wait flex justify-center items-center gap-2 mt-4"
             >
               {isLoggingIn ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   VERIFICANDO...
                 </>
               ) : (
                 "INICIAR SESIÓN"
               )}
             </button>
           </form>
           <p className="mt-8 text-[10px] text-slate-300 uppercase tracking-widest font-bold">LogiScan Systems v2.2</p>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-50 pb-12 transition-colors duration-500 flex flex-col">
      {/* Header */}
      <header className={`border-b sticky top-0 z-20 shadow-md transition-colors duration-300 ${getHeaderColor()}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <PackageCheck className={`w-6 h-6 ${getHeaderTextColor()}`} />
              </div>
              <div>
                <h1 className={`text-xl font-black tracking-tight ${getHeaderTextColor()}`}>LogiScan</h1>
                <p className={`text-[10px] font-medium opacity-80 ${getHeaderTextColor()}`}>Op: {sessionUser}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleLogout} 
                className={`p-2 rounded-lg transition-colors hover:bg-white/20 ${getHeaderTextColor()}`}
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
              
              <div className="hidden md:flex bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10 ml-2">
                <button 
                  onClick={() => setAppMode('REGISTER')} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${appMode === 'REGISTER' ? 'bg-white text-violet-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >
                  Registro
                </button>
                <button 
                  onClick={() => setAppMode('CARTA_PORTE')} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${appMode === 'CARTA_PORTE' ? 'bg-white text-amber-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >
                  Carta Porte
                </button>
                <button 
                  onClick={() => setAppMode('EXIT_TICKET')} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${appMode === 'EXIT_TICKET' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >
                  Hoja Salida
                </button>
                <button 
                  onClick={() => setAppMode('VERIFY')} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${appMode === 'VERIFY' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >
                  Verificar
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Mode Switcher */}
          <div className="md:hidden pb-3 pt-1 flex gap-2 overflow-x-auto no-scrollbar">
             <button onClick={() => setAppMode('REGISTER')} className={`flex-1 min-w-[80px] py-2 text-center rounded-lg text-xs font-bold border shadow-sm transition-all ${appMode === 'REGISTER' ? 'bg-violet-100 border-violet-200 text-violet-800' : 'bg-white/90 border-transparent text-slate-500'}`}>Registro</button>
             <button onClick={() => setAppMode('CARTA_PORTE')} className={`flex-1 min-w-[80px] py-2 text-center rounded-lg text-xs font-bold border shadow-sm transition-all ${appMode === 'CARTA_PORTE' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/90 border-transparent text-slate-500'}`}>Carta P.</button>
             <button onClick={() => setAppMode('EXIT_TICKET')} className={`flex-1 min-w-[80px] py-2 text-center rounded-lg text-xs font-bold border shadow-sm transition-all ${appMode === 'EXIT_TICKET' ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white/90 border-transparent text-slate-500'}`}>Hoja S.</button>
             <button onClick={() => setAppMode('VERIFY')} className={`flex-1 min-w-[80px] py-2 text-center rounded-lg text-xs font-bold border shadow-sm transition-all ${appMode === 'VERIFY' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-white/90 border-transparent text-slate-500'}`}>Verif.</button>
          </div>
        </div>
      </header>

      {/* Main Content Render */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        {/* Banners */}
        {appMode === 'VERIFY' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-4 animate-fadeIn shadow-sm">
             <div className="bg-emerald-100 p-2 rounded-full">
                <ClipboardCheck className="w-6 h-6 text-emerald-600" />
             </div>
             <div>
               <h3 className="font-bold text-emerald-900">Modo Verificación de Salida</h3>
               <p className="text-xs text-emerald-700">Verifica contra escaneos previos.</p>
             </div>
          </div>
        )}
        
        {appMode === 'CARTA_PORTE' && (
           <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4 animate-fadeIn shadow-sm">
             <div className="bg-amber-100 p-2 rounded-full">
                <Truck className="w-6 h-6 text-amber-600" />
             </div>
             <div>
               <h3 className="font-bold text-amber-900">Emisión de Carta Porte</h3>
               <p className="text-xs text-amber-800">Genera Cartas Porte para el operador.</p>
             </div>
          </div>
        )}

        {appMode === 'EXIT_TICKET' && (
           <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-4 animate-fadeIn shadow-sm">
             <div className="bg-blue-100 p-2 rounded-full">
                <FileCheck className="w-6 h-6 text-blue-600" />
             </div>
             <div>
               <h3 className="font-bold text-blue-900">Hoja de Salida</h3>
               <p className="text-xs text-blue-800">Genera e imprime el documento de control de salida.</p>
             </div>
          </div>
        )}

         {appMode === 'REGISTER' && (
           <div className="mb-6 bg-violet-50 border border-violet-200 p-4 rounded-xl flex items-center gap-4 animate-fadeIn shadow-sm">
             <div className="bg-violet-100 p-2 rounded-full">
                <ClipboardList className="w-6 h-6 text-violet-600" />
             </div>
             <div>
               <h3 className="font-bold text-violet-900">Registro de Escaneo</h3>
               <p className="text-xs text-violet-700">Arma tus grupos de Contenedores y Paquetes.</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-4">
              
              {appMode === 'VERIFY' && (
                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-3 mb-4 animate-fadeIn">
                   <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-100">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-black text-emerald-800 uppercase">Datos de Salida (Obligatorios)</h3>
                   </div>
                   
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Conductor</label>
                     <input type="text" value={verifyDriver} onChange={e => setVerifyDriver(e.target.value)} className="w-full text-sm p-2 bg-white text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 uppercase font-semibold placeholder:text-slate-400" placeholder="Nombre Conductor" />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Remolque</label>
                        <input type="text" value={verifyTrailer} onChange={e => setVerifyTrailer(e.target.value)} className="w-full text-sm p-2 bg-white text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 uppercase font-semibold placeholder:text-slate-400" placeholder="Placa/Num" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sello</label>
                        <input type="text" value={verifySeal} onChange={e => setVerifySeal(e.target.value)} className="w-full text-sm p-2 bg-white text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 uppercase font-semibold placeholder:text-slate-400" placeholder="Num Sello" />
                      </div>
                   </div>
                   <div className="mt-2 text-[10px] text-emerald-600 font-medium bg-emerald-50 p-2 rounded">
                      Verificador Responsable: <span className="font-bold">{sessionUser}</span>
                   </div>
                </div>
              )}

              {appMode !== 'CARTA_PORTE' && appMode !== 'EXIT_TICKET' && (
                <ScannerInput 
                  currentCodes={activeCodes}
                  onAddCode={handleAddCode}
                  onClear={handleClearCodes}
                  onRemoveCode={handleRemoveCode}
                  onEditCode={handleEditCode}
                />
              )}
              
              {appMode === 'REGISTER' && (
                <ControlPanel 
                  docType={docType} setDocType={setDocType}
                  docNumber={docNumber} setDocNumber={setDocNumber}
                  bultos={bultos} setBultos={setBultos}
                  serviceType={serviceType} setServiceType={setServiceType}
                  region={region} setRegion={setRegion}
                  onSave={handleSaveGroup}
                  disabled={activeCodes.length === 0}
                />
              )}

              {appMode === 'CARTA_PORTE' && (
                <CartaPorteForm 
                   rfcOperador={rfcOperador} setRfcOperador={setRfcOperador}
                   licencia={licencia} setLicencia={setLicencia}
                   operadorName={operadorName} setOperadorName={setOperadorName}
                   numEconomico={numEconomico} setNumEconomico={setNumEconomico}
                   confVehic={confVehic} setConfVehic={setConfVehic}
                   placa={placa} setPlaca={setPlaca}
                   ano={ano} setAno={setAno}
                   poliza={poliza} setPoliza={setPoliza}
                   seguro={seguro} setSeguro={setSeguro}
                   peso={peso} setPeso={setPeso}
                   distribuidora={distribuidora} setDistribuidora={setDistribuidora}
                   proveedorNum={proveedorNum} setProveedorNum={setProveedorNum}
                   
                   serviceType={serviceType} setServiceType={setServiceType}
                   region={region} setRegion={setRegion}
                   onSave={handleSaveCartaPorte}
                   
                   catalogs={catalogs}
                />
              )}

              {appMode === 'EXIT_TICKET' && (
                <ExitTicketForm
                  operadorName={operadorName} setOperadorName={setOperadorName}
                  placa={placa} setPlaca={setPlaca}
                  
                  entryDate={entryDate} setEntryDate={setEntryDate}
                  entryTime={entryTime} setEntryTime={setEntryTime}
                  exitDate={exitDate} setExitDate={setExitDate}
                  exitTime={exitTime} setExitTime={setExitTime}
                  isLoaded={isLoaded} setIsLoaded={setIsLoaded}
                  loadPercent={loadPercent} setLoadPercent={setLoadPercent}
                  exitSeal={exitSeal} setExitSeal={setExitSeal}

                  catalogs={catalogs}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <HistoryTable 
              records={records} 
              accessToken={accessToken} 
              onLoginRequest={handleLogin} 
              masterSheetId={masterSheetId}
            />
          </div>
          
        </div>
      </main>

      <footer className="mt-8 py-6 text-center border-t border-slate-200/60">
         <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase flex items-center justify-center gap-1">
           <Code className="w-3 h-3 text-slate-300" />
           Sistema diseñado por <span className="font-black text-slate-500">Eddie Rosse</span>
         </p>
      </footer>
    </div>
  );
};

export default App;
