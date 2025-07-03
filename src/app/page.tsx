"use client";
import React, { useState, useRef, useLayoutEffect, useEffect } from "react";

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

  // Calculate dynamic height for payments box (match textarea rows, min 10 rows)
  const rowHeight = 32; // px, approx for text-lg + padding

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
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 drop-shadow-lg text-center">Team Picker & Payment Tracker</h1>
      <div className="flex flex-col md:flex-row gap-8 mb-8 w-full max-w-4xl justify-center">
        {/* Player Names */}
        <div className="flex flex-col items-center flex-1">
          <label className="text-xl font-semibold text-white mb-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">Enter Player Names Below</label>
          <div className="relative w-64">
            <textarea
              ref={textareaRef}
              className="w-full rounded-xl bg-white/80 p-4 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-black placeholder:text-gray-500"
              placeholder="Type one name per line..."
              value={names}
              onChange={handleNamesChange}
              style={{ height: textareaHeight, minHeight: `${rowHeight * 10}px`, maxHeight: "500px" }}
              rows={10}
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
        {/* Payments */}
        <div className="flex flex-col items-center flex-1">
          <label className="text-xl font-semibold text-white mb-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">Payments</label>
          <div
            className="w-64 rounded-xl bg-white/80 p-4 shadow-lg flex flex-col gap-2 transition-all duration-200"
            style={{ height: `${(payments.length + 2) * rowHeight}px`, minHeight: `${32 * 10}px` }}
          >
            {payments.length === 0 && (
              <span className="text-gray-400 text-center mt-24">No players yet</span>
            )}
            {payments.map((name, idx) => (
              <label key={name} className="flex items-center gap-2 text-lg cursor-pointer select-none">
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
      {/* Generate Teams Button */}
      <button
        className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-2 px-8 rounded-full shadow-lg border border-green-900 transition mb-4 text-xl"
        onClick={handleGenerateTeams}
        disabled={payments.length < 2}
      >
        Generate Teams
      </button>
      {/* Start Over Button */}
      <button
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-8 rounded-full shadow-lg border border-red-900 transition mb-8 text-lg"
        onClick={handleStartOver}
      >
        Start Over
      </button>
      {/* Teams Display */}
      {teams && (
        <div className="w-full max-w-xl flex flex-col items-center gap-4 mb-4">
          <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
            <div className="flex-1 bg-white/90 rounded-xl p-4 shadow-lg border-2 border-green-700">
              <input
                className="text-xl font-bold text-green-800 mb-2 text-center w-full bg-transparent border-b-2 border-green-300 focus:outline-none focus:border-green-700 transition"
                value={teamNames.bib}
                onChange={e => handleTeamNameChange("bib", e.target.value)}
                maxLength={32}
              />
              <ul className="text-lg text-green-900 font-medium list-disc list-inside">
                {teams.bib.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-2 mb-2">
                    <span>{name}</span>
                    <button
                      className="ml-2 px-2 py-1 bg-green-200 hover:bg-green-300 text-green-900 rounded transition text-lg font-bold border border-green-700"
                      onClick={() => handleSwapPlayer(name, 'bib')}
                      title="Move to other team"
                    >
                      ⇄
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-white/90 rounded-xl p-4 shadow-lg border-2 border-green-900">
              <input
                className="text-xl font-bold text-green-800 mb-2 text-center w-full bg-transparent border-b-2 border-green-300 focus:outline-none focus:border-green-900 transition"
                value={teamNames.nobib}
                onChange={e => handleTeamNameChange("nobib", e.target.value)}
                maxLength={32}
              />
              <ul className="text-lg text-green-900 font-medium list-disc list-inside">
                {teams.nobib.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-2 mb-2">
                    <span>{name}</span>
                    <button
                      className="ml-2 px-2 py-1 bg-green-200 hover:bg-green-300 text-green-900 rounded transition text-lg font-bold border border-green-900"
                      onClick={() => handleSwapPlayer(name, 'nobib')}
                      title="Move to other team"
                    >
                      ⇄
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            className={`mt-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-8 rounded-full shadow-lg border border-green-900 transition text-lg ${copied ? "opacity-70" : ""}`}
            onClick={handleCopyAndShare}
          >
            {copied ? "Copied!" : "Share via WhatsApp"}
          </button>
        </div>
      )}
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
