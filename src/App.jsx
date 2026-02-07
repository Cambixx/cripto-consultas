import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import GeminiInput from './components/GeminiInput';
import CryptoSelector from './components/CryptoSelector';
import TimeframeSelector from './components/TimeframeSelector';
import AnalysisResult from './components/AnalysisResult';
import { getTopCryptos, getCandleData, getGeminiAnalysis } from './services/api';
import { calculateIndicators } from './utils/indicators';

const App = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [timeframe, setTimeframe] = useState('4h');
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
      // Fetch candle data
      const candles = await getCandleData(selectedCrypto.symbol, timeframe);

      if (!candles.length) {
        throw new Error('Failed to fetch market data. Please try again.');
      }

      // Calculate indicators
      const indicators = calculateIndicators(candles);
      const currentPrice = candles[candles.length - 1].close;

      // Construct prompt
      const prompt = `
        Actúa como un experto trader de criptomonedas. Analiza los siguientes datos para ${selectedCrypto.symbol} en la temporalidad de ${timeframe}.
        
        Precio Actual: ${currentPrice}
        
        Indicadores Técnicos:
        - RSI (14): ${indicators.rsi.toFixed(2)}
        - MACD: ${indicators.macd.MACD?.toFixed(4) || 0} (Señal: ${indicators.macd.signal?.toFixed(4) || 0}, Histograma: ${indicators.macd.histogram?.toFixed(4) || 0})
        - Bandas de Bollinger: Superior ${indicators.bb.upper?.toFixed(4) || 0}, Inferior ${indicators.bb.lower?.toFixed(4) || 0}, Media ${indicators.bb.middle?.toFixed(4) || 0}
        - EMA (50): ${indicators.ema50.toFixed(4)}
        - EMA (200): ${indicators.ema200.toFixed(4)}
        
        Historial de Precios Reciente (Últimas 5 velas - Cierre):
        ${candles.slice(-5).map(c => c.close).join(', ')}

        Basado en estos datos, proporciona un consejo de trading específico para un trader de SPOT (que busca comprar barato y vender caro).
        
        Estructura tu respuesta de la siguiente manera:
        1. **Sentimiento del Mercado**: ¿Alcista, Bajista o Neutral?
        2. **Análisis Técnico**: analiza profundamente los indicadores. ¿Está el RSI sobrecomprado/sobrevendido? ¿El precio está por encima/debajo de las EMAs? ¿Cruce de MACD?
        3. **Estrategia de Trading Spot**: 
           - **Acción**: COMPRAR / VENDER / MANTENER / ESPERAR
           - **Precio de Entrada**: Rango de entrada sugerido si es compra.
           - **Stop Loss**: Nivel sugerido (aunque es spot, para gestión de riesgo).
           - **Take Profit**: Niveles objetivos.
        4. **Advertencia de Riesgo**: Breve descargo de responsabilidad.

        Mantén un tono profesional pero accesible. Enfócate en oportunidades potenciales. Responde completamente en ESPAÑOL.
      `;

      // Call Gemini
      const result = await getGeminiAnalysis(apiKey, prompt);
      setAnalysis(result);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-accent selection:text-accent-foreground">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
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
          <GeminiInput onApiKeySubmit={handleApiKeySubmit} />
        ) : (
          <div className="space-y-8">
            <div className="bg-card border border-border p-6 rounded-xl shadow-lg">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-1/2">
                  <CryptoSelector cryptos={cryptos} onSelect={setSelectedCrypto} />
                </div>
                <div className="w-full md:w-auto">
                  <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalysis}
                disabled={!selectedCrypto || isLoading}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-accent text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isLoading ? 'Analyzing Market Data...' : 'Generate AI Analysis'}
              </motion.button>
            </div>

            <AnalysisResult analysis={analysis} isLoading={isLoading} error={error} />

            <div className="text-center">
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
