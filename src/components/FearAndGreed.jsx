import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

const CACHE_KEY = 'fng_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const FearAndGreed = ({ onValueChange }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFNG = async () => {
            // Check cache
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { value, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setData(value);
                        if (onValueChange) onValueChange(value);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                // ignore cache errors
            }

            try {
                const response = await axios.get('https://api.alternative.me/fng/');
                const result = response.data.data[0];
                setData(result);
                if (onValueChange) {
                    onValueChange(result);
                }
                // Save to cache
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        value: result,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    // ignore storage errors
                }
            } catch (error) {
                console.error("Error fetching Fear & Greed Index:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFNG();
    }, [onValueChange]);

    if (loading) return <div className="text-muted-foreground text-sm animate-pulse">Loading Sentiment...</div>;
    if (!data) return null;

    const value = parseInt(data.value);

    // Determine color based on value
    let colorClass = "text-yellow-500"; // Neutral
    if (value >= 75) colorClass = "text-green-500"; // Extreme Greed
    else if (value >= 55) colorClass = "text-green-400"; // Greed
    else if (value <= 25) colorClass = "text-red-500"; // Extreme Fear
    else if (value <= 45) colorClass = "text-red-400"; // Fear

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-lg shadow-sm"
        >
            <Gauge className={`w-5 h-5 ${colorClass}`} />
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Fear & Greed</span>
                <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold ${colorClass}`}>{value}</span>
                    <span className="text-sm text-foreground/80 font-medium">{data.value_classification}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default FearAndGreed;

