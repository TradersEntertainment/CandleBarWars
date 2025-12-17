'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import abi from './abi.json';

const CONTRACT_ADDRESS = '0x7da6Ef758A38773033FeC7421959c0AECbeF4719'; // V3.8 House Wins
const MARKETS = ['BTC', 'ETH', 'SOL', 'XRP'];

const ASSET_THEMES: Record<string, string> = {
  BTC: "border-t-4 border-t-orange-500 shadow-[0_-5px_20px_rgba(249,115,22,0.15)]",
  ETH: "border-t-4 border-t-purple-500 shadow-[0_-5px_20px_rgba(168,85,247,0.15)]",
  SOL: "border-t-4 border-t-teal-400 shadow-[0_-5px_20px_rgba(45,212,191,0.15)]",
  XRP: "border-t-4 border-t-blue-500 shadow-[0_-5px_20px_rgba(59,130,246,0.15)]",
};

const ASSET_LOGOS: Record<string, string> = {
  BTC: "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]",
  ETH: "text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]",
  SOL: "text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]",
  XRP: "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]",
};

export default function Home() {
  const { data: ethPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'getMarketStats',
    args: ['ETH'],
  });

  const [showInfo, setShowInfo] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [marketData, setMarketData] = useState<any>({});

  // 1. Fetch Data (Binance)
  useEffect(() => {
    const fetchData = async () => {
      const newData: any = {};
      for (const symbol of MARKETS) {
        try {
          const kRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}USDT&interval=1m&limit=1440`);
          const kData = await kRes.json();

          // Filter for Today (UTC 00:00)
          const now = new Date();
          const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
          const startTs = startOfDay.getTime();

          let g = 0, r = 0;
          kData.forEach((c: any) => {
            const openTime = c[0];
            if (openTime >= startTs) {
              if (parseFloat(c[4]) > parseFloat(c[1])) g++;
              else r++;
            }
          });

          const totalToday = g + r;
          const remaining = 1440 - totalToday;

          const pRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
          const pData = await pRes.json();

          const dRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}USDT&interval=1d&limit=7`);
          const dData = await dRes.json();
          let gDays = 0;
          dData.forEach((c: any) => parseFloat(c[4]) > parseFloat(c[1]) ? gDays++ : null);
          const wr = ((gDays / 7) * 100).toFixed(0) + '%';

          newData[symbol] = { green: g, red: r, price: parseFloat(pData.price), winRate: wr, remaining: remaining };
        } catch (e) { console.error(e); }
      }
      setMarketData(newData);
    };

    const updateTimer = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    fetchData();
    updateTimer();
    const dInt = setInterval(fetchData, 60000);
    const tInt = setInterval(updateTimer, 1000);
    return () => { clearInterval(dInt); clearInterval(tInt); };
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200 font-sans p-6 selection:bg-green-900 selection:text-white relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Info Modal Portal */}
      {showInfo && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
          <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <span className="text-[#00ff41]">DATA</span> & <span className="text-[#ff003c]">RULES</span>
            </h3>

            <div className="space-y-4 text-sm text-gray-400 font-mono">
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <span className="text-white font-bold block mb-1">DATA SOURCE</span>
                We stream real-time <span className="text-yellow-500">1-minute candles</span> directly from the <span className="text-white">Binance Futures API</span> to ensure global price accuracy.
              </div>

              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <span className="text-white font-bold block mb-1">TIMEFRAME (UTC)</span>
                Rounds run from <span className="text-white">00:00 UTC</span> to <span className="text-white">00:00 UTC</span> daily. Settlement is automated immediately after the round closes.
              </div>

              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <span className="text-white font-bold block mb-1">WINNING CONDITION</span>
                We count every single 1m candle in the 24h period:
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>If <span className="text-green-400">Green Candles</span> &gt; Red Candles → <span className="text-green-400 font-bold">BULLS WIN</span></li>
                  <li>If <span className="text-red-400">Red Candles</span> &gt; Green Candles → <span className="text-red-400 font-bold">BEARS WIN</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <header className="flex flex-col md:flex-row justify-between items-center mb-10 max-w-7xl mx-auto border-b border-gray-900 pb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">BAR WARS</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Base Protocol // Daily Prediction Market
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <button onClick={() => setShowInfo(true)} className="flex items-center gap-2 px-3 py-2 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-xs font-mono uppercase tracking-wide transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span>Game Rules</span>
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Round Ends (UTC)</div>
            <div className="text-2xl font-mono font-bold text-gray-300">{timeLeft || "00h 00m 00s"}</div>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </header>

      <UserStats />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {MARKETS.map(symbol => (
          <MarketCard key={symbol} symbol={symbol} data={marketData[symbol]} />
        ))}
      </div>

      <footer className="max-w-7xl mx-auto mt-12 text-center border-t border-gray-900 pt-8 text-gray-600 text-xs text-gray-500">
        <p className="mb-2">SETTLEMENT AUTOMATED AT UTC 00:00 // BASED ON LAST 24H OF 1M CANDLES</p>
        <p>BAR WARS PROTOCOL v3.5.1</p>
      </footer>
    </main>
  );
}

