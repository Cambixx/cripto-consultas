import { useState } from 'react';
import { getGeminiAnalysis } from '../services/api';
import { calculateIndicators } from '../utils/indicators';

export const useGeminiAnalysis = (apiKey) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const runAnalysis = async (selectedCrypto, strategy, mtfData, marketSentiment) => {
        if (!apiKey || !selectedCrypto || !mtfData) return;

        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            if (!mtfData.mtf.data.length) {
                throw new Error('No se pudieron obtener datos del mercado.');
            }

            const indicators = calculateIndicators(mtfData.mtf.data);
            const currentPrice = mtfData.mtf.data[mtfData.mtf.data.length - 1].close;
            const htfIndicators = calculateIndicators(mtfData.htf.data);
            const htfTrend = htfIndicators.latest.ema200 && mtfData.htf.data.slice(-1)[0].close > htfIndicators.latest.ema200 ? 'ALCISTA' : 'BAJISTA';

            const fearAndGreedText = marketSentiment
                ? `${marketSentiment.value} (${marketSentiment.value_classification})`
                : 'Datos no disponibles';

            const prompt = `
        Actúa como un ${strategy === 'scalper' ? 'Scalper Agresivo' : strategy === 'mean_reversion' ? 'Trader de Reversión' : 'Trader Institucional de Tendencias'}.
        Analiza ${selectedCrypto.symbol} con un enfoque de **Análisis Multi-Temporal (MTA)**:
        
        1. **Tendencia Macro (${mtfData.htf.timeframe})**: ${htfTrend} (Precio vs EMA200).
        2. **Estructura Actual (${mtfData.mtf.timeframe})**:
           - Precio: ${currentPrice}
           - RSI: ${indicators.latest.rsi.toFixed(2)}
           - MACD: ${indicators.latest.macd.MACD?.toFixed(4)}
           - Bandas Bollinger: Rango ${indicators.latest.bb.lower?.toFixed(4)} - ${indicators.latest.bb.upper?.toFixed(4)}
        3. **Micro-Estructura (${mtfData.ltf.timeframe})**:
           - Cierre Reciente: ${mtfData.ltf.data.slice(-1)[0].close}
        
        Contexto Global: Sentimiento ${fearAndGreedText}, Estrategia ${strategy.toUpperCase()}.
        ${marketSentiment?.value_classification === 'Neutral' ? '⚠️ ADVERTENCIA: Mercado Choppy.' : ''}
        
        Genera un Plan de Trading detallado en ESPAÑOL resaltando Acción, Entrada, SL y TP.
      `;

            const result = await getGeminiAnalysis(apiKey, prompt);
            setAnalysis(result);
            return result;
        } catch (err) {
            console.error(err);
            setError(err.message || 'Ocurrió un error inesperado.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        analysis,
        setAnalysis,
        isLoading,
        error,
        setError,
        runAnalysis
    };
};
