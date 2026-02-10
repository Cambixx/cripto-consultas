const { GoogleGenerativeAI } = require("@google/generative-ai");

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
                body: JSON.stringify({ error: "Gemini API Key not configured on server" })
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Lista de modelos a intentar. gemini-1.5-flash-latest es el más estable para la v1beta/v1
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-2.0-flash-exp"
        ];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Proxy: Intentando con modelo ${modelName}...`);
                // Algunos modelos en v1beta requieren models/ prefix si el SDK no lo pone, 
                // pero @google/generative-ai lo suele manejar.
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    return {
                        statusCode: 200,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ analysis: text }),
                    };
                }
            } catch (error) {
                console.warn(`Proxy fail [${modelName}]:`, error.message);
                lastError = error;
                // Si es un error de API Key (403/401), no hace falta seguir rotando modelos
                if (error.message.includes("403") || error.message.includes("401")) {
                    break;
                }
            }
        }

        // Si todos fallan
        throw lastError || new Error("Todos los modelos fallaron o la API Key no tiene permisos.");

    } catch (error) {
        console.error("Proxy Error Final:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                details: "Asegúrate de que GEMINI_API_KEY en Netlify es válida y tiene habilitado el modelo gemini-1.5-flash."
            }),
        };
    }
};
