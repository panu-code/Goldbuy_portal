import React, { useState, useEffect } from 'react';
import { DailyStats, SaleRecord, ExtractedData } from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { EntryForm } from './components/EntryForm.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { BonusCalculatorView } from './components/BonusCalculatorView.tsx';
import { InfoView } from './components/InfoView.tsx';
import { UserSelectionScreen } from './components/UserSelectionScreen.tsx';
import { isBonusSale, calculateNormalized14kWeight, calculateBonusAmount } from './components/ValidationUtils.ts';
import { Home, Calculator, CheckCircle, Save, Info, AlertCircle } from 'lucide-react';

// --- CONFIGURATION ---
// IMPORTANT: Replace the placeholder below with the Web App URL you copied from Google Apps Script!
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxxbR7Dx0DSgaJg10dQXeL_s_dPqCSoXgxvG4U4h_-RswcC2lhXnieI6bpGCD8R4QNaXQ/exec"; 

const sendToGoogleSheets = async (data: SaleRecord): Promise<boolean> => {
  // Simplified check for the configured URL.
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn("Google Sheets Webhook URL is not configured.");
    return false;
  }
  try {
    // We can't use 'no-cors' for a real deployment as it hides errors.
    // For the Apps Script webhook, a standard CORS request is needed.
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'cors', 
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });
    
    // Check if the response from Apps Script is successful.
    if (response.ok) {
        const result = await response.json();
        return result.status === 'success';
    }
    return false;

  } catch (error) {
    console.error("Transmission Error:", error);
    return false;
  }
};

// Helper to recalculate stats from scratch
const recalculateStats = (history: SaleRecord[], currentDriverId: string): DailyStats => {
  let totalSales = 0;
  let bonusSalesCount = 0;
  let runningTotalEuro = 0;
  let totalGoldWeightNormalized = 0;
  let totalGoldCost = 0;
  let estimatedBonusEuro = 0;

  // Filter history to only include records for the current driver
  const driverHistory = history.filter(record => record.userId === currentDriverId);

  driverHistory.forEach(record => {
    totalSales += 1;
    runningTotalEuro += record.amountEuro;

    const normalizedSaleWeight = calculateNormalized14kWeight(
      record.weightGoldTotal, 
      record.weightGold8k, 
      record.weightGold18k, 
      record.weightGold22k,
      record.weightGold24k, 
    );

    const isBonus = isBonusSale(
      record.amountEuro, 
      record.weightGoldTotal, 
      record.weightGold8k, 
      record.weightGold18k,
      record.weightGold22k,
      record.weightGold24k, 
    );

    if (isBonus) bonusSalesCount += 1;
    totalGoldWeightNormalized += normalizedSaleWeight;
    if (normalizedSaleWeight > 0) totalGoldCost += record.amountEuro;
    
    estimatedBonusEuro += calculateBonusAmount(
      record.amountEuro, 
      record.weightGoldTotal,
      record.weightGold8k, 
      record.weightGold18k,
      record.weightGold22k, // Corrected from weight22k
      record.weightGold24k, // Corrected from weight24k
    );
  });

  const currentAvgGoldPrice = totalGoldWeightNormalized > 0 
    ? totalGoldCost / totalGoldWeightNormalized 
    : 0;

  return {
    totalSales,
    bonusSalesCount,
    runningTotalEuro,
    totalGoldWeightNormalized,
    totalGoldCost,
    currentAvgGoldPrice,
    estimatedBonusEuro
  };
};

type MainTab = 'dashboard' | 'calculator' | 'info';

