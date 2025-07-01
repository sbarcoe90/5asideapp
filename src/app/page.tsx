"use client";
import React, { useState, useRef, useLayoutEffect, useEffect } from "react";

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [names, setNames] = useState("");
  const [payments, setPayments] = useState<string[]>([]);
  const [paid, setPaid] = useState<{ [name: string]: boolean }>({});
  const [teams, setTeams] = useState<{ bib: string[]; nobib: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [teamNames, setTeamNames] = useState<{ bib: string; nobib: string }>({ bib: "Bib", nobib: "No Bib" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shadowRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState("auto");

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

  // Update names and payments list
  const handleNamesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNames(e.target.value);
    const playerList = e.target.value
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
  const handleCopy = async () => {
    if (!teams) return;
    const bib = teams.bib.join("\n");
    const nobib = teams.nobib.join("\n");
    const text = `*${teamNames.bib}*\n${bib}\n\n*${teamNames.nobib}*\n${nobib}`;
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
          <label className="text-xl font-semibold text-white mb-2">Enter Player Names</label>
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
        </div>
        {/* Payments */}
        <div className="flex flex-col items-center flex-1">
          <label className="text-xl font-semibold text-white mb-2">Payments</label>
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
                  <li key={name} className="flex items-center justify-between gap-2">
                    <span>{name}</span>
                    <button
                      className="ml-2 px-2 py-1 bg-green-200 hover:bg-green-300 text-green-900 rounded transition text-xs font-semibold border border-green-700"
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
                  <li key={name} className="flex items-center justify-between gap-2">
                    <span>{name}</span>
                    <button
                      className="ml-2 px-2 py-1 bg-green-200 hover:bg-green-300 text-green-900 rounded transition text-xs font-semibold border border-green-900"
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
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy for WhatsApp"}
          </button>
        </div>
      )}
      <footer className="mt-auto text-center text-white/80 text-sm pt-10">
        <span>⚽ 5-a-side Team Picker & Payment Tracker</span>
      </footer>
    </div>
  );

  // Landing page content
  const landing = (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-700 via-green-500 to-green-800 py-10 px-2">
      <div className="bg-white/90 rounded-2xl shadow-xl p-8 max-w-xl w-full flex flex-col items-center gap-6">
        <h1 className="text-4xl font-extrabold text-green-900 mb-2 text-center drop-shadow">5-a-side Team Picker & Payment Tracker</h1>
        <p className="text-green-900 text-lg text-center mb-2">
          <span className="font-semibold"></span> I was bouncing between note apps on different devices trying to pick teams and then track missed payments from Revolut, WhatsApp, and more. It was a pain to keep track and share teams!
        </p>
        <div className="bg-green-100 rounded-xl p-4 w-full">
          <h2 className="text-xl font-bold text-green-800 mb-2 text-center">How it works</h2>
          <ol className="list-decimal list-inside text-green-900 text-base space-y-1">
            <li>Paste or type your player names (one per line).</li>
            <li>Press <span className="font-semibold">Generate Teams</span> to split into two random teams.</li>
            <li>Rename teams if you want, or swap players between teams.</li>
            <li>Copy the teams (with one click) to WhatsApp or anywhere else.</li>
            <li>Finally, mark off who has paid with the pre populated list with checkboxes (dopamaine hits galore!).</li>
            <li>Payments and teams are saved locally for your next session.</li>
          </ol>
        </div>
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-3 px-10 rounded-full shadow-lg border border-green-900 transition text-xl mt-4"
          onClick={() => setShowDemo(true)}
        >
          Give it a shot!
        </button>
        <footer className="mt-8 text-center text-green-800/80 text-sm">
          <span>Made for 5-a-side organisers everywhere ⚽</span>
        </footer>
      </div>
    </div>
  );

  return showDemo ? mainApp : landing;
}
