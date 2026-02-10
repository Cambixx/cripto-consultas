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

        // Intentar con el modelo más robusto primero
        let model;
        try {
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        } catch (e) {
            model = genAI.getGenerativeModel({ model: "gemini-pro" });
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ analysis: text }),
        };
    } catch (error) {
        console.error("Proxy Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
