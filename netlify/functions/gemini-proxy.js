import { GoogleGenAI } from "@google/genai";

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
                body: JSON.stringify({ error: "Gemini API Key missing on server" })
            };
        }

        const ai = new GoogleGenAI({ apiKey });

        // Usamos el modelo exacto que indica la documentación (gemini-3-flash-preview)
        // Y añadimos un fallback por si todavía no está disponible en tu región.
        const models = ["gemini-3-flash-preview", "gemini-2.0-flash-exp", "gemini-1.5-flash"];
        let lastError = null;

        for (const modelName of models) {
            try {
                console.log(`Proxy (SDK GenAI): Intentando con ${modelName}...`);
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt
                });

                if (response && response.text) {
                    console.log(`Proxy Success: ${modelName} respondió OK.`);
                    return {
                        statusCode: 200,
                        headers: { "Content-Type": "application/json" },
                        // response.text ya es el string directo en el nuevo SDK
                        body: JSON.stringify({ analysis: response.text }),
                    };
                }
            } catch (err) {
                console.warn(`Error con ${modelName}:`, err.message);
                lastError = err;
                // Si la clave es inválida, paramos
                if (err.message.includes("403") || err.message.includes("401")) break;
            }
        }

        throw lastError || new Error("Todos los modelos fallaron.");

    } catch (error) {
        console.error("Proxy Error Final:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                details: "Asegúrate de que tu API Key tenga acceso a los modelos 'Preview' en Google AI Studio."
            }),
        };
    }
};
