
import React, { useState, useCallback, useEffect } from 'react';
import { ScannerInput } from './components/ScannerInput';
import { ControlPanel } from './components/ControlPanel';
import { HistoryTable } from './components/HistoryTable';
import { CartaPorteForm } from './components/CartaPorteForm';
import { ExitTicketForm } from './components/ExitTicketForm';
import { ScanRecord, ServiceType, DocType, Region, GoogleUser, RecordCategory, CatalogData, RecordStatus } from './types';
import { PackageCheck, ClipboardList, Settings, Truck, Code, ClipboardCheck, Lock, Loader2, LogOut, FileCheck } from 'lucide-react';

// --- CONFIGURACIÓN ---
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
  // Trailer 1
  const [isLoaded, setIsLoaded] = useState('SI');
  const [loadPercent, setLoadPercent] = useState('0%');
  const [exitSeal, setExitSeal] = useState('');
  // Trailer 2
  const [placa2, setPlaca2] = useState('');
  const [isLoaded2, setIsLoaded2] = useState('NO');
  const [loadPercent2, setLoadPercent2] = useState('0%');
  const [exitSeal2, setExitSeal2] = useState('');

  // --- VERIFICATION STATE ---
  const [verifyDriver, setVerifyDriver] = useState('');
  const [verifyTrailer, setVerifyTrailer] = useState('');
  const [verifySeal, setVerifySeal] = useState('');

  // Assignment State
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DOMICILIO);
  const [region, setRegion] = useState<Region>(Region.FORANEO);
  
  // Data State
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogData>({ drivers: [], units: [] });

  const [masterSheetId, setMasterSheetId] = useState<string>(GOOGLE_SCRIPT_URL);

  // --- PERSISTENCIA LOCAL ---
  useEffect(() => {
    if (sessionUser) {
      const saved = localStorage.getItem(`logiscan_records_${sessionUser}`);
      if (saved) {
        try {
          setRecords(JSON.parse(saved));
        } catch (e) {
          console.error("Error al cargar persistencia", e);
        }
      }
    }
  }, [sessionUser]);

  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem(`logiscan_records_${sessionUser}`, JSON.stringify(records));
    }
  }, [records, sessionUser]);

  useEffect(() => {
    const savedMaster = localStorage.getItem('logiscan_master_sheet_id');
    if (savedMaster) setMasterSheetId(savedMaster);
  }, []);

  const handleSettings = () => {
    const input = prompt("URL del Script:", masterSheetId);
    if (input !== null) {
      const cleanVal = input.trim();
      setMasterSheetId(cleanVal);
      localStorage.setItem('logiscan_master_sheet_id', cleanVal);
    }
  };

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
        setCatalogs({
          drivers: data.drivers || [],
          units: data.units || []
        });
      }
    } catch (e) {
      console.error("Error fetching catalogs", e);
    }
  };

  const performLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) return;
    setIsLoggingIn(true);
    try {
      const response = await fetch(masterSheetId, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', username: loginUser, password: loginPass })
      });
      const data = await response.json();
      if (data.result === 'success') {
        setSessionUser(data.name);
        fetchCatalogs();
      } else {
        alert("Acceso Denegado");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("¿Cerrar sesión? Los datos no sincronizados se mantendrán localmente para este usuario.")) {
      setSessionUser('');
      setLoginPass('');
    }
  };

  const onSyncSuccess = useCallback(() => {
    setRecords([]);
    if (sessionUser) {
      localStorage.removeItem(`logiscan_records_${sessionUser}`);
    }
  }, [sessionUser]);

  const playSuccessSound = () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playErrorSound = () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.type = 'sawtooth';
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const handleAddCode = useCallback((code: string) => {
    // 1. DUPLICATE CHECK (GLOBAL)
    // Evitar agregar si ya existe en la lista local actual
    const isDuplicateLocal = records.some(r => r.huCode === code || r.providerCode === code);
    
    if (appMode === 'REGISTER') {
      if (isDuplicateLocal) {
        playErrorSound();
        alert(`⚠️ DUPLICADO: El código ${code} ya está registrado en memoria.`);
        return;
      }
      // También checar en la lista de escaneo actual antes de agregarlo
      if (activeCodes.includes(code)) {
         playErrorSound();
         return; // Ya está en el staging
      }
      
      setActiveCodes(prev => (playSuccessSound(), [...prev, code]));
    }
    else if (appMode === 'VERIFY') {
      if (!verifyTrailer || !verifySeal || !verifyDriver) {
        alert("Llena datos de salida primero");
        return;
      }
      // En modo verificar, BUSCAMOS el existente y lo actualizamos
      setRecords(prev => {
        let found = false;
        const updated = prev.map(r => {
          if (r.status === 'PENDIENTE' && (r.huCode === code || r.providerCode === code)) {
            found = true;
            return { 
              ...r, 
              status: 'VERIFICADO' as RecordStatus, 
              verifiedAt: Date.now(), 
              verifierName: sessionUser,
              departureDriver: verifyDriver,
              departureTrailer: verifyTrailer,
              departureSeal: verifySeal 
            } as ScanRecord;
          }
          return r;
        });
        
        if (found) {
          playSuccessSound();
        } else {
          // Si no se encuentra como pendiente, puede que ya esté verificado o no exista
          const alreadyVerified = prev.some(r => r.status === 'VERIFICADO' && (r.huCode === code || r.providerCode === code));
          if (alreadyVerified) {
            playErrorSound();
            alert("Este código YA fue verificado anteriormente.");
          } else {
            playErrorSound();
            alert("Código no encontrado en pendientes.");
          }
        }
        return updated;
      });
      setActiveCodes([]); 
    }
  }, [appMode, sessionUser, verifyDriver, verifyTrailer, verifySeal, records, activeCodes]);

  const handleSaveGroup = useCallback((storeNumber: string) => {
    if (activeCodes.length === 0) return;
    const providerCode = activeCodes[0];
    const lpCodes = activeCodes.slice(1);
    const storeLabel = `${serviceType} ${storeNumber}`;
    const newRecords = (lpCodes.length > 0 ? lpCodes : ['SIN_LP']).map(lp => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'PENDIENTE' as RecordStatus,
      recordCategory: 'SCAN' as RecordCategory,
      scannerName: sessionUser,
      docType,
      docNumber,
      bultos,
      storeLabel,
      destination: 'PAQUETERÍA',
      providerCode,
      huCode: lp
    }));
    setRecords(prev => [...prev, ...newRecords]);
    setActiveCodes([]);
    setDocNumber('');
    setBultos('');
  }, [activeCodes, docType, docNumber, bultos, serviceType, sessionUser]);

  const handleSaveCartaPorte = useCallback((storeNumber: string) => {
    if(!rfcOperador || !placa) return alert("RFC y Placa requeridos");
    const newRecord: ScanRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'PENDIENTE' as RecordStatus,
      recordCategory: 'CARTA_PORTE',
      scannerName: sessionUser,
      storeLabel: `${serviceType} ${storeNumber}`,
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
      cp_distribuidora: distribuidora,
      cp_proveedorNum: proveedorNum,
      cp_entryDate: entryDate,
      cp_entryTime: entryTime,
      cp_exitDate: exitDate,
      cp_exitTime: exitTime,
      cp_isLoaded: isLoaded,
      cp_loadPercent: loadPercent,
      cp_exitSeal: exitSeal,
      cp_placa2: placa2,
      cp_isLoaded2: isLoaded2,
      cp_loadPercent2: loadPercent2,
      cp_exitSeal2: exitSeal2
    };
    setRecords(prev => [...prev, newRecord]);
    playSuccessSound();
    alert("Carta Porte Guardada Localmente");
    setRfcOperador(''); setLicencia(''); setOperadorName(''); setPlaca('');
  }, [rfcOperador, licencia, operadorName, numEconomico, confVehic, placa, ano, poliza, seguro, peso, distribuidora, proveedorNum, entryDate, entryTime, exitDate, exitTime, isLoaded, loadPercent, exitSeal, placa2, isLoaded2, loadPercent2, exitSeal2, serviceType, sessionUser]);

  // NUEVAS FUNCIONES DE EDICIÓN Y BORRADO
  const handleDeleteRecord = useCallback((id: string) => {
    if (confirm("¿Seguro que deseas eliminar este registro?")) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  }, []);

  const handleUpdateRecord = useCallback((updatedRecord: ScanRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  }, []);

  const getHeaderColor = () => {
    switch (appMode) {
      case 'REGISTER': return 'bg-violet-700 border-violet-800'; 
      case 'VERIFY': return 'bg-emerald-600 border-emerald-700'; 
      case 'CARTA_PORTE': return 'bg-amber-500 border-amber-600'; 
      case 'EXIT_TICKET': return 'bg-blue-600 border-blue-700';
      default: return 'bg-white border-slate-200';
    }
  };

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4"><button onClick={handleSettings} className="p-2 text-slate-500 hover:text-white"><Settings className="w-5 h-5" /></button></div>
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
           <div className="bg-violet-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="w-10 h-10 text-violet-600" /></div>
           <h1 className="text-2xl font-black text-slate-800 mb-2">LogiScan</h1>
           <form onSubmit={performLogin} className="space-y-4">
             <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" placeholder="Usuario" />
             <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" placeholder="Contraseña" />
             <button type="submit" disabled={isLoggingIn} className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2">
               {isLoggingIn ? <Loader2 className="animate-spin" /> : "ENTRAR"}
             </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 flex flex-col">
      <header className={`border-b sticky top-0 z-20 shadow-md transition-colors ${getHeaderColor()}`}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center gap-2 text-white"><PackageCheck /> <div><h1 className="text-xl font-black">LogiScan</h1><p className="text-[10px] opacity-80">Op: {sessionUser}</p></div></div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="p-2 text-white hover:bg-white/20 rounded-lg"><LogOut className="w-5 h-5" /></button>
            <div className="hidden md:flex bg-black/20 p-1 rounded-xl gap-1">
              {['REGISTER', 'CARTA_PORTE', 'EXIT_TICKET', 'VERIFY'].map(mode => (
                <button key={mode} onClick={() => setAppMode(mode as AppMode)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${appMode === mode ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'}`}>
                  {mode === 'REGISTER' ? 'Registro' : mode === 'CARTA_PORTE' ? 'Carta Porte' : mode === 'EXIT_TICKET' ? 'Hoja Salida' : 'Verificar'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            {appMode === 'VERIFY' && (
              <div className="bg-white p-4 rounded-xl border-emerald-200 shadow-sm space-y-3">
                 <input type="text" value={verifyDriver} onChange={e => setVerifyDriver(e.target.value)} className="w-full text-sm p-2 border rounded-lg" placeholder="Conductor Salida" />
                 <div className="grid grid-cols-2 gap-2">
                   <input type="text" value={verifyTrailer} onChange={e => setVerifyTrailer(e.target.value)} className="w-full text-sm p-2 border rounded-lg" placeholder="Placa/Eco" />
                   <input type="text" value={verifySeal} onChange={e => setVerifySeal(e.target.value)} className="w-full text-sm p-2 border rounded-lg" placeholder="Sello" />
                 </div>
              </div>
            )}
            {appMode !== 'CARTA_PORTE' && appMode !== 'EXIT_TICKET' && (
              <ScannerInput currentCodes={activeCodes} onAddCode={handleAddCode} onClear={() => setActiveCodes([])} onRemoveCode={i => setActiveCodes(p => p.filter((_, idx) => idx !== i))} />
            )}
            {appMode === 'REGISTER' && <ControlPanel docType={docType} setDocType={setDocType} docNumber={docNumber} setDocNumber={setDocNumber} bultos={bultos} setBultos={setBultos} serviceType={serviceType} setServiceType={setServiceType} region={region} setRegion={setRegion} onSave={handleSaveGroup} disabled={activeCodes.length === 0} />}
            
            {appMode === 'CARTA_PORTE' && <CartaPorteForm rfcOperador={rfcOperador} setRfcOperador={setRfcOperador} licencia={licencia} setLicencia={setLicencia} operadorName={operadorName} setOperadorName={setOperadorName} numEconomico={numEconomico} setNumEconomico={setNumEconomico} confVehic={confVehic} setConfVehic={setConfVehic} placa={placa} setPlaca={setPlaca} ano={ano} setAno={setAno} poliza={poliza} setPoliza={setPoliza} seguro={seguro} setSeguro={setSeguro} peso={peso} setPeso={setPeso} distribuidora={distribuidora} setDistribuidora={setDistribuidora} proveedorNum={proveedorNum} setProveedorNum={setProveedorNum} serviceType={serviceType} setServiceType={setServiceType} region={region} setRegion={setRegion} onSave={handleSaveCartaPorte} catalogs={catalogs} />}
            
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
                placa2={placa2} setPlaca2={setPlaca2}
                isLoaded2={isLoaded2} setIsLoaded2={setIsLoaded2}
                loadPercent2={loadPercent2} setLoadPercent2={setLoadPercent2}
                exitSeal2={exitSeal2} setExitSeal2={setExitSeal2}
                catalogs={catalogs} 
                scriptUrl={masterSheetId}
              />
            )}
          </div>
          <div className="lg:col-span-8">
            <HistoryTable 
              records={records} 
              accessToken={null} 
              onLoginRequest={() => setSessionUser('')} 
              masterSheetId={masterSheetId} 
              onSyncSuccess={onSyncSuccess}
              onDeleteRecord={handleDeleteRecord}
              onUpdateRecord={handleUpdateRecord}
            />
          </div>
        </div>
      </main>
      <footer className="mt-auto py-6 text-center border-t text-[10px] text-slate-400 font-medium">LogiScan Systems - Eddie Rosse</footer>
    </div>
  );
};

export default App;
