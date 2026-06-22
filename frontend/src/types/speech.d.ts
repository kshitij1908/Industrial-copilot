/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;
type SpeechRecognitionErrorEvent = any;

interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}
