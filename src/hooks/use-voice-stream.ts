import { useRef, useCallback, useEffect, useState } from "react";
import { downsampleBuffer } from "../utils/downsample-buffer";
import { int16ArrayToBase64 } from "../utils/int16array-to-base64";
import { SilenceDetector } from "../utils/silence-detection";
import { UseVoiceStreamOptions } from "../types/use-voice-stream.types";
import {
  DEFAULT_TARGET_SAMPLE_RATE,
  DEFAULT_BUFFER_SIZE,
  DEFAULT_SILENCE_THRESHOLD,
  DEFAULT_SILENCE_DURATION,
  DEFAULT_INCLUDE_DESTINATION,
} from "../constants/voice-stream.constants";

export const useVoiceStream = (options: UseVoiceStreamOptions) => {
  const {
    onStartStreaming,
    onStopStreaming,
    onAudioChunked,
    onError,
    targetSampleRate = DEFAULT_TARGET_SAMPLE_RATE,
    bufferSize = DEFAULT_BUFFER_SIZE,
    enableSilenceDetection = false,
    silenceThreshold = DEFAULT_SILENCE_THRESHOLD,
    silenceDuration = DEFAULT_SILENCE_DURATION,
    autoStopOnSilence = false,
    includeDestination = DEFAULT_INCLUDE_DESTINATION,
  } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silenceDetectorRef = useRef<SilenceDetector | null>(null);

  const handleError = useCallback(
    (error: Error) => {
      console.error("Voice stream error:", error);
      if (onError) {
        onError(error);
      }
    },
    [onError]
  );

  const stopStreaming = useCallback(() => {
    if (!isStreaming) return;

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (silenceDetectorRef.current) {
      silenceDetectorRef.current.reset();
      silenceDetectorRef.current = null;
    }

    setIsStreaming(false);

    if (onStopStreaming) {
      onStopStreaming();
    }
  }, [isStreaming, onStopStreaming]);

  const startStreaming = useCallback(async () => {
    if (isStreaming) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
      const sampleRate = audioContext.sampleRate;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const scriptProcessor = audioContext.createScriptProcessor(
        bufferSize,
        1,
        1
      );
      scriptProcessorRef.current = scriptProcessor;

      // Initialize silence detector if enabled
      if (enableSilenceDetection) {
        silenceDetectorRef.current = new SilenceDetector(
          silenceThreshold,
          silenceDuration,
          autoStopOnSilence ? stopStreaming : undefined
        );
      }

      scriptProcessor.onaudioprocess = (
        audioProcessingEvent: AudioProcessingEvent
      ) => {
        try {
          const inputBuffer = audioProcessingEvent.inputBuffer;
          const channelData = inputBuffer.getChannelData(0);

          // Process silence detection if enabled
          if (enableSilenceDetection && silenceDetectorRef.current) {
            silenceDetectorRef.current.processAudioData(channelData);
          }

          const downsampledBuffer = downsampleBuffer(
            channelData,
            sampleRate,
            targetSampleRate
          );
          const base64Data = int16ArrayToBase64(downsampledBuffer);

          if (onAudioChunked) {
            onAudioChunked(base64Data);
          }
        } catch (error) {
          handleError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      };

      sourceNode.connect(scriptProcessor);
      if (includeDestination) {
        scriptProcessor.connect(audioContext.destination);
      }

      setIsStreaming(true);
      if (onStartStreaming) {
        onStartStreaming();
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    isStreaming,
    onStartStreaming,
    onAudioChunked,
    onError,
    targetSampleRate,
    bufferSize,
    enableSilenceDetection,
    silenceThreshold,
    silenceDuration,
    autoStopOnSilence,
    includeDestination,
    stopStreaming,
    handleError,
  ]);

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    startStreaming,
    stopStreaming,
    isStreaming,
  };
};
