import { RSI, MACD, BollingerBands, SMA, EMA } from 'technicalindicators';

export const calculateIndicators = (candles) => {
    const closePrices = candles.map(c => c.close);
    const highPrices = candles.map(c => c.high);
    const lowPrices = candles.map(c => c.low);

    // RSI
    const rsi = RSI.calculate({
        values: closePrices,
        period: 14,
    });

    // MACD
    const macd = MACD.calculate({
        values: closePrices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    });

    // Bollinger Bands
    const bb = BollingerBands.calculate({
        period: 20,
        values: closePrices,
        stdDev: 2,
    });

    // EMA 50
    const ema50 = EMA.calculate({
        period: 50,
        values: closePrices,
    });

    // EMA 200
    const ema200 = EMA.calculate({
        period: 200,
        values: closePrices,
    });

    return {
        rsi: rsi.slice(-1)[0] || 0,
        macd: macd.slice(-1)[0] || { MACD: 0, signal: 0, histogram: 0 },
        bb: bb.slice(-1)[0] || { upper: 0, lower: 0, middle: 0 },
        ema50: ema50.slice(-1)[0] || 0,
        ema200: ema200.slice(-1)[0] || 0,
    };
};
