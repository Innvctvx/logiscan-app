import React, { useState, useCallback, useEffect } from 'react';
import { ScannerInput } from './components/ScannerInput';
import { ControlPanel } from './components/ControlPanel';
import { HistoryTable } from './components/HistoryTable';
import { CartaPorteForm } from './components/CartaPorteForm';
import { ExitTicketForm } from './components/ExitTicketForm';
import { CartaPorteSelector } from './components/CartaPorteSelector';
import { ScanRecord, ServiceType, DocType, Region, GoogleUser, RecordCategory, CatalogData, RecordStatus, MasterRecord, STORE_NAMES } from './types';
import { PackageCheck, ClipboardList, Settings, Truck, Code, ClipboardCheck, Lock, Loader2, LogOut, FileCheck, RefreshCw, Database, CheckCircle2, PenLine, Zap } from 'lucide-react';
import { playSuccessSound, playErrorSound } from './services/soundService';
import { api } from './services/api';

// --- CONFIGURACIÓN ---
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKKKEwil8Byd3eMwgQgd9k_jN1g5yjdNO5pghkaGWszeqcrav04-3JJIHiOFXdmEwc/exec"; 

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
  // Nuevo: Store de Salida (FIJO)
  const [exitStore, setExitStore] = useState('5'); // Valor por defecto fijo

  // --- VERIFICATION STATE ---
  const [verifyDriver, setVerifyDriver] = useState('');
  const [verifyTrailer, setVerifyTrailer] = useState('');
  const [verifySeal, setVerifySeal] = useState('');
  const [isVerifyScanning, setIsVerifyScanning] = useState(false); // NUEVO ESTADO PARA CONTROLAR FOCO
  
  // NEW: Master Records for Validation
  const [masterRecords, setMasterRecords] = useState<MasterRecord[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);

  // Assignment State
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DOMICILIO);
  const [region, setRegion] = useState<Region>(Region.FORANEO);
  
  // Data State
  const [records, setRecords] = useState<ScanRecord[]>([]);
  // PERSISTENCE FLAG: Critical to prevent overwriting local storage with empty array on load
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const [catalogs, setCatalogs] = useState<CatalogData>({ drivers: [], units: [] });

  const [masterSheetId, setMasterSheetId] = useState<string>(DEFAULT_SCRIPT_URL);

  // --- AUTOFILL SELECTOR STATE ---
  const [showCPSelector, setShowCPSelector] = useState(false);
  const [cpSelectorMode, setCpSelectorMode] = useState<'VERIFY' | 'EXIT' | null>(null);

  // --- PERSISTENCIA LOCAL (ARREGLADA) ---
  
  // 1. Cargar Configuración Global
  useEffect(() => {
    const savedMaster = localStorage.getItem('logiscan_master_sheet_id');
    if (savedMaster) setMasterSheetId(savedMaster);
  }, []);

  // 2. Cargar Datos del Usuario (Solo una vez al loguearse)
  useEffect(() => {
    if (sessionUser && !isStorageLoaded) {
      const saved = localStorage.getItem(`logiscan_records_${sessionUser}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log("Restaurando sesión para", sessionUser, parsed.length, "registros.");
          setRecords(parsed);
        } catch (e) {
          console.error("Error al cargar persistencia", e);
        }
      } else {
        console.log("No hay datos previos para", sessionUser);
      }
      setIsStorageLoaded(true); // Marcamos como cargado, ahora es seguro guardar
    }
  }, [sessionUser, isStorageLoaded]);

  // 3. Guardar Datos (Solo si ya se cargó la persistencia inicial)
  useEffect(() => {
    if (sessionUser && isStorageLoaded) {
      localStorage.setItem(`logiscan_records_${sessionUser}`, JSON.stringify(records));
    }
  }, [records, sessionUser, isStorageLoaded]);

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
    const data = await api.getCatalogs(masterSheetId);
    if (data.result === 'success') {
      setCatalogs({
        drivers: data.drivers || [],
        units: data.units || []
      });
    }
  };

  const loadMasterData = async () => {
    setIsLoadingMaster(true);
    const response = await api.fetchMasterData(masterSheetId);
    if (response.result === 'success' && response.data) {
      setMasterRecords(response.data);
      alert(`✅ Base de datos actualizada: ${response.data.length} paquetes encontrados en el sistema.`);
    } else {
      alert("⚠️ No se pudo descargar la base de datos. Verifica tu conexión.");
    }
    setIsLoadingMaster(false);
  };

  const performLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) return;
    setIsLoggingIn(true);
    
    // Resetear flag de almacenamiento para que cargue datos del nuevo usuario
    setIsStorageLoaded(false); 
    setRecords([]);

    const data = await api.login(masterSheetId, loginUser, loginPass);
    
    if (data.result === 'success') {
      setSessionUser(data.name);
      fetchCatalogs();
    } else {
      alert("Acceso Denegado: " + (data.error || 'Credenciales inválidas'));
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    if (confirm("¿Cerrar sesión? Los datos no sincronizados se mantendrán en este dispositivo para tu usuario.")) {
      setSessionUser('');
      setLoginPass('');
      setRecords([]);
      setIsStorageLoaded(false); // Resetear para próxima sesión
    }
  };

  const onSyncSuccess = useCallback(() => {
    fetchCatalogs();
  }, [sessionUser]);

  const handleClearMemory = useCallback(() => {
    if (confirm("¿ESTÁS SEGURO?\n\nEsto borrará todos los registros de la memoria del dispositivo. Asegúrate de haberlos subido a Drive primero.")) {
      setRecords([]);
      if (sessionUser) {
        localStorage.removeItem(`logiscan_records_${sessionUser}`);
      }
      playSuccessSound(); // Sonido de confirmación
    }
  }, [sessionUser]);

  // --- LOGICA DE AUTOCOMPLETADO CON SELECTOR ---
  
  const openAutofill = (mode: 'VERIFY' | 'EXIT') => {
    // Verificar si hay registros
    const hasCP = records.some(r => r.recordCategory === 'CARTA_PORTE');
    if (!hasCP) {
      playErrorSound();
      alert("❌ NO HAY DATOS\n\nNo tienes registros de Carta Porte guardados en este dispositivo para importar.");
      return;
    }
    setCpSelectorMode(mode);
    setShowCPSelector(true);
  };

  const handleSelectCartaPorte = (record: ScanRecord) => {
    let importedFields: string[] = [];

    if (cpSelectorMode === 'VERIFY') {
      // Rellenar Verificación
      if (record.cp_operador) { setVerifyDriver(record.cp_operador); importedFields.push("Chofer"); }
      if (record.cp_placa) { setVerifyTrailer(record.cp_placa); importedFields.push("Placa"); }
      if (record.cp_exitSeal) { setVerifySeal(record.cp_exitSeal); importedFields.push("Sello"); }
      
      playSuccessSound();
      if(importedFields.length > 0) {
        alert(`✅ DATOS IMPORTADOS A VERIFICACIÓN:\n\n- ${importedFields.join('\n- ')}`);
      } else {
        alert("⚠️ El registro seleccionado no tenía datos útiles para importar.");
      }

    } else if (cpSelectorMode === 'EXIT') {
      // Rellenar Hoja de Salida
      if (record.cp_operador) { setOperadorName(record.cp_operador); importedFields.push("Operador"); }
      if (record.cp_placa) { setPlaca(record.cp_placa); importedFields.push("Remolque 1"); }
      if (record.cp_placa2) { setPlaca2(record.cp_placa2); importedFields.push("Remolque 2"); }
      
      // Intentar rellenar fechas si existen en la carta porte original
      if (record.cp_entryDate) setEntryDate(record.cp_entryDate);
      if (record.cp_entryTime) setEntryTime(record.cp_entryTime);
      
      // NOTA CORREGIDA: NO SOBRESCRIBIR EL ALMACÉN DE SALIDA
      // El almacén es fijo ("Nuestro Almacén"), no depende del destino del viaje.
      
      playSuccessSound();
      if(importedFields.length > 0) {
         alert(`✅ DATOS IMPORTADOS A HOJA DE SALIDA:\n\n- ${importedFields.join('\n- ')}`);
      } else {
         alert("⚠️ El registro seleccionado no tenía datos para importar.");
      }
    }
    setShowCPSelector(false);
    setCpSelectorMode(null);
  };


  const handleAddCode = useCallback((code: string) => {
    
    // --- LÓGICA DE REGISTRO (FASE 1) ---
    if (appMode === 'REGISTER') {
      // Validar duplicados locales
      const isDuplicateLocal = records.some(r => r.huCode === code || r.providerCode === code);
      if (isDuplicateLocal) {
        playErrorSound();
        alert(`⚠️ DUPLICADO: El código ${code} ya está registrado en memoria.`);
        return;
      }
      if (activeCodes.includes(code)) {
        playErrorSound();
        alert("⚠️ Este código ya está en el grupo actual.");
        return;
      }
      playSuccessSound();
      setActiveCodes(prev => [...prev, code]);
    } 
    
    // --- LÓGICA DE VERIFICACIÓN (FASE 2) ---
    else if (appMode === 'VERIFY') {
      if (!verifyDriver || !verifyTrailer || !verifySeal) {
        playErrorSound();
        alert("⚠️ FALTAN DATOS DE SALIDA\n\nDebes llenar Chofer, Placa y Sello antes de escanear paquetes.");
        return;
      }

      // 1. Buscar en registros locales (recién escaneados pero no subidos)
      const localRecordIndex = records.findIndex(r => 
        (r.huCode === code || r.providerCode === code) && r.recordCategory === 'SCAN'
      );

      if (localRecordIndex !== -1) {
        // Encontrado localmente
        const record = records[localRecordIndex];
        if (record.status === 'VERIFICADO') {
          playErrorSound();
          alert("⚠️ YA VERIFICADO\nEste paquete ya fue marcado como verificado anteriormente.");
          return;
        }

        const updatedRecords = [...records];
        updatedRecords[localRecordIndex] = {
          ...record,
          status: 'VERIFICADO',
          verifiedAt: Date.now(),
          verifierName: sessionUser,
          departureDriver: verifyDriver,
          departureTrailer: verifyTrailer,
          departureSeal: verifySeal
        };
        setRecords(updatedRecords);
        playSuccessSound();
        return;
      }

      // 2. Buscar en MASTER RECORDS (Base de datos descargada)
      const remoteRecord = masterRecords.find(r => r.code === code);

      if (remoteRecord) {
        // EXISTE EN EL SERVIDOR -> Creamos registro de verificación
        playSuccessSound();
        // Creamos un registro local que representa la actualización
        const verificationRecord: ScanRecord = {
          id: crypto.randomUUID(),
          timestamp: Date.now(), // Fecha de verificación
          verifiedAt: Date.now(),
          status: 'VERIFICADO',
          recordCategory: 'SCAN',
          scannerName: "SISTEMA (Previo)", // Indicativo
          verifierName: sessionUser,
          
          storeLabel: remoteRecord.store, // Usamos la tienda donde se encontró
          destination: remoteRecord.store,
          
          // Asignamos el código detectado
          huCode: code.startsWith('Q') || code.startsWith('0') ? code : undefined,
          providerCode: !code.startsWith('Q') && !code.startsWith('0') ? code : undefined,

          // Datos de salida
          departureDriver: verifyDriver,
          departureTrailer: verifyTrailer,
          departureSeal: verifySeal,

          // Campos opcionales vacíos
          docType: 'REMISIÓN',
          docNumber: 'VERIFICACIÓN',
          bultos: '1'
        };

        setRecords(prev => [...prev, verificationRecord]);
        alert(`✅ PAQUETE ENCONTRADO EN ${remoteRecord.store}\nMarcado como verificado exitosamente.`);
      } else {
        // 3. NO ENCONTRADO EN NINGÚN LADO
        playErrorSound();
        const force = confirm(`❌ ERROR CRÍTICO: PAQUETE NO ENCONTRADO\n\nEl código ${code} NO tiene registro de entrada.\n\n¿Desea forzar la verificación como INCIDENCIA?`);
        
        if (force) {
           const forcedRecord: ScanRecord = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            verifiedAt: Date.now(),
            status: 'VERIFICADO', // O 'INCIDENCIA'
            recordCategory: 'SCAN',
            scannerName: "NO REGISTRADO",
            verifierName: sessionUser,
            storeLabel: `${serviceType} ${region === Region.LOCAL ? '98' : '99'} (FORZADO)`, // Default fallback
            destination: 'DESCONOCIDO',
            huCode: code,
            departureDriver: verifyDriver,
            departureTrailer: verifyTrailer,
            departureSeal: verifySeal,
            docNumber: 'SIN_ENTRADA',
            bultos: '1'
          };
          setRecords(prev => [...prev, forcedRecord]);
        }
      }
    }
  }, [appMode, activeCodes, records, sessionUser, verifyDriver, verifyTrailer, verifySeal, masterRecords, serviceType, region]);

  const handleGroupComplete = (storeNumber: string) => {
    if (activeCodes.length === 0) return;

    const timestamp = Date.now();
    
    // --- LÓGICA DE AGRUPAMIENTO JERÁRQUICO ---
    const containerCode = activeCodes[0];
    const childCodes = activeCodes.slice(1);
    
    const newRecords: ScanRecord[] = [];

    if (childCodes.length > 0) {
      childCodes.forEach(child => {
        newRecords.push({
          id: crypto.randomUUID(),
          timestamp,
          status: 'PENDIENTE',
          recordCategory: 'SCAN',
          scannerName: sessionUser,
          docType,
          docNumber,
          bultos,
          storeLabel: `${serviceType} ${storeNumber}`,
          destination: STORE_NAMES[storeNumber] || storeNumber,
          
          huCode: child,            // El Paquete
          providerCode: containerCode // El Contenedor Padre
        });
      });
    } else {
      const isContainer = containerCode.startsWith('Q') || containerCode.startsWith('00');

      newRecords.push({
        id: crypto.randomUUID(),
        timestamp,
        status: 'PENDIENTE',
        recordCategory: 'SCAN',
        scannerName: sessionUser,
        docType,
        docNumber,
        bultos,
        storeLabel: `${serviceType} ${storeNumber}`,
        destination: STORE_NAMES[storeNumber] || storeNumber,
        
        huCode: isContainer ? undefined : containerCode, 
        providerCode: isContainer ? containerCode : undefined
      });
    }

    setRecords(prev => [...prev, ...newRecords]);
    setActiveCodes([]);
    playSuccessSound();
  };

  const handleSaveCartaPorte = (storeNum: string) => {
    // Validaciones explícitas antes de guardar
    if (!rfcOperador) { playErrorSound(); alert("⚠️ Falta el RFC del Operador"); return; }
    if (!operadorName) { playErrorSound(); alert("⚠️ Falta el Nombre del Operador"); return; }
    if (!placa) { playErrorSound(); alert("⚠️ Falta la Placa del Vehículo"); return; }
    
    const newRecord: ScanRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'PENDIENTE',
      recordCategory: 'CARTA_PORTE',
      scannerName: sessionUser,
      storeLabel: `${serviceType} ${storeNum}`,
      destination: STORE_NAMES[storeNum],

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
    alert(`✅ CARTA PORTE GUARDADA LOCALMENTE\n\nTienda: ${STORE_NAMES[storeNum]}\nUnidad: ${placa}\nOperador: ${operadorName}`);
    
    // Opcional: Limpiar campos clave para el siguiente
    setRfcOperador(''); setOperadorName(''); setPlaca('');
  };

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
             <PackageCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">LogiScan 3.0</h1>
          <p className="text-slate-400 font-medium mb-8">Sistema de Control Logístico</p>
          
          <form onSubmit={performLogin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Usuario"
              value={loginUser}
              onChange={e => setLoginUser(e.target.value)}
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex justify-center"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : 'INICIAR SESIÓN'}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
             <button onClick={handleSettings} className="text-xs font-bold text-slate-400 flex items-center gap-1 mx-auto hover:text-slate-600">
               <Settings className="w-3 h-3" /> Configurar Servidor
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-safe">
      {/* Selector Modal */}
      <CartaPorteSelector 
        isOpen={showCPSelector} 
        onClose={() => setShowCPSelector(false)} 
        onSelect={handleSelectCartaPorte} 
        records={records}
      />

      {/* Header */}
      <div className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="px-4 py-3 flex justify-between items-center max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-lg shadow-inner">
              L
            </div>
            <div>
              <h1 className="font-bold leading-none">LogiScan</h1>
              <span className="text-[10px] text-blue-200 font-mono opacity-80">{sessionUser}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
            <LogOut className="w-4 h-4 text-slate-300" />
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-2 pb-2 flex gap-1 max-w-3xl mx-auto overflow-x-auto no-scrollbar">
          <button onClick={() => { setAppMode('REGISTER'); setIsVerifyScanning(false); }} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${appMode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Code className="w-3 h-3" /> Escanear
          </button>
          <button onClick={() => setAppMode('VERIFY')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${appMode === 'VERIFY' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ClipboardCheck className="w-3 h-3" /> Verificar
          </button>
          <button onClick={() => setAppMode('CARTA_PORTE')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${appMode === 'CARTA_PORTE' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Truck className="w-3 h-3" /> Carta Porte
          </button>
          <button onClick={() => setAppMode('EXIT_TICKET')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition-all whitespace-nowrap px-3 ${appMode === 'EXIT_TICKET' ? 'bg-blue-400 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileCheck className="w-3 h-3" /> Salida
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        
        {/* MAIN MODE: REGISTER / SCAN */}
        {appMode === 'REGISTER' && (
          <div className="animate-fadeIn">
             <ScannerInput 
               currentCodes={activeCodes}
               onAddCode={handleAddCode}
               onClear={() => setActiveCodes([])}
               onRemoveCode={(idx) => setActiveCodes(prev => prev.filter((_, i) => i !== idx))}
               onEditCode={(idx, newCode) => setActiveCodes(prev => prev.map((c, i) => i === idx ? newCode : c))}
             />
             <ControlPanel 
               docType={docType} setDocType={setDocType}
               docNumber={docNumber} setDocNumber={setDocNumber}
               bultos={bultos} setBultos={setBultos}
               serviceType={serviceType} setServiceType={setServiceType}
               region={region} setRegion={setRegion}
               onSave={handleGroupComplete}
               disabled={activeCodes.length === 0}
             />
          </div>
        )}

        {/* VERIFICATION MODE */}
        {appMode === 'VERIFY' && (
          <div className="animate-fadeIn space-y-4">
             {/* Master Data Control */}
             <div className="bg-slate-800 text-slate-300 p-4 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                   <Database className="w-5 h-5 text-emerald-400" />
                   <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Base de Datos Maestra</p>
                      <p className="text-sm font-bold text-white">{masterRecords.length} Reg. Cargados</p>
                   </div>
                </div>
                <button 
                  onClick={loadMasterData}
                  disabled={isLoadingMaster}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                   {isLoadingMaster ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                   {masterRecords.length > 0 ? 'ACTUALIZAR' : 'DESCARGAR'}
                </button>
             </div>
             
             {/* VISUALIZACIÓN CONDICIONAL: DATOS MANUALES vs ESCÁNER */}
             {!isVerifyScanning ? (
               <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 transition-all">
                  <div className="flex justify-between items-center mb-4 border-b pb-2 border-emerald-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" /> Datos de Salida (Verificación)
                    </h3>
                    {/* Botón Autocompletar */}
                    <button 
                      onClick={() => openAutofill('VERIFY')} 
                      className="text-[10px] font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3 h-3" /> AUTOCOMPLETAR
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <input 
                      type="text" 
                      value={verifyDriver} 
                      onChange={e => setVerifyDriver(e.target.value)} 
                      placeholder="NOMBRE CHOFER" 
                      className="w-full p-3 bg-white text-slate-900 border border-emerald-100 rounded-lg text-sm uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400" 
                    />
                    <div className="grid grid-cols-2 gap-4">
                       <input 
                        type="text" 
                        value={verifyTrailer} 
                        onChange={e => setVerifyTrailer(e.target.value)} 
                        placeholder="# REMOLQUE" 
                        className="w-full p-3 bg-white text-slate-900 border border-emerald-100 rounded-lg text-sm uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400" 
                      />
                       <input 
                        type="text" 
                        value={verifySeal} 
                        onChange={e => setVerifySeal(e.target.value)} 
                        placeholder="SELLO DE SEGURIDAD" 
                        className="w-full p-3 bg-white text-slate-900 border border-emerald-100 rounded-lg text-sm uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400" 
                      />
                    </div>
                    
                    <button
                      onClick={() => setIsVerifyScanning(true)}
                      disabled={!verifyDriver || !verifyTrailer || !verifySeal}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      CONFIRMAR DATOS Y ESCANEAR
                    </button>
                  </div>
               </div>
             ) : (
               <div className="animate-in slide-in-from-right duration-300">
                  {/* BARRA DE DATOS BLOQUEADOS */}
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4 shadow-sm">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">DATOS CONFIRMADOS:</span>
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase">
                           <span className="bg-emerald-200 px-2 py-0.5 rounded">{verifyTrailer}</span>
                           <span>•</span>
                           <span>{verifySeal}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 mt-1 truncate max-w-[200px]">{verifyDriver}</span>
                     </div>
                     <button 
                        onClick={() => setIsVerifyScanning(false)} 
                        className="flex items-center gap-1 px-3 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm hover:bg-emerald-50"
                     >
                        <PenLine className="w-3.5 h-3.5" /> EDITAR
                     </button>
                  </div>

                  <ScannerInput 
                    currentCodes={[]} // No grouping in verify mode
                    onAddCode={handleAddCode}
                    onClear={() => {}}
                    onRemoveCode={() => {}}
                  />
               </div>
             )}
          </div>
        )}

        {/* CARTA PORTE MODE */}
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

        {/* EXIT TICKET MODE */}
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
            exitStore={exitStore} setExitStore={setExitStore}
            catalogs={catalogs}
            scriptUrl={masterSheetId}
            onRequestAutofill={() => openAutofill('EXIT')}
          />
        )}

        {/* SHARED HISTORY TABLE */}
        <div className="pb-8">
           <HistoryTable 
             records={records} 
             accessToken={null} 
             onLoginRequest={() => {}} 
             masterSheetId={masterSheetId}
             onSyncSuccess={onSyncSuccess}
             onDeleteRecord={(id) => setRecords(prev => prev.filter(r => r.id !== id))}
             onUpdateRecord={(updated) => setRecords(prev => prev.map(r => r.id === updated.id ? updated : r))}
             onClearMemory={handleClearMemory}
           />
        </div>
      </div>
    </div>
  );
};

export default App;