import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

// Hooks
import { useMarketData } from './hooks/useMarketData';
import { useGeminiAnalysis } from './hooks/useGeminiAnalysis';
import { useLocalStorage } from './hooks/useLocalStorage';

// Layout Components
import Header from './components/layout/Header';
import ControlBar from './components/layout/ControlBar';
import AnalysisHistory from './components/layout/AnalysisHistory';

// Feature Components
import GeminiInput from './components/GeminiInput';
import AnalysisResult from './components/AnalysisResult';
import PriceChart from './components/PriceChart';
import StrategySelector from './components/StrategySelector';
import RiskCalculator from './components/RiskCalculator';

const App = () => {
  // Persistence
  const [apiKey, setApiKey] = useLocalStorage('gemini_api_key', import.meta.env.VITE_GEMINI_API_KEY || '');
  const [favorites, setFavorites] = useLocalStorage('crypto_favorites', []);
  const [history, setHistory] = useLocalStorage('analysis_history', []);

  // UI State
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [timeframe, setTimeframe] = useState('4h');
  const [strategy, setStrategy] = useState('trend_follower');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Data & AI Hooks
  const {
    cryptos,
    candles,
    marketSentiment,
    setMarketSentiment,
    isLoading: isMarketLoading,
    fetchMTFData
  } = useMarketData(selectedCrypto, timeframe);

  const {
    analysis,
    setAnalysis,
    isLoading: isAnalysisLoading,
    error: analysisError,
    runAnalysis
  } = useGeminiAnalysis(apiKey);

  const handleAnalysis = useCallback(async () => {
    if (!selectedCrypto || !apiKey) return;
    try {
      const mtfData = await fetchMTFData();
      const result = await runAnalysis(selectedCrypto, strategy, mtfData, marketSentiment);

      if (result) {
        setHistory(prev => [{
          id: Date.now(),
          symbol: selectedCrypto.symbol,
          timeframe,
          strategy,
          result: result,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10));
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  }, [selectedCrypto, apiKey, timeframe, strategy, marketSentiment, fetchMTFData, runAnalysis, setHistory]);

  const toggleFavorite = (symbol) => {
    setFavorites(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space to Analyze
      if (e.code === 'Space' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAnalysis();
      }
      // H to open History
      if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsHistoryOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnalysis]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <RiskCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        currentPrice={candles[candles.length - 1]?.close}
      />

      <AnalysisHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={setAnalysis}
        onClear={() => setHistory([])}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-8"
      >
        <Header
          onCalculatorOpen={() => setIsCalculatorOpen(true)}
          setMarketSentiment={setMarketSentiment}
          itemVariants={itemVariants}
        />

        {!apiKey ? (
          <motion.div variants={itemVariants} className="max-w-md mx-auto pt-20">
            <GeminiInput onApiKeySubmit={setApiKey} />
          </motion.div>
        ) : (
          <div className="space-y-8">
            <ControlBar
              cryptos={cryptos}
              selectedCrypto={selectedCrypto}
              setSelectedCrypto={setSelectedCrypto}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onHistoryOpen={() => setIsHistoryOpen(true)}
              onLogout={() => {
                localStorage.removeItem('gemini_api_key');
                setApiKey('');
              }}
              itemVariants={itemVariants}
            />

            <motion.div variants={itemVariants} className="w-full">
              {selectedCrypto && candles.length > 0 ? (
                <div className="glass rounded-2xl neo-shadow p-6 border border-white/5">
                  <PriceChart
                    data={candles}
                    symbol={selectedCrypto.symbol}
                    timeframe={timeframe}
                  />
                </div>
              ) : (
                <div className="h-[400px] glass rounded-2xl flex items-center justify-center text-muted-foreground border-dashed border-2 border-white/5 font-mono text-sm uppercase tracking-widest text-center px-8">
                  {isMarketLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ x: [-48, 48] }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-12 h-full bg-primary"
                        />
                      </div>
                      Sincronizando flujos de mercado...
                    </div>
                  ) : 'Selecciona un activo para proyectar el gráfico'}
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="glass p-6 sm:p-8 rounded-2xl space-y-8 neo-shadow border border-white/5">
              <StrategySelector selected={strategy} onSelect={setStrategy} />

              <motion.button
                whileHover={{ scale: 1.01, boxShadow: "0 0 30px -10px hsla(199, 89%, 48%, 0.5)" }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAnalysis}
                disabled={!selectedCrypto || isAnalysisLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-primary to-blue-400 text-white font-bold py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 text-xl tracking-tight relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 slant" />
                {isAnalysisLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <BrainCircuit className="w-7 h-7 animate-spin" />
                    Sincronizando con el Oráculo Pro...
                  </span>
                ) : (
                  'ANALIZAR MULTI-TEMPORALIDAD AHORA'
                )}
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="w-full pb-20">
              <AnalysisResult analysis={analysis} isLoading={isAnalysisLoading} error={analysisError} />
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default App;
