import { useVoiceStream } from "../use-voice-stream";
import { renderHook, act } from "@testing-library/react";

describe("useVoiceStream", () => {
  const mockGetUserMedia = jest.fn();
  const mockAudioContext = {
    createMediaStreamSource: jest.fn(),
    createScriptProcessor: jest.fn(),
    sampleRate: 44100,
    close: jest.fn(),
    destination: {},
  };
  const mockScriptProcessor = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    onaudioprocess: null as ((event: AudioProcessingEvent) => void) | null,
  };
  const mockSourceNode = {
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    // Mock getUserMedia
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
    });

    // Mock AudioContext
    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    global.AudioContext.prototype.createMediaStreamSource =
      mockAudioContext.createMediaStreamSource;
    global.AudioContext.prototype.createScriptProcessor =
      mockAudioContext.createScriptProcessor;

    // Mock MediaStream
    const mockStream = {
      getTracks: () => [{ stop: jest.fn() }],
    };
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockAudioContext.createMediaStreamSource.mockReturnValue(mockSourceNode);
    mockAudioContext.createScriptProcessor.mockReturnValue(mockScriptProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore the original mediaDevices
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: undefined,
    });
  });

  it("should initialize without errors", () => {
    const { result } = renderHook(() =>
      useVoiceStream({
        onStartStreaming: jest.fn(),
        onStopStreaming: jest.fn(),
        onAudioChunked: jest.fn(),
      })
    );

    expect(result.current.startStreaming).toBeDefined();
    expect(result.current.stopStreaming).toBeDefined();
    expect(result.current.isStreaming).toBe(false);
  });

  it("should start streaming when startStreaming is called", async () => {
    const onStartStreaming = jest.fn();
    const { result } = renderHook(() =>
      useVoiceStream({
        onStartStreaming,
        onStopStreaming: jest.fn(),
        onAudioChunked: jest.fn(),
      })
    );

    await act(async () => {
      await result.current.startStreaming();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalled();
    expect(mockAudioContext.createScriptProcessor).toHaveBeenCalled();
    expect(onStartStreaming).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(true);
  });

  it("should stop streaming when stopStreaming is called", async () => {
    const onStopStreaming = jest.fn();
    const { result } = renderHook(() =>
      useVoiceStream({
        onStartStreaming: jest.fn(),
        onStopStreaming,
        onAudioChunked: jest.fn(),
      })
    );

    // Start streaming first
    await act(async () => {
      await result.current.startStreaming();
    });

    // Then stop streaming
    await act(async () => {
      result.current.stopStreaming();
    });

    expect(mockScriptProcessor.disconnect).toHaveBeenCalled();
    expect(mockSourceNode.disconnect).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
    expect(onStopStreaming).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it("should handle getUserMedia errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const onError = jest.fn();
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));

    const { result } = renderHook(() =>
      useVoiceStream({
        onStartStreaming: jest.fn(),
        onStopStreaming: jest.fn(),
        onAudioChunked: jest.fn(),
        onError,
      })
    );

    await act(async () => {
      await result.current.startStreaming();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Voice stream error:",
      expect.any(Error)
    );
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it("should respect custom configuration options", async () => {
    const customOptions = {
      targetSampleRate: 8000,
      bufferSize: 4096,
      enableSilenceDetection: true,
      silenceThreshold: -60,
      silenceDuration: 2000,
      autoStopOnSilence: true,
      includeDestination: false,
    };

    const { result } = renderHook(() =>
      useVoiceStream({
        onStartStreaming: jest.fn(),
        onStopStreaming: jest.fn(),
        onAudioChunked: jest.fn(),
        ...customOptions,
      })
    );

    await act(async () => {
      await result.current.startStreaming();
    });

    expect(mockAudioContext.createScriptProcessor).toHaveBeenCalledWith(
      customOptions.bufferSize,
      1,
      1
    );
    expect(mockScriptProcessor.connect).not.toHaveBeenCalledWith(
      mockAudioContext.destination
    );
  });

  it("should handle audio processing errors gracefully", async () => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useVoiceStream({
        onStartStreaming: jest.fn(),
        onStopStreaming: jest.fn(),
        onAudioChunked: jest.fn(),
        onError,
      })
    );

    await act(async () => {
      await result.current.startStreaming();
    });

    // Create a minimal mock of AudioProcessingEvent
    const mockAudioProcessingEvent = {
      inputBuffer: {
        getChannelData: () => {
          throw new Error("Processing error");
        },
      },
      outputBuffer: {
        getChannelData: jest.fn(),
      },
      playbackTime: 0,
      bubbles: false,
      cancelBubble: false,
      cancelable: false,
      composed: false,
      currentTarget: null,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      returnValue: true,
      srcElement: null,
      target: null,
      timeStamp: 0,
      type: "audioprocess",
      preventDefault: jest.fn(),
      stopImmediatePropagation: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as AudioProcessingEvent;

    await act(async () => {
      if (mockScriptProcessor.onaudioprocess) {
        mockScriptProcessor.onaudioprocess(mockAudioProcessingEvent);
      }
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