const App: React.FC = () => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(() => {
    return localStorage.getItem('selectedDriverId');
  });
  const currentRegion = 'Default Region';

  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'local' | 'error' | null>(null);
  
  const [allSalesHistory, setAllSalesHistory] = useState<SaleRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<SaleRecord | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<ExtractedData> | null>(null);
  const [stats, setStats] = useState<DailyStats>({
    totalSales: 0,
    bonusSalesCount: 0,
    runningTotalEuro: 0,
    totalGoldWeightNormalized: 0,
    totalGoldCost: 0,
    currentAvgGoldPrice: 0,
    estimatedBonusEuro: 0
  });

  useEffect(() => {
    const savedData = localStorage.getItem('goldbuy_all_sales_history');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) {
          setAllSalesHistory(parsed);
          if (selectedDriverId) {
            setStats(recalculateStats(parsed, selectedDriverId));
          }
        }
      } catch (e) {
        console.error("Failed to load local history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDriverId) {
      setStats(recalculateStats(allSalesHistory, selectedDriverId));
    }
  }, [allSalesHistory, selectedDriverId]);

  const handleSelectDriver = (driverId: string) => {
    setSelectedDriverId(driverId);
    localStorage.setItem('selectedDriverId', driverId);
    setStats(recalculateStats(allSalesHistory, driverId));
  };
  
  const handleSaveRecord = async (record: SaleRecord) => {
    if (!selectedDriverId) {
      console.error("No driver selected, cannot save record.");
      setLastSyncStatus('error');
      setTimeout(() => setLastSyncStatus(null), 3000);
      return;
    }

    const recordWithMeta: SaleRecord = { 
      ...record, 
      userId: selectedDriverId,
      region: record.region || currentRegion,
      isPaid: record.isPaid ?? false,
      isSentToBank: record.isSentToBank ?? false,
    };

    setIsSyncing(true);
    setLastSyncStatus(null);

    const onlineSuccess = await sendToGoogleSheets(recordWithMeta);

    setIsSyncing(false);
    
    if (onlineSuccess) {
      setLastSyncStatus('success');
    } else {
      setLastSyncStatus('local'); 
    }
    setTimeout(() => setLastSyncStatus(null), 3000);

    setAllSalesHistory(prev => {
      let newHistory;
      const existingIndex = prev.findIndex(r => r.id === recordWithMeta.id);
      
      if (existingIndex >= 0) {
        newHistory = [...prev];
        newHistory[existingIndex] = recordWithMeta;
      } else {
        newHistory = [...prev, recordWithMeta];
      }
      
      localStorage.setItem('goldbuy_all_sales_history', JSON.stringify(newHistory));
      return newHistory;
    });

    setEditingRecord(null);
    setPrefillData(null);
    setShowEntryForm(false);
    setActiveTab('dashboard');
  };

  const handleEditRecord = (record: SaleRecord) => {
    setEditingRecord(record);
    setShowHistory(false);
    setShowEntryForm(true);
  };
  
  const handleTransferToSale = (data: Partial<ExtractedData>) => {
    setPrefillData(data);
    setShowEntryForm(true);
    setActiveTab('dashboard'); 
  };

  const handleResetData = () => {
    const isConfirmed = window.confirm(
      'ARE YOU SURE?\n\nThis will permanently delete ALL sales data from this device. This action cannot be undone.'
    );
    if (isConfirmed) {
      setAllSalesHistory([]);
      setStats(recalculateStats([], selectedDriverId || ''));
      localStorage.removeItem('goldbuy_all_sales_history');
      setShowHistory(false);
      setActiveTab('dashboard');
    }
  };

  if (!selectedDriverId) {
    return (
      <div className="w-full max-w-md mx-auto h-screen bg-white shadow-2xl overflow-hidden flex flex-col font-sans text-slate-900 relative">
        <UserSelectionScreen onSelectDriver={handleSelectDriver} />
      </div>
    );
  }

  const currentDriverSalesHistory = allSalesHistory.filter(record => record.userId === selectedDriverId);

  let content = null;
  const entryData = editingRecord || prefillData;

  if (showEntryForm) {
    content = (
      <EntryForm 
        onCancel={() => {
          setEditingRecord(null);
          setPrefillData(null);
          setShowEntryForm(false);
        }} 
        onSave={handleSaveRecord}
        initialData={entryData as SaleRecord | null}
        startWithCamera={!!prefillData && !editingRecord}
        currentDriverId={selectedDriverId}
      />
    );
  } else if (showHistory) {
    content = (
      <HistoryView 
        records={currentDriverSalesHistory}
        onBack={() => setShowHistory(false)}
        onEdit={handleEditRecord}
        onReset={handleResetData}
        onUpdateRecord={handleSaveRecord}
        sendToGoogleSheets={sendToGoogleSheets}
      />
    );
  } else {
    switch (activeTab) {
      case 'dashboard':
        content = (
          <Dashboard 
            stats={stats} 
            userName={selectedDriverId}
            onNewSale={() => setShowEntryForm(true)}
            onViewHistory={() => setShowHistory(true)}
          />
        );
        break;
      case 'calculator':
        content = <BonusCalculatorView onTransferToSale={handleTransferToSale} />;
        break;
      case 'info':
        content = <InfoView />;
        break;
    }
  }

  const NavButton = ({ tabName, icon: Icon, label }: { tabName: MainTab, icon: React.ElementType, label: string }) => {
    const isTabActive = activeTab === tabName;
    const isDisabled = false;

    return (
      <button 
        onClick={() => setActiveTab(tabName)}
        disabled={isDisabled}
        className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300 ease-in-out
          ${isTabActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={label}
      >
        <Icon className={`w-5 h-5 mb-1 ${isTabActive ? 'fill-current text-blue-600' : 'text-slate-400'}`} />
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white shadow-2xl overflow-hidden flex flex-col font-sans text-slate-900 relative">
      
      {isSyncing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg z-50 text-sm font-bold animate-pulse">
          Saving...
        </div>
      )}
      {lastSyncStatus === 'success' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4" />
          Sent to Cloud
        </div>
      )}
      {lastSyncStatus === 'local' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-700 text-white px-6 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Save className="w-4 h-4" />
          Saved Locally (Offline)
        </div>
      )}
      {lastSyncStatus === 'error' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-4 h-4" />
          Sync Failed
        </div>
      )}

      <div className="flex-1 overflow-hidden relative animate-fadeIn">
        {content}
      </div>

      {!showEntryForm && !showHistory && (
        <div className="bg-white border-t border-slate-200 flex justify-between items-center h-16 shrink-0 px-2 shadow-inner">
          <NavButton tabName="dashboard" icon={Home} label="Sales" />
          <NavButton tabName="calculator" icon={Calculator} label="Bonus" />
          <NavButton tabName="info" icon={Info} label="Info" />
        </div>
      )}
    </div>
  );
};

export default App;
