import React, { useState, useCallback, useEffect } from 'react';
import { ScannerInput } from './components/ScannerInput';
import { ControlPanel } from './components/ControlPanel';
import { HistoryTable } from './components/HistoryTable';
import { ScanRecord, ServiceType, DocType, Region, GoogleUser } from './types';
import { PackageCheck, ClipboardCheck, ClipboardList, LogIn, UserCircle, LogOut } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

type AppMode = 'REGISTER' | 'VERIFY';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('REGISTER');

  // Scanner State
  const [activeCodes, setActiveCodes] = useState<string[]>([]);
  
  // Document Configuration State
  const [docType, setDocType] = useState<DocType>('EMBARQUE');
  const [docNumber, setDocNumber] = useState<string>('');
  const [bultos, setBultos] = useState<string>('');

  // Assignment State
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DOMICILIO);
  const [region, setRegion] = useState<Region>(Region.FORANEO);
  
  // Data State
  const [records, setRecords] = useState<ScanRecord[]>([]);

  // --- GOOGLE AUTH STATE ---
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [clientId, setClientId] = useState<string>('');

  // Initialize Google Token Client
  useEffect(() => {
    const savedClientId = localStorage.getItem('logiscan_client_id');
    if (savedClientId) setClientId(savedClientId);

    const initClient = () => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        // We defer client creation until we click login to ensure ClientID is present
        console.log("Google Identity Services loaded");
      } else {
        setTimeout(initClient, 500);
      }
    };
    initClient();
  }, []);

  const handleLogin = () => {
    let currentClientId = clientId;

    if (!currentClientId) {
      const input = prompt("Para conectar con Google, necesitas un 'Client ID'.\n\nSi no lo tienes, debes crearlo en Google Cloud Console.\n\nIngresa tu Client ID aquí:");
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
          
          // Fetch User Profile
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
    // Request permission
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

  const handleAddCode = useCallback((code: string) => {
    if (appMode === 'VERIFY') {
      // IMMEDIATE ACTION MODE
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

        if (found) {
          playSuccessSound();
        } else {
          const alreadyVerified = prevRecords.some(r => (r.huCode === code || r.providerCode === code) && r.status === 'VERIFICADO');
          if (!alreadyVerified) {
             playErrorSound();
          }
        }
        return updatedRecords;
      });
      setActiveCodes([]); 
    } else {
      // REGISTRATION MODE
      setActiveCodes(prev => {
        if (prev.includes(code)) return prev;
        if (prev.length >= 20) return prev; 
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

    if (lpCodes.length > 0) {
      lpCodes.forEach(lp => {
        newRecords.push({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          status: 'PENDIENTE',
          docType,
          docNumber,
          bultos,
          storeLabel,
          destination: 'PAQUETERÍA',
          huCode: lp,
          providerCode: providerCode
        });
      });
    } else {
       newRecords.push({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          status: 'PENDIENTE',
          docType,
          docNumber,
          bultos,
          storeLabel,
          destination: 'PAQUETERÍA',
          huCode: 'SIN_LP',
          providerCode: providerCode
        });
    }

    setRecords(prev => [...prev, ...newRecords]);
    setActiveCodes([]);
    
  }, [activeCodes, docType, docNumber, bultos, serviceType]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className={`border-b sticky top-0 z-20 shadow-sm transition-colors ${appMode === 'VERIFY' ? 'bg-indigo-900 border-indigo-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className={`${appMode === 'VERIFY' ? 'bg-indigo-700' : 'bg-blue-600'} p-2 rounded-lg`}>
                <PackageCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight ${appMode === 'VERIFY' ? 'text-white' : 'text-slate-900'}`}>LogiScan</h1>
                <p className={`text-xs font-medium ${appMode === 'VERIFY' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {appMode === 'VERIFY' ? 'Modo Verificación de Salida' : 'Generador de Hoja de Ruta'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Google Login / User Profile */}
              {!user ? (
                <button 
                  onClick={handleLogin}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    appMode === 'VERIFY' 
                    ? 'bg-indigo-800 border-indigo-700 text-indigo-100 hover:bg-indigo-700' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Conectar Google</span>
                </button>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                   appMode === 'VERIFY' 
                    ? 'bg-indigo-800 border-indigo-700 text-indigo-100' 
                    : 'bg-white border-green-200 text-slate-700'
                }`}>
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <UserCircle className="w-5 h-5" />
                  )}
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] opacity-70">Conectado como</span>
                    <span className="text-xs font-bold truncate max-w-[80px] sm:max-w-[120px]">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="ml-2 p-1 hover:bg-black/10 rounded-full" title="Cerrar sesión">
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Mode Switcher */}
              <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                <button
                  onClick={() => setAppMode('REGISTER')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    appMode === 'REGISTER' 
                      ? 'bg-white text-blue-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ClipboardList className="w-3 h-3" />
                  <span className="hidden sm:inline">Registro</span>
                </button>
                <button
                  onClick={() => setAppMode('VERIFY')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    appMode === 'VERIFY' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ClipboardCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Verificación</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {appMode === 'VERIFY' && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center gap-4">
             <div className="bg-indigo-100 p-3 rounded-full">
               <ClipboardCheck className="w-6 h-6 text-indigo-600" />
             </div>
             <div>
               <h3 className="font-bold text-indigo-900">Modo de Verificación Activo</h3>
               <p className="text-sm text-indigo-700">Escanea un código (HU o Contenedor) para confirmar su salida a ruta.</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-4">
              <ScannerInput 
                currentCodes={activeCodes}
                onAddCode={handleAddCode}
                onClear={handleClearCodes}
                onRemoveCode={handleRemoveCode}
              />
              
              {appMode === 'REGISTER' && (
                <>
                  <ControlPanel 
                    docType={docType}
                    setDocType={setDocType}
                    docNumber={docNumber}
                    setDocNumber={setDocNumber}
                    bultos={bultos}
                    setBultos={setBultos}
                    serviceType={serviceType}
                    setServiceType={setServiceType}
                    region={region}
                    setRegion={setRegion}
                    onSave={handleSaveGroup}
                    disabled={activeCodes.length === 0}
                  />
                  <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-yellow-800">
                    <p className="font-bold mb-1">Nota de Registro:</p>
                    <ul className="list-disc list-inside opacity-90">
                      <li>El primer código es el <strong>Proveedor (Contenedor)</strong>.</li>
                      <li>Los siguientes códigos son <strong>HU (Paquetes)</strong>.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <HistoryTable records={records} accessToken={accessToken} onLoginRequest={handleLogin} />
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default App;