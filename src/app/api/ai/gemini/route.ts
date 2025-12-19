import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
    if (!genAI) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY no configurada" },
            { status: 500 }
        );
    }

    try {
        const { data } = await req.json(); // Esperamos el objeto completo del caso

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Actúa como un médico especialista experto en neurología y genética.
      Analiza el siguiente caso clínico y proporciona un diagnóstico diferencial, sugerencias de tratamiento y pronóstico.
      
      DATOS DEL PACIENTE:
      - Edad/Sexo: Consultar en perfil.
      - Historia Clínica: ${JSON.stringify(data.history)}
      - Triaje: ${JSON.stringify(data.triage)}
      - Exámenes de Laboratorio: ${JSON.stringify(data.labs)}
      - Evaluación Neurológica (UHDRS/MMSE): ${JSON.stringify(data.neuro)}

      Responde en formato JSON válido con la siguiente estructura (sin bloques de código markdown, solo el JSON raw):
      {
        "diagnosis": "Diagnóstico principal sugerido",
        "reasoning": "Explicación breve de por qué se llega a esta conclusión (max 50 palabras)",
        "confidence": "Alta/Media/Baja",
        "recommendations": ["Recomendación 1", "Recomendación 2"]
      }
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Limpieza básica por si el modelo devuelve markdown
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(jsonString);

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("Error en Gemini API:", error);
        return NextResponse.json(
            { error: "Error procesando la solicitud con Gemini" },
            { status: 500 }
        );
    }
}
