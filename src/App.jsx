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
  const [compareCrypto, setCompareCrypto] = useState(null);
  const [timeframe, setTimeframe] = useState('4h');
  const [strategy, setStrategy] = useState('swing_spot');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);

  // Data & AI Hooks
  const {
    cryptos,
    candles,
    indicators,
    marketSentiment,
    setMarketSentiment,
    isLoading: isMarketLoading,
    fetchMTFData
  } = useMarketData(selectedCrypto, timeframe);

  const {
    candles: compareCandles,
    isLoading: isCompareLoading,
  } = useMarketData(compareCrypto, timeframe);

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
              compareCrypto={compareCrypto}
              setCompareCrypto={setCompareCrypto}
              isSplitView={isSplitView}
              setIsSplitView={setIsSplitView}
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

            <motion.div variants={itemVariants} className={`grid gap-6 ${isSplitView ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Main Chart */}
              <div className="bg-black border-4 border-white neo-shadow p-6 order-1">
                {selectedCrypto && candles.length > 0 ? (
                  <PriceChart
                    data={candles}
                    symbol={selectedCrypto.symbol}
                    timeframe={timeframe}
                    indicators={indicators}
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-primary border-4 border-dashed border-primary/20 bg-black font-mono text-xs uppercase tracking-[0.3em] text-center px-8">
                    {isMarketLoading ? '> ESTABLECIENDO CONEXIÓN...' : '> ESPERANDO ACTIVO PRINCIPAL'}
                  </div>
                )}
              </div>

              {/* Comparison Chart */}
              {isSplitView && (
                <div className="bg-black border-4 border-white neo-shadow p-6 order-2">
                  {compareCrypto && compareCandles.length > 0 ? (
                    <PriceChart
                      data={compareCandles}
                      symbol={compareCrypto.symbol}
                      timeframe={timeframe}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-primary border-4 border-dashed border-primary/20 bg-black font-mono text-xs uppercase tracking-[0.3em] text-center px-8">
                      {isCompareLoading ? '> ESCANEANDO LIQUIDEZ...' : '> ESPERANDO ACTIVO SECUNDARIO'}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="bg-black p-6 sm:p-8 border-4 border-white space-y-8 neo-shadow">
              <StrategySelector selected={strategy} onSelect={setStrategy} />

              <motion.button
                whileTap={{ scale: 0.98, x: 4, y: 4 }}
                onClick={handleAnalysis}
                disabled={!selectedCrypto || isAnalysisLoading}
                className="w-full bg-primary text-black font-black py-6 border-4 border-white neo-shadow transition-all disabled:opacity-50 text-2xl tracking-[0.1em] uppercase relative overflow-hidden group"
              >
                {isAnalysisLoading ? (
                  <span className="flex items-center justify-center gap-4">
                    <BrainCircuit className="w-8 h-8 animate-spin" />
                    PROCESANDO DATOS...
                  </span>
                ) : (
                  'EJECUTAR ANÁLISIS DEL ORÁCULO'
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
