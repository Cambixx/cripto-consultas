import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';

const RiskCalculator = ({ isOpen, onClose, currentPrice }) => {
    const [balance, setBalance] = useState(1000);
    const [riskPercent, setRiskPercent] = useState(1);
    const [entryPrice, setEntryPrice] = useState(currentPrice || 0);
    const [stopLoss, setStopLoss] = useState(currentPrice ? currentPrice * 0.95 : 0);

    // Results
    const [positionSize, setPositionSize] = useState(0);
    const [riskAmount, setRiskAmount] = useState(0);
    const [leverage, setLeverage] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentPrice) {
            setEntryPrice(currentPrice);
            setStopLoss(currentPrice * 0.95);
        }
    }, [currentPrice, isOpen]);

    useEffect(() => {
        calculate();
    }, [balance, riskPercent, entryPrice, stopLoss]);

    const calculate = () => {
        setError('');

        if (!balance || !entryPrice || !stopLoss) return;
        if (stopLoss >= entryPrice) { // Assuming long for now
            // Allow short logic later? For now Spot = Long
            // If stop > entry in spot, thats invalid for long
        }

        const riskAmt = balance * (riskPercent / 100);
        const stopDistancePercent = Math.abs((entryPrice - stopLoss) / entryPrice);

        if (stopDistancePercent === 0) {
            setPositionSize(0);
            return;
        }

        const posSizeUSD = riskAmt / stopDistancePercent;

        // Check if position size > balance (requires leverage)
        let lev = 1;
        if (posSizeUSD > balance) {
            lev = posSizeUSD / balance;
        }

        setRiskAmount(riskAmt);
        setPositionSize(posSizeUSD);
        setLeverage(lev);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                            <h2 className="font-bold text-lg">Calculadora de Riesgo</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-medium">Balance ($)</label>
                                <input
                                    type="number"
                                    value={balance}
                                    onChange={(e) => setBalance(parseFloat(e.target.value))}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-medium">Riesgo (%)</label>
                                <input
                                    type="number"
                                    value={riskPercent}
                                    onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                                    step="0.1"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-medium">Entrada ($)</label>
                                <input
                                    type="number"
                                    value={entryPrice}
                                    onChange={(e) => setEntryPrice(parseFloat(e.target.value))}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-medium">Stop Loss ($)</label>
                                <input
                                    type="number"
                                    value={stopLoss}
                                    onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                        </div>

                        {/* Warnings */}
                        {stopLoss >= entryPrice && (
                            <div className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 p-2 rounded">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Para compras en Spot, el Stop Loss debe ser menor a la entrada.</span>
                            </div>
                        )}

                        {/* Results Card */}
                        <div className="bg-gradient-to-br from-card to-accent/5 rounded-xl border border-border p-4 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-muted-foreground text-sm">Capital a Invertir</span>
                                <span className="text-2xl font-bold text-accent">
                                    ${positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-muted-foreground text-xs mb-1">Pérdida Máxima</span>
                                    <span className="text-red-400 font-mono">-${riskAmount.toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-muted-foreground text-xs mb-1">Distancia Stop</span>
                                    <span className="text-orange-400 font-mono">
                                        {((Math.abs(entryPrice - stopLoss) / entryPrice) * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            {leverage > 1 && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-yellow-500">
                                    <span>Requiere Apalancamiento:</span>
                                    <span className="font-bold">{leverage.toFixed(1)}x</span>
                                </div>
                            )}
                        </div>

                        <div className="text-center text-xs text-muted-foreground">
                            <p>Basado en el criterio de riesgo del 1% (Professional Standard)</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RiskCalculator;
