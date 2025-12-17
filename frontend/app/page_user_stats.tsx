
function UserStats() {
    const { address } = useAccount();
    const { data: balance, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: abi,
        functionName: 'balanceOf',
        args: [address],
    });

    // Auto-refresh balance every 5s
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
