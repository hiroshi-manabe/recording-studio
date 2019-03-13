import React, { useState, useRef, useCallback } from "react";
import {SpeechRecognizer} from "./SpeechRecognizer";
import {SpeechRecord} from "./utils";

export const App = () => {
  const media = useRef<HTMLAudioElement>(null);
  const [blobURL, setBlobURL] = useState<string>("");
  const [records, setRecords] = useState<SpeechRecord[]>();
  const blobUpdated = useCallback(function(blob: Blob, records: SpeechRecord[]) {
    if (media.current) {
      var url = URL.createObjectURL(blob);
      setBlobURL(url);
      media.current.src = url;
    }
    setRecords(records);
  }, [blobURL]);
  return (
    <>
      <SpeechRecognizer onBlobUpdated={blobUpdated} />
      <div style={ blobURL == "" ? { display: "none"} : { display: "block"} }>
      <audio ref={media} controls={!0} />
      </div>
    </>
  );
};
