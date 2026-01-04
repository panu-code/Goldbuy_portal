import React, { useState } from 'react';
import { Truck, ChevronRight } from 'lucide-react';

interface UserSelectionScreenProps {
  onSelectDriver: (driverId: string) => void;
}

const DRIVER_OPTIONS = [
  "Truck 1 Driver",
  "Truck 2 Driver",
  "Truck 3 Driver",
  "Truck 4 Driver",
  "Truck 5 Driver",
  "Truck 6 Driver",
];

export const UserSelectionScreen: React.FC<UserSelectionScreenProps> = ({ onSelectDriver }) => {
  const [selectedDriver, setSelectedDriver] = useState<string>('');

  const handleSubmit = () => {
    if (selectedDriver) {
      onSelectDriver(selectedDriver);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 text-center animate-fadeIn">
      <div className="bg-white/10 p-4 rounded-full mb-6 shadow-xl animate-bounce-in-slow">
        <Truck className="w-16 h-16 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-3 animate-slideInFromBottom delay-100">Welcome to GoldBuy Portal</h1>
      <p className="text-blue-100 text-lg mb-8 animate-slideInFromBottom delay-200">Please select your driver profile to begin.</p>

      <div className="w-full max-w-xs space-y-4 animate-slideInFromBottom delay-300">
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          className="w-full p-4 bg-white text-slate-800 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-base"
          aria-label="Select Driver Profile"
        >
          <option value="" disabled>Select your truck/driver...</option>
          {DRIVER_OPTIONS.map((driver) => (
            <option key={driver} value={driver}>{driver}</option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={!selectedDriver}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-lg py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2
            disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
          aria-label="Confirm Selection"
        >
          Confirm
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-blue-200 text-sm mt-8 animate-fadeIn delay-500">Your selection will be remembered.</p>
    </div>
  );
};
