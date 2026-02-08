import React from 'react';
import { motion } from 'framer-motion';
import CryptoSelector from '../CryptoSelector';
import TimeframeSelector from '../TimeframeSelector';

const ControlBar = ({ cryptos, selectedCrypto, setSelectedCrypto, timeframe, setTimeframe, onLogout, itemVariants }) => {
    return (
        <motion.div variants={itemVariants} className="glass p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
                <CryptoSelector cryptos={cryptos} onSelect={setSelectedCrypto} />
                <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
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
