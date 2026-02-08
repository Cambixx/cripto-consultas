import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Calculator as CalculatorIcon } from 'lucide-react';
import FearAndGreed from '../FearAndGreed';

const Header = ({ onCalculatorOpen, setMarketSentiment, itemVariants }) => {
    return (
        <header className="flex flex-col sm:flex-row justify-between items-center gap-6 py-4">
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl neo-shadow">
                    <BrainCircuit className="w-10 h-10 text-primary" />
                </div>
                <div className="text-left">
                    <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        CryptoOracle <span className="text-foreground/50 text-2xl font-light">PRO</span>
                    </h1>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-1">
                        Institutional MTA Intelligence
                    </p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <FearAndGreed onValueChange={setMarketSentiment} />
                <button
                    onClick={onCalculatorOpen}
                    className="p-3 glass hover:bg-primary/10 text-primary rounded-xl transition-all neo-shadow group"
                    title="Risk Calculator"
                >
                    <CalculatorIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </button>
            </motion.div>
        </header>
    );
};

export default Header;
