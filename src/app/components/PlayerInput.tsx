import React from "react";

interface PlayerInputProps {
  names: string;
  setNames: (names: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  shadowRef: React.RefObject<HTMLTextAreaElement | null>;
  textareaHeight: string;
  handleNamesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handlePasteFromWhatsApp: () => void;
  showPasteModal: boolean;
  setShowPasteModal: (show: boolean) => void;
  whatsAppPaste: string;
  setWhatsAppPaste: (text: string) => void;
  handleParseWhatsApp: () => void;
}

const PlayerInput: React.FC<PlayerInputProps> = ({
  names,
  setNames,
  textareaRef,
  shadowRef,
  textareaHeight,
  handleNamesChange,
  handlePasteFromWhatsApp,
  showPasteModal,
  setShowPasteModal,
  whatsAppPaste,
  setWhatsAppPaste,
  handleParseWhatsApp,
}) => {
  return (
    <div className="flex flex-col items-center flex-1">
      <div className="w-full">
        <label className="text-xl font-bold text-green-900 mb-3 block text-center tracking-wide">Enter Player Names</label>
        <div className="rounded-2xl bg-white/90 p-4 shadow-xl border border-green-200 transition-all duration-200 hover:shadow-2xl focus-within:shadow-2xl">
          <textarea
            ref={textareaRef}
            className="w-full rounded-xl bg-white/80 p-4 text-lg shadow focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-black placeholder:text-gray-500 min-h-[120px] md:min-h-[320px] max-h-[500px]"
            placeholder="Type one name per line..."
            value={names}
            onChange={handleNamesChange}
            style={{ height: textareaHeight, minHeight: '120px', maxHeight: '500px' }}
            rows={4}
          />
          {/* Shadow textarea for auto-sizing (hidden) */}
          <textarea
            ref={shadowRef}
            className="absolute top-0 left-0 w-full p-4 text-lg opacity-0 pointer-events-none h-0 resize-none text-black"
            tabIndex={-1}
            aria-hidden
            readOnly
            rows={1}
          />
        </div>
      </div>
      <div className="flex items-center w-full justify-center my-2">
        <span className="text-white text-sm font-bold px-2 py-1 bg-green-800 rounded-full shadow">OR</span>
      </div>
      <button
        className="mb-2 bg-green-700 hover:bg-green-800 text-white font-bold py-1 px-4 rounded-full shadow border border-green-900 transition text-base"
        onClick={handlePasteFromWhatsApp}
        type="button"
      >
        Paste from WhatsApp
      </button>
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col items-center gap-4">
            <h2 className="text-lg font-bold text-green-900">Paste WhatsApp Data</h2>
            <textarea
              className="w-full rounded bg-gray-100 p-3 text-base text-black border border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              rows={8}
              placeholder="Paste your WhatsApp messages here... (works on mobile and desktop)"
              value={whatsAppPaste}
              onChange={e => setWhatsAppPaste(e.target.value)}
            />
            <div className="flex gap-4 w-full justify-end">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-green-900 font-bold py-2 px-4 rounded"
                onClick={() => setShowPasteModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded"
                onClick={handleParseWhatsApp}
                type="button"
              >
                Parse WhatsApp Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerInput; 