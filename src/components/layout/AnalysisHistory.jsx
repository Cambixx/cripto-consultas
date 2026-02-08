import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronRight, Trash2, BrainCircuit } from 'lucide-react';

const AnalysisHistory = ({ isOpen, onClose, history, onSelect, onClear }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-white/10 z-[101] shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">Historial de Oráculo</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                    <BrainCircuit className="w-16 h-16 text-muted-foreground opacity-10" />
                                    <div>
                                        <p className="text-muted-foreground font-medium">No hay análisis guardados</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">Tus proyecciones del Oráculo aparecerán aquí.</p>
                                    </div>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onSelect(item.result);
                                            onClose();
                                        }}
                                        className="w-full text-left glass p-4 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold group-hover:text-primary transition-colors">{item.symbol}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded font-mono uppercase text-muted-foreground">
                                                    {item.timeframe}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                            <span className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-primary" />
                                                {item.strategy.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <ChevronRight className="absolute right-4 bottom-4 w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            )}
                        </div>

                        {history.length > 0 && (
                            <div className="p-4 bg-white/5 border-t border-white/10">
                                <button
                                    onClick={onClear}
                                    className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Limpiar Historial
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AnalysisHistory;
