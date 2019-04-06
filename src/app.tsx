import React, { useState, useRef, useCallback } from "react";
import {SpeechRecognizer} from "./SpeechRecognizer";
import {SpeechRecord} from "./utils";

export const App = () => {
  const media = useRef<HTMLAudioElement>(null);
  const [soundBlobURL, setSoundBlobURL] = useState<string>("");
  const [textBlobURL, setTextBlobURL] = useState<string>("");
  const [filename, setFilename] = useState<string>();
  const soundBlobUpdated = useCallback(function(soundBlob: Blob) {
    if (media.current) {
      let soundURL = URL.createObjectURL(soundBlob);
      setSoundBlobURL(soundURL);
      media.current.src = soundURL;
    }
  }, [soundBlobURL]);
  const textUpdated = useCallback(function(text: string, fname: string) {
    if (text !== "") {
      let textBlob = new Blob([text], { "type": "text/plain" });
      let textURL = URL.createObjectURL(textBlob);
      setTextBlobURL(textURL);
      setFilename(fname);
    }
  }, [textBlobURL, filename]);
  return (
    <>
      <SpeechRecognizer onSoundBlobUpdated={soundBlobUpdated} onTextUpdated={textUpdated} />
      <div style={ textBlobURL === "" ? { display: "none"} : { display: "block"} }>
        <a href={ textBlobURL } download={filename}>Download</a>
      </div>
      <div style={ soundBlobURL === "" ? { display: "none"} : { display: "block"} }>
        <audio ref={media} controls={!0} />
      </div>
    </>
  );
};
