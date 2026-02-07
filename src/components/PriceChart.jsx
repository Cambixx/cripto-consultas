import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const PriceChart = ({ data, symbol, timeframe }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef();

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af', // text-muted-foreground
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            grid: {
                vertLines: { color: 'rgba(40, 40, 40, 0.5)' },
                horzLines: { color: 'rgba(40, 40, 40, 0.5)' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#374151',
            },
            rightPriceScale: {
                borderColor: '#374151',
            }
        });

        // Create Candlestick Series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#22c55e', // green-500
            downColor: '#ef4444', // red-500
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Determine data format based on timeframe (Binance returns timestamps in ms)
        // lightweight-charts expects seconds for time (unless using custom tick logic, but usually unix timestamp)
        // Actually, createChart usually takes seconds for 'time'.
        const formattedData = data.map(candle => ({
            time: candle.time / 1000,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        }));

        candlestickSeries.setData(formattedData);

        // Fit content
        chart.timeScale().fitContent();

        chartRef.current = chart;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    return (
        <div className="w-full bg-card border border-border rounded-xl shadow-lg p-4 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">{symbol} Price Action ({timeframe})</h3>
                <div className="text-xs text-muted-foreground">Powered by TradingView</div>
            </div>
            <div ref={chartContainerRef} className="w-full h-[400px]" />
        </div>
    );
};

export default PriceChart;
