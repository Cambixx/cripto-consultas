import React from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Columns } from 'lucide-react';
import CryptoSelector from '../CryptoSelector';
import TimeframeSelector from '../TimeframeSelector';

const ControlBar = ({
    cryptos,
    selectedCrypto,
    setSelectedCrypto,
    compareCrypto,
    setCompareCrypto,
    isSplitView,
    setIsSplitView,
    timeframe,
    setTimeframe,
    favorites,
    toggleFavorite,
    onHistoryOpen,
    onLogout,
    itemVariants
}) => {
    return (
        <motion.div variants={itemVariants} className="bg-black p-4 border-2 border-primary/30 flex flex-col lg:flex-row gap-4 items-center relative z-50 neo-shadow">
            <div className="flex-1 w-full flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <CryptoSelector
                        cryptos={cryptos}
                        onSelect={setSelectedCrypto}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                        placeholder="ACTIVO PRINCIPAL"
                    />
                    {isSplitView && (
                        <CryptoSelector
                            cryptos={cryptos}
                            onSelect={setCompareCrypto}
                            favorites={favorites}
                            toggleFavorite={toggleFavorite}
                            placeholder="COMPARAR CON"
                        />
                    )}
                </div>

                <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsSplitView(!isSplitView)}
                        className={`p-3 border-2 transition-all h-[52px] px-5 flex items-center gap-2 group ${isSplitView ? 'bg-primary text-black border-white' : 'bg-black text-white border-white/20 hover:border-primary'}`}
                        title="VISTA DIVIDIDA"
                    >
                        <Columns className="w-5 h-5" />
                        <span className="text-xs font-mono uppercase tracking-[0.2em] hidden sm:inline font-bold">Split</span>
                    </button>

                    <button
                        onClick={onHistoryOpen}
                        className="p-3 bg-black border-2 border-white/20 hover:border-primary hover:text-primary text-white transition-all h-[52px] px-5 flex items-center gap-2 group"
                        title="HISTORIAL"
                    >
                        <HistoryIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-mono uppercase tracking-[0.2em] hidden sm:inline font-bold">Log</span>
                    </button>
                </div>
            </div>

            <button
                onClick={onLogout}
                className="text-[10px] font-mono text-muted-foreground hover:text-red-500 px-4 opacity-50 hover:opacity-100 transition-all uppercase tracking-[0.3em] font-bold"
            >
                [ EXIT ]
            </button>
        </motion.div>
    );
};

export default ControlBar;
