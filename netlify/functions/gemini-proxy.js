const axios = require('axios');

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "No API Key" }) };
        }

        // 1. Intento Principal: gemini-1.5-flash (v1beta) - El estándar actual
        try {
            console.log("Intento 1: gemini-1.5-flash (v1beta)");
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { 'Content-Type': 'application/json' } }
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ analysis: response.data.candidates[0].content.parts[0].text })
            };
        } catch (e) {
            console.warn("Fallo intento 1:", e.response?.data?.error?.message || e.message);
        }

        // 2. Intento Secundario: gemini-pro (v1) - El clásico estable
        try {
            console.log("Intento 2: gemini-pro (v1)");
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { 'Content-Type': 'application/json' } }
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ analysis: response.data.candidates[0].content.parts[0].text })
            };
        } catch (e) {
            console.warn("Fallo intento 2:", e.response?.data?.error?.message || e.message);
            throw e; // Si ambos fallan, lanzamos el error del segundo
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.response?.data?.error?.message || error.message,
                details: "Ambos modelos (1.5-flash y gemini-pro) fallaron. Verifica tu API Key."
            }),
        };
    }
};
