import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

export const getTopCryptos = async () => {
    try {
        const response = await axios.get(`${BINANCE_API_URL}/ticker/24hr`);
        // Filter for USDT pairs and sort by volume to get "top" cryptos
        const usdtPairs = response.data.filter(ticker => ticker.symbol.endsWith('USDT'));
        const sortedPairs = usdtPairs.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)).slice(0, 50);

        return sortedPairs.map(pair => ({
            symbol: pair.symbol,
            price: parseFloat(pair.lastPrice),
            change24h: parseFloat(pair.priceChangePercent),
        }));
    } catch (error) {
        console.error("Error fetching top cryptos:", error);
        return [];
    }
};

export const getCandleData = async (symbol, interval, limit = 300) => {
    try {
        const response = await axios.get(`${BINANCE_API_URL}/klines`, {
            params: {
                symbol: symbol,
                interval: interval,
                limit: limit,
            },
        });

        // Binance returns: [Open time, Open, High, Low, Close, Volume, Close time, ...]
        return response.data.map(candle => ({
            time: candle[0],
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
        }));
    } catch (error) {
        console.error(`Error fetching candle data for ${symbol} ${interval}:`, error);
        return [];
    }
};

export const getGeminiAnalysis = async (apiKey, prompt) => {
    try {
        // En producción y desarrollo con Netlify CLI, las funciones están en /.netlify/functions/
        const response = await axios.post('/.netlify/functions/gemini-proxy', {
            prompt: prompt
        });

        if (response.data && response.data.analysis) {
            return response.data.analysis;
        } else {
            throw new Error("Respuesta de IA vacía o inválida");
        }
    } catch (error) {
        console.error("Error calling Gemini Proxy:", error);
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(`Error en el análisis: ${errorMsg}`);
    }
};
// Helper to determine timeframes
const getTimeframeContext = (currentFrame) => {
    switch (currentFrame) {
        case '15m': return { htf: '4h', ltf: '5m' };
        case '1h': return { htf: '4h', ltf: '15m' };
        case '4h': return { htf: '1d', ltf: '1h' };
        case '1d': return { htf: '1w', ltf: '4h' };
        default: return { htf: '1d', ltf: '15m' };
    }
};

export const getMultiTimeframeData = async (symbol, currentFrame) => {
    const { htf, ltf } = getTimeframeContext(currentFrame);

    // Parallel fetch
    const [mtfData, htfData, ltfData] = await Promise.all([
        getCandleData(symbol, currentFrame),
        getCandleData(symbol, htf),
        getCandleData(symbol, ltf)
    ]);

    return {
        mtf: { timeframe: currentFrame, data: mtfData },
        htf: { timeframe: htf, data: htfData },
        ltf: { timeframe: ltf, data: ltfData }
    };
};
