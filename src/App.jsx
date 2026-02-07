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

  // Auto-fetch candles when selection changes
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
      // 1. Fetch Multi-Timeframe Data
      const mtfData = await getMultiTimeframeData(selectedCrypto.symbol, timeframe);

      if (!mtfData.mtf.data.length) {
        throw new Error('No se pudieron obtener datos del mercado.');
      }

      // 2. Calculate Indicators for Current Timeframe (MTF)
      const indicators = calculateIndicators(mtfData.mtf.data);
      const currentPrice = mtfData.mtf.data[mtfData.mtf.data.length - 1].close;

      // Calculate HTF Trend (Simple Check: Price vs EMA200 on HTF)
      const htfIndicators = calculateIndicators(mtfData.htf.data);
      const htfTrend = htfIndicators.ema200 && mtfData.htf.data.slice(-1)[0].close > htfIndicators.ema200 ? 'ALCISTA' : 'BAJISTA';

      const fearAndGreedText = marketSentiment
        ? `${marketSentiment.value} (${marketSentiment.value_classification})`
        : 'Datos no disponibles';

      // 3. Construct Context-Aware Prompt
      const prompt = `
        Actúa como un ${strategy === 'scalper' ? 'Scalper Agresivo' : strategy === 'mean_reversion' ? 'Trader de Reversión' : 'Trader Institucional de Tendencias'}.
        
        Analiza ${selectedCrypto.symbol} con un enfoque de **Análisis Multi-Temporal (MTA)**:
        
        1. **Tendencia Macro (${mtfData.htf.timeframe})**: ${htfTrend} (Precio vs EMA200).
        2. **Estructura Actual (${mtfData.mtf.timeframe})**:
           - Precio: ${currentPrice}
           - RSI (14): ${indicators.rsi.toFixed(2)}
           - MACD: ${indicators.macd.MACD?.toFixed(4)}
           - Bandas Bollinger: Rango ${indicators.bb.lower?.toFixed(4)} - ${indicators.bb.upper?.toFixed(4)}
        3. **Micro-Estructura (${mtfData.ltf.timeframe})**:
           - Cierre Reciente: ${mtfData.ltf.data.slice(-1)[0].close}
        
        **Contexto Global**:
        - Sentimiento: ${fearAndGreedText}
        - Estrategia Seleccionada: ${strategy.toUpperCase()}
        
        **Instrucciones**:
        ${marketSentiment?.value_classification === 'Neutral' ? '⚠️ ADVERTENCIA: Mercado sin dirección clara (Choppy). Prioriza la preservación de capital.' : ''}
        
        Genera un Plan de Trading detallado en ESPAÑOL:
        
        1. **Diagnóstico MTA**: ¿Están alineadas la tendencia Macro y Micro?
        2. **Estrategia Ejecutable**:
           - **Dirección**: LONG / SHORT / ESPERAR
           - **Zona de Entrada**: Precio exacto o confirmación necesaria en ${mtfData.ltf.timeframe}.
           - **Stop Loss**: Nivel técnico (Soporte/Resistencia).
           - **Take Profit**: Objetivos logicos.
        3. **Gestión de Riesgo**:
           - Sugerencia de tamaño de posición (Conservador/Agresivo) dada la confianza del setup.
        
        Sé directo, profesional y evita la ambigüedad.
      `;

      // Call Gemini
      const result = await getGeminiAnalysis(apiKey, prompt);
      setAnalysis(result);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-accent selection:text-accent-foreground">
      <RiskCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        currentPrice={candles[candles.length - 1]?.close}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <header className="text-center mb-10 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrainCircuit className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-accent bg-clip-text text-transparent">
              CryptoOracle Pro
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Institutional-Grade Multi-Timeframe Analysis
          </p>
        </header>

        {!apiKey ? (
          <div className="max-w-md mx-auto">
            <GeminiInput onApiKeySubmit={handleApiKeySubmit} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Control Bar */}
            <div className="bg-card border border-border p-4 rounded-xl shadow-lg flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1 min-w-[200px]">
                  <CryptoSelector cryptos={cryptos} onSelect={setSelectedCrypto} />
                </div>
                <div className="min-w-[150px]">
                  <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
                </div>
              </div>

              <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                <FearAndGreed onValueChange={setMarketSentiment} />
                <button
                  onClick={() => setIsCalculatorOpen(true)}
                  className="p-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg border border-accent/20 transition-colors"
                  title="Risk Calculator"
                >
                  <CalculatorIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('gemini_api_key');
                    setApiKey('');
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap"
                >
                  Salir
                </button>
              </div>
            </div>

            {/* Price Chart - Full Width */}
            <div className="w-full">
              {selectedCrypto && candles.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full min-h-[500px]"
                >
                  <PriceChart
                    data={candles}
                    symbol={selectedCrypto.symbol}
                    timeframe={timeframe}
                  />
                </motion.div>
              ) : (
                <div className="h-[400px] bg-card/50 border border-border/50 rounded-xl flex items-center justify-center text-muted-foreground">
                  Selecciona una criptomoneda para ver el gráfico
                </div>
              )}
            </div>

            {/* Strategy Selection & Action - Full Width */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-lg space-y-6">
              <StrategySelector selected={strategy} onSelect={setStrategy} />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAnalysis}
                disabled={!selectedCrypto || isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-accent text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <BrainCircuit className="w-6 h-6 animate-pulse" />
                    Analizando Tendencia Macro (1D), Estructura (4H) y Entrada ({timeframe})...
                  </span>
                ) : (
                  'Ejecutar Análisis Profesional Multi-Temporal'
                )}
              </motion.button>
            </div>

            {/* Analysis Result - Full Width */}
            <div className="w-full">
              <AnalysisResult analysis={analysis} isLoading={isLoading} error={error} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default App;
