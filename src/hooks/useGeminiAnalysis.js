import { useState } from 'react';
import { getGeminiAnalysis } from '../services/api';
import { calculateIndicators } from '../utils/indicators';

const getStrategyPrompt = (strategy) => {
    switch (strategy) {
        case 'dca_accumulation':
            return {
                role: 'Experto en DCA (Dollar Cost Averaging) y acumulación inteligente',
                focus: 'Genera un PLAN DE ACUMULACIÓN escalonado. Define 3-4 niveles de compra con % del capital para cada uno. El objetivo es promediar el precio de entrada comprando más barato en cada nivel.',
                extra: '- Nivel 1 (Conservador): precio y % del capital\n- Nivel 2 (Agresivo): precio y % del capital\n- Nivel 3 (Ultra-dip): precio y % del capital\n- Intervalo temporal entre compras'
            };
        case 'breakout_buyer':
            return {
                role: 'Especialista en rupturas de resistencia y continuaciones alcistas en spot',
                focus: 'Identifica si hay un BREAKOUT potencial. Busca si el precio está cerca de una resistencia clave, si el volumen confirma, y define la entrada SOLO si la ruptura es confirmada (nunca anticipar).',
                extra: '- Nivel de resistencia a romper\n- Condiciones de confirmación (volumen, cierre por encima)\n- Entrada post-confirmación (retest de la resistencia como soporte)\n- Falso breakout: cuándo abortar'
            };
        case 'swing_spot':
        default:
            return {
                role: 'Trader institucional de Swing en Spot. Solo compras, sin apalancamiento',
                focus: 'Analiza la estructura de mercado para encontrar el MEJOR PUNTO DE COMPRA. Busca confluencias de soporte, sobreventa, y divergencias para una entrada precisa.',
                extra: '- Zona de compra ideal (rango de precio)\n- Stop loss basado en el soporte más cercano\n- Take profit parcial 1 (25%) y Take profit final (75%)\n- Timeframe estimado de la operación'
            };
    }
};

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

            const strategyInfo = getStrategyPrompt(strategy);
            const sr = indicators.latest.supportResistance;
            const supportsText = sr.supports.map(s => `$${s.price.toFixed(4)} (fuerza: ${s.count})`).join(', ') || 'No detectados';
            const resistancesText = sr.resistances.map(r => `$${r.price.toFixed(4)} (fuerza: ${r.count})`).join(', ') || 'No detectados';

            const prompt = `
Actúa como un ${strategyInfo.role}.
REGLA ABSOLUTA: Esto es TRADING SPOT. Solo puedes COMPRAR (nunca shorts, nunca apalancamiento). El objetivo es comprar barato y vender más caro.

Analiza ${selectedCrypto.symbol} para COMPRA EN SPOT:

1. **Tendencia Macro (${mtfData.htf.timeframe})**: ${htfTrend} (Precio vs EMA200)

2. **Estructura Actual (${mtfData.mtf.timeframe})**:
   - Precio actual: $${currentPrice}
   - RSI(14): ${indicators.latest.rsi.toFixed(2)}
   - Stoch RSI: ${indicators.latest.stochRSI ? `K=${indicators.latest.stochRSI.k.toFixed(2)}, D=${indicators.latest.stochRSI.d.toFixed(2)}` : 'N/A'}
   - MACD: ${indicators.latest.macd.MACD?.toFixed(4)} (Histograma: ${indicators.latest.macd.histogram?.toFixed(4)})
   - Bollinger: Inferior $${indicators.latest.bb.lower?.toFixed(4)} — Superior $${indicators.latest.bb.upper?.toFixed(4)}
   - ATR(14): $${indicators.latest.atr?.toFixed(4)} (volatilidad)

3. **Niveles Clave Automáticos**:
   - **Soportes**: ${supportsText}
   - **Resistencias**: ${resistancesText}
   - Stop Loss sugerido (ATR): $${indicators.latest.suggestedStopLoss?.toFixed(4)}
   - Take Profit sugerido (ATR): $${indicators.latest.suggestedTakeProfit?.toFixed(4)}

4. **Diagnóstico**:
   - Régimen de Mercado: ${indicators.latest.regime.replace(/_/g, ' ')}
   - Divergencias RSI: ${indicators.latest.divergence.replace(/_/g, ' ')}
   - Spot Score: ${indicators.latest.spotScore.score}/10 (${indicators.latest.spotScore.signal})
   - Razones: ${indicators.latest.spotScore.reasons.join(' | ')}
   - Micro-Estructura (${mtfData.ltf.timeframe}): Cierre $${mtfData.ltf.data.slice(-1)[0].close}

5. **Contexto Global**: Sentimiento Fear & Greed: ${fearAndGreedText}

${indicators.latest.divergence !== 'NONE' ? `🔥 IMPORTANTE: Se ha detectado ${indicators.latest.divergence.replace(/_/g, ' ')}.` : ''}
${indicators.latest.regime.includes('STRONG') ? `🚀 ALERTA: Tendencia extremadamente fuerte.` : ''}
${indicators.latest.spotScore.score >= 7 ? `✅ SEÑAL FUERTE DE COMPRA: Spot Score ${indicators.latest.spotScore.score}/10` : ''}
${indicators.latest.spotScore.score <= 3 ? `⛔ NO ES MOMENTO DE COMPRAR: Spot Score ${indicators.latest.spotScore.score}/10` : ''}

Genera en ESPAÑOL un plan específico con esta estructura:

## 📊 Veredicto Rápido
(¿Comprar ahora, esperar, o no comprar? Una línea clara.)

## 🎯 Plan de Ejecución — ${strategyInfo.role.split('.')[0]}
${strategyInfo.extra}

## 📈 Confluencias a Favor
(¿Qué indicadores apoyan la compra?)

## ⚠️ Riesgos y Invalidación
(¿Cuándo se invalida el setup? ¿Qué vigilar?)

## 💡 Consejo Clave
(Un consejo práctico y directo para esta operación)
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

