import React from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon } from 'lucide-react';
import CryptoSelector from '../CryptoSelector';
import TimeframeSelector from '../TimeframeSelector';

const ControlBar = ({
    cryptos,
    selectedCrypto,
    setSelectedCrypto,
    timeframe,
    setTimeframe,
    favorites,
    toggleFavorite,
    onHistoryOpen,
    onLogout,
    itemVariants
}) => {
    return (
        <motion.div variants={itemVariants} className="glass p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full flex flex-col sm:flex-row gap-4 items-center">
                <CryptoSelector
                    cryptos={cryptos}
                    onSelect={setSelectedCrypto}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                />
                <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

                <button
                    onClick={onHistoryOpen}
                    className="p-3 glass hover:bg-white/10 text-muted-foreground hover:text-primary rounded-xl transition-all h-[52px] px-5 flex items-center gap-2 group"
                    title="Historial de Análisis"
                >
                    <HistoryIcon className="w-5 h-5 group-hover:rotate-[-20deg] transition-transform" />
                    <span className="text-xs font-mono uppercase tracking-widest hidden sm:inline">Historial</span>
                </button>
            </div>

            <button
                onClick={onLogout}
                className="text-xs font-mono text-muted-foreground hover:text-destructive px-4 opacity-50 hover:opacity-100 transition-all uppercase tracking-tighter"
            >
                Cerrar Sesión
            </button>
        </motion.div>
    );
};

export default ControlBar;
