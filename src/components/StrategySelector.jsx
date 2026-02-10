import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, TrendingUp, Activity } from 'lucide-react';

const strategies = [
    {
        id: 'swing_spot',
        name: 'Swing Spot',
        icon: TrendingUp,
        description: 'Compra en soporte, vende en resistencia. Operaciones de días a semanas.',
        color: 'text-blue-400',
        border: 'border-blue-400/50'
    },
    {
        id: 'dca_accumulation',
        name: 'Acumulación DCA',
        icon: Activity,
        description: 'Compra escalonada en caídas. Promedia precio de entrada a la baja.',
        color: 'text-purple-400',
        border: 'border-purple-400/50'
    },
    {
        id: 'breakout_buyer',
        name: 'Compra en Breakout',
        icon: Crosshair,
        description: 'Compra al romper resistencias clave con volumen. Busca continuaciones.',
        color: 'text-green-400',
        border: 'border-green-400/50'
    }
];

const StrategySelector = ({ selected, onSelect }) => {
    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Estilo de Trading
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {strategies.map((strategy) => {
                    const Icon = strategy.icon;
                    const isSelected = selected === strategy.id;

                    return (
                        <motion.button
                            key={strategy.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(strategy.id)}
                            className={`
                relative flex flex-col items-start p-4 rounded-xl border text-left transition-all
                ${isSelected
                                    ? `bg-accent/10 ${strategy.border} shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                                    : 'bg-card border-border hover:border-foreground/20'}
              `}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-5 h-5 ${strategy.color}`} />
                                <span className={`font-bold text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {strategy.name}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {strategy.description}
                            </p>
                            {isSelected && (
                                <div className={`absolute inset-0 rounded-xl border-2 ${strategy.border} pointer-events-none opacity-50`} />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default StrategySelector;
