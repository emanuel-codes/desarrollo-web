import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/mpga",
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/wave",
  "audio/webm",
  "video/mp4",
  "video/mpeg",
  "video/webm",
]);
const ALLOWED_EXTENSIONS = new Set(["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"]);

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return errorResponse("La API key de OpenAI no está configurada en el servidor.", 500);
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return errorResponse("No se recibió ningún archivo válido.");
    }

    const extension = getExtension(uploadedFile.name);
    const isAllowedMime = ALLOWED_MIME_TYPES.has(uploadedFile.type);
    const isAllowedExtension = ALLOWED_EXTENSIONS.has(extension);

    if (!isAllowedMime && !isAllowedExtension) {
      return errorResponse("Formato no permitido. Sube un archivo mp3, mp4, mpeg, mpga, m4a, wav o webm.");
    }

    if (uploadedFile.size <= 0) {
      return errorResponse("El archivo está vacío.");
    }

    if (uploadedFile.size > MAX_FILE_SIZE) {
      return errorResponse("El archivo supera el límite máximo de 25 MB.");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcript = await openai.audio.transcriptions.create({
      file: uploadedFile,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
      language: "es",
      response_format: "text",
    });

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcription error", error);
    return errorResponse("No pudimos transcribir el archivo. Intenta de nuevo o revisa la configuración del servidor.", 500);
  }
}
