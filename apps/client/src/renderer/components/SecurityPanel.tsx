import React, { useState } from 'react';

const SecurityPanel: React.FC = () => {
  // Red Team State
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000');
  const [rps, setRps] = useState(10);
  const [isAttacking, setIsAttacking] = useState(false);

  // Blue Team State
  const [systemStatus, setSystemStatus] = useState<'secure' | 'critical'>('secure');
  const [logs, setLogs] = useState<string[]>([
    '[10:00:01] System monitor initialized.',
    '[10:00:02] Firewall active. Port 80, 443 open.',
    '[10:00:05] No anomalous traffic detected.',
  ]);

  const handleStartAttack = () => {
    setIsAttacking(!isAttacking);
    if (!isAttacking) {
        // Simulation: Change status to critical and add logs
        setSystemStatus('critical');
        addLog(`[ALERT] High traffic detected from unknown source! RPS: ${rps}`);
    } else {
        setSystemStatus('secure');
        addLog('[INFO] Traffic normalized. Threat mitigated.');
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  return (
    <div className="flex h-full w-full bg-black text-green-500 font-mono p-4 gap-4">
      {/* Left: Red Team Control */}
      <div className="flex-1 border-2 border-red-800 rounded-lg p-6 bg-gray-900/50 flex flex-col gap-6 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
        <h2 className="text-2xl font-bold text-red-500 border-b border-red-800 pb-2 mb-2 uppercase tracking-widest">
          Red Team // Command
        </h2>
        
        <div className="flex flex-col gap-2">
            <label className="text-red-400 text-sm uppercase">Target URL</label>
            <input 
                type="text" 
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="bg-black border border-red-900 text-red-500 p-2 rounded focus:outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all"
            />
        </div>

        <div className="flex flex-col gap-2">
            <label className="text-red-400 text-sm uppercase flex justify-between">
                <span>Intensity (RPS)</span>
                <span className="font-bold">{rps}</span>
            </label>
            <input 
                type="range" 
                min="1" 
                max="100" 
                value={rps}
                onChange={(e) => setRps(Number(e.target.value))}
                className="accent-red-600 h-2 bg-red-900 rounded-lg appearance-none cursor-pointer"
            />
        </div>

        <button 
            onClick={handleStartAttack}
            className={`mt-auto py-3 px-6 rounded font-bold uppercase tracking-widest transition-all duration-200 
                ${isAttacking 
                    ? 'bg-red-900/20 text-red-500 border border-red-500 animate-pulse' 
                    : 'bg-red-700 hover:bg-red-600 text-black border border-transparent shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                }`}
        >
            {isAttacking ? 'STOP ATTACK' : 'INITIATE ATTACK'}
        </button>
      </div>

      {/* Right: Blue Team Monitor */}
      <div className="flex-1 border-2 border-green-800 rounded-lg p-6 bg-gray-900/50 flex flex-col gap-6 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
        <div className="flex justify-between items-center border-b border-green-800 pb-2 mb-2">
            <h2 className="text-2xl font-bold text-green-500 uppercase tracking-widest">
            Blue Team // Monitor
            </h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded border ${
                systemStatus === 'secure' 
                    ? 'border-green-600 bg-green-900/30 text-green-400' 
                    : 'border-red-600 bg-red-900/30 text-red-400 animate-pulse'
            }`}>
                <div className={`w-3 h-3 rounded-full ${systemStatus === 'secure' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="uppercase text-xs font-bold">{systemStatus === 'secure' ? 'SYSTEM SECURE' : 'CRITICAL ALERT'}</span>
            </div>
        </div>

        <div className="flex-1 bg-black border border-green-900 rounded p-4 overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
            <div className="flex-1 overflow-y-auto font-mono text-sm space-y-1 z-0 custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-green-900 pl-2 hover:bg-green-900/10">
                        <span className="text-green-700 mr-2">{'>'}</span>
                        {log}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;
