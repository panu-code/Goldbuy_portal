import React, { useEffect, useState } from 'react';
import { DailyStats } from '../types.ts';
import { Plus, TrendingUp, Award, Euro, Calculator, Scale, TableProperties, Users } from 'lucide-react'; // Added Users icon

interface DashboardProps {
  stats: DailyStats;
  userName: string;
  onNewSale: () => void;
  onViewHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, userName, onNewSale, onViewHistory }) => {
  const BONUS_TARGET = 114;
  const remainingBonus = Math.max(0, BONUS_TARGET - stats.estimatedBonusEuro);
  const progressPercent = Math.min(100, (stats.estimatedBonusEuro / BONUS_TARGET) * 100);

  // Animation State for Running Total
  const [animateSpending, setAnimateSpending] = useState(false);
  // Animation State for Stat Cards
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    // Only animate if stats actually change
    setAnimateSpending(true);
    setAnimateStats(true); 
    const timer = setTimeout(() => {
      setAnimateSpending(false);
      setAnimateStats(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [stats.totalSales, stats.bonusSalesCount, stats.runningTotalEuro, stats.currentAvgGoldPrice, stats.estimatedBonusEuro]);

  const StatCard = ({ icon: Icon, value, label, valueSuffix = '', colorClass = 'text-slate-800', bgColorClass = 'bg-blue-100' }: {
    icon: React.ElementType, value: string | number, label: string, valueSuffix?: string, colorClass?: string, bgColorClass?: string
  }) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[120px] transition-transform duration-300 ease-out ${animateStats ? 'scale-[1.02]' : 'scale-100'}`}>
      <div className={`${bgColorClass} p-2 rounded-full mb-2`}>
        <Icon className="w-6 h-6 text-current" />
      </div>
      <span className={`text-3xl font-bold ${colorClass}`}>{value}{valueSuffix}</span>
      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider text-center">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6 pb-12 rounded-b-[2rem] shadow-lg relative z-10">
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-2xl font-bold">Hello, {userName}</h1>
        </div>
        <p className="text-blue-200 text-sm">Ready to log sales to the main office.</p>
        <div className="absolute bottom-3 right-6 flex items-center text-blue-200 text-xs gap-1">
          <Users className="w-4 h-4" />
          <span className="opacity-80">Your Personal Dashboard</span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="px-4 -mt-8 grid grid-cols-2 gap-4 relative z-20 mb-4">
        <StatCard icon={TrendingUp} value={stats.totalSales} label="Total Sales" bgColorClass="bg-blue-100 text-blue-600" />
        <StatCard icon={Award} value={stats.bonusSalesCount} label="Bonus Deals" bgColorClass="bg-yellow-100 text-yellow-600" />
        <StatCard 
          icon={Scale} 
          value={stats.currentAvgGoldPrice > 0 ? stats.currentAvgGoldPrice.toFixed(2) : '-'} 
          valueSuffix="€/g" 
          label="Avg Gold Price" 
          bgColorClass="bg-purple-100 text-purple-600" 
          colorClass="text-slate-800 text-2xl"
        />

        {/* Estimated Bonus Euro */}
        <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden transition-transform duration-300 ease-out ${animateStats ? 'scale-[1.02]' : 'scale-100'}`}>
          <div className="bg-emerald-100 p-2 rounded-full mb-2 z-10">
            <Calculator className="w-6 h-6 text-emerald-600" />
          </div>
          <span className={`text-2xl font-bold z-10 ${stats.estimatedBonusEuro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
             {stats.estimatedBonusEuro.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}
          </span>
          <div className="flex flex-col items-center z-10">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider text-center">Est. Bonus</span>
            <div className="text-[10px] font-medium text-slate-400 mt-1 flex gap-1">
              Target: {BONUS_TARGET}€ 
              {remainingBonus > 0 && <span className="text-orange-400">(-{remainingBonus.toFixed(0)})</span>}
            </div>
          </div>
          
          {/* Progress Bar Background */}
          <div 
            className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>

      {/* Running Total Full Width - Animated */}
      <div className="px-4">
        <div 
          className={`bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-500 ease-out transform ${
            animateSpending ? 'scale-105 ring-2 ring-emerald-400 bg-emerald-50' : 'scale-100'
          }`}
        >
          <div>
            <span className="block text-xs text-slate-500 uppercase font-semibold tracking-wider">Daily Spending</span>
            <span 
              className={`block font-bold text-slate-800 transition-all duration-300 ${animateSpending ? 'text-emerald-700' : ''}`}
              style={{ fontSize: '2.25rem', lineHeight: '2.5rem' }} 
            >
              {stats.runningTotalEuro.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
          <div className={`p-3 rounded-full transition-colors duration-500 ${animateSpending ? 'bg-emerald-200' : 'bg-slate-100'}`}>
            <Euro className={`w-8 h-8 transition-colors duration-500 ${animateSpending ? 'text-emerald-700' : 'text-slate-600'}`} />
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <button
          onClick={onNewSale}
          className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white rounded-2xl py-6 shadow-lg shadow-blue-300 flex flex-col items-center justify-center group"
          aria-label="New Sale Entry"
        >
          <div className="bg-white/20 p-4 rounded-full mb-3 group-hover:bg-white/30 transition-colors">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wide">NEW SALE ENTRY</span>
          <span className="text-blue-100 text-sm mt-1">Scan Receipt & Scale</span>
        </button>

        <button 
          onClick={onViewHistory}
          className="w-full max-w-sm bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-slate-700 rounded-xl py-4 shadow-sm flex items-center justify-center gap-2"
          aria-label="View Spreadsheet Data"
        >
          <TableProperties className="w-5 h-5 text-slate-500" />
          <span className="font-semibold">View Spreadsheet Data (Test)</span>
        </button>
        
        <p className="text-xs text-slate-400 text-center max-w-xs mt-2">
          Data is automatically synchronized with the main office spreadsheet upon submission.
        </p>
      </div>
    </div>
  );
};
