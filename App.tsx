import React, { useState, useCallback, useEffect } from 'react';
import { ScannerInput } from './components/ScannerInput';
import { ControlPanel } from './components/ControlPanel';
import { HistoryTable } from './components/HistoryTable';
import { CartaPorteForm } from './components/CartaPorteForm';
import { ScanRecord, ServiceType, DocType, Region, GoogleUser, RecordCategory } from './types';
import { PackageCheck, ClipboardCheck, ClipboardList, LogIn, UserCircle, LogOut, Settings, Truck, AlertTriangle, Code } from 'lucide-react';

// --- CONFIGURACIÓN HARDCODED (SIN LOGIN) ---
// Pega aquí tu URL de Web App de Google Apps Script (debe terminar en /exec)
// Ejemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
const GOOGLE_SCRIPT_URL = ""; 

declare global {
  interface Window {
    google: any;
  }
}

type AppMode = 'REGISTER' | 'VERIFY' | 'CARTA_PORTE';

const App: React.FC = () => {
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
  
  // New State for Foraneo Provider
  const [distribuidora, setDistribuidora] = useState('');
  const [proveedorNum, setProveedorNum] = useState('');

  // Assignment State (Shared)
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DOMICILIO);
  const [region, setRegion] = useState<Region>(Region.FORANEO);
  
  // Data State
  const [records, setRecords] = useState<ScanRecord[]>([]);

  // --- GOOGLE AUTH & SETTINGS STATE ---
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [clientId, setClientId] = useState<string>('');
  
  // Initialize masterSheetId with the hardcoded URL if available
  const [masterSheetId, setMasterSheetId] = useState<string>(GOOGLE_SCRIPT_URL);

  // Initialize Logic
  useEffect(() => {
    // Load Settings
    const savedClientId = localStorage.getItem('logiscan_client_id');
    if (savedClientId) setClientId(savedClientId);
    
    // Only load from localStorage if we haven't hardcoded the URL
    if (!GOOGLE_SCRIPT_URL) {
      const savedSheetId = localStorage.getItem('logiscan_master_sheet_id');
      if (savedSheetId) setMasterSheetId(savedSheetId);
    }

    // Init Google (Only needed if NOT using hardcoded URL)
    if (!GOOGLE_SCRIPT_URL) {
      const initClient = () => {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
          console.log("Google Identity Services loaded");
        } else {
          setTimeout(initClient, 500);
        }
      };
      initClient();
    }
  }, []);

  const handleSettings = () => {
    // If hardcoded, alert the user instead of letting them change it easily
    if (GOOGLE_SCRIPT_URL) {
      alert("⚠️ MODO AUTOMÁTICO ACTIVO ⚠️\n\nEl sistema está configurado internamente para sincronizar con la hoja central.\n\nNo es necesario configurar nada.");
      return;
    }

    const input = prompt(
      "CONFIGURACIÓN DE CONEXIÓN\n\n" +
      "OPCIÓN A (Sin Login):\nPega la URL de la Web App de Apps Script.\n\n" +
      "OPCIÓN B (Con Login):\nPega el ID de la hoja de cálculo.", 
      masterSheetId
    );

    if (input !== null) {
      const cleanVal = input.trim();
      setMasterSheetId(cleanVal);
      localStorage.setItem('logiscan_master_sheet_id', cleanVal);
      
      if(cleanVal.startsWith('https://')) {
        alert("✅ Modo Automático Configurado.");
      } else if (cleanVal) {
        alert("✅ ID Configurado. Requiere Login.");
      } else {
        alert("🗑️ Configuración borrada.");
      }
    }
  };

  const handleLogin = () => {
    let currentClientId = clientId;

    if (!currentClientId) {
      const input = prompt("Ingresa tu Google Client ID:");
      if (!input) return;
      currentClientId = input.trim();
      setClientId(currentClientId);
      localStorage.setItem('logiscan_client_id', currentClientId);
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: currentClientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile',
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          setAccessToken(tokenResponse.access_token);
          fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          })
          .then(res => res.json())
          .then(data => {
            setUser({
              name: data.name,
              email: data.email,
              picture: data.picture
            });
          });
        }
      },
    });
    
    setTokenClient(client);
    client.requestAccessToken();
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    if (window.google) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('Access token revoked');
      });
    }
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
      setRecords(prevRecords => {
        let found = false;
        const updatedRecords = prevRecords.map(record => {
          if (record.status === 'PENDIENTE') {
            if (record.huCode === code || record.providerCode === code) {
              found = true;
              return { ...record, status: 'VERIFICADO', verifiedAt: Date.now() } as ScanRecord;
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
        // DUPLICATE LOGIC: If code exists, remove it (toggle off)
        if (prev.includes(code)) {
          playDeleteSound();
          return prev.filter(c => c !== code);
        }
        // If code doesn't exist, add it
        playSuccessSound();
        return [...prev, code];
      });
    }
  }, [appMode]);

  const handleRemoveCode = useCallback((index: number) => {
    setActiveCodes(prev => prev.filter((_, i) => i !== index));
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
    
  }, [activeCodes, docType, docNumber, bultos, serviceType]);

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
      cp_proveedorNum: region === Region.FORANEO ? proveedorNum : ''
    };

    setRecords(prev => [...prev, newRecord]);
    playSuccessSound();
    alert("Carta Porte guardada para " + storeLabel);

    setRfcOperador('');
    setLicencia('');
    setOperadorName('');
    setPlaca('');
    setDistribuidora('');
    setProveedorNum('');
  }, [rfcOperador, licencia, operadorName, numEconomico, confVehic, placa, ano, poliza, seguro, peso, distribuidora, proveedorNum, serviceType, region]);

  const isScriptMode = masterSheetId.startsWith('https://');
  // If we have a hardcoded URL, we never show the login button
  const showLoginButton = !GOOGLE_SCRIPT_URL && !isScriptMode && !user;
  const showUserMenu = !GOOGLE_SCRIPT_URL && !isScriptMode && user;

  // Header Color Logic
  const getHeaderColor = () => {
    switch (appMode) {
      case 'REGISTER': return 'bg-violet-700 border-violet-800'; // Purple
      case 'VERIFY': return 'bg-emerald-600 border-emerald-700'; // Green
      case 'CARTA_PORTE': return 'bg-amber-500 border-amber-600'; // Yellow
      default: return 'bg-white border-slate-200';
    }
  };

  const getHeaderTextColor = () => {
     return appMode === 'CARTA_PORTE' ? 'text-slate-900' : 'text-white';
  };

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
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleSettings} 
                className={`p-2 rounded-lg transition-colors hover:bg-white/20 ${getHeaderTextColor()}`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {showLoginButton && (
                <button onClick={handleLogin} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white transition-colors">
                  <LogIn className="w-4 h-4" />
                </button>
              )}
              {showUserMenu && user && (
                 <img src={user.picture} className="w-8 h-8 rounded-full border-2 border-white/50 cursor-pointer hover:scale-105 transition-transform" alt="User" onClick={handleLogout}/>
              )}

              {/* Desktop Mode Switcher */}
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
             <button onClick={() => setAppMode('REGISTER')} className={`flex-1 py-2 text-center rounded-lg text-xs font-bold border shadow-sm transition-all ${appMode === 'REGISTER' ? 'bg-violet-100 border-violet-200 text-violet-800' : 'bg-white/90 border-transparent text-slate-500'}`}>Registro</button>
             <button onClick={() => setAppMode('CARTA_PORTE')} className={`flex-1 py-2 text-center rounded-lg text-xs font-bold border shadow-sm transition-all ${appMode === 'CARTA_PORTE' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white/90 border-transparent text-slate-500'}`}>Carta Porte</button>
             <button onClick={() => setAppMode('VERIFY')} className={`flex-1 py-2 text-center rounded-lg text-xs font-bold border shadow-sm transition-all ${appMode === 'VERIFY' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-white/90 border-transparent text-slate-500'}`}>Verificar</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        
        {/* Status Banners */}
        {appMode === 'VERIFY' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-4 animate-fadeIn shadow-sm">
             <div className="bg-emerald-100 p-2 rounded-full">
                <ClipboardCheck className="w-6 h-6 text-emerald-600" />
             </div>
             <div>
               <h3 className="font-bold text-emerald-900">Modo Verificación</h3>
               <p className="text-xs text-emerald-700">Escanea para confirmar salida.</p>
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
               <p className="text-xs text-amber-800">Datos del Chofer y Vehículo.</p>
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
              
              {appMode !== 'CARTA_PORTE' && (
                <ScannerInput 
                  currentCodes={activeCodes}
                  onAddCode={handleAddCode}
                  onClear={handleClearCodes}
                  onRemoveCode={handleRemoveCode}
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
