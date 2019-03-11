// Speech

export type SpeechRecord = {
  results: SpeechRecogintionResult[];
  start: number;
  end: number;
};

export type SpeechRecogintionResult = {
  transcript: string;
  confidence: number;
};

declare class SpeechRecogintion {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  stop(): void;
  abort(): void;
  onresult: (
    event: {
      results: Array<Array<SpeechRecogintionResult>>;
    }
  ) => void;
  onend: (event: any) => void;
  onaudiostart: (event: any) => void;
  onaudioend: (event: any) => void;
  onspeechstart: (event: any) => void;
  onspeechend: (event: any) => void;

  onnomatch: (event: any) => void;
  onerror: (event: any) => void;
  start: () => void;
}

export const SpeechRecognition: typeof SpeechRecogintion =
  (global as any).webkitSpeechRecognition || (global as any).SpeechRecognition;

// let currentRecognition: SpeechRecogintion | null = null;
export function createSpeechRecognition(opts: {
  lang?: string;
  onResult: (results: SpeechRecogintionResult[]) => void;
  onEnd: (
    results: SpeechRecogintionResult[],
    range: { start: number; end: number }
  ) => void;
}) {
  const recognition = new SpeechRecognition();
  recognition.lang = opts.lang || "ja-JP";
  recognition.interimResults = true;
  let currentInputResults: SpeechRecogintionResult[] = [];
  recognition.onresult = event => {
    console.log("SpeechRecognition: onresult", event);
    const r: SpeechRecogintionResult[] = [];
    Array.from(event.results).forEach(xr => {
      r.push(...Array.from(xr));
    });
    currentInputResults = r;
    opts.onResult(r);
  };

  let defaultStart = Date.now();
  let start: number | null = null;
  let end: number | null = null;

  recognition.onspeechstart = (_event: any) => {
    // set at init
    if (start == null) {
      start = Date.now();
    }
    console.log("SpeechRecognition: onspeechstart");
  };
  recognition.onspeechend = (_event: any) => {
    end = Date.now();
    console.log("SpeechRecognition: onspeechend");
  };

  recognition.onnomatch = (_event: any) => {
    console.log("SpeechRecogintion: nomatch");
  };

  recognition.onend = (event: any) => {
    console.log("SpeechRecogintion: end");
    opts.onEnd(currentInputResults, {
      start: start || defaultStart,
      end: end || defaultStart
    });
  };

  recognition.onerror = (_event: any) => {
    console.log("SpeechRecogintion: onerror");
  };

  return recognition;
}

// media recorder
declare var MediaRecorder: any;
export async function createMediaRecorder(listeners: {
  onRecordEnd: (blob: Blob) => void;
  onData: (chunks: Blob[]) => void;
}): Promise<{ start: Function; stop: Function }> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });
  const codec = "audio/webm";
  const recorder = new MediaRecorder(stream, {
    audioBitsPerSecond: 128000, // 128kbps
    mimeType: codec
  });
  const chunks: Array<Blob> = [];
  recorder.addEventListener("dataavailable", (ev: { data: Blob }) => {
    chunks.push(ev.data);
    listeners.onData(chunks);
  });

  recorder.addEventListener("stop", async () => {
    const blob = new Blob(chunks, { type: codec });
    listeners.onRecordEnd(blob);
  });
  return recorder;
}
