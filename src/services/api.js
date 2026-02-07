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

export const getCandleData = async (symbol, interval, limit = 100) => {
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

// Helper to check available models
const validateGeminiAccess = async (apiKey) => {
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        return response.data.models?.map(m => m.name.replace('models/', '')) || [];
    } catch (error) {
        console.warn("Could not validate models via API, seeing what happens:", error);
        return [];
    }
};

export const getGeminiAnalysis = async (apiKey, prompt) => {
    const genAI = new GoogleGenerativeAI(apiKey);

    let attempts = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-2.0-flash-exp"
    ];

    // Try to dynamically fetch available models to prioritize them
    try {
        const available = await validateGeminiAccess(apiKey);
        if (available.length > 0) {
            console.log("Found available models:", available);
            // innovative sort: prioritize flash/pro models that are in our known list or look valid
            const validAvailable = available.filter(m =>
                m.includes('gemini') && (m.includes('flash') || m.includes('pro'))
            );

            // Put available models first, but keep our fallbacks just in case
            attempts = [...new Set([...validAvailable, ...attempts])];
        }
    } catch (e) {
        console.warn("Model validation check skipped", e);
    }

    console.log("Will attempt models in this order:", attempts);

    for (const modelName of attempts) {
        try {
            console.log(`Attempting Gemini model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.warn(`Model ${modelName} failed:`, error.message);
            // Continue to next model
            if (modelName === attempts[attempts.length - 1]) {
                console.error("All model attempts failed.");
                throw new Error(`Failed to generate content. All attempts failed. Models tried: ${attempts.join(', ')}. Last error: ${error.message}`);
            }
        }
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
