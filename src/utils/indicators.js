import { RSI, MACD, BollingerBands, EMA, ATR, StochasticRSI } from 'technicalindicators';

// ── Support & Resistance Detection ──────────────────────────
const detectSupportResistance = (candles, lookback = 20) => {
    const supports = [];
    const resistances = [];

    for (let i = lookback; i < candles.length - lookback; i++) {
        const low = candles[i].low;
        const high = candles[i].high;

        // Check if this is a swing low (support)
        let isSwingLow = true;
        for (let j = i - lookback; j <= i + lookback; j++) {
            if (j !== i && candles[j].low < low) {
                isSwingLow = false;
                break;
            }
        }
        if (isSwingLow) {
            supports.push({ price: low, index: i, time: candles[i].time / 1000 });
        }

        // Check if this is a swing high (resistance)
        let isSwingHigh = true;
        for (let j = i - lookback; j <= i + lookback; j++) {
            if (j !== i && candles[j].high > high) {
                isSwingHigh = false;
                break;
            }
        }
        if (isSwingHigh) {
            resistances.push({ price: high, index: i, time: candles[i].time / 1000 });
        }
    }

    // Cluster nearby levels (merge if within 0.5%)
    const clusterLevels = (levels) => {
        if (levels.length === 0) return [];
        const sorted = [...levels].sort((a, b) => a.price - b.price);
        const clusters = [{ price: sorted[0].price, count: 1, time: sorted[0].time }];

        for (let i = 1; i < sorted.length; i++) {
            const last = clusters[clusters.length - 1];
            const diff = Math.abs(sorted[i].price - last.price) / last.price;
            if (diff < 0.005) {
                // Merge: use average price, increment count
                last.price = (last.price * last.count + sorted[i].price) / (last.count + 1);
                last.count++;
                last.time = Math.max(last.time, sorted[i].time);
            } else {
                clusters.push({ price: sorted[i].price, count: 1, time: sorted[i].time });
            }
        }

        // Sort by strength (count) and recency
        return clusters
            .sort((a, b) => b.count - a.count || b.time - a.time)
            .slice(0, 5);
    };

    return {
        supports: clusterLevels(supports),
        resistances: clusterLevels(resistances)
    };
};

// ── Spot Score (1-10) — unified buying opportunity rating ────
const calculateSpotScore = ({ rsi, stochRSI, regime, divergence, macd, bb, currentPrice, atr, ema200 }) => {
    let score = 5; // Neutral starting point
    const reasons = [];

    // RSI scoring (oversold = buy signal for spot)
    if (rsi <= 25) { score += 2; reasons.push('RSI extremadamente sobrevendido'); }
    else if (rsi <= 35) { score += 1.5; reasons.push('RSI sobrevendido'); }
    else if (rsi <= 45) { score += 0.5; reasons.push('RSI neutral-bajo'); }
    else if (rsi >= 75) { score -= 2; reasons.push('RSI sobrecomprado — NO comprar'); }
    else if (rsi >= 65) { score -= 1; reasons.push('RSI alto'); }

    // Stochastic RSI
    if (stochRSI && stochRSI.k <= 20 && stochRSI.d <= 20) {
        score += 1.5;
        reasons.push('StochRSI doble sobreventa');
    } else if (stochRSI && stochRSI.k <= 30) {
        score += 0.5;
        reasons.push('StochRSI bajo');
    } else if (stochRSI && stochRSI.k >= 80) {
        score -= 1;
        reasons.push('StochRSI sobrecomprado');
    }

    // Market regime
    if (regime === 'STRONG_BULLISH') { score += 1; reasons.push('Tendencia fuertemente alcista'); }
    else if (regime === 'BULLISH') { score += 0.5; reasons.push('Tendencia alcista'); }
    else if (regime === 'STRONG_BEARISH') { score -= 1.5; reasons.push('Tendencia fuertemente bajista'); }
    else if (regime === 'BEARISH') { score -= 0.5; reasons.push('Tendencia bajista'); }

    // Divergences
    if (divergence === 'BULLISH_DIVERGENCE') { score += 1.5; reasons.push('Divergencia alcista detectada'); }
    else if (divergence === 'BEARISH_DIVERGENCE') { score -= 1; reasons.push('Divergencia bajista'); }

    // MACD
    if (macd.histogram > 0 && macd.MACD > macd.signal) {
        score += 0.5;
        reasons.push('MACD momentum positivo');
    } else if (macd.histogram < 0 && macd.MACD < macd.signal) {
        score -= 0.5;
        reasons.push('MACD momentum negativo');
    }

    // Bollinger Bands — price near lower band = potential buy
    if (bb && currentPrice <= bb.lower * 1.01) {
        score += 1;
        reasons.push('Precio en banda inferior de Bollinger');
    } else if (bb && currentPrice >= bb.upper * 0.99) {
        score -= 0.5;
        reasons.push('Precio en banda superior');
    }

    // Price vs EMA 200
    if (ema200 && currentPrice > ema200) {
        score += 0.5;
        reasons.push('Precio sobre EMA 200');
    }

    return {
        score: Math.max(1, Math.min(10, Math.round(score))),
        rawScore: score,
        reasons,
        signal: score >= 7 ? 'COMPRA_FUERTE' : score >= 5.5 ? 'COMPRA' : score >= 4 ? 'ESPERAR' : 'NO_COMPRAR'
    };
};

