import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getTopCryptos, getCandleData, getMultiTimeframeData } from '../services/api';
import { calculateIndicators } from '../utils/indicators';

const REFRESH_INTERVAL = 30_000; // 30 seconds

export const useMarketData = (selectedCrypto, timeframe) => {
    const [cryptos, setCryptos] = useState([]);
    const [candles, setCandles] = useState([]);
    const [mtfData, setMtfData] = useState(null);
    const [marketSentiment, setMarketSentiment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const refreshTimerRef = useRef(null);

    // Fetch initial crypto list
    useEffect(() => {
        const fetchCryptos = async () => {
            try {
                const data = await getTopCryptos();
                setCryptos(data);
            } catch (err) {
                console.error("Failed to fetch cryptos", err);
            }
        };
        fetchCryptos();
    }, []);

    // Fetch candles when selectedCrypto or timeframe changes
    const fetchCandles = useCallback(async (showLoading = true) => {
        if (!selectedCrypto) return;
        if (showLoading) setIsLoading(true);
        try {
            const data = await getCandleData(selectedCrypto.symbol, timeframe);
            setCandles(data);
            setError('');
        } catch (e) {
            console.error("Failed to fetch candles", e);
            if (showLoading) setError("Error al obtener datos del gráfico.");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [selectedCrypto, timeframe]);

    useEffect(() => {
        fetchCandles(true);
    }, [fetchCandles]);

    // Auto-refresh every 30s
    useEffect(() => {
        if (!selectedCrypto) return;

        refreshTimerRef.current = setInterval(() => {
            fetchCandles(false); // silent refresh
        }, REFRESH_INTERVAL);

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [selectedCrypto, timeframe, fetchCandles]);

    // Calculate indicators from candle data
    const indicators = useMemo(() => {
        if (!candles || candles.length < 50) return null;
        try {
            return calculateIndicators(candles);
        } catch (e) {
            console.error("Indicator calculation error:", e);
            return null;
        }
    }, [candles]);

    const fetchMTFData = useCallback(async () => {
        if (!selectedCrypto) return null;
        try {
            const data = await getMultiTimeframeData(selectedCrypto.symbol, timeframe);
            setMtfData(data);
            return data;
        } catch (err) {
            console.error("Failed to fetch MTF data", err);
            throw err;
        }
    }, [selectedCrypto, timeframe]);

    return {
        cryptos,
        candles,
        indicators,
        mtfData,
        marketSentiment,
        setMarketSentiment,
        isLoading,
        error,
        setError,
        fetchMTFData
    };
};

