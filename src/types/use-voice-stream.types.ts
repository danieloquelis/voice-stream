export interface UseVoiceStreamOptions {
  /**
   * Callback function called when streaming starts
   */
  onStartStreaming?: () => void;

  /**
   * Callback function called when streaming stops
   */
  onStopStreaming?: () => void;

  /**
   * Callback function called with each audio chunk in base64 format
   */
  onAudioChunked?: (chunkBase64: string) => void;

  /**
   * Callback function called when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Target sample rate for the audio stream (default: 16000)
   */
  targetSampleRate?: number;

  /**
   * Buffer size for audio processing (default: 8192)
   */
  bufferSize?: number;

  /**
   * Enable silence detection (default: false)
   */
  enableSilenceDetection?: boolean;

  /**
   * Silence threshold in dB (default: -50)
   */
  silenceThreshold?: number;

  /**
   * Minimum duration of silence in milliseconds before triggering silence detection (default: 1000)
   */
  silenceDuration?: number;

  /**
   * Whether to automatically stop streaming when silence is detected (default: false)
   */
  autoStopOnSilence?: boolean;

  /**
   * Whether to include the audio context destination in the processing chain (default: true)
   */
  includeDestination?: boolean;
}