// ── Main Indicator Calculation ──────────────────────────────
export const calculateIndicators = (candles) => {
    const closePrices = candles.map(c => c.close);
    const highPrices = candles.map(c => c.high);
    const lowPrices = candles.map(c => c.low);
    const times = candles.map(c => c.time / 1000);

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

    // ATR (Average True Range) — for dynamic stop losses
    const atrValues = ATR.calculate({
        high: highPrices,
        low: lowPrices,
        close: closePrices,
        period: 14
    });

    // Stochastic RSI — better oversold detection for spot
    let stochRSIValues = [];
    try {
        stochRSIValues = StochasticRSI.calculate({
            values: closePrices,
            rsiPeriod: 14,
            stochasticPeriod: 14,
            kPeriod: 3,
            dPeriod: 3
        });
    } catch (e) {
        console.warn('StochRSI calculation failed:', e.message);
    }

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

    // RSI Divergence Detection
    let divergence = 'NONE';
    if (rsiValues.length > 20) {
        const lastRSI = rsiValues[rsiValues.length - 1];
        const prevRSI = rsiValues[rsiValues.length - 10];
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

    // Support & Resistance
    const srLevels = detectSupportResistance(candles, 5);

    // Latest values
    const latestRSI = rsiValues.slice(-1)[0] || 0;
    const latestMACD = macdValues.slice(-1)[0] || { MACD: 0, signal: 0, histogram: 0 };
    const latestBB = bbValues.slice(-1)[0] || { upper: 0, lower: 0, middle: 0 };
    const latestATR = atrValues.slice(-1)[0] || 0;
    const latestStochRSI = stochRSIValues.length > 0
        ? stochRSIValues[stochRSIValues.length - 1]
        : null;

    // Spot Score
    const spotScore = calculateSpotScore({
        rsi: latestRSI,
        stochRSI: latestStochRSI,
        regime,
        divergence,
        macd: latestMACD,
        bb: latestBB,
        currentPrice: latestPrice,
        atr: latestATR,
        ema200: latestEMA200
    });

    return {
        latest: {
            rsi: latestRSI,
            macd: latestMACD,
            bb: latestBB,
            ema50: ema50Values.slice(-1)[0] || 0,
            ema200: ema200Values.slice(-1)[0] || 0,
            atr: latestATR,
            stochRSI: latestStochRSI,
            regime,
            divergence,
            isWhaleActivity: volumeSpikes.length > 0 && volumeSpikes.slice(-1)[0].time === times[times.length - 1],
            spotScore,
            supportResistance: srLevels,
            suggestedStopLoss: latestPrice - (latestATR * 1.5),
            suggestedTakeProfit: latestPrice + (latestATR * 3),
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
