import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Calculator as CalculatorIcon } from 'lucide-react';
import FearAndGreed from '../FearAndGreed';

const Header = ({ onCalculatorOpen, setMarketSentiment, itemVariants }) => {
    return (
        <header className="flex flex-col sm:flex-row justify-between items-center gap-6 py-6 border-b-2 border-primary/20 mb-8 bg-black">
            <motion.div variants={itemVariants} className="flex items-center gap-5">
                <div className="p-2 bg-primary border-2 border-white neo-shadow">
                    <BrainCircuit className="w-10 h-10 text-black" />
                </div>
                <div className="text-left">
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                        ORACULO <span className="text-primary not-italic">PRO</span>
                    </h1>
                    <p className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] mt-1 bg-primary/10 px-2 py-0.5 inline-block">
                        Terminal de Inteligencia Spot v3.0
                    </p>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-6">
                <div className="border-2 border-white/20 p-1 bg-card">
                    <FearAndGreed onValueChange={setMarketSentiment} />
                </div>
                <button
                    onClick={onCalculatorOpen}
                    className="p-4 bg-primary text-black border-2 border-white neo-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group"
                    title="Calculadora de Riesgo"
                >
                    <CalculatorIcon className="w-6 h-6" />
                </button>
            </motion.div>
        </header>
    );
};

export default Header;
