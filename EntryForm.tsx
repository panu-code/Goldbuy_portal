import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, Save, ArrowLeft, AlertCircle, CheckCircle2, X, Mail, Phone, User, FileText, Megaphone, Sparkles, Ban, AlertTriangle } from 'lucide-react';
import { ExtractedData, SaleRecord } from '../types.ts';
import { extractReceiptData } from '../services/geminiService.ts';
import { isValidFinnishIBAN, formatIBAN, isBonusSale } from './ValidationUtils.ts';

interface EntryFormProps {
  onCancel: () => void;
  onSave: (record: SaleRecord) => void;
  initialData?: SaleRecord | null;
  startWithCamera?: boolean;
  currentDriverId: string; // New prop for selected driver ID
}

const MARKETING_OPTIONS = [
  "Newspaper",
  "Facebook",
  "Google",
  "Social Media",
  "Other (see additional notes)"
];

export const EntryForm: React.FC<EntryFormProps> = ({ onCancel, onSave, initialData, startWithCamera = false, currentDriverId }) => {
  const [step, setStep] = useState<'camera' | 'edit' | 'confirm'>(startWithCamera ? 'camera' : (initialData ? 'edit' : 'camera'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.receiptImageBase64 || null);
  
  const [formData, setFormData] = useState<ExtractedData>(() => {
    const baseData = {
      receiptNumber: '',
      firstName: '',
      lastName: '',
      clientSSN: '',
      phoneNumber: '',
      email: '',
      iban: '',
      amountEuro: 0,
      marketingChannel: '',
      weightGoldTotal: 0,
      weightGold8k: 0, 
      weightGold18k: 0,
      weightGold22k: 0,
      weightGold24k: 0, 
      weightSilverTotal: 0,
      weightSilver800: 0,
      weightSilver813: 0,
      weightSilver830: 0,
      weightSilver925: 0,
      weightSilver999: 0,
      location: '',
      date: new Date().toISOString().split('T')[0],
    };
    if (initialData) {
      return { ...baseData, ...initialData };
    }
    return baseData;
  });

  const [comments, setComments] = useState(initialData?.comments || '');
  
  const [isIbanUnavailable, setIsIbanUnavailable] = useState(false);
  const [ibanTouched, setIbanTouched] = useState(false);
  
  useEffect(() => {
    if (initialData && (!initialData.iban || initialData.iban === 'NO_ACCOUNT')) {
      setIsIbanUnavailable(true);
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const weightGold14k = Math.max(0, formData.weightGoldTotal - (formData.weightGold8k + formData.weightGold18k + formData.weightGold22k + formData.weightGold24k)); 
  const weightSilver813_Calculated = Math.max(0, formData.weightSilverTotal - (formData.weightSilver800 + formData.weightSilver925 + formData.weightSilver830 + formData.weightSilver999));

  const isQualifyingBonus = useMemo(() => {
    return isBonusSale(
      formData.amountEuro, 
      formData.weightGoldTotal, 
      formData.weightGold8k, 
      formData.weightGold18k, 
      formData.weightGold22k,
      formData.weightGold24k, 
    );
  }, [formData.amountEuro, formData.weightGoldTotal, formData.weightGold8k, formData.weightGold18k, formData.weightGold22k, formData.weightGold24k]);

  const isIbanInvalidRealtime = useMemo(() => {
    if (isIbanUnavailable || !formData.iban) return false;
    return !isValidFinnishIBAN(formData.iban);
  }, [formData.iban, isIbanUnavailable]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStep('edit');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);

      try {
        const extracted = await extractReceiptData(base64);
        
        setFormData(prev => ({
          ...prev,
          ...extracted,
          amountEuro: initialData?.amountEuro ?? extracted.amountEuro ?? prev.amountEuro,
          weightGoldTotal: initialData?.weightGoldTotal ?? extracted.weightGoldTotal ?? prev.weightGoldTotal,
          weightGold8k: initialData?.weightGold8k ?? extracted.weightGold8k ?? prev.weightGold8k, 
          weightGold18k: initialData?.weightGold18k ?? extracted.weightGold18k ?? prev.weightGold18k,
          weightGold22k: initialData?.weightGold22k ?? extracted.weightGold22k ?? prev.weightGold22k,
          weightGold24k: initialData?.weightGold24k ?? extracted.weightGold24k ?? prev.weightGold24k, 
        }));

      } catch (err) {
        console.error("Extraction failed", err);
        setErrors(prev => ({...prev, general: "Could not read image automatically. Please fill manually."}));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatIBAN(val);
    setFormData({...formData, iban: formatted});
    setIbanTouched(true);
    
    if (isValidFinnishIBAN(formatted)) {
       setErrors(prev => {
         const { iban, ...rest } = prev;
         return rest;
       });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.receiptNumber) newErrors.receiptNumber = "Receipt # Required";
    if (!formData.firstName) newErrors.firstName = "First Name Required";
    if (!formData.lastName) newErrors.lastName = "Last Name Required";
    if (!formData.clientSSN) newErrors.clientSSN = "ID/HETU Required";
    if (!formData.amountEuro || formData.amountEuro <= 0) newErrors.amountEuro = "Required > 0";
    if (!formData.location) newErrors.location = "Required";
    if (!formData.marketingChannel) newErrors.marketingChannel = "Please select an option";
    
    if ((formData.weightGoldTotal <= 0) && (formData.weightSilverTotal <= 0)) {
       newErrors.weightGoldTotal = "Total Gold weight is required";
    }

    if (formData.weightGold8k + formData.weightGold18k + formData.weightGold22k + formData.weightGold24k > formData.weightGoldTotal) {
        newErrors.weightGoldSplit = "The sum of 8k, 18k, 22k, and 24k exceeds the Total Gold Weight.";
    }
    
    const silverSplits = formData.weightSilver800 + formData.weightSilver925 + formData.weightSilver830 + formData.weightSilver999;
    if (silverSplits > formData.weightSilverTotal) {
        newErrors.weightSilverSplit = "The sum of Silver parts exceeds the Total Silver Weight.";
    }

    if (!isIbanUnavailable) {
      if (!isValidFinnishIBAN(formData.iban)) {
        newErrors.iban = "Invalid IBAN. Must be FI + 16 digits.";
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleInitialSubmit = () => {
    if (validate()) {
      setStep('confirm');
    }
  };

  const handleFinalConfirm = () => {
    onSave({
      ...formData,
      iban: isIbanUnavailable ? 'NO_ACCOUNT' : formData.iban,
      weightSilver813: weightSilver813_Calculated,
      userId: currentDriverId, // Use the passed currentDriverId
      region: initialData?.region || 'Default Region', // Region can be kept as default or made selectable
      comments,
      id: initialData?.id || crypto.randomUUID(),
      timestamp: initialData?.timestamp || Date.now(),
      receiptImageBase64: imagePreview,
      isPaid: initialData?.isPaid ?? false, // Preserve if editing, default false for new
      isSentToBank: initialData?.isSentToBank ?? false, // Preserve if editing, default false for new
    });
  };

  const getInputClass = (fieldName: string, baseClass: string = "") => {
    const hasError = !!errors[fieldName];
    return `${baseClass} ${hasError 
      ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900 placeholder-red-300' 
      : 'border-slate-300 bg-slate-50 focus:ring-blue-500'}`;
  };

  if (step === 'camera') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-blue-100 to-indigo-100 animate-fadeIn">
        <div className="bg-white p-4 shadow-sm flex items-center">
          <button onClick={onCancel} className="p-2 -ml-2 text-slate-600 hover:text-blue-600 transition-colors" aria-label="Back to Dashboard">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="ml-2 font-bold text-lg text-slate-800">New Sale Entry</h2>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-center space-y-2 max-w-xs animate-slideInFromBottom">
            <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-semibold text-slate-800">Scan Documents</h3>
            <p className="text-slate-600 text-sm">Photograph Receipt OR Handwritten scale notes.</p>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs bg-blue-600 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-blue-300 active:scale-95 transition-all flex items-center justify-center gap-3 animate-pulse-once"
            aria-label="Take Photo of Receipt"
          >
            <Camera className="w-6 h-6" />
            Take Photo
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden" 
            aria-hidden="true"
          />
          
          <button onClick={onCancel} className="text-slate-500 font-medium py-2 hover:text-red-500 transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 pb-24 relative animate-fadeIn">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-fadeIn">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-blue-900 font-semibold text-lg animate-pulse">Reading OCR data...</p>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
           <button onClick={startWithCamera ? () => setStep('camera') : onCancel} className="p-2 -ml-2 mr-2 text-slate-500 hover:text-blue-600 transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-slate-800">Verify Details</h2>
        </div>
        <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
           {isProcessing ? 'SCANNING' : (initialData?.id ? 'EDITING' : 'NEW ENTRY')}
        </div>
      </div>

      {/* Image Preview (Small) */}
      {imagePreview && (
        <div className="bg-slate-900 p-4 flex justify-center">
          <img src={imagePreview} alt="Receipt Preview" className="h-48 object-contain rounded-lg border border-slate-700 shadow-lg" />
        </div>
      )}

      {/* Form Fields */}
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        
        {errors.general && (
           <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex gap-2 items-start text-sm animate-pulse">
             <AlertCircle className="w-5 h-5 shrink-0" />
             <p>{errors.general}</p>
           </div>
        )}

        {/* Section: Transaction Basic */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-slideInFromRight">
           <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Transaction Details</h3>
           <div id="field-receiptNumber">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                Receipt Number <span className="text-xs text-slate-400">(Digits Only)</span>
              </label>
              <input 
                type="text" 
                inputMode="numeric"
                value={formData.receiptNumber}
                onChange={e => setFormData({...formData, receiptNumber: e.target.value.replace(/\D/g, '')})}
                className={getInputClass('receiptNumber', "w-full p-3 border rounded-lg outline-none font-bold text-lg tracking-wide focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all")}
                placeholder="12345"
                aria-required="true"
              />
              {errors.receiptNumber && <p className="text-red-600 text-xs mt-1 font-semibold" role="alert">{errors.receiptNumber}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
               <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all"
                aria-required="true"
              />
            </div>
             <div id="field-location">
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className={getInputClass('location', "w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all")}
                placeholder="City..."
                aria-required="true"
              />
              {errors.location && <p className="text-red-600 text-xs mt-1" role="alert">{errors.location}</p>}
            </div>
            </div>
        </div>

        {/* Section: Client */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-slideInFromRight delay-100">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Client Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div id="field-firstName">
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className={getInputClass('firstName', "w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all")}
                placeholder="Mikael"
                aria-required="true"
              />
               {errors.firstName && <p className="text-red-600 text-xs mt-1" role="alert">{errors.firstName}</p>}
            </div>
            <div id="field-lastName">
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input 
                type="text" 
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className={getInputClass('lastName', "w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all")}
                placeholder="Hakala"
                aria-required="true"
              />
              {errors.lastName && <p className="text-red-600 text-xs mt-1" role="alert">{errors.lastName}</p>}
            </div>
          </div>
          
          <div id="field-clientSSN">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Personal ID / HETU <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.clientSSN}
                onChange={e => setFormData({...formData, clientSSN: e.target.value})}
                className={getInputClass('clientSSN', "w-full p-3 border rounded-lg outline-none font-mono focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all")}
                placeholder="DDMMYY-XXXX"
                aria-required="true"
              />
              {errors.clientSSN && <p className="text-red-600 text-xs mt-1" role="alert">{errors.clientSSN}</p>}
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email
               </label>
               <input 
                 type="email" 
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all"
                 placeholder="client@example.com"
               />
            </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  Phone Number
               </label>
               <input 
                 type="tel" 
                 value={formData.phoneNumber}
                 onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                 className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all"
                 placeholder="040 123 4567"
               />
            </div>
          </div>

          <div id="field-iban">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">
                IBAN (Bank Account) {!isIbanUnavailable && <span className="text-red-500">*</span>}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none bg-slate-50 px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 transition-colors">
                 <input 
                    type="checkbox"
                    checked={isIbanUnavailable}
                    onChange={e => {
                        setIsIbanUnavailable(e.target.checked);
                        if (e.target.checked) {
                            setErrors(prev => {
                                const { iban, ...rest } = prev;
                                return rest;
                            });
                        }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Account number not available"
                 />
                 <span className="font-medium text-xs sm:text-sm">Account number not available</span>
              </label>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                value={formData.iban}
                disabled={isIbanUnavailable}
                onChange={handleIbanChange}
                className={`w-full p-3 border rounded-lg font-mono tracking-wide outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 transition-all
                  ${!isIbanUnavailable && ibanTouched && isIbanInvalidRealtime 
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900 pr-10' 
                    : errors.iban 
                      ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                      : 'border-slate-300 bg-slate-50'}`}
                placeholder={isIbanUnavailable ? "No IBAN provided" : "FI12 3456 7890 1234 56"}
                aria-required={!isIbanUnavailable}
                aria-invalid={!isIbanUnavailable && (ibanTouched && isIbanInvalidRealtime || !!errors.iban)}
              />
              {!isIbanUnavailable && ibanTouched && isIbanInvalidRealtime && (
                <div className="absolute right-3 top-3.5 text-red-500 animate-pulse" aria-hidden="true">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            {((errors.iban && !isIbanUnavailable) || (!isIbanUnavailable && ibanTouched && isIbanInvalidRealtime)) && (
              <div className="bg-red-50 text-red-700 p-2 mt-2 rounded border border-red-200 text-sm flex gap-2 items-center animate-in slide-in-from-top-1" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.iban || "Invalid Finnish IBAN format (FI + 16 digits)"}
              </div>
            )}
          </div>
        </div>

        {/* Section: Financials */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-slideInFromRight delay-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Price</h3>
            {isQualifyingBonus && (
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                <Sparkles className="w-3 h-3" />
                BONUS DEAL
              </div>
            )}
          </div>
           <div id="field-amountEuro">
               <label className="block text-sm font-medium text-slate-700 mb-1">Sale Price (€)</label>
               <input 
                type="number" 
                inputMode="decimal"
                value={formData.amountEuro || ''}
                onChange={e => setFormData({...formData, amountEuro: parseFloat(e.target.value) || 0})}
                className={getInputClass('amountEuro', "w-full p-3 border rounded-lg text-lg font-semibold outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all")}
                placeholder="0.00"
                aria-required="true"
              />
              {errors.amountEuro && <p className="text-red-600 text-xs mt-1" role="alert">{errors.amountEuro}</p>}
            </div>
        </div>

        {/* Section: Measurements */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-6 animate-slideInFromRight delay-300">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Measurements & Purity</h3>
          
          {/* Gold Section */}
          <div className={`bg-yellow-50/50 p-4 rounded-lg border space-y-3 ${errors.weightGoldSplit ? 'border-red-500 ring-2 ring-red-100' : 'border-yellow-100'}`}>
             <div className="flex justify-between items-center mb-2" id="field-weightGoldTotal">
                <label className="block text-lg font-bold text-yellow-800">GOLD Total</label>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={formData.weightGoldTotal || ''}
                      onChange={e => setFormData({...formData, weightGoldTotal: parseFloat(e.target.value) || 0})}
                      className={getInputClass('weightGoldTotal', "w-32 p-2 bg-white border rounded outline-none text-right font-mono font-bold text-lg focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all")}
                      placeholder="0.00"
                      aria-required="true"
                    />
                    <span className="text-yellow-800 font-bold">g</span>
                  </div>
                  {errors.weightGoldTotal && <span className="text-red-600 text-xs font-bold mt-1" role="alert">{errors.weightGoldTotal}</span>}
                </div>
             </div>
             
             {/* Gold Splitter */}
             <div className="bg-white rounded-md border border-yellow-200 divide-y divide-yellow-100 overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-yellow-50">
                   <span className="font-semibold text-sm text-yellow-900">14k (585) - <span className="font-normal italic">Remainder</span></span>
                   <span className="font-mono text-yellow-900">{weightGold14k.toFixed(2)} g</span>
                </div>
                <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">8k (333)</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightGold8k || ''}
                     onChange={e => setFormData({...formData, weightGold8k: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
                <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">18k (750)</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightGold18k || ''}
                     onChange={e => setFormData({...formData, weightGold18k: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
                <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">22k (916)</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightGold22k || ''}
                     onChange={e => setFormData({...formData, weightGold22k: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
                <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">24k (999)</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightGold24k || ''}
                     onChange={e => setFormData({...formData, weightGold24k: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
             </div>
             {errors.weightGoldSplit && (
               <div className="bg-red-50 text-red-700 p-2 rounded text-xs flex gap-2 items-center font-semibold" role="alert">
                 <AlertTriangle className="w-4 h-4 text-red-600" />
                 {errors.weightGoldSplit}
               </div>
             )}
          </div>

          {/* Silver Section */}
          <div className={`bg-slate-100/50 p-4 rounded-lg border space-y-3 ${errors.weightSilverSplit ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'}`}>
             <div className="flex justify-between items-center mb-2">
                <label className="block text-lg font-bold text-slate-700">SILVER Total</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={formData.weightSilverTotal || ''}
                    onChange={e => setFormData({...formData, weightSilverTotal: parseFloat(e.target.value) || 0})}
                    className="w-32 p-2 bg-white border border-slate-300 rounded outline-none text-right font-mono font-bold text-lg focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                    placeholder="0.00"
                  />
                  <span className="text-slate-700 font-bold">g</span>
                </div>
             </div>

              {/* Silver Splitter */}
             <div className="bg-white rounded-md border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-slate-50">
                   <span className="font-semibold text-sm text-slate-900">.813 - <span className="font-normal italic">Remainder/Default</span></span>
                   <span className="font-mono text-slate-900">{weightSilver813_Calculated.toFixed(2)} g</span>
                </div>
                 <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">.800</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightSilver800 || ''}
                     onChange={e => setFormData({...formData, weightSilver800: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
                 <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">.830</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightSilver830 || ''}
                     onChange={e => setFormData({...formData, weightSilver830: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
                 <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">.925</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightSilver925 || ''}
                     onChange={e => setFormData({...formData, weightSilver925: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
                 <div className="flex justify-between items-center p-2">
                   <span className="font-medium text-sm text-slate-600 pl-1">.999</span>
                   <input 
                     type="number"
                     inputMode="decimal"
                     placeholder="0.00"
                     value={formData.weightSilver999 || ''}
                     onChange={e => setFormData({...formData, weightSilver999: parseFloat(e.target.value) || 0})}
                     className="w-24 p-1 text-right border-b border-slate-200 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                   />
                </div>
             </div>
             {errors.weightSilverSplit && (
               <div className="bg-red-50 text-red-700 p-2 rounded text-xs flex gap-2 items-center font-semibold" role="alert">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  {errors.weightSilverSplit}
               </div>
             )}
          </div>
        </div>
        
        {/* Section: Marketing */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromRight delay-400" id="field-marketingChannel">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-blue-500" />
            How did you hear about us?
          </label>
          <select
            value={formData.marketingChannel}
            onChange={e => setFormData({...formData, marketingChannel: e.target.value})}
            className={getInputClass('marketingChannel', "w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all")}
            aria-required="true"
          >
            <option value="" disabled>Select an option...</option>
            {MARKETING_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.marketingChannel && <p className="text-red-600 text-xs mt-1" role="alert">{errors.marketingChannel}</p>}
        </div>

        {/* Section: Comments */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromRight delay-500">
           <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
           <textarea 
             value={comments}
             onChange={e => setComments(e.target.value)}
             className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 h-24 resize-none transition-all"
             placeholder="Any special remarks..."
           />
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-xl z-40 pb-6 animate-slideInFromBottom">
        <button 
          onClick={handleInitialSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          aria-label="Verify and Save"
        >
          <Save className="w-5 h-5" />
          VERIFY & SAVE
        </button>
      </div>

      {/* Confirmation Modal */}
      {step === 'confirm' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideInFromBottom duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Confirm Sale
              </h3>
              <button onClick={() => setStep('edit')} className="p-1 hover:bg-blue-500 rounded-full transition-colors" aria-label="Close confirmation">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-slate-600 text-sm text-center">
                Please double check the critical payout information below before finalizing.
              </p>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                  <span className="text-blue-700 text-sm font-medium">Client Name</span>
                  <span className="font-bold text-slate-900">{formData.firstName} {formData.lastName}</span>
                </div>
                 <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                  <span className="text-blue-700 text-sm font-medium">Receipt #</span>
                  <span className="font-bold text-red-600">{formData.receiptNumber}</span>
                </div>
                <div className="flex flex-col border-b border-blue-200 pb-2">
                  <span className="text-blue-700 text-sm font-medium mb-1">IBAN Account</span>
                  <span className="font-mono font-bold text-slate-900 text-lg break-all">
                    {isIbanUnavailable ? (
                      <span className="flex items-center gap-1 text-slate-500 text-base">
                        <Ban className="w-4 h-4" /> No Account
                      </span>
                    ) : (
                      formData.iban
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 text-sm font-medium">Payout Amount</span>
                  <span className="font-bold text-emerald-600 text-3xl">
                    {formData.amountEuro?.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                
                {/* Bonus Badge in Confirm Screen */}
                {isQualifyingBonus && (
                  <div className="bg-emerald-100 border border-emerald-300 p-3 rounded-lg flex items-center gap-2 shadow-sm animate-pulse">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">This sale qualifies for a Bonus!</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleFinalConfirm}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-emerald-300 active:scale-[0.98] transition-all"
                aria-label={initialData ? 'Update Record' : 'Information Correct'}
              >
                {initialData ? 'UPDATE RECORD' : 'INFORMATION CORRECT'}
              </button>
              
              <button 
                onClick={() => setStep('edit')}
                className="w-full text-slate-500 py-2 text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Go Back & Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
