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
  const [isRecording, setRecording] = useState(false);
  const [step, setStep] = useState(0);
  const [startAt, setStartAt] = useState(0);
  const [format, setFormat] = useState(Format.PLAIN);
  const [lang, setLang] = useState("");
  const [offset, setOffset] = useState(0);

  // const [records, setRecords] = useState<SpeechRecord[]>([]);
  const [currentResults, setCurrentResults] = useState<
    SpeechRecogintionResult[]
  >([]);

  const zeroPaddingMax3 = (
    num: number,
    length: number) => {
    return `00${num}`.slice(-length)
  };

  const formatTime = (t: number) => {
    const t2 = t < 0 ? 0 : t;
    return zeroPaddingMax3(Math.floor(t2/3600000),2) +
           ":" +
           zeroPaddingMax3((Math.floor(t2/60000)) % 60, 2) +
           ":" +
           zeroPaddingMax3((Math.floor(t2/1000)) % 60, 2) +
           "," +
           zeroPaddingMax3(t2 % 1000, 3);
  };

  const recordToTranscript = (r: SpeechRecord) => {
    return r.results.map(i => i.transcript).join(". ");
  };

  const recordsToString = (
    records: SpeechRecord[],
    startAt: number,
    format: Format
  ) => {
    let result = "";
    let count = 1;
    for (let r of records) {
      if (format === Format.PLAIN) {
         result += recordToTranscript(r) + "\n";
      }
      else if (format === Format.TIMESTAMP) {
         result += `${Math.floor((r.start - startAt + offset) / 1000)}s: ` + recordToTranscript(r) + "\n";
      }
      else if (format === Format.SRT) {
        result += `${count}\n`;
        result += formatTime(r.start - startAt + offset) + " --> " + formatTime(r.end - startAt + offset) + "\n";
        result += recordToTranscript(r) + "\n\n";
      }
      count++;
    }
    return result;
  }

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
      if (!isRecording) {
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
    [isRecording, step]
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

  const getMatchLang = (browserLang: string, recognitionLangs: string[]) => {
    let t = browserLang.split("-");
    let rls = recognitionLangs.map(rl => {
      let x = rl.toLowerCase();
      let t2 = x.split("-");
      if (t2[0] === "cmn" || t2[0] === "yue") {
        return "zh-" + t2[t2.length - 1];
      }
      return x;
    });
    let toOrigMap: { [key:string]: string; } = {};
    for (let i = 0; i < rls.length; ++i) {
      toOrigMap[rls[i]] = recognitionLangs[i];
    }
    let filtered_2 = rls.filter(rl => rl === browserLang);
    if (filtered_2.length == 1) {
      return toOrigMap[filtered_2[0]];
    }
    let filtered_1 = rls.filter(rl => (rl.split("-"))[0] === t[0]);
    let t2 = filtered_1.length > 1 ? (filtered_1.filter(rl => rl === "en-us" || rl === "es-es" || rl === "pt-pt" || rl === "zh-ch"))[0] : filtered_1.length == 1 ? filtered_1[0] : "en-us";
    return toOrigMap[t2];
  };

  let browserLang = (window.navigator.languages && window.navigator.languages[0]) ||
                    window.navigator.language;
  const storedLang = localStorage.getItem("lang");           let defaultLang = (storedLang === null || storedLang == "") ? getMatchLang(browserLang, langs.map(x => x.value)) : storedLang;
  const formats = [ Format.PLAIN, Format.TIMESTAMP, Format.SRT ];
  const storedFormatStr = localStorage.getItem("format");
  const defaultFormat = storedFormatStr === null ? Format.PLAIN : Number(storedFormatStr);
  useEffect(
    () => {
      setLang(defaultLang);
      setFormat(defaultFormat);
    },
    []
  );

  const onLangChange = (event: React.FormEvent<HTMLSelectElement>) => {
    setLang(event.currentTarget.value);
    localStorage.setItem("lang", event.currentTarget.value);
  };
  const onFormatChange = (event: React.FormEvent<HTMLSelectElement>) => {
    setFormat(Number(event.currentTarget.value));
    localStorage.setItem("format", event.currentTarget.value);
  };
  const onOffsetChange = (event: React.FormEvent<HTMLInputElement>) => {
    setOffset(Number(event.currentTarget.value));
  };
  return (
    <>
      <select onChange={onLangChange} value={lang}>
        { langs.map((x) => <option key={x.label} value={x.value}>{x.label}</option>) }
      </select>
      &nbsp;Offset (milliseconds):
      <input type="number" value={offset} min="-1000000" max="1000000" step="50" onChange={onOffsetChange} />
      &nbsp;
      {isRecording ? (
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
        readOnly={isRecording}
        style={{ width: "95vw", height: "60vh" }}
        value={speechText}
        onChange={() => {}}
      />
      <div>
      <select onChange={onFormatChange} value={format}>
        { formats.map((x) => <option key={x} value={x}>{formatStrings[x]}</option>) }
      </select>
      </div>
    </>
  );
}
