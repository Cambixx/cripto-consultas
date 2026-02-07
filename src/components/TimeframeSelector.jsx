import React from 'react';
import { motion } from 'framer-motion';

const timeframes = [
    { label: '1 Hour', value: '1h' },
    { label: '4 Hours', value: '4h' },
    { label: '1 Day', value: '1d' },
    { label: '1 Week', value: '1w' },
];

const TimeframeSelector = ({ selected, onSelect }) => {
    return (
        <div className="flex justify-center gap-2 mb-8">
            {timeframes.map((tf) => (
                <motion.button
                    key={tf.value}
                    onClick={() => onSelect(tf.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selected === tf.value
                            ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
                            : 'bg-card border border-border text-muted-foreground hover:bg-accent/10'
                        }`}
                >
                    {tf.label}
                </motion.button>
            ))}
        </div>
    );
};

export default TimeframeSelector;
