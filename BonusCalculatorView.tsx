import React, { useState, useEffect } from 'react';
import { Calculator, HelpCircle, AlertTriangle, PhoneCall, ChevronsRight, Sparkles, Copy, Share2 } from 'lucide-react';
import { calculateNormalized14kWeight, calculateBonusAmount, isBonusSale } from './ValidationUtils.ts';
import { ExtractedData } from '../types.ts';

interface BonusCalculatorViewProps {
  onTransferToSale: (data: Partial<ExtractedData>) => void;
}

export const BonusCalculatorView: React.FC<BonusCalculatorViewProps> = ({ onTransferToSale }) => {
  const [inputs, setInputs] = useState({
    price: 250,
    weightGoldTotal: 10,
    weight8k: 0, 
    weight18k: 0,
    weight22k: 0,
    weight24k: 0, 
  });
  
  const [callCompleted, setCallCompleted] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [animateBonus, setAnimateBonus] = useState(false);

  const normalizedWeight = calculateNormalized14kWeight(inputs.weightGoldTotal, inputs.weight8k, inputs.weight18k, inputs.weight22k, inputs.weight24k); 
  const pricePerGram = normalizedWeight > 0 ? inputs.price / normalizedWeight : 0;
  const isBonus = isBonusSale(inputs.price, inputs.weightGoldTotal, inputs.weight8k, inputs.weight18k, inputs.weight22k, inputs.weight24k); 
  const estimatedBonus = calculateBonusAmount(inputs.price, inputs.weightGoldTotal, inputs.weight8k, inputs.weight18k, inputs.weight22k, inputs.weight24k); 

  const isOverpriced = pricePerGram >= 40;
  const canTransfer = !isOverpriced || (isOverpriced && callCompleted);
  const gapTo40EuroLimit = 40 - pricePerGram; // Distance from the 40€ limit

  useEffect(() => {
    if (!isOverpriced) {
      setCallCompleted(false);
    }
  }, [isOverpriced]);

  // Animate bonus whenever inputs change
  useEffect(() => {
    setAnimateBonus(true);
    const timer = setTimeout(() => setAnimateBonus(false), 500);
    return () => clearTimeout(timer);
  }, [inputs]);

  const handleTransfer = () => {
    onTransferToSale({
      amountEuro: inputs.price,
      weightGoldTotal: inputs.weightGoldTotal,
      weightGold8k: inputs.weight8k, 
      weightGold18k: inputs.weight18k,
      weightGold22k: inputs.weight22k,
      weightGold24k: inputs.weight24k, 
    });
  };

  const handleCopyForManager = () => {
    const purityBreakdown = [];
    if (inputs.weight8k > 0) purityBreakdown.push(`8k: ${inputs.weight8k.toFixed(2)}g`);
    if (inputs.weight18k > 0) purityBreakdown.push(`18k: ${inputs.weight18k.toFixed(2)}g`);
    if (inputs.weight22k > 0) purityBreakdown.push(`22k: ${inputs.weight22k.toFixed(2)}g`);
    if (inputs.weight24k > 0) purityBreakdown.push(`24k: ${inputs.weight24k.toFixed(2)}g`);
    const remaining14k = Math.max(0, inputs.weightGoldTotal - (inputs.weight8k + inputs.weight18k + inputs.weight22k + inputs.weight24k));
    if (remaining14k > 0) purityBreakdown.push(`14k (remainder): ${remaining14k.toFixed(2)}g`);

    const message = `
GoldBuy Pelipuhelu required:
------------------------------
Purchase Price: ${inputs.price.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}
Total Gold Weight: ${inputs.weightGoldTotal.toFixed(2)}g
Purity Breakdown: ${purityBreakdown.length > 0 ? purityBreakdown.join(', ') : 'Not specified'}
Normalized 14k Weight: ${normalizedWeight.toFixed(2)}g
Price Paid / 14k gram: ${pricePerGram.toFixed(2)}€/g
${isOverpriced ? `ALERT: This is above the 40€/g limit.` : `This is within the acceptable range.`}
Estimated Bonus: ${estimatedBonus.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}

Please advise on how to proceed.
    `.trim();

    navigator.clipboard.writeText(message)
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 3000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };


  return (
    <div className="h-full flex flex-col bg-slate-50 animate-fadeIn">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 shadow-md z-10">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Bonus Calculator
        </h1>
        <p className="text-emerald-100 text-sm mt-1">Simulate deals to see potential earnings.</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6 pb-24">
        
        {/* Explanation Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromBottom">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            How is the bonus calculated?
          </h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <strong className="text-slate-800">1. Normalization:</strong> All gold is converted to a "14k equivalent" weight.
              <br/>
              <span className="text-xs italic bg-slate-100 px-2 py-1 rounded inline-block mt-1">
                (8k: ~0.57x, 18k: ~1.28x, 22k: ~1.56x, 24k: ~1.71x more than 14k)
              </span>
            </p>
            <p>
              <strong className="text-slate-800">2. Threshold:</strong> If you buy gold for <strong className="text-emerald-700">under 30€ per 14k gram</strong>, you qualify for a bonus.
            </p>
            <p>
              <strong className="text-slate-800">3. The Formula:</strong>
              <div className="bg-slate-100 p-3 rounded-lg font-mono text-xs mt-1 border border-slate-200">
                (40€ - YourPricePerGram) × 10% × TotalWeight14k
              </div>
            </p>
          </div>
        </div>

        {/* Simulator */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-5 animate-slideInFromBottom delay-100">
          <div className="border-b border-slate-100 pb-2 mb-2">
            <h3 className="font-bold text-slate-800">Deal Simulator</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Gold Weight (g)</label>
              <input 
                type="number" 
                className="w-full p-2 border border-slate-300 rounded font-bold text-lg focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
                value={inputs.weightGoldTotal}
                onChange={e => setInputs({...inputs, weightGoldTotal: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Price (€)</label>
              <input 
                type="number" 
                className="w-full p-2 border border-slate-300 rounded font-bold text-lg focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
                value={inputs.price}
                onChange={e => setInputs({...inputs, price: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 space-y-2">
            <p className="text-xs font-bold text-yellow-800 uppercase">Purity Splits (Optional)</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block">8k</label> 
                <input 
                  type="number" 
                  className="w-full p-1 border border-yellow-200 rounded text-sm focus:border-emerald-400 outline-none transition-all"
                  placeholder="0"
                  value={inputs.weight8k || ''}
                  onChange={e => setInputs({...inputs, weight8k: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block">18k</label>
                <input 
                  type="number" 
                  className="w-full p-1 border border-yellow-200 rounded text-sm focus:border-emerald-400 outline-none transition-all"
                  placeholder="0"
                  value={inputs.weight18k || ''}
                  onChange={e => setInputs({...inputs, weight18k: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block">22k</label>
                <input 
                  type="number" 
                  className="w-full p-1 border border-yellow-200 rounded text-sm focus:border-emerald-400 outline-none transition-all"
                  placeholder="0"
                  value={inputs.weight22k || ''}
                  onChange={e => setInputs({...inputs, weight22k: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 block">24k</label> 
                <input 
                  type="number" 
                  className="w-full p-1 border border-yellow-200 rounded text-sm focus:border-emerald-400 outline-none transition-all"
                  placeholder="0"
                  value={inputs.weight24k || ''}
                  onChange={e => setInputs({...inputs, weight24k: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-600">Normalized Weight (14k):</span>
               <span className="font-mono font-bold">{normalizedWeight.toFixed(2)} g</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-600">Price Paid / 14k gram:</span>
               <span className={`font-mono font-bold ${
                 pricePerGram < 30 ? 'text-emerald-600 text-lg' : 
                 pricePerGram < 40 ? 'text-orange-600' : 
                 'text-red-600'
                 } transition-all duration-300 ease-out`}
                 style={{ fontSize: pricePerGram < 30 ? '1.25rem' : '1rem' }}
               >
                 {pricePerGram.toFixed(2)} €
               </span>
             </div>
             {gapTo40EuroLimit < 10 && gapTo40EuroLimit > 0 && (
               <p className="text-xs text-orange-500 text-right">
                 <strong className="font-semibold">{gapTo40EuroLimit.toFixed(2)}€/g</strong> remaining until 40€ limit.
               </p>
             )}
             
             <div className={`mt-4 pt-4 border-t ${isBonus ? 'border-emerald-200 bg-emerald-50/50 -mx-4 px-4 pb-2' : 'border-slate-200'}`}>
               <div className="flex justify-between items-center">
                 <span className="font-bold text-slate-800">Your Bonus</span>
                 <div className="text-right">
                   <span className={`font-bold transition-all duration-300 ease-out ${
                     isBonus ? 'text-emerald-600 text-3xl' : 'text-slate-400 text-2xl'
                   } ${animateBonus ? 'scale-105' : 'scale-100'}`}
                     style={{ fontSize: isBonus ? '2.25rem' : '1.5rem' }}
                   >
                     {estimatedBonus.toFixed(2)} €
                   </span>
                   {!isBonus && !isOverpriced && (
                     <p className="text-[10px] text-orange-500 flex items-center gap-1 justify-end">
                        <Sparkles className="w-3 h-3 text-orange-400"/>
                        Not a bonus deal
                     </p>
                   )}
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Pelipuhelu Warning Section */}
        {isOverpriced && (
          <div className="bg-red-50 border-2 border-red-500 p-5 rounded-xl shadow-lg space-y-4 animate-slideInFromBottom delay-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600 animate-pulse" />
              <h3 className="text-xl font-bold text-red-800 animate-pulse">OTA PELIPUHELU</h3>
            </div>
            <p className="text-red-700 text-sm">
              The purchase price is <strong className="font-mono">{pricePerGram.toFixed(2)}€/g</strong>, which is above the 40€/g limit. Manager approval is required to proceed with this deal.
            </p>
            <label className="flex items-center gap-3 bg-white p-4 rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors">
              <input 
                type="checkbox"
                checked={callCompleted}
                onChange={(e) => setCallCompleted(e.target.checked)}
                className="w-6 h-6 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-800 select-none flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-slate-500" />
                Pelipuhelu Completed
              </span>
            </label>
            <div className="relative">
              <button 
                onClick={handleCopyForManager}
                className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                aria-label="Copy details for manager call"
              >
                <Copy className="w-4 h-4" />
                Copy for Manager Call (WhatsApp)
              </button>
              {copiedToClipboard && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-700 text-white px-3 py-1 rounded-full text-xs animate-fadeIn shadow-lg">
                  Copied!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 animate-slideInFromBottom delay-300">
          <button 
            onClick={handleTransfer}
            disabled={!canTransfer}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold p-4 rounded-xl shadow-lg shadow-blue-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3
                       disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            Create Sale Entry from Calculation
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
