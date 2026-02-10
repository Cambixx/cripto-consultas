import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { calculateIndicators } from '../utils/indicators';
import { Sparkles, Target, TrendingUp } from 'lucide-react';

const PriceChart = ({ data, symbol, timeframe, indicators: externalIndicators }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const seriesRef = useRef({});

    // Toggles
    const [toggles, setToggles] = useState({
        ema50: false,
        ema200: false,
        bb: false,
        sr: true, // S/R on by default
    });

    useEffect(() => {
        if (!chartContainerRef.current || !data.length) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            width: chartContainerRef.current.clientWidth,
            height: 450,
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            timeScale: {
                timeVisible: true,
                borderColor: '#ffffff10',
            },
            rightPriceScale: {
                borderColor: '#ffffff10',
            }
        });

        const firstPrice = data[data.length - 1]?.close || 0;
        let precision = 2;
        let minMove = 0.01;

        if (firstPrice > 0 && firstPrice < 0.001) { precision = 8; minMove = 0.00000001; }
        else if (firstPrice >= 0.001 && firstPrice < 1) { precision = 6; minMove = 0.000001; }
        else if (firstPrice >= 1 && firstPrice < 1000) { precision = 3; minMove = 0.001; }

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#43f906',
            downColor: '#ff3131',
            borderVisible: false,
            wickUpColor: '#43f906',
            wickDownColor: '#ff3131',
            priceFormat: { type: 'price', precision, minMove },
        });

        const formattedData = data.map(candle => ({
            time: candle.time / 1000,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        }));

        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current.candles = candlestickSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            seriesRef.current = {};
        };
    }, [data]);

    // Use external indicators if available, otherwise calculate
    const allIndicators = React.useMemo(() => {
        if (externalIndicators) return externalIndicators;
        if (!data.length) return null;
        return calculateIndicators(data);
    }, [data, externalIndicators]);

    useEffect(() => {
        if (!chartRef.current || !allIndicators || !seriesRef.current.candles) return;
        const chart = chartRef.current;
        const candleSeries = seriesRef.current.candles;

        // EMA 50
        if (toggles.ema50) {
            if (!seriesRef.current.ema50) {
                seriesRef.current.ema50 = chart.addSeries(LineSeries, {
                    color: '#3b82f6', lineWidth: 1, priceLineVisible: false,
                });
            }
            seriesRef.current.ema50.setData(allIndicators.series.ema50);
        } else if (seriesRef.current.ema50) {
            chart.removeSeries(seriesRef.current.ema50);
            seriesRef.current.ema50 = null;
        }

        // EMA 200
        if (toggles.ema200) {
            if (!seriesRef.current.ema200) {
                seriesRef.current.ema200 = chart.addSeries(LineSeries, {
                    color: '#a855f7', lineWidth: 1.5, priceLineVisible: false,
                });
            }
            seriesRef.current.ema200.setData(allIndicators.series.ema200);
        } else if (seriesRef.current.ema200) {
            chart.removeSeries(seriesRef.current.ema200);
            seriesRef.current.ema200 = null;
        }

        // Bollinger Bands
        if (toggles.bb) {
            if (!seriesRef.current.bbUpper) {
                seriesRef.current.bbUpper = chart.addSeries(LineSeries, {
                    color: 'rgba(234, 179, 8, 0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false,
                });
                seriesRef.current.bbLower = chart.addSeries(LineSeries, {
                    color: 'rgba(234, 179, 8, 0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false,
                });
                seriesRef.current.bbMiddle = chart.addSeries(LineSeries, {
                    color: 'rgba(234, 179, 8, 0.2)', lineWidth: 1, priceLineVisible: false,
                });
            }
            seriesRef.current.bbUpper.setData(allIndicators.series.bb.map(b => ({ time: b.time, value: b.upper })));
            seriesRef.current.bbLower.setData(allIndicators.series.bb.map(b => ({ time: b.time, value: b.lower })));
            seriesRef.current.bbMiddle.setData(allIndicators.series.bb.map(b => ({ time: b.time, value: b.middle })));
        } else if (seriesRef.current.bbUpper) {
            chart.removeSeries(seriesRef.current.bbUpper);
            chart.removeSeries(seriesRef.current.bbLower);
            chart.removeSeries(seriesRef.current.bbMiddle);
            seriesRef.current.bbUpper = null;
            seriesRef.current.bbLower = null;
            seriesRef.current.bbMiddle = null;
        }

        // Support/Resistance price lines
        // Clean up old S/R lines
        if (seriesRef.current.srLines) {
            seriesRef.current.srLines.forEach(line => {
                try { candleSeries.removePriceLine(line); } catch (e) { /* ignore */ }
            });
        }
        seriesRef.current.srLines = [];

        if (toggles.sr && allIndicators.latest.supportResistance) {
            const { supports, resistances } = allIndicators.latest.supportResistance;

            supports.forEach((s) => {
                const line = candleSeries.createPriceLine({
                    price: s.price,
                    color: 'rgba(34, 197, 94, 0.6)',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: `S (${s.count})`,
                });
                seriesRef.current.srLines.push(line);
            });

            resistances.forEach((r) => {
                const line = candleSeries.createPriceLine({
                    price: r.price,
                    color: 'rgba(239, 68, 68, 0.6)',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: `R (${r.count})`,
                });
                seriesRef.current.srLines.push(line);
            });
        }
    }, [toggles, allIndicators]);

    useEffect(() => {
        if (!seriesRef.current.candles || !allIndicators || typeof seriesRef.current.candles.setMarkers !== 'function') return;

        try {
            seriesRef.current.candles.setMarkers(
                allIndicators.series.volumeSpikes.map(spike => ({
                    time: spike.time,
                    position: 'aboveBar',
                    color: '#0ea5e9',
                    shape: 'arrowDown',
                    text: 'WHALE',
                }))
            );
        } catch (err) {
            console.error("Error setting markers:", err);
        }
    }, [allIndicators]);

    const toggleIndicator = (id) => {
        setToggles(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const latestIndicators = allIndicators;

    return (
        <div className="w-full space-y-6 relative bg-black">
            {/* Overlay Indicators */}
            {latestIndicators && (
                <div className="absolute top-20 right-4 z-10 flex flex-col items-end gap-3">
                    {/* Spot Score Badge */}
                    {latestIndicators.latest.spotScore && (
                        <SpotScoreBadge score={latestIndicators.latest.spotScore} />
                    )}
                    <RSIBadge value={latestIndicators.latest.rsi} />
                    {latestIndicators.latest.stochRSI && (
                        <StochRSIBadge value={latestIndicators.latest.stochRSI} />
                    )}
                    {latestIndicators.latest.isWhaleActivity && (
                        <div className="px-3 py-2 border-2 border-blue-500 bg-black text-blue-500 flex items-center gap-2 neo-shadow animate-pulse">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">WHALE_DETECTED</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-white/10 pb-4">
                <div className="flex flex-col">
                    <h3 className="font-black text-3xl tracking-tighter text-white flex items-center gap-3 uppercase italic">
                        {symbol} <span className="text-primary not-italic">/USDT</span>
                        <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest">
                            {timeframe}
                        </span>
                    </h3>
                    <div className="text-[10px] text-primary uppercase tracking-[0.4em] font-bold mt-1">
                        [ ENGINE_V5 // LIVE_DATA // SPOT_ONLY ]
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <IndicatorToggle
                        label="S/R"
                        active={toggles.sr}
                        onClick={() => toggleIndicator('sr')}
                        color="bg-emerald-500"
                    />
                    <IndicatorToggle
                        label="EMA_50"
                        active={toggles.ema50}
                        onClick={() => toggleIndicator('ema50')}
                        color="bg-blue-500"
                    />
                    <IndicatorToggle
                        label="EMA_200"
                        active={toggles.ema200}
                        onClick={() => toggleIndicator('ema200')}
                        color="bg-purple-500"
                    />
                    <IndicatorToggle
                        label="BANDS"
                        active={toggles.bb}
                        onClick={() => toggleIndicator('bb')}
                        color="bg-yellow-500"
                    />
                </div>
            </div>

            <div ref={chartContainerRef} className="w-full relative min-h-[450px] lg:min-h-[550px] border-2 border-white/5 bg-black/40" />
        </div>
    );
};

const SpotScoreBadge = ({ score }) => {
    const { score: val, signal } = score;
    let colorClass;
    if (val >= 7) { colorClass = 'border-green-500 text-green-500'; }
    else if (val >= 5) { colorClass = 'border-yellow-500 text-yellow-500'; }
    else { colorClass = 'border-red-500 text-red-500'; }

    const signalLabels = {
        'COMPRA_FUERTE': 'STRONG_BUY',
        'COMPRA': 'OPPORTUNITY',
        'ESPERAR': 'WAIT_ZONE',
        'NO_COMPRAR': 'DANGER_ZONE',
    };

    return (
        <div className={`px-4 py-2 border-2 bg-black flex items-center gap-3 neo-shadow ${colorClass}`}>
            <Target className="w-5 h-5" />
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono uppercase tracking-widest font-bold opacity-70">SPOT_SCORE</span>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono">{val}/10</span>
                    <span className="text-[9px] font-mono font-bold bg-white/10 px-1">{signalLabels[signal] || signal}</span>
                </div>
            </div>
        </div>
    );
};

const RSIBadge = ({ value }) => {
    const isOverbought = value >= 70;
    const isOversold = value <= 30;
    const color = isOverbought ? 'text-red-500 border-red-500'
        : isOversold ? 'text-green-500 border-green-500'
            : 'text-primary border-primary';

    return (
        <div className={`px-4 py-2 border-2 bg-black flex items-center gap-3 neo-shadow ${color}`}>
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold opacity-70">RSI_14</span>
            <span className="text-lg font-black font-mono">{value.toFixed(2)}</span>
        </div>
    );
};

const StochRSIBadge = ({ value }) => {
    const k = value.k || 0;
    const isOversold = k <= 20;
    const isOverbought = k >= 80;
    const color = isOverbought ? 'text-red-500 border-red-500'
        : isOversold ? 'text-green-500 border-green-500'
            : 'text-primary border-primary';

    return (
        <div className={`px-4 py-2 border-2 bg-black flex items-center gap-3 neo-shadow ${color}`}>
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold opacity-70">STOCH_K</span>
            <span className="text-lg font-black font-mono">{k.toFixed(1)}</span>
        </div>
    );
};

const IndicatorToggle = ({ label, active, onClick, color }) => (
    <button
        onClick={onClick}
        className={`
            px-4 py-2 text-[10px] font-black font-mono transition-all border-2 uppercase tracking-widest
            ${active
                ? `bg-primary text-black border-white shadow-[2px_2px_0px_white]`
                : 'bg-black text-white/50 border-white/10 hover:border-primary hover:text-white'}
        `}
    >
        <span className="flex items-center gap-2">
            <div className={`w-2 h-2 ${active ? 'bg-black' : color}`} />
            {label}
        </span>
    </button>
);

export default PriceChart;



