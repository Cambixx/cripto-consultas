import React, { useState } from 'react';
import { Key, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GeminiInput = ({ onApiKeySubmit }) => {
    const [apiKey, setApiKey] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onApiKeySubmit(apiKey);
            setIsVisible(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full max-w-md mx-auto mb-8"
                >
                    <div className="bg-card border border-border p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                            <Key className="w-5 h-5 text-accent" />
                            Configure Gemini API
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">
                                    Enter your FREE Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                    placeholder="AIzaSy..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!apiKey}
                                className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Start Analysis <Check className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GeminiInput;
