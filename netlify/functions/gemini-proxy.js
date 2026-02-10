const axios = require('axios');

exports.handler = async (event, context) => {
    // Solo permitir POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "GEMINI_API_KEY no configurada en Netlify" })
            };
        }

        // Lista de modelos según documentación 2026 (Febrero)
        // Probamos gemini-3-flash primero por ser el más moderno
        const attempts = [
            { model: "gemini-3-flash", version: "v1beta" },
            { model: "gemini-1.5-flash", version: "v1" }
        ];

        let lastError = null;

        for (const attempt of attempts) {
            try {
                console.log(`Proxy (REST): Intentando ${attempt.model} via ${attempt.version}...`);

                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${apiKey}`,
                    {
                        contents: [{ parts: [{ text: prompt }] }]
                    },
                    {
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                if (response.data && response.data.candidates && response.data.candidates[0].content.parts[0].text) {
                    return {
                        statusCode: 200,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ analysis: response.data.candidates[0].content.parts[0].text }),
                    };
                }
            } catch (error) {
                const errorMsg = error.response?.data?.error?.message || error.message;
                console.warn(`Fallo en proxy [${attempt.model}]:`, errorMsg);
                lastError = new Error(errorMsg);

                // Si es error de API Key (401/403), no seguimos rotando
                if (error.response?.status === 401 || error.response?.status === 403) break;
            }
        }

        throw lastError || new Error("No se pudo obtener respuesta de Gemini.");

    } catch (error) {
        console.error("Proxy Error Final:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                details: "Error en la función serverless. Verifica la API KEY en el panel de Netlify."
            }),
        };
    }
};
