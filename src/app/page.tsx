"use client";
import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import PlayerInput from "./components/PlayerInput";

export default function Home() {
  // Always show the main app, hide landing page
  // const [showDemo, setShowDemo] = useState(false);
  const [names, setNames] = useState("");
  const [payments, setPayments] = useState<string[]>([]);
  const [paid, setPaid] = useState<{ [name: string]: boolean }>({});
  const [teams, setTeams] = useState<{ bib: string[]; nobib: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [teamNames, setTeamNames] = useState<{ bib: string; nobib: string }>({ bib: "Bib", nobib: "No Bib" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shadowRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [whatsAppPaste, setWhatsAppPaste] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (shadowRef.current && textareaRef.current) {
      shadowRef.current.value = names || " ";
      setTextareaHeight(`${shadowRef.current.scrollHeight}px`);
    }
  }, [names]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedNames = localStorage.getItem("fiveaside_names");
    const savedPaid = localStorage.getItem("fiveaside_paid");
    const savedTeams = localStorage.getItem("fiveaside_teams");
    const savedTeamNames = localStorage.getItem("fiveaside_teamnames");
    if (savedNames) {
      setNames(savedNames);
      const playerList = savedNames
        .split("\n")
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      setPayments(playerList);
      if (savedPaid) {
        try {
          setPaid(JSON.parse(savedPaid));
        } catch {}
      }
      if (savedTeams) {
        try {
          setTeams(JSON.parse(savedTeams));
        } catch {}
      }
    }
    if (savedTeamNames) {
      try {
        setTeamNames(JSON.parse(savedTeamNames));
      } catch {}
    }
  }, []);

  // Save to localStorage when names or paid changes
  useEffect(() => {
    localStorage.setItem("fiveaside_names", names);
    localStorage.setItem("fiveaside_paid", JSON.stringify(paid));
  }, [names, paid]);

  // Save teams to localStorage when teams change
  useEffect(() => {
    if (teams) {
      localStorage.setItem("fiveaside_teams", JSON.stringify(teams));
    }
  }, [teams]);

  // Save team names to localStorage when changed
  useEffect(() => {
    localStorage.setItem("fiveaside_teamnames", JSON.stringify(teamNames));
  }, [teamNames]);

  // WhatsApp parsing utility
  function parseWhatsAppNames(text: string): string[] {
    // WhatsApp format: [date, time] Name: message
    // Support both desktop and mobile formats
    const lines = text.split(/\r?\n/);
    const names = lines
      .map(line => {
        // Match: [dd/mm] or [dd/mm/yyyy], time (12/24h), optional am/pm, Name:
        const match = line.match(/\[\d{2}\/\d{2}(?:\/\d{4})?, \d{1,2}:\d{2}(?::\d{2})?\s?(?:am|pm)?\] ([^:]+):/i);
        if (match) {
          // Remove leading non-letters and trim
          let name = match[1].trim().replace(/^[^A-Za-z]+/, "");
          // Only first word (first name)
          name = name.split(" ")[0];
          // Only allow names that start with a letter
          if (/^[A-Za-z]/.test(name)) {
            return name;
          }
        }
        return null;
      })
      .filter(Boolean) as string[];
    // Remove duplicates and empty
    return Array.from(new Set(names)).filter(Boolean);
  }

  // Handler for WhatsApp paste button (show modal/section)
  const handlePasteFromWhatsApp = () => {
    setShowPasteModal(true);
    setWhatsAppPaste("");
  };

  // Handler for parsing WhatsApp data from modal/section
  const handleParseWhatsApp = () => {
    const namesArr = parseWhatsAppNames(whatsAppPaste);
    setNames(namesArr.join("\n"));
    setPayments(namesArr);
    setPaid({});
    setShowPasteModal(false);
    setWhatsAppPaste("");
  };

  // Enhance manual paste: if WhatsApp format detected, auto-parse
  const handleNamesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Detect WhatsApp format
    if (/^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/m.test(value)) {
      const namesArr = parseWhatsAppNames(value);
      setNames(namesArr.join("\n"));
      setPayments(namesArr);
      setPaid({});
      return;
    }
    setNames(value);
    const playerList = value
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    setPayments(playerList);
    // Remove paid status for names that are no longer present
    setPaid((prev) => {
      const updated: { [name: string]: boolean } = {};
      playerList.forEach((name) => {
        updated[name] = prev[name] || false;
      });
      return updated;
    });
  };

  // Toggle payment status
  const handlePaidToggle = (name: string) => {
    setPaid((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Generate teams
  const handleGenerateTeams = () => {
    const shuffled = [...payments].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    setTeams({
      bib: shuffled.slice(0, mid),
      nobib: shuffled.slice(mid),
    });
    setCopied(false);
  };

  // Copy teams to clipboard (with fallback)
  const handleCopyAndShare = async () => {
    if (!teams) return;
    const bib = teams.bib.join("\n");
    const nobib = teams.nobib.join("\n");
    const text = `*${teamNames.bib}*\n${bib}\n\n*${teamNames.nobib}*\n${nobib}`;

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({ text });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // User cancelled or not supported, fall through to WhatsApp
      }
    }

    // WhatsApp share link (mobile or desktop)
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");

    // Also copy to clipboard as fallback
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start Over handler
  const handleStartOver = () => {
    setNames("");
    setPayments([]);
    setPaid({});
    setTeams(null);
    setCopied(false);
    setTeamNames({ bib: "Bib", nobib: "No Bib" });
    localStorage.removeItem("fiveaside_names");
    localStorage.removeItem("fiveaside_paid");
    localStorage.removeItem("fiveaside_teams");
    localStorage.removeItem("fiveaside_teamnames");
  };

  // Handle team name change
  const handleTeamNameChange = (key: "bib" | "nobib", value: string) => {
    setTeamNames((prev) => ({ ...prev, [key]: value }));
  };

  // Swap player between teams
  const handleSwapPlayer = (player: string, from: 'bib' | 'nobib') => {
    if (!teams) return;
    const fromTeam = [...teams[from]];
    const toTeamKey = from === 'bib' ? 'nobib' : 'bib';
    const toTeam = [...teams[toTeamKey], player];
    const newFromTeam = fromTeam.filter((name) => name !== player);
    setTeams({
      ...teams,
      [from]: newFromTeam,
      [toTeamKey]: toTeam,
    });
  };

  // Place the entire main app UI in a variable for clarity
  const mainApp = (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-green-700 via-green-500 to-green-800 py-10 px-2">
      <header className="w-full max-w-3xl mx-auto mt-4 mb-6 px-4 py-4 rounded-2xl bg-white/20 border border-white/30 shadow-lg flex flex-col items-center relative">
        <h1
          className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg text-center animate-fadeInUp"
        >
          Team Picker & Payment Tracker
        </h1>
        <p
          className="text-lg md:text-xl font-semibold mt-0 mb-2 text-center drop-shadow-md animate-fadeInUp bg-gradient-to-r from-yellow-300 via-yellow-400 to-green-200 bg-clip-text text-transparent"
          style={{ animationDelay: '0.2s' }}
        >
          The <span className="underline decoration-yellow-500 decoration-4 underline-offset-2">ONLY</span> tool YOU need to manage YOUR games!
        </p>
      </header>
      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col items-center gap-4 relative">
            <button
              className="absolute top-2 right-2 text-green-900 hover:text-red-600 text-2xl font-bold focus:outline-none"
              onClick={() => setShowInfo(false)}
              aria-label="Close How to Use"
              type="button"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-green-900 mb-2">How to use</h2>
            <ul className="text-green-900 text-base list-disc list-inside space-y-2 text-left">
              <li>Enter player names manually, or use <b>Paste from WhatsApp</b> to quickly add your group.</li>
              <li>Mark who has paid using the checkboxes.</li>
              <li>Click <b>Generate Teams</b> to split players randomly.</li>
              <li>Edit team names or swap players between teams as needed.</li>
              <li>Share teams via WhatsApp or copy to clipboard.</li>
            </ul>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8 mb-8 w-full max-w-4xl justify-center">
        {/* Player Names */}
        <PlayerInput
          names={names}
          setNames={setNames}
          textareaRef={textareaRef}
          shadowRef={shadowRef}
          textareaHeight={textareaHeight}
          handleNamesChange={handleNamesChange}
          handlePasteFromWhatsApp={handlePasteFromWhatsApp}
          showPasteModal={showPasteModal}
          setShowPasteModal={setShowPasteModal}
          whatsAppPaste={whatsAppPaste}
          setWhatsAppPaste={setWhatsAppPaste}
          handleParseWhatsApp={handleParseWhatsApp}
        />
        {/* Payments - side by side */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-full">
            <label className="text-xl font-bold text-white mb-3 block text-center tracking-wide">Payment Tracker</label>
            <div className="rounded-2xl bg-white/90 p-4 shadow-xl border border-green-200 transition-all duration-200 hover:shadow-2xl focus-within:shadow-2xl flex flex-col gap-2 min-h-[120px]">
              {payments.length === 0 && (
                <span className="text-gray-400 text-center mt-24">No players yet</span>
              )}
              {payments.map((name, idx) => (
                <label key={name} className="flex items-center gap-2 text-lg cursor-pointer select-none hover:bg-green-50 rounded px-2 py-1 transition">
                  <span className="w-6 text-right text-gray-500 font-mono">{idx + 1}.</span>
                  <input
                    type="checkbox"
                    checked={!!paid[name]}
                    onChange={() => handlePaidToggle(name)}
                    className="accent-green-600 w-5 h-5"
                  />
                  <span className={paid[name] ? "line-through text-gray-500" : "text-green-900 font-medium"}>{name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Generate Teams Button Area */}
      <div className="flex flex-col items-center w-full my-6">
        {/* <span className="text-base md:text-lg text-black font-medium mb-2 text-center">Click to randomly split players into two teams!</span> */}
        <button
          className={`flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-green-300 hover:from-yellow-500 hover:to-green-400 text-green-900 font-extrabold py-3 px-12 rounded-full shadow-2xl border-2 border-green-900 transition-all duration-200 text-2xl focus:outline-none focus:ring-4 focus:ring-green-300 active:scale-95 ${payments.length < 2 ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
          onClick={handleGenerateTeams}
          disabled={payments.length < 2}
          aria-label="Generate random teams"
          type="button"
        >
          <img src="/shuffle.svg" alt="Shuffle icon" className="w-7 h-7 mr-1" />
          Generate Teams
        </button>
      </div>
      {/* Start Over Button */}
      <button
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-8 rounded-full shadow-lg border border-red-900 transition mb-8 text-lg"
        onClick={handleStartOver}
      >
        Start Over
      </button>
      {/* Teams Display */}
      {teams && (
        <div className="w-full max-w-xl flex flex-col md:flex-row items-stretch gap-6 mb-4">
          {/* Bib Team Card */}
          <div className="flex-1 bg-white/90 rounded-2xl p-4 shadow-2xl border-2 border-green-700 relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 rounded-t-2xl bg-green-400" />
            <input
              className="text-xl font-extrabold text-green-800 mb-3 text-center w-full bg-transparent border-b-2 border-green-300 focus:outline-none focus:border-green-700 transition py-1"
              value={teamNames.bib}
              onChange={e => handleTeamNameChange("bib", e.target.value)}
              maxLength={32}
              aria-label="Edit Bib team name"
            />
            <ul className="text-lg text-green-900 font-medium list-none flex flex-col gap-2 mt-2">
              {teams.bib.map((name) => (
                <li key={name} className="flex items-center justify-between gap-2 group transition-all">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-400" aria-hidden="true"></span>
                    {name}
                  </span>
                  <button
                    className="ml-2 p-2 bg-green-100 hover:bg-green-300 text-green-900 rounded-full transition text-lg font-bold border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={() => handleSwapPlayer(name, 'bib')}
                    title="Move to other team"
                    aria-label={`Move ${name} to No Bib team`}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* No Bib Team Card */}
          <div className="flex-1 bg-white/90 rounded-2xl p-4 shadow-2xl border-2 border-blue-700 relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 rounded-t-2xl bg-blue-400" />
            <input
              className="text-xl font-extrabold text-blue-800 mb-3 text-center w-full bg-transparent border-b-2 border-blue-300 focus:outline-none focus:border-blue-700 transition py-1"
              value={teamNames.nobib}
              onChange={e => handleTeamNameChange("nobib", e.target.value)}
              maxLength={32}
              aria-label="Edit No Bib team name"
            />
            <ul className="text-lg text-blue-900 font-medium list-none flex flex-col gap-2 mt-2">
              {teams.nobib.map((name) => (
                <li key={name} className="flex items-center justify-between gap-2 group transition-all">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-400" aria-hidden="true"></span>
                    {name}
                  </span>
                  <button
                    className="ml-2 p-2 bg-blue-100 hover:bg-blue-300 text-blue-900 rounded-full transition text-lg font-bold border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => handleSwapPlayer(name, 'nobib')}
                    title="Move to other team"
                    aria-label={`Move ${name} to Bib team`}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <button
        className={`mt-2 flex items-center justify-center gap-2 w-full max-w-xs mx-auto py-3 px-8 rounded-full text-lg font-extrabold shadow-2xl border-2 border-green-900 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 active:scale-95
          ${copied ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-green-500 via-green-400 to-green-600 hover:from-green-600 hover:to-green-400 text-white hover:scale-105'}
          `}
        onClick={handleCopyAndShare}
        aria-label="Share teams via WhatsApp"
        title="Share your teams instantly on WhatsApp!"
        type="button"
      >
        <img src="/whatsapp.svg" alt="WhatsApp logo" className="w-7 h-7 mr-1" />
        {copied ? (
          <span className="flex items-center gap-1">
            <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Copied!
          </span>
        ) : (
          'Share to WhatsApp'
        )}
      </button>
      <footer className="mt-auto text-center text-white/80 text-sm pt-10 flex flex-col items-center gap-2">
        <span>⚽ 5-a-side Team Picker & Payment Tracker</span>
        <a
          href="https://buymeacoffee.com/sbarcoe"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-2 px-4 rounded-full shadow border border-yellow-600 transition text-base mt-2"
          style={{ textDecoration: 'none' }}
        >
          <span role="img" aria-label="coffee">☕</span> Buy Me a Coffee
        </a>
      </footer>

      {/* Floating Feedback Button */}
      <button
        className="fixed z-50 bottom-6 right-6 bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-5 rounded-full shadow-lg border-2 border-green-900 transition text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
        aria-label="Send Feedback"
        onClick={() => setShowFeedback(true)}
        type="button"
      >
        Feedback
      </button>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col items-center relative p-2 sm:p-4 mx-2">
            <button
              className="absolute top-2 right-2 text-green-900 hover:text-red-600 text-2xl font-bold focus:outline-none"
              onClick={() => setShowFeedback(false)}
              aria-label="Close Feedback Form"
              type="button"
            >
              ×
            </button>
            <iframe
              src="https://tally.so/r/w2YWAL"
              title="Feedback Form"
              className="w-full rounded-b-xl border-0"
              style={{ minHeight: '340px', height: '70vh', maxHeight: '90vh' }}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );

  // Landing page content (hidden for now)
  // const landing = ( ... );

  // Always show mainApp
  return mainApp;
}
