import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import GeminiInput from './components/GeminiInput';
import CryptoSelector from './components/CryptoSelector';
import TimeframeSelector from './components/TimeframeSelector';
import AnalysisResult from './components/AnalysisResult';
import PriceChart from './components/PriceChart';
import FearAndGreed from './components/FearAndGreed';
import { getTopCryptos, getCandleData, getGeminiAnalysis } from './services/api';
import { calculateIndicators } from './utils/indicators';

const App = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [timeframe, setTimeframe] = useState('4h');
  const [candles, setCandles] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState(null);
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
      // Use existing candles or refetch if empty
      let currentCandles = candles;
      if (!currentCandles.length) {
        currentCandles = await getCandleData(selectedCrypto.symbol, timeframe);
        setCandles(currentCandles);
      }

      if (!currentCandles.length) {
        throw new Error('No se pudieron obtener datos del mercado. Por favor intenta de nuevo.');
      }

      // Calculate indicators
      const indicators = calculateIndicators(currentCandles);
      const currentPrice = currentCandles[currentCandles.length - 1].close;

      const fearAndGreedText = marketSentiment
        ? `${marketSentiment.value} (${marketSentiment.value_classification})`
        : 'Datos no disponibles';

      // Construct prompt
      const prompt = `
        Actúa como un experto trader de criptomonedas. Analiza los siguientes datos para ${selectedCrypto.symbol} en la temporalidad de ${timeframe}.
        
        Precio Actual: ${currentPrice}
        
        Sentimiento General del Mercado (Fear & Greed Index): ${fearAndGreedText}
        
        Indicadores Técnicos:
        - RSI (14): ${indicators.rsi.toFixed(2)}
        - MACD: ${indicators.macd.MACD?.toFixed(4) || 0} (Señal: ${indicators.macd.signal?.toFixed(4) || 0}, Histograma: ${indicators.macd.histogram?.toFixed(4) || 0})
        - Bandas de Bollinger: Superior ${indicators.bb.upper?.toFixed(4) || 0}, Inferior ${indicators.bb.lower?.toFixed(4) || 0}, Media ${indicators.bb.middle?.toFixed(4) || 0}
        - EMA (50): ${indicators.ema50.toFixed(4)}
        - EMA (200): ${indicators.ema200.toFixed(4)}
        
        Historial de Precios Reciente (Últimas 5 velas - Cierre):
        ${currentCandles.slice(-5).map(c => c.close).join(', ')}

        Basado en estos datos, proporciona un consejo de trading específico para un trader de SPOT (que busca comprar barato y vender caro).
        
        Estructura tu respuesta de la siguiente manera:
        1. **Sentimiento del Mercado**: Integra el análisis técnico con el índice de Miedo y Codicia. ¿Es un momento de compra por miedo extremo o venta por euforia?
        2. **Análisis Técnico**: analiza profundamente los indicadores. ¿El precio respeta las EMAs?
        3. **Estrategia de Trading Spot**: 
           - **Acción**: COMPRAR / VENDER / MANTENER / ESPERAR
           - **Precio de Entrada**: Rango preciso.
           - **Stop Loss**: (Opcional en spot, pero sugerido).
           - **Take Profit**: Objetivos clave.
        4. **Advertencia de Riesgo**: Breve.

        Mantén un tono profesional pero accesible. Responde en ESPAÑOL.
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <header className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrainCircuit className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-accent bg-clip-text text-transparent">
              CryptoOracle
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            AI-Powered Spot Trading Analysis
          </p>
        </header>

        {!apiKey ? (
          <div className="max-w-md mx-auto">
            <GeminiInput onApiKeySubmit={handleApiKeySubmit} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Control Panel */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-lg">
              <div className="flex flex-col xl:flex-row gap-6 items-end justify-between">
                <div className="w-full xl:w-2/3 flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <CryptoSelector cryptos={cryptos} onSelect={setSelectedCrypto} />
                  </div>
                  <div>
                    <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
                  </div>
                </div>

                <div className="w-full xl:w-1/3 flex flex-col gap-4">
                  <div className="flex justify-end">
                    <FearAndGreed onValueChange={setMarketSentiment} />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnalysis}
                    disabled={!selectedCrypto || isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-accent text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Analyzing Market...' : 'Generate AI Analysis'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Chart Section */}
              {selectedCrypto && candles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <PriceChart
                    data={candles}
                    symbol={selectedCrypto.symbol}
                    timeframe={timeframe}
                  />
                </motion.div>
              )}

              {/* Analysis Section */}
              <div className={!selectedCrypto ? "col-span-2" : ""}>
                <AnalysisResult analysis={analysis} isLoading={isLoading} error={error} />
              </div>
            </div>

            <div className="text-center pt-8">
              <button
                onClick={() => {
                  localStorage.removeItem('gemini_api_key');
                  setApiKey('');
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear API Key
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default App;
