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

        // Lista de modelos a intentar en orden de preferencia
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Proxy: Intentando con modelo ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Si llegamos aquí, tuvimos éxito
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ analysis: text }),
                };
            } catch (error) {
                console.warn(`Proxy: Falló modelo ${modelName}:`, error.message);
                lastError = error;
                // Continuar al siguiente modelo
            }
        }

        // Si todos fallan
        throw lastError || new Error("Todos los modelos fallaron");

    } catch (error) {
        console.error("Proxy Error Final:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
