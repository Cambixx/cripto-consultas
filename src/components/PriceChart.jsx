import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { calculateIndicators } from '../utils/indicators';
import { Sparkles } from 'lucide-react';

const PriceChart = ({ data, symbol, timeframe }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const seriesRef = useRef({});

    // Toggles
    const [toggles, setToggles] = useState({
        ema50: false,
        ema200: false,
        bb: false
    });

    useEffect(() => {
        if (!chartContainerRef.current || !data.length) return;

        const handleResize = () => {
            chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            width: chartContainerRef.current.clientWidth,
            height: 450,
            grid: {
                vertLines: { color: 'rgba(40, 40, 40, 0.3)' },
                horzLines: { color: 'rgba(40, 40, 40, 0.3)' },
            },
            timeScale: {
                timeVisible: true,
                borderColor: '#374151',
            },
            rightPriceScale: {
                borderColor: '#374151',
            }
        });

        const firstPrice = data[data.length - 1]?.close || 0;
        let precision = 2;
        let minMove = 0.01;

        if (firstPrice > 0 && firstPrice < 0.001) { precision = 8; minMove = 0.00000001; }
        else if (firstPrice >= 0.001 && firstPrice < 1) { precision = 6; minMove = 0.000001; }
        else if (firstPrice >= 1 && firstPrice < 1000) { precision = 3; minMove = 0.001; }

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
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
        };
    }, [data]);

    // Memoized indicator calculations
    const allIndicators = React.useMemo(() => {
        if (!data.length) return null;
        return calculateIndicators(data);
    }, [data]);

    useEffect(() => {
        if (!chartRef.current || !allIndicators) return;
        const chart = chartRef.current;

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
    }, [toggles, allIndicators]);

    useEffect(() => {
        if (!seriesRef.current.candles || !allIndicators) return;

        // Add markers for volume spikes
        seriesRef.current.candles.setMarkers(
            allIndicators.series.volumeSpikes.map(spike => ({
                time: spike.time,
                position: 'aboveBar',
                color: '#0ea5e9',
                shape: 'arrowDown',
                text: 'WHALE',
            }))
        );
    }, [allIndicators]);

    const toggleIndicator = (id) => {
        setToggles(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const latestIndicators = allIndicators;

    return (
        <div className="w-full space-y-4 relative">
            {/* Overlay Indicators */}
            {latestIndicators && (
                <div className="absolute top-16 right-4 z-10 flex flex-col items-end gap-2">
                    <RSIBadge value={latestIndicators.latest.rsi} />
                    {latestIndicators.latest.isWhaleActivity && (
                        <div className="px-3 py-1.5 rounded-lg border border-blue-400/20 bg-blue-400/10 text-blue-400 backdrop-blur-md flex items-center gap-2 neo-shadow animate-pulse">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Whale Activity Detected</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h3 className="font-bold text-xl tracking-tight text-foreground flex items-center gap-2">
                        {symbol} <span className="text-muted-foreground font-light text-sm">/ USDT</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-mono uppercase">
                            {timeframe}
                        </span>
                    </h3>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mt-1">
                        Live Market Execution • TV Engine v5
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <IndicatorToggle
                        label="EMA 50"
                        active={toggles.ema50}
                        onClick={() => toggleIndicator('ema50')}
                        color="bg-blue-500"
                    />
                    <IndicatorToggle
                        label="EMA 200"
                        active={toggles.ema200}
                        onClick={() => toggleIndicator('ema200')}
                        color="bg-purple-500"
                    />
                    <IndicatorToggle
                        label="Bands"
                        active={toggles.bb}
                        onClick={() => toggleIndicator('bb')}
                        color="bg-yellow-500"
                    />
                </div>
            </div>

            <div ref={chartContainerRef} className="w-full relative min-h-[450px] lg:min-h-[550px]" />
        </div>
    );
};

const RSIBadge = ({ value }) => {
    const isOverbought = value >= 70;
    const isOversold = value <= 30;
    const color = isOverbought ? 'text-red-400 bg-red-400/10 border-red-400/20'
        : isOversold ? 'text-green-400 bg-green-400/10 border-green-400/20'
            : 'text-primary bg-primary/10 border-primary/20';

    return (
        <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md flex items-center gap-2 neo-shadow ${color}`}>
            <span className="text-[10px] font-mono uppercase tracking-tighter opacity-70">RSI(14)</span>
            <span className="text-sm font-bold font-mono">{value.toFixed(2)}</span>
        </div>
    );
};

const IndicatorToggle = ({ label, active, onClick, color }) => (
    <button
        onClick={onClick}
        className={`
            px-3 py-1.5 rounded-lg text-xs font-mono transition-all border
            ${active
                ? `${color}/20 text-foreground border-${color}/50 neo-shadow`
                : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'}
        `}
    >
        <span className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${active ? color : 'bg-muted-foreground/30'}`} />
            {label}
        </span>
    </button>
);

export default PriceChart;
