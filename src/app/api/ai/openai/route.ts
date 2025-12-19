import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    if (!openai) {
        return NextResponse.json(
            { error: "OPENAI_API_KEY no configurada" },
            { status: 500 }
        );
    }

    try {
        const { data } = await req.json();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Eres un asistente médico experto en enfermedades neurodegenerativas (Huntington). 
          Responde siempre en formato JSON estricto con la estructura: 
          { "diagnosis": string, "reasoning": string, "confidence": string, "recommendations": string[] }`
                },
                {
                    role: "user",
                    content: `Analiza este caso:
          - Historia: ${JSON.stringify(data.history)}
          - Triaje: ${JSON.stringify(data.triage)}
          - Labs: ${JSON.stringify(data.labs)}
          - Neuro: ${JSON.stringify(data.neuro)}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0].message.content;
        if (!text) throw new Error("Respuesta vacía de OpenAI");

        const parsed = JSON.parse(text);

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("Error en OpenAI API:", error);
        return NextResponse.json(
            { error: "Error procesando la solicitud con OpenAI" },
            { status: 500 }
        );
    }
}
