import React from 'react';
import { Lightbulb, Camera, Calculator, Table2, Cloud, HardDrive, AlertTriangle, Info, CheckCircle, Diamond, DollarSign, Waypoints, Zap, Save, Truck, Clock, Banknote, Users } from 'lucide-react'; 

export const InfoView: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-slate-50 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-md z-10">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="w-6 h-6" />
          GoldBuy Portal: Info & Help
        </h1>
        <p className="text-blue-100 text-sm mt-1">Everything you need to know to use the app effectively.</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-8 pb-24">

        {/* Introduction */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromBottom">
          <h2 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            Welcome to GoldBuy Portal!
          </h2>
          <p className="text-slate-600 text-sm space-y-2">
            This portal is your essential tool for efficiently managing gold and silver purchases across multiple trucks/drivers. It streamlines the process of digitizing receipts, accurately calculating gold values, and tracking individual sales and potential bonuses.
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-3 space-y-1">
            <li><strong className="text-slate-800">Scan & Digitize:</strong> Use your device's camera to capture receipt data.</li>
            <li><strong className="text-slate-800">Calculate Bonuses:</strong> Instantly see potential bonus earnings based on deal profitability.</li>
            <li><strong className="text-slate-800">Track Sales:</strong> Keep a clear record of all transactions.</li>
            <li><strong className="text-slate-800">Multi-Driver Support:</strong> Manage sales across different truck drivers.</li>
            <li><strong className="text-slate-800">Bulk Payments:</strong> Export payment-ready CSV files for your bank.</li>
          </ul>
        </section>

        {/* Key Functions */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromBottom delay-100">
          <h2 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-600" />
            Key Functions Explained
          </h2>

          <div className="space-y-6">
            {/* Driver Selection */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-blue-500" /> Driver Selection (Multi-Truck Management)
              </h3>
              <p className="text-slate-600 text-sm">
                At startup, you'll be prompted to select your driver profile. This associates all your sales data with your specific truck/driver ID.
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                <li><strong className="text-slate-800">Persistent Selection:</strong> Your selection is saved locally, so you won't need to choose every time.</li>
                <li><strong className="text-slate-800">Isolated Data:</strong> All dashboards and history views will display data relevant only to the currently selected driver.</li>
              </ul>
              <p className="text-xs text-slate-500 italic mt-2">
                <strong>Note:</strong> A collective "Leaderboard" for all drivers would typically be implemented on the backend (e.g., within the Google Sheet itself) due to client-side data limitations.
              </p>
            </div>

            {/* New Sale Entry */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-blue-500" /> New Sale Entry
              </h3>
              <p className="text-slate-600 text-sm">
                Start here for every new purchase. The app guides you through:
              </p>
              <ol className="list-decimal list-inside text-sm text-slate-600 mt-2 space-y-1">
                <li><strong>Taking a Photo:</strong> Capture the weighing scale display and any handwritten notes. The app's OCR (Optical Character Recognition) will attempt to extract key data.</li>
                <li><strong>Verifying Details:</strong> Always review and correct any extracted data. Fill in client information (name, ID, contact) and payout details manually.</li>
                <li><strong>Saving:</strong> Once verified, the sale is saved!</li>
              </ol>
            </div>

            {/* Gold & Silver Purity Handling */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <Diamond className="w-4 h-4 text-yellow-600" /> Gold & Silver Purity Handling
              </h3>
              <p className="text-slate-600 text-sm">
                The app supports various purities, with a default for unassigned weights:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                <li><strong>Gold:</strong> Input total gold weight. Specific purities (8k, 18k, 22k, 24k) can be entered manually. Any remaining gold weight is automatically assigned as <strong className="font-mono">14k (585)</strong>.</li>
                <li><strong>Silver:</strong> Input total silver weight. Specific purities (.800, .830, .925, .999) can be entered manually. Any remaining silver weight is automatically assigned as <strong className="font-mono">.813</strong>.</li>
              </ul>
              <p className="text-xs text-slate-500 italic mt-2">
                <strong>Tip:</strong> Be precise with specific purity weights. The rest will default.
              </p>
            </div>

            {/* Bonus Calculator */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-emerald-600" /> Bonus Calculator (Profit Driver)
              </h3>
              <p className="text-slate-600 text-sm">
                This tool helps you optimize deals and estimate potential bonuses before finalizing a purchase:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                <li><strong>Normalization:</strong> All gold is converted to a "14k equivalent" for fair comparison.</li>
                <li><strong>Bonus Threshold:</strong> You qualify for a bonus if the purchase price is <strong className="text-emerald-700">under 30€ per 14k gram</strong>.</li>
                <li><strong className="text-slate-800">Visual Feedback:</strong> As you adjust the price, observe the "Potential Bonus" counter and the "Price Paid / 14k gram" indicator changing color and size to reflect profitability and proximity to limits.</li>
                <li><strong className="text-slate-800">"Pelipuhelu" (Manager Call):</strong> If the price exceeds <strong className="font-mono">40€ per 14k gram</strong>, a manager's approval is required. Mark "Pelipuhelu Completed" after approval.</li>
                <li><strong className="text-slate-800">Manager Quick-Link:</strong> For "Pelipuhelu" situations, a dedicated button will copy all crucial deal details (price, weights, normalized price, bonus) to your clipboard for easy sharing via WhatsApp or other messaging apps.</li>
                <li><strong>Transfer to Sale:</strong> Use the "Create Sale Entry from Calculation" button to pre-fill the New Sale Entry form.</li>
              </ul>
              <p className="text-xs text-slate-500 italic mt-2">
                <strong>Formula:</strong> <code>(40€ - YourPricePerGram) × 10% × TotalWeight14k</code>
              </p>
            </div>
            
            {/* Data Masterlist */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <Table2 className="w-4 h-4 text-purple-600" /> Data Masterlist & Payment Engine
              </h3>
              <p className="text-slate-600 text-sm">
                Access your full sales history via the "View Spreadsheet Data" button from the Dashboard.
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                <li><strong className="text-slate-800">Pending Queue:</strong> A prominent section at the top will show "Unsynced Sales" (records not yet fully sent to the cloud). You can retry syncing individual records or all at once.</li>
                <li><strong>View & Edit:</strong> Browse all records, and tap the <strong className="font-mono">pencil icon</strong> to edit any entry.</li>
                <li><strong className="text-slate-800">Mark as Paid:</strong> Each record has a checkbox to mark it as 'Paid'. This helps track payments.</li>
                <li><strong className="text-slate-800">Bulk Payment Engine:</strong> Use the "Export Bank Payments (CSV)" button to generate a CSV file formatted for direct bank upload.
                  <ul className="list-circle list-inside ml-4">
                    <li>This export includes only records with valid IBANs that are currently unpaid and have not yet been included in a bank export.</li>
                    <li>After export, records are automatically marked as 'Sent to Bank' (<code>isSentToBank = true</code>) to prevent double payments.</li>
                  </ul>
                </li>
                <li><strong>Export Options:</strong>
                  <ul className="list-circle list-inside ml-4">
                    <li><strong className="text-blue-600">Daily Summary:</strong> A concise overview of daily activities.</li>
                    <li><strong className="text-green-600">Full CSV:</strong> A detailed export of all recorded sales data, including `isPaid` and `isSentToBank` statuses.</li>
                  </ul>
                </li>
                <li><strong>Reset Data:</strong> The <strong className="font-red-600">Trash2 icon</strong> allows you to delete ALL local data. Use with extreme caution!</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How the App Works */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromBottom delay-200">
          <h2 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-3">
            <Waypoints className="w-5 h-5 text-blue-600" />
            How the App Works (Under the Hood)
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-slate-500" />
                Offline-First with Local Storage
              </h3>
              <p className="text-slate-600 text-sm">
                All sales data, including driver selection, and payment statuses (`isPaid`, `isSentToBank`) are first saved directly to your device's browser using <strong className="font-mono">localStorage</strong>. This ensures that you can continue to log sales even if you lose internet connection. Data remains securely on your device until it can be synchronized.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                Cloud Synchronization (Google Sheets Webhook)
              </h3>
              <p className="text-slate-600 text-sm">
                When an internet connection is available, the app automatically attempts to send the saved sale records to the main office's Google Sheet via a secure <strong className="font-mono">webhook URL</strong>.
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                <li><strong className="text-green-600 flex items-center gap-1">Sent to Cloud <CheckCircle className="w-3 h-3"/>:</strong> Your data has been successfully transmitted.</li>
                <li><strong className="text-slate-700 flex items-center gap-1">Saved Locally <Save className="w-3 h-3"/>:</strong> Data is saved on your device and will sync when connected to the internet.</li>
              </ul>
              <p className="text-xs text-slate-500 italic mt-2">
                The Google Sheets Webhook URL is securely configured in the application environment and is not visible or editable within the app.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" /> Gemini API for OCR
              </h3>
              <p className="text-slate-600 text-sm">
                The app leverages the powerful <strong className="font-mono">Google Gemini API</strong> to perform OCR on your receipt photos, automatically extracting weights and other key information to minimize manual data entry.
              </p>
            </div>
          </div>
        </section>

        {/* Tips for Success */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromBottom delay-300">
          <h2 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Tips for Success
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">📸 OCR Best Practices:</h3>
              <ul className="list-disc list-inside text-sm text-slate-600 ml-4 space-y-1">
                <li>Ensure good, even lighting (avoid shadows).</li>
                <li>Place receipts/notes on a flat, contrasting surface.</li>
                <li>Hold the camera steady and focus clearly.</li>
                <li>Capture only the relevant information to minimize noise.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">📝 Data Entry Accuracy:</h3>
              <ul className="list-disc list-inside text-sm text-slate-600 ml-4 space-y-1">
                <li><strong className="text-red-600">Always Double-Check:</strong> OCR is helpful, but human verification is crucial, especially for IBAN and SSN.</li>
                <li>Fill out all mandatory fields (marked with an asterisk <span className="text-red-500">*</span>).</li>
                <li>Use the "Additional Notes" field for any unique sale details or client requests.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">💰 Bonus Calculator Strategy:</h3>
              <ul className="list-disc list-inside text-sm text-slate-600 ml-4 space-y-1">
                <li>Use the calculator before offering a price to optimize your bonus.</li>
                <li>Be aware of the "Pelipuhelu" requirement for high-value deals.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Important Considerations */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-slideInFromBottom delay-400">
          <h2 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Important Considerations
          </h2>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
            <li><strong>Data Security:</strong> While data is stored locally on your device, it's unencrypted browser storage. Ensure your device is secured. Sensitive information like IBAN and SSN should be handled according to company privacy policies.</li>
            <li><strong>API Key:</strong> The Gemini API key is managed externally and is not stored or accessed within the client-side code.</li>
            <li><strong>Simplified Version:</strong> This version of the portal has been streamlined for core functionality. Features like user selection, regions, and detailed hours/route tracking have been removed to simplify the user experience.</li>
          </ul>
        </section>

      </div>
    </div>
  );
};