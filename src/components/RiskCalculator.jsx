import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, AlertTriangle, TrendingUp, ShieldCheck, Target } from 'lucide-react';

const RiskCalculator = ({ isOpen, onClose, currentPrice }) => {
    const [balance, setBalance] = useState(1000);
    const [riskPercent, setRiskPercent] = useState(1);
    const [entryPrice, setEntryPrice] = useState(currentPrice || 0);
    const [stopLoss, setStopLoss] = useState(currentPrice ? currentPrice * 0.97 : 0);
    const [takeProfit, setTakeProfit] = useState(currentPrice ? currentPrice * 1.06 : 0);

    useEffect(() => {
        if (currentPrice && isOpen) {
            setEntryPrice(currentPrice);
            setStopLoss(+(currentPrice * 0.97).toFixed(8));
            setTakeProfit(+(currentPrice * 1.06).toFixed(8));
        }
    }, [currentPrice, isOpen]);

    const results = useMemo(() => {
        if (!balance || !entryPrice || !stopLoss || !takeProfit) {
            return null;
        }

        const isValid = stopLoss < entryPrice && takeProfit > entryPrice;
        if (!isValid) return { isValid: false };

        const riskAmt = balance * (riskPercent / 100);
        const stopDistPercent = (entryPrice - stopLoss) / entryPrice;
        const tpDistPercent = (takeProfit - entryPrice) / entryPrice;

        if (stopDistPercent <= 0) return { isValid: false };

        let positionUSD = riskAmt / stopDistPercent;

        // SPOT: nunca invertir más del balance disponible
        const cappedToBalance = positionUSD > balance;
        positionUSD = Math.min(positionUSD, balance);

        const quantity = positionUSD / entryPrice;
        const potentialProfit = positionUSD * tpDistPercent;
        const actualRisk = positionUSD * stopDistPercent;
        const rrRatio = tpDistPercent / stopDistPercent;
        const portfolioPercent = (positionUSD / balance) * 100;

        return {
            isValid: true,
            positionUSD,
            quantity,
            riskAmt: actualRisk,
            potentialProfit,
            stopDistPercent: stopDistPercent * 100,
            tpDistPercent: tpDistPercent * 100,
            rrRatio,
            portfolioPercent,
            cappedToBalance,
        };
    }, [balance, riskPercent, entryPrice, stopLoss, takeProfit]);

    if (!isOpen) return null;

    const isInputValid = results?.isValid;
    const rrColor = results?.rrRatio >= 2 ? 'text-green-400' : results?.rrRatio >= 1 ? 'text-yellow-400' : 'text-red-400';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-accent/10 p-4 border-b border-border flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-accent" />
                            <div>
                                <h2 className="font-bold text-lg">Calculadora Spot</h2>
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Solo compra • Sin apalancamiento</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors text-xl"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="💰 Balance ($)" value={balance} onChange={setBalance} />
                            <InputField label="⚠️ Riesgo (%)" value={riskPercent} onChange={setRiskPercent} step="0.1" max={10} />
                            <InputField label="📈 Entrada ($)" value={entryPrice} onChange={setEntryPrice} />
                            <InputField label="🛑 Stop Loss ($)" value={stopLoss} onChange={setStopLoss} />
                            <div className="col-span-2">
                                <InputField label="🎯 Take Profit ($)" value={takeProfit} onChange={setTakeProfit} />
                            </div>
                        </div>

                        {/* Warnings */}
                        {stopLoss >= entryPrice && (
                            <Warning text="El Stop Loss debe ser MENOR que la entrada (solo compras en spot)." />
                        )}
                        {takeProfit <= entryPrice && (
                            <Warning text="El Take Profit debe ser MAYOR que la entrada." />
                        )}
                        {results?.cappedToBalance && (
                            <div className="flex items-center gap-2 text-blue-400 text-xs bg-blue-400/10 p-2 rounded border border-blue-400/20">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                <span>Posición limitada a tu balance. En spot no puedes invertir más de lo que tienes.</span>
                            </div>
                        )}

                        {/* Results Card */}
                        {isInputValid && results && (
                            <div className="bg-gradient-to-br from-card to-accent/5 rounded-xl border border-border p-4 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span className="text-muted-foreground text-sm">Capital a Invertir</span>
                                    <span className="text-2xl font-bold text-accent">
                                        ${results.positionUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <span className="block text-muted-foreground text-[10px] mb-1 uppercase">Cantidad</span>
                                        <span className="text-foreground font-mono text-xs">{results.quantity.toFixed(6)}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-muted-foreground text-[10px] mb-1 uppercase">Pérdida Max</span>
                                        <span className="text-red-400 font-mono text-xs">-${results.riskAmt.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-muted-foreground text-[10px] mb-1 uppercase">Ganancia</span>
                                        <span className="text-green-400 font-mono text-xs">+${results.potentialProfit.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <span className="block text-muted-foreground text-[10px] mb-0.5">Stop</span>
                                        <span className="text-orange-400 font-mono">-{results.stopDistPercent.toFixed(2)}%</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-muted-foreground text-[10px] mb-0.5">Target</span>
                                        <span className="text-green-400 font-mono">+{results.tpDistPercent.toFixed(2)}%</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-muted-foreground text-[10px] mb-0.5">R:R Ratio</span>
                                        <span className={`font-mono font-bold ${rrColor}`}>
                                            1:{results.rrRatio.toFixed(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* R:R Visual */}
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Target className={`w-4 h-4 ${rrColor}`} />
                                        <span className={`text-xs font-bold ${rrColor}`}>
                                            {results.rrRatio >= 2 ? '✅ Buen ratio (≥ 2:1)' : results.rrRatio >= 1 ? '⚠️ Ratio aceptable' : '❌ Ratio malo (< 1:1)'}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                                        <div className="bg-red-500/60 h-full" style={{ width: `${(1 / (1 + results.rrRatio)) * 100}%` }} />
                                        <div className="bg-green-500/60 h-full" style={{ width: `${(results.rrRatio / (1 + results.rrRatio)) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="mt-1 text-[10px] text-muted-foreground text-center">
                                    {results.portfolioPercent.toFixed(1)}% de tu portfolio
                                </div>
                            </div>
                        )}

                        <div className="text-center text-[10px] text-muted-foreground opacity-60">
                            Spot only • Max inversión = tu balance • Sin apalancamiento
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const InputField = ({ label, value, onChange, step = "any", max }) => (
    <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step={step}
            max={max}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
        />
    </div>
);

const Warning = ({ text }) => (
    <div className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{text}</span>
    </div>
);

export default RiskCalculator;
