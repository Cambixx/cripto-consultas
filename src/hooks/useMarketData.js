import { useState, useEffect, useCallback } from 'react';
import { getTopCryptos, getCandleData, getMultiTimeframeData } from '../services/api';

export const useMarketData = (selectedCrypto, timeframe) => {
    const [cryptos, setCryptos] = useState([]);
    const [candles, setCandles] = useState([]);
    const [mtfData, setMtfData] = useState(null);
    const [marketSentiment, setMarketSentiment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedCrypto) return;
            setIsLoading(true);
            try {
                const data = await getCandleData(selectedCrypto.symbol, timeframe);
                setCandles(data);
            } catch (e) {
                console.error("Failed to fetch candles", e);
                setError("Error al obtener datos del gráfico.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedCrypto, timeframe]);

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
        mtfData,
        marketSentiment,
        setMarketSentiment,
        isLoading,
        error,
        setError,
        fetchMTFData
    };
};
