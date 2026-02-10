import { GoogleGenAI } from "@google/genai";

export const handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        // El SDK busca automáticamente process.env.GEMINI_API_KEY si no se pasa en el constructor
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY no encontrada en el entorno del servidor.");
        }

        const ai = new GoogleGenAI({ apiKey });

        // Intentamos con la serie 3 que es la que marca la documentación actual
        const models = ["gemini-3-flash", "gemini-3-flash-preview", "gemini-1.5-flash"];
        let lastError = null;

        for (const modelName of models) {
            try {
                console.log(`Proxy (SDK v3): Intentando con ${modelName}...`);
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt
                });

                if (response && response.text) {
                    return {
                        statusCode: 200,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ analysis: response.text }),
                    };
                }
            } catch (err) {
                console.warn(`Fallo con ${modelName}:`, err.message);
                lastError = err;
                // Si es un error de credenciales, no seguimos intentando otros modelos
                if (err.message.includes("403") || err.message.includes("401")) break;
            }
        }

        throw lastError || new Error("No se pudo obtener respuesta de Gemini 3.");

    } catch (error) {
        console.error("Proxy Error Final:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                details: "Asegúrate de que GEMINI_API_KEY esté correctamente configurada en Netlify."
            }),
        };
    }
};
