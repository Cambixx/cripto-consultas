export const handler = async (event, context) => {
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
                body: JSON.stringify({ error: "Gemini API Key not configured on server" })
            };
        }

        // Lista de modelos y versiones a intentar para máxima compatibilidad
        // Según documentación de 2025/2026
        const attempts = [
            { model: "gemini-2.0-flash", version: "v1beta" },
            { model: "gemini-1.5-flash", version: "v1beta" },
            { model: "gemini-1.5-flash", version: "v1" },
            { model: "gemini-1.5-pro", version: "v1beta" }
        ];

        let lastError = null;

        for (const attempt of attempts) {
            try {
                console.log(`Proxy (Fetch): Intentando ${attempt.model} via ${attempt.version}...`);

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 2048,
                            }
                        })
                    }
                );

                const data = await response.json();

                if (response.ok && data.candidates && data.candidates[0].content.parts[0].text) {
                    return {
                        statusCode: 200,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ analysis: data.candidates[0].content.parts[0].text }),
                    };
                } else if (data.error) {
                    console.warn(`Proxy fail [${attempt.model}]:`, data.error.message);
                    lastError = new Error(data.error.message);
                    // Si es error de API Key (Invalida), no seguimos intentando
                    if (data.error.status === "PERMISSION_DENIED" || data.error.status === "UNAUTHENTICATED") {
                        break;
                    }
                }
            } catch (error) {
                console.warn(`Fetch error for ${attempt.model}:`, error.message);
                lastError = error;
            }
        }

        throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini.");

    } catch (error) {
        console.error("Proxy Error Final:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                details: "Error interno en el proxy de Gemini. Revisa la validez de la API KEY en Netlify."
            }),
        };
    }
};
