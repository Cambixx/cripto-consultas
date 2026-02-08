import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Calculator as CalculatorIcon } from 'lucide-react';
import GeminiInput from './components/GeminiInput';
import CryptoSelector from './components/CryptoSelector';
import TimeframeSelector from './components/TimeframeSelector';
import AnalysisResult from './components/AnalysisResult';
import PriceChart from './components/PriceChart';
import FearAndGreed from './components/FearAndGreed';
import StrategySelector from './components/StrategySelector';
import RiskCalculator from './components/RiskCalculator';
import { getTopCryptos, getCandleData, getGeminiAnalysis, getMultiTimeframeData } from './services/api';
import { calculateIndicators } from './utils/indicators';

const App = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [timeframe, setTimeframe] = useState('4h');
  const [candles, setCandles] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState(null);
  const [strategy, setStrategy] = useState('trend_follower');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCryptos = async () => {
      const data = await getTopCryptos();
      setCryptos(data);
    };
    fetchCryptos();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCrypto) return;
      try {
        const data = await getCandleData(selectedCrypto.symbol, timeframe);
        setCandles(data);
      } catch (e) {
        console.error("Failed to fetch candles", e);
      }
    };
    fetchData();
  }, [selectedCrypto, timeframe]);

  const handleApiKeySubmit = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleAnalysis = async () => {
    if (!apiKey || !selectedCrypto) return;
    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const mtfData = await getMultiTimeframeData(selectedCrypto.symbol, timeframe);
      if (!mtfData.mtf.data.length) throw new Error('No se pudieron obtener datos del mercado.');
      const indicators = calculateIndicators(mtfData.mtf.data);
      const currentPrice = mtfData.mtf.data[mtfData.mtf.data.length - 1].close;
      const htfIndicators = calculateIndicators(mtfData.htf.data);
      const htfTrend = htfIndicators.ema200 && mtfData.htf.data.slice(-1)[0].close > htfIndicators.ema200 ? 'ALCISTA' : 'BAJISTA';
      const fearAndGreedText = marketSentiment ? `${marketSentiment.value} (${marketSentiment.value_classification})` : 'Datos no disponibles';

      const prompt = `
        Actúa como un ${strategy === 'scalper' ? 'Scalper Agresivo' : strategy === 'mean_reversion' ? 'Trader de Reversión' : 'Trader Institucional de Tendencias'}.
        Analiza ${selectedCrypto.symbol} con un enfoque de **Análisis Multi-Temporal (MTA)**:
        1. **Tendencia Macro (${mtfData.htf.timeframe})**: ${htfTrend} (Precio vs EMA200).
        2. **Estructura Actual (${mtfData.mtf.timeframe})**: Precio: ${currentPrice}, RSI: ${indicators.rsi.toFixed(2)}, MACD: ${indicators.macd.MACD?.toFixed(4)}.
        3. **Micro-Estructura (${mtfData.ltf.timeframe})**: Cierre Reciente: ${mtfData.ltf.data.slice(-1)[0].close}.
        Contexto Global: Sentimiento ${fearAndGreedText}, Estrategia ${strategy.toUpperCase()}.
        ${marketSentiment?.value_classification === 'Neutral' ? '⚠️ ADVERTENCIA: Mercado Choppy.' : ''}
        Genera un Plan de Trading detallado en ESPAÑOL resaltando Acción, Entrada, SL y TP.
      `;

      const result = await getGeminiAnalysis(apiKey, prompt);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-8"
      >
        <header className="flex flex-col sm:flex-row justify-between items-center gap-6 py-4">
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl neo-shadow">
              <BrainCircuit className="w-10 h-10 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                CryptoOracle <span className="text-foreground/50 text-2xl font-light">PRO</span>
              </h1>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-1">
                Institutional MTA Intelligence
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <FearAndGreed onValueChange={setMarketSentiment} />
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="p-3 glass hover:bg-primary/10 text-primary rounded-xl transition-all neo-shadow group"
              title="Risk Calculator"
            >
              <CalculatorIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        </header>

        {!apiKey ? (
          <motion.div variants={itemVariants} className="max-w-md mx-auto pt-20">
            <GeminiInput onApiKeySubmit={handleApiKeySubmit} />
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Control Bar */}
            <motion.div variants={itemVariants} className="glass p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
                <CryptoSelector cryptos={cryptos} onSelect={setSelectedCrypto} />
                <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('gemini_api_key');
                  setApiKey('');
                }}
                className="text-xs font-mono text-muted-foreground hover:text-destructive px-4 opacity-50 hover:opacity-100 transition-all uppercase tracking-tighter"
              >
                Cerrar Sesión
              </button>
            </motion.div>

            {/* Chart Block */}
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
                <div className="h-[400px] glass rounded-2xl flex items-center justify-center text-muted-foreground border-dashed border-2 border-white/5">
                  Selecciona un activo para proyectar el gráfico
                </div>
              )}
            </motion.div>

            {/* Strategy Selection */}
            <motion.div variants={itemVariants} className="glass p-6 sm:p-8 rounded-2xl space-y-8 neo-shadow border border-white/5">
              <StrategySelector selected={strategy} onSelect={setStrategy} />

              <motion.button
                whileHover={{ scale: 1.01, boxShadow: "0 0 30px -10px hsla(199, 89%, 48%, 0.5)" }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAnalysis}
                disabled={!selectedCrypto || isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-primary to-blue-400 text-white font-bold py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 text-xl tracking-tight relative overflow-hidden group"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <BrainCircuit className="w-7 h-7 animate-spin" />
                    Sincronizando con el Oráculo Pro...
                  </span>
                ) : (
                  'ANALIZAR MULTI-TEMPORALIDAD AHORA'
                )}
              </motion.button>
            </motion.div>

            {/* Result Area */}
            <motion.div variants={itemVariants} className="w-full pb-20">
              <AnalysisResult analysis={analysis} isLoading={isLoading} error={error} />
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default App;
