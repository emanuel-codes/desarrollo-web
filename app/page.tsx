"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"];

type Status = "idle" | "ready" | "transcribing" | "completed" | "error";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("Selecciona un archivo para comenzar.");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(
    () => ({ words: countWords(transcript), chars: transcript.length }),
    [transcript],
  );

  const statusLabel = {
    idle: "Selecciona un archivo",
    ready: "Archivo listo",
    transcribing: "Transcribiendo",
    completed: "Completado",
    error: "Error",
  }[status];

  function validateFile(selectedFile: File) {
    const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((extension) =>
      selectedFile.name.toLowerCase().endsWith(extension),
    );

    if (!hasAcceptedExtension) {
      return "Formato no permitido. Usa mp3, mp4, mpeg, mpga, m4a, wav o webm.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "El archivo supera el límite de 25 MB.";
    }

    return null;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    setTranscript("");
    setCopied(false);

    if (!selectedFile) {
      setFile(null);
      setStatus("idle");
      setMessage("Selecciona un archivo para comenzar.");
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFile(null);
      setStatus("error");
      setMessage(validationError);
      return;
    }

    setFile(selectedFile);
    setStatus("ready");
    setMessage("Archivo listo. Revisa la advertencia de costos antes de transcribir.");
  }

  async function handleTranscribe() {
    if (!file) {
      setStatus("error");
      setMessage("Primero selecciona un archivo de audio o video.");
      return;
    }

    setStatus("transcribing");
    setMessage("Transcribiendo con OpenAI. Esto puede tardar según el tamaño y duración del archivo.");
    setCopied(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al transcribir.");
      }

      setTranscript(data.transcript || "");
      setStatus("completed");
      setMessage("Transcripción completada correctamente.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No pudimos transcribir el archivo.");
    }
  }

  async function handleCopy() {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
  }

  function handleDownload() {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${file?.name.replace(/\.[^/.]+$/, "") || "transcripcion"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    setFile(null);
    setTranscript("");
    setStatus("idle");
    setMessage("Selecciona un archivo para comenzar.");
    setCopied(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="grid gap-8 rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-glow backdrop-blur lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
          <div className="flex flex-col justify-center gap-6">
            <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              MVP SaaS · OpenAI Transcription API
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Audio Transcript AI
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Transcribe audio o video a texto en español con una experiencia limpia, rápida y preparada para escalar.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-950 p-4 text-white">Modelo recomendado: gpt-4o-mini-transcribe</div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">Límite MVP: 25 MB por archivo</div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">Preparado para medir minutos por usuario</div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Subida segura</p>
                <h2 className="mt-2 text-2xl font-bold">Transcribir archivo</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{statusLabel}</span>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-600 bg-white/5 px-6 py-10 text-center transition hover:border-amber-200 hover:bg-white/10">
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={handleFileChange}
              />
              <span className="text-lg font-semibold">Selecciona un archivo</span>
              <span className="mt-2 text-sm text-slate-300">mp3, mp4, mpeg, mpga, m4a, wav o webm · máximo 25 MB</span>
            </label>

            {file && (
              <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-slate-100">
                <p><strong>Nombre:</strong> {file.name}</p>
                <p><strong>Tipo:</strong> {file.type || "No especificado"}</p>
                <p><strong>Tamaño:</strong> {formatBytes(file.size)}</p>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-amber-200/30 bg-amber-200/10 p-4 text-sm leading-6 text-amber-50">
              El consumo depende de la duración del audio. gpt-4o-mini-transcribe es el modelo recomendado por su relación costo-beneficio; puedes cambiar a gpt-4o-transcribe para máxima precisión desde variables de entorno.
            </div>

            <p className={`mt-4 text-sm ${status === "error" ? "text-red-200" : "text-slate-300"}`}>{message}</p>

            <button
              onClick={handleTranscribe}
              disabled={!file || status === "transcribing"}
              className="mt-6 w-full rounded-2xl bg-amber-200 px-5 py-4 font-bold text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "transcribing" ? "Transcribiendo..." : "Transcribir ahora"}
            </button>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-glow backdrop-blur lg:p-8">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Resultado</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Transcripción final</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full bg-slate-100 px-4 py-2">{stats.words} palabras</span>
              <span className="rounded-full bg-slate-100 px-4 py-2">{stats.chars} caracteres</span>
            </div>
          </div>

          <textarea
            className="min-h-[320px] w-full resize-y rounded-3xl border border-slate-200 bg-slate-50 p-5 text-base leading-7 text-slate-800 outline-none ring-slate-950/10 transition focus:ring-4"
            placeholder="Aquí aparecerá la transcripción..."
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={handleCopy} disabled={!transcript} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-40">
              {copied ? "Copiado" : "Copiar texto"}
            </button>
            <button onClick={handleDownload} disabled={!transcript} className="rounded-2xl bg-white px-5 py-3 font-bold text-slate-950 shadow-sm disabled:opacity-40">
              Descargar .txt
            </button>
            <button onClick={handleClear} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700">
              Limpiar
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
