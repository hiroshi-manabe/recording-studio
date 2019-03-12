import React from "react";
import {SpeechRecognizer} from "./SpeechRecognizer";
import {render} from 'react-dom';
import {SpeechRecord} from "./utils";

function dummy(blob: Blob, records: SpeechRecord[]) {};
render(
  <SpeechRecognizer onBlobUpdated={dummy} />,
  document.getElementById('content')
);
