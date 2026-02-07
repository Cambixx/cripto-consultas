import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const CryptoSelector = ({ cryptos, onSelect }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState(null);

    const filteredCryptos = cryptos.filter(c =>
        c.symbol.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (crypto) => {
        setSelectedCrypto(crypto);
        onSelect(crypto);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative w-full max-w-md mx-auto mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Cryptocurrency
            </label>

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-accent transition-colors"
                >
                    <span className={selectedCrypto ? "text-foreground font-semibold" : "text-muted-foreground"}>
                        {selectedCrypto ? selectedCrypto.symbol : "Search and select a pair..."}
                    </span>
                    <Search className="w-4 h-4 text-muted-foreground" />
                </button>

                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-card p-2 border-b border-border">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search symbol (e.g. BTC)..."
                                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                                autoFocus
                            />
                        </div>

                        {filteredCryptos.map((crypto) => (
                            <button
                                key={crypto.symbol}
                                onClick={() => handleSelect(crypto)}
                                className="w-full text-left px-4 py-2 hover:bg-accent/10 transition-colors flex justify-between items-center"
                            >
                                <span className="font-medium">{crypto.symbol}</span>
                                <span className={crypto.change24h >= 0 ? "text-green-500 text-sm" : "text-red-500 text-sm"}>
                                    {crypto.change24h > 0 ? '+' : ''}{crypto.change24h}%
                                </span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default CryptoSelector;