function MarketCard({ symbol, data }: { symbol: string, data: any }) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [quantity, setQuantity] = useState<number>(1);
  const [showInfo, setShowInfo] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: stats, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'getMarketStats',
    args: [symbol],
  });

  const { data: userStats, refetch: refetchUser } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'getUserMarketStats',
    args: [symbol, address],
    query: { enabled: !!address }
  });

  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      refetch();
      refetchUser();
      setTimeout(() => { refetch(); refetchUser(); }, 2000);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, refetch, refetchUser]);

  const period = stats ? Number(stats[0]) : 1;
  const pool = stats ? parseFloat(formatEther(stats[1])) : 0;
  const bullTickets = stats ? Number(stats[2]) : 0;
  const bearTickets = stats ? Number(stats[3]) : 0;

  const myBulls = userStats ? Number(userStats[0]) : 0;
  const myBears = userStats ? Number(userStats[1]) : 0;

  const green = data ? data.green : 0;
  const red = data ? data.red : 0;
  const remaining = data ? data.remaining : 1440;
  const price = data ? data.price : 0;
  const winRate = data ? data.winRate : '---';
  const total = green + red;
  const gPct = total > 0 ? (green / total) * 100 : 50;
  const rPct = total > 0 ? (red / total) * 100 : 50;

  const totalBets = bullTickets + bearTickets;
  const bullPct = totalBets > 0 ? (bullTickets / totalBets) * 100 : 50;
  const bearPct = totalBets > 0 ? (bearTickets / totalBets) * 100 : 50;

  const handleBet = (side: number) => {
    try {
      if (quantity > 1) {
        // Batch Bet
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: abi,
          functionName: 'betBatch',
          args: [symbol, side, quantity],
          value: parseEther((0.001 * quantity).toString()),
        });
      } else {
        // Single Bet
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: abi,
          functionName: 'bet',
          args: [symbol, side],
          value: parseEther('0.001'),
        });
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className={`bg-[#0A0A0A] rounded-3xl border border-gray-900 overflow-hidden relative group hover:border-gray-800 transition-colors duration-300 shadow-2xl flex flex-col ${ASSET_THEMES[symbol]}`}>

      {/* 1. HEADER */}
      <div className="px-6 pt-6 pb-2 flex justify-between items-start z-20 relative bg-[#0A0A0A]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <h2 className={`text-3xl font-black text-white leading-none tracking-tight ${ASSET_LOGOS[symbol]}`}>{symbol}</h2>
            <span className="text-gray-600 text-lg font-medium">/ USDT</span>
          </div>
          {(myBulls > 0 || myBears > 0) && (
            <div className="flex gap-2 text-[10px] font-mono mt-1">
              {myBulls > 0 && <span className="text-green-500 bg-green-900/20 px-1 rounded border border-green-900/30">YOU: {myBulls} BULL</span>}
              {myBears > 0 && <span className="text-red-500 bg-red-900/20 px-1 rounded border border-red-900/30">YOU: {myBears} BEAR</span>}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">POOL: {pool.toFixed(4)} ETH</div>
          <div className={`text-xl font-mono font-bold ${price > 0 ? 'text-white' : 'text-gray-500'}`}>
            ${price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
            <span className="text-[10px] ml-2 animate-pulse text-green-500">• LIVE</span>
          </div>
        </div>
      </div>

      {/* 2. VISUALIZATION */}
      <div className="relative h-64 w-full bg-[#050505] flex items-end justify-center overflow-hidden flex-grow border-y border-gray-900/50">
        <div className={`absolute top-0 left-0 w-full h-full opacity-10 bg-gradient-to-b ${ASSET_LOGOS[symbol].replace('text-', 'from-')}/20 to-transparent pointer-events-none`}></div>

        {/* BULL */}
        <div className="absolute left-4 bottom-4 h-[90%] w-[48%] flex items-end justify-start pointer-events-none z-0">
          <Image
            src={`/${symbol.toLowerCase()}_bull.png`}
            alt="Bull"
            width={500}
            height={500}
            className="object-contain object-bottom h-full w-full opacity-100 drop-shadow-2xl brightness-110"
          />
        </div>

        {/* BEAR */}
        <div className="absolute right-4 bottom-4 h-[90%] w-[48%] flex items-end justify-end pointer-events-none z-0">
          <Image
            src={`/${symbol.toLowerCase()}_bear.png`}
            alt="Bear"
            width={500}
            height={500}
            className="object-contain object-bottom h-full w-full opacity-100 drop-shadow-2xl brightness-110"
          />
        </div>

        {/* BAR COUNTER */}
        {/* NEW STACKED BAR COUNTERS */}
        <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col font-mono uppercase tracking-widest text-[9px] font-bold">

          {/* GREEN ROW */}
          <div className="relative w-full h-6 bg-black/80 border-t border-zinc-800 flex items-center">
            <div style={{ width: `${gPct}%` }} className="h-full bg-gradient-to-r from-green-900/40 to-green-500/40 border-r-2 border-green-500 transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(0,255,65,0.2)]"></div>
            <div className="absolute left-3 z-10 text-white flex items-center gap-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-[pulse_1.5s_infinite] shadow-[0_0_8px_#00ff41]"></span>
              <span className="text-[#00ff41] text-xs font-black">{green}</span> GREEN CANDLES
            </div>
          </div>

          {/* RED ROW */}
          <div className="relative w-full h-6 bg-black/80 border-t border-zinc-800 flex items-center justify-end">
            <div style={{ width: `${rPct}%` }} className="h-full bg-gradient-to-l from-red-900/40 to-red-500/40 border-l-2 border-red-500 transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(255,0,60,0.2)]"></div>
            <div className="absolute right-3 z-10 text-white flex items-center gap-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              RED CANDLES <span className="text-[#ff003c] text-xs font-black">{red}</span>
              <span className="w-1.5 h-1.5 bg-[#ff003c] rounded-full animate-[pulse_1.5s_infinite] shadow-[0_0_8px_#ff003c]"></span>
            </div>
          </div>
        </div>

        {/* REMAINING CANDLES INDICATOR */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 border border-gray-800 px-2 py-1 rounded-full text-[9px] font-mono text-gray-400 z-10 backdrop-blur-sm flex items-center gap-2 shadow-xl">
          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
          REMAINING: <span className="text-white font-bold">{remaining}</span> BARS
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-[#080808] py-1 text-center border-b border-gray-900">
        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Last 7 Days Win Rate: <span className="text-gray-300 font-bold">{winRate} Bullish</span></span>
      </div>

      {/* 4. ACTIONS */}
      <div className="p-4 grid grid-cols-2 gap-4 z-20 bg-[#0A0A0A]">

        {/* Quantity Selector */}
        <div className="col-span-2 flex justify-between items-center px-4 mb-2">
          {/* Left Side (Green) */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 h-6 items-end opacity-60">
              <div className="w-1 bg-green-500 animate-[bounce_1s_infinite]"></div>
              <div className="w-1 bg-green-500 h-4 animate-[bounce_1.2s_infinite]"></div>
              <div className="w-1 bg-green-500 h-2 animate-[bounce_0.8s_infinite]"></div>
              <div className="w-1 bg-green-500 h-5 animate-[bounce_1.5s_infinite]"></div>
            </div>
            <div className="text-[9px] text-green-500/80 font-mono leading-tight text-left hidden sm:block">
              WIN IF<br />GREEN &gt; RED
            </div>
          </div>

          {/* Center Selector */}
          <div className="flex justify-center items-center gap-4">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors">-</button>
            <div className="flex flex-col items-center">
              <span className="text-xl font-mono font-bold text-white">{quantity}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">TICKETS</span>
              <div className="mt-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] font-mono font-bold text-green-400">
                {(0.001 * quantity).toFixed(3)} ETH
              </div>
            </div>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors">+</button>
          </div>

          {/* Right Side (Red) */}
          <div className="flex items-center gap-2">
            <div className="text-[9px] text-red-500/80 font-mono leading-tight text-right hidden sm:block">
              WIN IF<br />RED &gt; GREEN
            </div>
            <div className="flex gap-0.5 h-6 items-end opacity-60">
              <div className="w-1 bg-red-500 h-3 animate-[bounce_1.1s_infinite]"></div>
              <div className="w-1 bg-red-500 h-5 animate-[bounce_0.9s_infinite]"></div>
              <div className="w-1 bg-red-500 h-2 animate-[bounce_1.3s_infinite]"></div>
              <div className="w-1 bg-red-500 animate-[bounce_1s_infinite]"></div>
            </div>
          </div>
        </div>

        {/* Explanatory Text & Info Button */}
        <div className="col-span-2 flex justify-center items-center gap-2 -mt-2 mb-1 opacity-80 hover:opacity-100 transition-opacity">
          <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wide">
            Winning side determined by <span className="text-gray-400 font-bold">1m Candle Count</span>
          </span>
          <button onClick={() => setShowInfo(true)} className="text-gray-600 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <span className="text-[#00ff41]">DATA</span> & <span className="text-[#ff003c]">RULES</span>
              </h3>

              <div className="space-y-4 text-sm text-gray-400 font-mono">
                <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                  <span className="text-white font-bold block mb-1">DATA SOURCE</span>
                  We stream real-time <span className="text-yellow-500">1-minute candles</span> directly from the <span className="text-white">Binance Futures API</span> to ensure global price accuracy.
                </div>

                <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                  <span className="text-white font-bold block mb-1">TIMEFRAME (UTC)</span>
                  Rounds run from <span className="text-white">00:00 UTC</span> to <span className="text-white">00:00 UTC</span> daily. Settlement is automated immediately after the round closes.
                </div>

                <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                  <span className="text-white font-bold block mb-1">WINNING CONDITION</span>
                  We count every single 1m candle in the 24h period:
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>If <span className="text-green-400">Green Candles</span> &gt; Red Candles → <span className="text-green-400 font-bold">BULLS WIN</span></li>
                    <li>If <span className="text-red-400">Red Candles</span> &gt; Green Candles → <span className="text-red-400 font-bold">BEARS WIN</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button onClick={() => handleBet(1)} disabled={isPending || isConfirming} className="py-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-[#00ff41] hover:bg-[#00ff41]/5 text-gray-300 hover:text-white font-bold text-sm transition-all duration-200 uppercase tracking-widest flex flex-col items-center gap-1 disabled:opacity-50 group active:scale-95">
            <span className="group-hover:text-[#00ff41] transition-colors">{isPending ? 'Signing...' : isConfirming ? 'Confirming...' : `Vote Bullish (${quantity}x)`}</span>
            <span className="text-[10px] opacity-50 font-mono group-hover:opacity-100">{(0.001 * quantity).toFixed(3)} ETH</span>
          </button>
          <PayoutPreview pool={pool} tickets={bullTickets} side="bull" userQuantity={quantity} />
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={() => handleBet(2)} disabled={isPending || isConfirming} className="py-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-[#ff003c] hover:bg-[#ff003c]/5 text-gray-300 hover:text-white font-bold text-sm transition-all duration-200 uppercase tracking-widest flex flex-col items-center gap-1 disabled:opacity-50 group active:scale-95">
            <span className="group-hover:text-[#ff003c] transition-colors">{isPending ? 'Signing...' : isConfirming ? 'Confirming...' : `Vote Bearish (${quantity}x)`}</span>
            <span className="text-[10px] opacity-50 font-mono group-hover:opacity-100">{(0.001 * quantity).toFixed(3)} ETH</span>
          </button>
          <PayoutPreview pool={pool} tickets={bearTickets} side="bear" userQuantity={quantity} />
        </div>

        {/* Transaction Status */}
        {(isPending || isConfirming || isConfirmed) && (
          <div className="col-span-2 text-center text-[10px] font-mono mt-1 animate-pulse text-yellow-500">
            {isPending && "Check Wallet to Sign..."}
            {isConfirming && "Confirming Transaction..."}
            {isConfirmed && <span className="text-green-500 font-bold">Bet Placed Successfully!</span>}
          </div>
        )}
        {writeError && (
          <div className="col-span-2 text-center text-[10px] text-red-500 break-words bg-red-900/20 p-2 rounded mt-2 border border-red-900/50">
            {writeError.message}
          </div>
        )}

        {/* Live Sentiment Bar */}
        {(isConfirmed || totalBets > 0) ? (
          <div className="col-span-2 mt-2 w-full h-4 bg-gray-900 rounded-sm relative overflow-hidden flex shadow-inner">
            <div style={{ width: `${bullPct}%` }} className="h-full bg-gradient-to-r from-green-900 to-green-600 transition-all duration-500 ease-out flex items-center justify-start px-2">
              {bullPct > 15 && <span className="text-[8px] font-bold text-black opacity-70">{Math.round(bullPct)}%</span>}
            </div>
            <div style={{ width: `${bearPct}%` }} className="h-full bg-gradient-to-l from-red-900 to-red-600 transition-all duration-500 ease-out flex items-center justify-end px-2">
              {bearPct > 15 && <span className="text-[8px] font-bold text-black opacity-70">{Math.round(bearPct)}%</span>}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {showSuccess ? (
                <span className="text-[9px] font-bold text-white drop-shadow-md animate-pulse">BET PLACED! UPDATING...</span>
              ) : (
                <span className="text-[9px] font-mono text-gray-500/50 uppercase tracking-widest">Live Sentiment</span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PayoutPreview({ pool, tickets, side, userQuantity = 1 }: { pool: number, tickets: number, side: 'bull' | 'bear', userQuantity?: number }) {
  const simulatedPool = pool + (0.001 * userQuantity);
  const mySharePct = (userQuantity / (tickets + userQuantity));
  const potentialPayout = simulatedPool * mySharePct;
  const cost = 0.001 * userQuantity;
  const multiplier = potentialPayout / cost;

  const colorClass = multiplier > 1.2 ? 'text-[#00ff41]' : multiplier >= 1.0 ? 'text-yellow-500' : 'text-[#ff003c]';

  return (
    <div className="text-[10px] text-gray-500 font-mono text-center flex flex-col gap-1 mt-1 border border-orange-500/30 p-2 rounded bg-orange-900/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
      <div className="flex justify-between items-center bg-black/40 p-1 rounded-sm border border-orange-500/20">
        <span className="text-orange-200/70 font-bold">Est. Payout:</span>
        <span className="text-orange-400 text-base font-black tracking-tight drop-shadow-[0_0_8px_rgba(251,146,60,0.8)] animate-pulse">{potentialPayout.toFixed(4)} Ξ</span>
      </div>
      <div className="flex justify-between items-center opacity-70 px-1">
        <span>Share:</span>
        <span>{(mySharePct * 100).toFixed(1)}%</span>
      </div>
      <div className="flex justify-between border-t border-gray-800 mt-1 pt-1 px-1">
        <span>Multiplier:</span>
        <span className={`font-bold ${colorClass}`}>{multiplier.toFixed(2)}x</span>
      </div>
    </div>
  )
}

function UserStats() {
  const { address } = useAccount();
  const { data: balance, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: abi,
    functionName: 'balanceOf',
    args: [address],
  });

  useEffect(() => {
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (!address || !balance) return null;

  return (
    <div className="max-w-7xl mx-auto mb-6 px-4">
      <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          <span className="text-gray-400 text-sm font-mono uppercase tracking-widest">My Active Tickets</span>
        </div>
        <div className="text-2xl font-bold text-white font-mono tracking-tight drop-shadow-md">
          {Number(balance).toString()} <span className="text-sm text-gray-600 font-normal">TICKETS</span>
        </div>
      </div>
    </div>
  );
}
