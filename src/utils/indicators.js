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

    // Market Regime Detection
    const latestPrice = closePrices[closePrices.length - 1];
    const latestEMA50 = ema50Values[ema50Values.length - 1];
    const latestEMA200 = ema200Values[ema200Values.length - 1];

    let regime = 'NEUTRAL';
    if (latestEMA50 && latestEMA200) {
        const gap = (latestEMA50 - latestEMA200) / latestEMA200;
        if (latestPrice > latestEMA200 && latestEMA50 > latestEMA200) {
            regime = gap > 0.02 ? 'STRONG_BULLISH' : 'BULLISH';
        } else if (latestPrice < latestEMA200 && latestEMA50 < latestEMA200) {
            regime = gap < -0.02 ? 'STRONG_BEARISH' : 'BEARISH';
        } else {
            regime = 'RANGING';
        }
    }

    // RSI Divergence Detection (Simplified)
    let divergence = 'NONE';
    if (rsiValues.length > 20) {
        const lastRSI = rsiValues[rsiValues.length - 1];
        const prevRSI = rsiValues[rsiValues.length - 10]; // looking back a bit
        const lastPrice = closePrices[closePrices.length - 1];
        const prevPrice = closePrices[closePrices.length - 10];

        if (lastPrice < prevPrice && lastRSI > prevRSI && lastRSI < 40) {
            divergence = 'BULLISH_DIVERGENCE';
        } else if (lastPrice > prevPrice && lastRSI < prevRSI && lastRSI > 60) {
            divergence = 'BEARISH_DIVERGENCE';
        }
    }

    // Volume Analysis
    const volumes = candles.map(c => c.volume);
    const volumeSpikes = [];
    const volPeriod = 20;

    for (let i = volPeriod; i < volumes.length; i++) {
        const slice = volumes.slice(i - volPeriod, i);
        const avg = slice.reduce((a, b) => a + b, 0) / volPeriod;
        if (volumes[i] > avg * 2.5) {
            volumeSpikes.push({
                time: times[i],
                value: volumes[i],
                ratio: volumes[i] / avg
            });
        }
    }

    return {
        latest: {
            rsi: rsiValues.slice(-1)[0] || 0,
            macd: macdValues.slice(-1)[0] || { MACD: 0, signal: 0, histogram: 0 },
            bb: bbValues.slice(-1)[0] || { upper: 0, lower: 0, middle: 0 },
            ema50: ema50Values.slice(-1)[0] || 0,
            ema200: ema200Values.slice(-1)[0] || 0,
            regime,
            divergence,
            isWhaleActivity: volumeSpikes.length > 0 && volumeSpikes.slice(-1)[0].time === times[times.length - 1]
        },
        series: {
            rsi: rsiSeries,
            macd: macdSeries,
            bb: bbSeries,
            ema50: ema50Series,
            ema200: ema200Series,
            volumeSpikes
        }
    };
};



