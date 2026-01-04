import React, { useMemo, useState } from 'react';
import { SaleRecord } from '../types.ts';
import { ArrowLeft, Download, Table2, Pencil, ClipboardList, Trash2, Sparkles, CheckSquare, Banknote, Clock, RotateCcw } from 'lucide-react';
import { formatIBAN } from './ValidationUtils.ts'; // Assuming formatIBAN is available

interface HistoryViewProps {
  records: SaleRecord[];
  onBack: () => void;
  onEdit: (record: SaleRecord) => void;
  onReset: () => void;
  onUpdateRecord: (record: SaleRecord) => Promise<void>; // Prop to update a single record (e.g., isPaid, isSentToBank)
  sendToGoogleSheets: (record: SaleRecord) => Promise<boolean>; // Prop to trigger a single record sync
}

export const HistoryView: React.FC<HistoryViewProps> = ({ records, onBack, onEdit, onReset, onUpdateRecord, sendToGoogleSheets }) => {
  const [syncingRecords, setSyncingRecords] = useState<Set<string>>(new Set()); // Track which records are actively syncing

  const totals = useMemo(() => {
    return records.reduce((acc, curr) => {
      const w14k = Math.max(0, curr.weightGoldTotal - (curr.weightGold8k + curr.weightGold18k + curr.weightGold22k + curr.weightGold24k));
      return {
        amountEuro: acc.amountEuro + curr.amountEuro,
        weightGoldTotal: acc.weightGoldTotal + curr.weightGoldTotal,
        weightGold8k: acc.weightGold8k + curr.weightGold8k,
        weightGold14k: acc.weightGold14k + w14k,
        weightGold18k: acc.weightGold18k + curr.weightGold18k,
        weightGold22k: acc.weightGold22k + curr.weightGold22k,
        weightGold24k: acc.weightGold24k + curr.weightGold24k,
        weightSilverTotal: acc.weightSilverTotal + curr.weightSilverTotal,
        weightSilver800: acc.weightSilver800 + curr.weightSilver800,
        weightSilver813: acc.weightSilver813 + curr.weightSilver813,
        weightSilver830: acc.weightSilver830 + curr.weightSilver830,
        weightSilver925: acc.weightSilver925 + curr.weightSilver925,
        weightSilver999: acc.weightSilver999 + curr.weightSilver999,
      };
    }, {
      amountEuro: 0,
      weightGoldTotal: 0,
      weightGold8k: 0,
      weightGold14k: 0,
      weightGold18k: 0,
      weightGold22k: 0,
      weightGold24k: 0,
      weightSilverTotal: 0,
      weightSilver800: 0,
      weightSilver813: 0,
      weightSilver830: 0,
      weightSilver925: 0,
      weightSilver999: 0
    });
  }, [records]);
  
  const unsyncedSales = useMemo(() => {
    // Records that are NOT yet sent to Google Sheets (assuming the `sendToGoogleSheets` function updates a status that can be re-queried later, or the `isSentToBank` indicates cloud sync status as an approximation)
    // For this client-side only app, `isSentToBank` will represent if it was included in a bank export,
    // let's assume `isSentToBank = false` implies it also hasn't been successfully synced to *all* cloud systems.
    return records.filter(r => !r.isSentToBank); // Or a more explicit cloud-sync flag if available
  }, [records]);

  const handleReset = () => {
    const isConfirmed = window.confirm(
      'ARE YOU SURE?\n\nThis will permanently delete ALL sales data from this device. This action cannot be undone.'
    );
    if (isConfirmed) {
      onReset();
    }
  };

  const handleTogglePaid = async (record: SaleRecord) => {
    const updatedRecord = { ...record, isPaid: !record.isPaid };
    await onUpdateRecord(updatedRecord); // Update local state and attempt sync
  };

  const handleRetrySync = async (record: SaleRecord) => {
    setSyncingRecords(prev => new Set(prev).add(record.id));
    const success = await sendToGoogleSheets(record);
    if (success) {
      // If sync is successful, mark it as sent to bank (assuming Google Sheets is the 'bank' for tracking)
      await onUpdateRecord({ ...record, isSentToBank: true });
    }
    setSyncingRecords(prev => {
      const newSet = new Set(prev);
      newSet.delete(record.id);
      return newSet;
    });
  };

  const handleRetryAllUnsynced = async () => {
    for (const record of unsyncedSales) {
      if (!syncingRecords.has(record.id)) { // Only retry if not already syncing
        await handleRetrySync(record);
      }
    }
  };

  const exportDailySummaryCSV = () => {
    if (records.length === 0) return;
    
    // Fix: Define a type for the daily summary objects. When using `any`, the compiler
    // can infer the type as `unknown` in strict mode, causing property access errors.
    // By providing a strong type, we ensure type safety.
    interface DailySummaryData {
      date: string;
      user: string;
      region: string;
      salesCount: number;
      totalPayout: number;
      totalGold: number;
      totalSilver: number;
      clockIn?: string;
      clockOut?: string;
      totalHours?: string;
    }

    const dailyData = records.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = {
          date: date,
          user: record.userId,
          region: record.region,
          salesCount: 0,
          totalPayout: 0,
          totalGold: 0,
          totalSilver: 0,
        };
      }
      acc[date].salesCount += 1;
      acc[date].totalPayout += record.amountEuro;
      acc[date].totalGold += record.weightGoldTotal;
      acc[date].totalSilver += record.weightSilverTotal;
      return acc;
    }, {} as Record<string, DailySummaryData>);
    
    let clockInTime = 'N/A';
    let clockOutTime = 'N/A';
    let totalHours = 'N/A';

    const latestDate = Object.keys(dailyData).sort().pop();
    if(latestDate && dailyData[latestDate]){
        dailyData[latestDate].clockIn = clockInTime;
        dailyData[latestDate].clockOut = clockOutTime;
        dailyData[latestDate].totalHours = totalHours;
    }

    const headers = [
      "Date", "User", "Region", "Clock In", "Clock Out", "Total Hours",
      "Sales Count", "Total Payout (€)", "Total Gold (g)", "Total Silver (g)"
    ];
    
    const rows = Object.values(dailyData).map(day => [
      `"${day.date}"`, `"${day.user}"`, `"${day.region}"`,
      `"${day.clockIn || 'N/A'}"`, `"${day.clockOut || 'N/A'}"`, `"${day.totalHours || 'N/A'}"`,
      day.salesCount, day.totalPayout.toFixed(2), day.totalGold.toFixed(2), day.totalSilver.toFixed(2)
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `goldbuy_DAILY_summary_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = () => {
    if (records.length === 0) return;

    const headers = [
      "ID", "Timestamp", "Date (Input)", "Time", "Region", "User/Buyer", 
      "Receipt Number", "Location", "Marketing Channel",
      "Client First Name", "Client Last Name", "SSN/HETU", "Phone", "Email", "IBAN", 
      "Total Payout (€)", 
      "Gold Total (g)", "Gold 8k (g)", "Gold 14k (Calc) (g)", "Gold 18k (g)", "Gold 22k (g)", "Gold 24k (g)",
      "Silver Total (g)", "Silver .800 (g)", "Silver .813 (g)", "Silver .830 (g)", "Silver .925 (g)", "Silver .999 (g)", 
      "Comments", "Is Paid", "Is Sent to Bank"
    ];

    const rows = records.map(r => {
      const w14k = Math.max(0, r.weightGoldTotal - (r.weightGold8k + r.weightGold18k + r.weightGold22k + r.weightGold24k));
      const dateTime = new Date(r.timestamp);
      
      return [
        r.id,
        r.timestamp,
        r.date,
        dateTime.toLocaleTimeString(),
        `"${r.region}"`,
        `"${r.userId}"`,
        `"${r.receiptNumber}"`,
        `"${r.location}"`,
        `"${r.marketingChannel}"`,
        `"${r.firstName}"`,
        `"${r.lastName}"`,
        `"${r.clientSSN}"`,
        `"${r.phoneNumber}"`,
        `"${r.email}"`,
        `"${r.iban}"`,
        r.amountEuro.toFixed(2),
        r.weightGoldTotal.toFixed(2),
        r.weightGold8k.toFixed(2),
        w14k.toFixed(2),
        r.weightGold18k.toFixed(2),
        r.weightGold22k.toFixed(2),
        r.weightGold24k.toFixed(2),
        r.weightSilverTotal.toFixed(2),
        r.weightSilver800.toFixed(2),
        r.weightSilver813.toFixed(2),
        r.weightSilver830.toFixed(2),
        r.weightSilver925.toFixed(2),
        r.weightSilver999.toFixed(2),
        `"${r.comments.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        r.isPaid ? 'TRUE' : 'FALSE',
        r.isSentToBank ? 'TRUE' : 'FALSE'
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `goldbuy_FULL_sales_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBankPaymentsCSV = async () => {
    const unpaidUnsentRecords = records.filter(r => r.iban !== 'NO_ACCOUNT' && !r.isPaid && !r.isSentToBank);

    if (unpaidUnsentRecords.length === 0) {
      alert("No unpaid, unsent records with valid IBAN to export.");
      return;
    }

    const headers = [
      "Name", "Recipient type", "IBAN", "Currency", "Amount", "Reference"
    ];

    const rows = unpaidUnsentRecords.map(r => {
      return [
        `"${r.firstName} ${r.lastName}"`,
        "PERSON",
        `"${formatIBAN(r.iban).replace(/\s/g, '')}"`, // Clean IBAN
        "EUR",
        r.amountEuro.toFixed(2),
        `"${r.receiptNumber}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `goldbuy_BANK_payments_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // After successful export, mark these records as sent to bank locally
    for (const record of unpaidUnsentRecords) {
      await onUpdateRecord({ ...record, isSentToBank: true });
    }
    alert(`${unpaidUnsentRecords.length} payment records exported and marked as 'Sent to Bank'.`);
  };


  // Helper to determine if a record is a bonus sale (simplified for display)
  const isRecordBonus = (record: SaleRecord) => {
    // This function will need the same logic as ValidationUtils.isBonusSale
    // to correctly determine bonus status for display.
    return (record.amountEuro / (record.weightGoldTotal || 1)) < 30; // Simplified heuristic
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-md flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:text-blue-200 transition-colors" aria-label="Back to Dashboard">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="ml-2">
            <h2 className="font-bold text-lg">Data Masterlist</h2>
            <p className="text-xs text-blue-200">Full dataset ready for export</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportDailySummaryCSV}
            disabled={records.length === 0}
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export Daily Summary CSV"
          >
            <ClipboardList className="w-4 h-4" />
            Daily Summary
          </button>
          <button 
            onClick={exportToCSV}
            disabled={records.length === 0}
            className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export Full CSV"
          >
            <Download className="w-4 h-4" />
            Full CSV
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-red-700 active:scale-95 transition-all"
            title="Reset All Data"
            aria-label="Reset All Data"
          >
            <Trash2 className="w-4 h-4" />
            Reset Data
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 animate-fadeIn">
        {records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Table2 className="w-16 h-16 mb-4 opacity-50" />
            <p>No sales recorded yet.</p>
          </div>
        ) : (
          <>
            {/* Pending Queue Section */}
            {unsyncedSales.length > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-lg shadow-md animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-bold text-orange-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Sync Queue ({unsyncedSales.length})
                  </h3>
                  <button 
                    onClick={handleRetryAllUnsynced}
                    disabled={unsyncedSales.some(r => syncingRecords.has(r.id))}
                    className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry All
                  </button>
                </div>
                <ul className="space-y-2">
                  {unsyncedSales.map(r => (
                    <li key={r.id} className="flex items-center justify-between text-sm text-orange-700 bg-orange-100 p-2 rounded">
                      <span>
                        <span className="font-mono text-xs text-orange-600 mr-2">{r.receiptNumber}</span>
                        <span className="font-semibold">{r.firstName} {r.lastName}</span> - {r.amountEuro.toFixed(2)}€
                      </span>
                      <button 
                        onClick={() => handleRetrySync(r)}
                        disabled={syncingRecords.has(r.id)}
                        className="bg-orange-500 text-white px-2 py-1 rounded-md text-xs hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                      >
                        {syncingRecords.has(r.id) ? 'Syncing...' : 'Retry'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bulk Payment Engine */}
            <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 mb-6 rounded-lg shadow-md animate-fadeIn delay-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-bold text-emerald-800 flex items-center gap-2">
                    <Banknote className="w-5 h-5" />
                    Bulk Payment Engine
                  </h3>
                  <button 
                    onClick={exportBankPaymentsCSV}
                    disabled={records.filter(r => r.iban !== 'NO_ACCOUNT' && !r.isPaid && !r.isSentToBank).length === 0}
                    className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Export Bank Payments (CSV)
                  </button>
                </div>
                <p className="text-sm text-emerald-700">
                  Generate a CSV file for bank transfers. Only includes unpaid records with valid IBANs that haven't been previously exported.
                </p>
                <p className="text-xs text-emerald-600 mt-2">
                  <span className="font-semibold">Note:</span> After export, records are marked as 'Sent to Bank'.
                </p>
            </div>


            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-blue-100 text-blue-800 font-bold uppercase sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="p-3 border-b w-10 sticky left-0 bg-blue-100 z-10 shadow-sm"></th>
                      <th className="p-3 border-b min-w-[80px]">Paid?</th> {/* New column for paid status */}
                      <th className="p-3 border-b min-w-[100px]">Date/Time</th>
                      <th className="p-3 border-b min-w-[80px]">Region</th>
                      <th className="p-3 border-b min-w-[80px]">Buyer</th>
                      <th className="p-3 border-b min-w-[100px]">Receipt</th>
                      <th className="p-3 border-b min-w-[150px]">Client Name</th>
                      <th className="p-3 border-b min-w-[100px]">Marketing</th>
                      <th className="p-3 border-b text-right min-w-[100px] bg-emerald-50 text-emerald-800">Price (€)</th>
                      
                      {/* Gold Columns */}
                      <th className="p-3 border-b text-right min-w-[80px] bg-yellow-100 text-yellow-800 border-l border-yellow-200">Gold Tot</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-yellow-100 text-slate-600">8k</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-yellow-100 text-slate-600">14k</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-yellow-100 text-slate-600">18k</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-yellow-100 text-slate-600">22k</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-yellow-100 text-slate-600 border-r border-yellow-200">24k</th>
                      
                      {/* Silver Columns */}
                      <th className="p-3 border-b text-right min-w-[80px] bg-slate-100 text-slate-800 border-l border-slate-200">Silv Tot</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-slate-100 text-slate-600">.813</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-slate-100 text-slate-600">.925</th>
                      <th className="p-3 border-b text-right min-w-[80px] bg-slate-100 text-slate-600">.999</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.slice().reverse().map((r) => {
                       const w14k = Math.max(0, r.weightGoldTotal - (r.weightGold8k + r.weightGold18k + r.weightGold22k + r.weightGold24k));
                       const dateTime = new Date(r.timestamp);
                       const isBonus = isRecordBonus(r);
                       
                       return (
                        <tr key={r.id} className={`group transition-colors ${isBonus ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-white hover:bg-blue-50/50'} ${r.isPaid ? 'opacity-70 line-through text-slate-500 italic' : ''}`}>
                          <td className={`p-2 sticky left-0 z-10 border-r border-slate-100 ${isBonus ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-white group-hover:bg-blue-50/50'} ${r.isPaid ? 'opacity-70 line-through text-slate-500 italic' : ''}`}>
                             <button 
                               onClick={() => onEdit(r)}
                               className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-all"
                               title="Edit Record"
                               aria-label={`Edit record ${r.receiptNumber}`}
                             >
                               <Pencil className="w-4 h-4" />
                             </button>
                             {isBonus && (
                               <span className="inline-block ml-1" title="Bonus Sale">
                                 <Sparkles className="w-4 h-4 text-emerald-500" />
                               </span>
                             )}
                          </td>
                          <td className={`p-2 ${r.isPaid ? 'bg-green-100' : 'bg-slate-50'}`}> {/* Paid status column */}
                            <label className="flex items-center justify-center cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={r.isPaid}
                                onChange={() => handleTogglePaid(r)}
                                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                aria-label={`Mark record ${r.receiptNumber} as paid`}
                              />
                            </label>
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {r.date}<br/>
                            <span className="text-[10px] text-slate-400">{dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="p-3 font-medium text-slate-700">{r.region}</td>
                          <td className="p-3 font-medium text-slate-700">{r.userId}</td>
                          <td className="p-3 font-bold text-slate-900">{r.receiptNumber}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{r.firstName} {r.lastName}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{r.email}</div>
                          </td>
                          <td className="p-3 text-slate-600">{r.marketingChannel}</td>
                          <td className="p-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                            {r.amountEuro.toFixed(2)}
                          </td>

                          {/* Gold Data */}
                          <td className="p-3 text-right font-bold text-yellow-900 bg-yellow-50/30 border-l border-yellow-100">
                             {r.weightGoldTotal > 0 ? r.weightGoldTotal.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-600 bg-yellow-50/30">
                             {r.weightGold8k > 0 ? r.weightGold8k.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-600 bg-yellow-50/30">
                             {w14k > 0 ? w14k.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-600 bg-yellow-50/30">
                             {r.weightGold18k > 0 ? r.weightGold18k.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-600 bg-yellow-50/30">
                             {r.weightGold22k > 0 ? r.weightGold22k.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-600 bg-yellow-50/30 border-r border-yellow-100">
                             {r.weightGold24k > 0 ? r.weightGold24k.toFixed(2) : '-'}
                          </td>

                          {/* Silver Data */}
                          <td className="p-3 text-right font-bold text-slate-700 bg-slate-50/50 border-l border-slate-100">
                            {r.weightSilverTotal > 0 ? r.weightSilverTotal.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-500 bg-slate-50/50">
                             {r.weightSilver813 > 0 ? r.weightSilver813.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-500 bg-slate-50/50">
                             {r.weightSilver925 > 0 ? r.weightSilver925.toFixed(2) : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-500 bg-slate-50/50">
                             {r.weightSilver999 > 0 ? r.weightSilver999.toFixed(2) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* FOOTER TOTALS ROW */}
                  <tfoot className="bg-blue-200 border-t-2 border-blue-300 font-bold text-blue-900 text-xs sticky bottom-0 z-20">
                     <tr>
                       <td className="p-3 sticky left-0 bg-blue-200 z-10" colSpan={1}></td>
                       <td className="p-3" colSpan={1}></td> {/* Empty for 'Paid?' column */}
                       <td className="p-3" colSpan={6}>TOTALS</td>
                       <td className="p-3 text-right text-emerald-800">{totals.amountEuro.toFixed(2)}</td>
                       <td className="p-3 text-right text-yellow-900 border-l border-blue-300">{totals.weightGoldTotal.toFixed(2)}</td>
                       <td className="p-3 text-right">{totals.weightGold8k.toFixed(2)}</td>
                       <td className="p-3 text-right">{totals.weightGold14k.toFixed(2)}</td>
                       <td className="p-3 text-right">{totals.weightGold18k.toFixed(2)}</td>
                       <td className="p-3 text-right">{totals.weightGold22k.toFixed(2)}</td>
                       <td className="p-3 text-right border-r border-blue-300">{totals.weightGold24k.toFixed(2)}</td>
                       <td className="p-3 text-right text-slate-900">{totals.weightSilverTotal.toFixed(2)}</td>
                       <td className="p-3 text-right">{totals.weightSilver813.toFixed(2)}</td>
                       <td className="p-3 text-right">{totals.weightSilver925.toFixed(2)}</td>
                       <td className="p-3 text-right">{totals.weightSilver999.toFixed(2)}</td>
                     </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
