import { RSI, MACD, BollingerBands, EMA } from 'technicalindicators';

export const calculateIndicators = (candles) => {
    const closePrices = candles.map(c => c.close);
    const times = candles.map(c => c.time / 1000); // converting to seconds

    // RSI
    const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
    const rsiSeries = times.slice(candles.length - rsiValues.length).map((time, i) => ({
        time, value: rsiValues[i]
    }));

    // MACD
    const macdValues = MACD.calculate({
        values: closePrices,
        fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
        SimpleMAOscillator: false, SimpleMASignal: false,
    });
    const macdSeries = times.slice(candles.length - macdValues.length).map((time, i) => ({
        time,
        macd: macdValues[i].MACD,
        signal: macdValues[i].signal,
        histogram: macdValues[i].histogram
    }));

    // Bollinger Bands
    const bbValues = BollingerBands.calculate({ period: 20, values: closePrices, stdDev: 2 });
    const bbSeries = times.slice(candles.length - bbValues.length).map((time, i) => ({
        time,
        upper: bbValues[i].upper,
        lower: bbValues[i].lower,
        middle: bbValues[i].middle
    }));

    // EMA 50
    const ema50Values = EMA.calculate({ period: 50, values: closePrices });
    const ema50Series = times.slice(candles.length - ema50Values.length).map((time, i) => ({
        time, value: ema50Values[i]
    }));

    // EMA 200
    const ema200Values = EMA.calculate({ period: 200, values: closePrices });
    const ema200Series = times.slice(candles.length - ema200Values.length).map((time, i) => ({
        time, value: ema200Values[i]
    }));

    return {
        latest: {
            rsi: rsiValues.slice(-1)[0] || 0,
            macd: macdValues.slice(-1)[0] || { MACD: 0, signal: 0, histogram: 0 },
            bb: bbValues.slice(-1)[0] || { upper: 0, lower: 0, middle: 0 },
            ema50: ema50Values.slice(-1)[0] || 0,
            ema200: ema200Values.slice(-1)[0] || 0,
        },
        series: {
            rsi: rsiSeries,
            macd: macdSeries,
            bb: bbSeries,
            ema50: ema50Series,
            ema200: ema200Series,
        }
    };
};

