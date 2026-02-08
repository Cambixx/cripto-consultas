import React, { useState } from 'react';
import { Search, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CryptoSelector = ({ cryptos, onSelect, favorites = [], toggleFavorite }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState(null);

    const filteredCryptos = cryptos.filter(c =>
        c.symbol.toLowerCase().includes(search.toLowerCase())
    );

    const favoriteCryptos = cryptos.filter(c => favorites.includes(c.symbol));

    const handleSelect = (crypto) => {
        setSelectedCrypto(crypto);
        onSelect(crypto);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative w-full max-w-sm">
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:bg-white/10 transition-all h-[52px] group"
                >
                    <div className="flex items-center gap-3">
                        {selectedCrypto ? (
                            <div className="flex items-center gap-2">
                                <span className="text-foreground font-bold tracking-tight">{selectedCrypto.symbol}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCrypto.change24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {selectedCrypto.change24h >= 0 ? '+' : ''}{selectedCrypto.change24h}%
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-sm font-medium">Buscar activo...</span>
                        )}
                    </div>
                    <Search className={`w-4 h-4 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop to close */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute z-50 w-full mt-2 bg-card border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[400px] overflow-hidden flex flex-col"
                            >
                                <div className="p-3 bg-white/5 border-b border-white/5">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Filtrar por nombre..."
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            autoFocus
                                        />
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    {/* Favorites Section */}
                                    {favorites.length > 0 && !search && (
                                        <div className="p-2 border-b border-white/5">
                                            <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                                                <Star className="w-3 h-3 fill-primary" /> Favoritos
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 mt-1">
                                                {favoriteCryptos.map(crypto => (
                                                    <button
                                                        key={`fav-${crypto.symbol}`}
                                                        onClick={() => handleSelect(crypto)}
                                                        className="px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-all group"
                                                    >
                                                        <span className="text-sm font-bold group-hover:text-primary transition-colors">{crypto.symbol}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All Cryptos */}
                                    <div className="p-1">
                                        {filteredCryptos.length > 0 ? (
                                            filteredCryptos.map((crypto) => (
                                                <div key={crypto.symbol} className="flex items-center group/item px-1">
                                                    <button
                                                        onClick={() => handleSelect(crypto)}
                                                        className="flex-1 text-left px-3 py-2.5 hover:bg-white/10 rounded-lg transition-all flex justify-between items-center"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm tracking-tight group-hover/item:text-primary transition-colors">{crypto.symbol}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">Binance Spot</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-mono font-bold">${crypto.price < 1 ? crypto.price.toFixed(6) : crypto.price.toLocaleString()}</span>
                                                            <span className={`text-[10px] font-bold ${crypto.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                                {crypto.change24h > 0 ? '+' : ''}{crypto.change24h}%
                                                            </span>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFavorite(crypto.symbol);
                                                        }}
                                                        className={`p-2 rounded-lg hover:bg-white/10 transition-all ${favorites.includes(crypto.symbol) ? 'text-primary' : 'text-muted-foreground opacity-20 hover:opacity-100'}`}
                                                    >
                                                        <Star className={`w-4 h-4 ${favorites.includes(crypto.symbol) ? 'fill-primary' : ''}`} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                                                <Sparkles className="w-6 h-6 opacity-20" />
                                                <p className="text-xs font-mono uppercase tracking-widest">Sin resultados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CryptoSelector;
