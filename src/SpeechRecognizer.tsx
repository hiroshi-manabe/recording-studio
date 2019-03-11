import React, { useEffect, useState, useRef } from "react";

import {
  SpeechRecogintionResult,
  createSpeechRecognition,
  createMediaRecorder,
  SpeechRecord
} from "./utils";

let currentSpeechRecognition: any | null = null;
let currentMediaRecorder: any | null = null;

type Props = {
  onBlobUpdated: (blob: Blob, records: SpeechRecord[]) => void;
};

let records: SpeechRecord[] = [];
enum Format {
  PLAIN,
  TIMESTAMP,
  SRT
}

let formatStrings = [
  "Text Only",
  "With Timestamps",
  "SRT"
]

export function SpeechRecognizer(props: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRecoding, setRecording] = useState(false);
  const [step, setStep] = useState(0);
  const [startAt, setStartAt] = useState(0);
  const [format, setFormat] = useState(Format.PLAIN);
  const [lang, setLang] = useState("");

  // const [records, setRecords] = useState<SpeechRecord[]>([]);
  const [currentResults, setCurrentResults] = useState<
    SpeechRecogintionResult[]
  >([]);

  const onRecordStart = async () => {
    const mediaRecorder = await createMediaRecorder({
      onData(chunks) {
        const size = chunks.map(c => c.size).reduce((sum, i) => sum + i, 0);
        console.log(`size: ${Math.floor(size / 1000)}kb`);
      },
      onRecordEnd(blob) {
        props.onBlobUpdated(blob, records);
      }
    });
    currentMediaRecorder = mediaRecorder;
    mediaRecorder.start();
    records = [];
    setStartAt(Date.now());
    setRecording(true);
  };

  const onRecordEnd = async () => {
    if (currentSpeechRecognition) {
      currentSpeechRecognition.stop();
    }
    if (currentMediaRecorder) {
      currentMediaRecorder.stop();
    }
    setRecording(false);
    setStep(0);
  };

  useEffect(
    () => {
      if (!isRecoding) {
        return;
      }
      let recognition = createSpeechRecognition({
        lang: lang,
        onResult(results) {
          setCurrentResults(results);
        },
        onEnd(results, range) {
          if (results.length > 0) {
            records.push({
              start: range.start - startAt,
              end: range.end - startAt,
              results: results.map(r => {
                // serialize to JSON.stringify
                return {
                  transcript: r.transcript,
                  confidence: r.confidence
                };
              })
            });
          }
          setCurrentResults([]);
          setStep(s => s + 1);
        }
      });
      currentSpeechRecognition = recognition;

      console.log("start new recognition: step", step);

      recognition.start();
      return () => {
        // @ts-ignore
        recognition = null;
      };
    },
    [isRecoding, step]
  );

  const speechText = recordsToString(records, 0, format);

  // scroll to bottom
  useEffect(
    () => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    },
    [speechText]
  );

  const langs = [
    { value: "id-ID", label: "Bahasa Indonesia" },
    { value: "ca-ES", label: "Català" },
    { value: "cs-CZ", label: "Čeština" },
    { value: "de-DE", label: "Deutsch" },
    { value: "en-GB", label: "English (UK)" },
    { value: "en-US", label: "English (US)" },
    { value: "es-ES", label: "Español (España)" },
    { value: "es-MX", label: "Español (México)" },
    { value: "fr-FR", label: "Français" },
    { value: "it-IT", label: "Italiano" },
    { value: "hu-HU", label: "Magyar" },
    { value: "pl-PL", label: "Polski" },
    { value: "pt-BR", label: "Português (Brasil)" },
    { value: "pt-PT", label: "Português (Portugal)" },
    { value: "vi-VN", label: "Tiếng Việt" },
    { value: "tr-TR", label: "Türkçe" },
    { value: "ru-RU", label: "Pусский" },
    { value: "ko-KR", label: "한국어" },
    { value: "cmn-Hans-CN", label: "普通话（大陆）" },
    { value: "cmn-Hant-TW", label: "國語（台灣）" },
    { value: "yue-Hant-HK", label: "粵語" },
    { value: "ja-JP", label: "日本語" },
    { value: "hi-IN", label: "हिन्दी" },
    { value: "th-TH", label: "ภาษาไทย" }
  ];
  const formats = [ Format.PLAIN, Format.TIMESTAMP, Format.SRT ];

  const onLangChange = (event: React.FormEvent<HTMLSelectElement>) => {
    setLang(event.currentTarget.value);
  };
  const onFormatChange = (event: React.FormEvent<HTMLSelectElement>) => {
    setFormat(Number(event.currentTarget.value));
  };
  return (
    <>
      <select onChange={onLangChange}>
        { langs.map((x) => <option key={x.label} value={x.value}>{x.label}</option>) }
      </select>
      {isRecoding ? (
        <>
          <button onClick={onRecordEnd}>recording end</button>
          &nbsp; Recording...
        </>
      ) : (
        <button onClick={onRecordStart}>recording start</button>
      )}
      <hr />
      <h3>Output</h3>
      {currentResults.length > 0 && <div>Input...</div>}
      {currentResults.map((r, index) => {
        return (
          <div key={index}>
            {Math.floor(r.confidence * 10000) / 100}%: {r.transcript}:
          </div>
        );
      })}
      <textarea
        ref={textareaRef}
        placeholder="Press start to record..."
        readOnly={isRecoding}
        style={{ width: "95vw", height: "60vh" }}
        value={speechText}
        onChange={() => {}}
      />
      <div>
      <select onChange={onFormatChange}>
        { formats.map((x) => <option key={x} value={x}>{formatStrings[x]}</option>) }
      </select>
      </div>
    </>
  );
}

function zeroPaddingMax3(
  num: number,
  length: number) {
  return `00${num}`.slice(-length)
}

function formatTime(t: number) {
  return zeroPaddingMax3(Math.floor(t/3600000),2) +
         ":" +
         zeroPaddingMax3((Math.floor(t/60000)) % 60, 2) +
         ":" +
         zeroPaddingMax3((Math.floor(t/1000)) % 60, 2) +
         "," +
         zeroPaddingMax3(t % 1000, 3);
}

function recordToTranscript(r: SpeechRecord) {
  return r.results.map(i => i.transcript).join(". ");
}

function recordsToString(
  records: SpeechRecord[],
  startAt: number,
  format: Format
) {
  var result = "";
  var count = 1;
  for (let r of records) {
    if (format == Format.PLAIN) {
       result += recordToTranscript(r) + "\n";
    }
    else if (format == Format.TIMESTAMP) {
       result += `${Math.floor((r.start - startAt) / 1000)}s: ` + recordToTranscript(r) + "\n";
    }
    else if (format == Format.SRT) {
       result += `${count}\n`;
       result += formatTime(r.start - startAt) + " --> " + formatTime(r.end - startAt) + "\n";
       result += recordToTranscript(r) + "\n\n";
    }
    count++;
  }
  return result;
}
