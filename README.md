# Audio Transcript AI

Audio Transcript AI es un MVP full-stack construido con Next.js App Router, TypeScript, Tailwind CSS y el SDK oficial de OpenAI para Node.js. Permite subir un archivo de audio o video, enviarlo de forma segura a un endpoint interno y ver la transcripción final en pantalla.

## Funcionalidades

- Interfaz SaaS premium, responsive y en español.
- Subida de archivos `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav` y `webm`.
- Validación de archivo en frontend y backend.
- Límite máximo de 25 MB por archivo.
- Transcripción con `openai.audio.transcriptions.create`.
- Modelo recomendado por defecto: `gpt-4o-mini-transcribe`.
- Botones para copiar, descargar como `.txt` y limpiar.
- Contador de palabras y caracteres.
- Estados claros: selecciona un archivo, archivo listo, transcribiendo, completado y error.

## Requisitos

- Node.js 18.17 o superior.
- Una API key de OpenAI con acceso a la API.

> Importante: la API de OpenAI se cobra aparte de ChatGPT Plus. Tener ChatGPT Plus no incluye créditos ni uso gratuito de la API.

## Instalación

```bash
npm install
```

## Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Agrega tu API key:

```env
OPENAI_API_KEY=tu_api_key
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

Nunca expongas `OPENAI_API_KEY` en el frontend. Esta app solo la usa en la ruta interna `/api/transcribe`.

## Ejecutar en desarrollo

```bash
npm run dev
```

Luego abre [http://localhost:3000](http://localhost:3000).

## Cambiar el modelo de transcripción

El modelo se configura con `OPENAI_TRANSCRIBE_MODEL`:

```env
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

Usa `gpt-4o-mini-transcribe` para la mejor relación costo-beneficio. Si necesitas máxima precisión, cambia a:

```env
OPENAI_TRANSCRIBE_MODEL=gpt-4o-transcribe
```

Como fallback opcional, podrías evaluar `whisper-1`, pero no es el modelo principal de este proyecto.

## Límite de archivos

El MVP acepta archivos de hasta 25 MB. La validación existe tanto en el navegador como en el backend para evitar envíos no permitidos.

## Costos y control futuro

Antes de transcribir, la interfaz muestra una advertencia de costos porque el consumo depende de la duración del audio. El código queda preparado para agregar medición de duración y, en una futura versión con usuarios y base de datos, descontar minutos disponibles por usuario.

## Estructura principal

- `app/page.tsx`: interfaz principal de subida, estados, resultado y acciones.
- `app/api/transcribe/route.ts`: endpoint interno que valida el archivo y llama a OpenAI.
- `app/globals.css`: estilos globales y base visual.
- `.env.example`: variables necesarias para configurar el entorno local.
