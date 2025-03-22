# Voice Stream

A powerful TypeScript library for real-time voice streaming in React applications, designed for AI-powered voice applications, real-time transcription, and audio processing.

## Features

- 🎙️ Real-time voice streaming with configurable audio processing
- 🔊 Automatic silence detection and handling
- ⚡ Configurable sample rate and buffer size
- 🔄 Base64 encoded audio chunks for easy transmission
- 🛠️ TypeScript support with full type definitions
- 📦 Zero dependencies (except for React)

## Installation

```bash
yarn add voice-stream
# or
npm install voice-stream
```

## Requirements

- React 18 or higher
- Modern browser with Web Audio API support

## Basic Usage

```typescript
import { useVoiceStream } from "voice-stream";

function App() {
  const { startStreaming, stopStreaming, isStreaming } = useVoiceStream({
    onStartStreaming: () => {
      console.log("Streaming started");
    },
    onStopStreaming: () => {
      console.log("Streaming stopped");
    },
    onAudioChunked: (chunkBase64) => {
      // Handle the audio chunk
      console.log("Received audio chunk");
    },
  });

  return (
    <div>
      <button onClick={startStreaming} disabled={isStreaming}>
        Start Recording
      </button>
      <button onClick={stopStreaming} disabled={!isStreaming}>
        Stop Recording
      </button>
    </div>
  );
}
```

## Advanced Configuration

The `useVoiceStream` hook accepts several configuration options for advanced use cases:

```typescript
const options = {
  // Basic callbacks
  onStartStreaming: () => void,
  onStopStreaming: () => void,
  onAudioChunked: (base64Data: string) => void,
  onError: (error: Error) => void,

  // Audio processing options
  targetSampleRate: 16000, // Default: 16000
  bufferSize: 4096, // Default: 4096

  // Silence detection options
  enableSilenceDetection: true, // Default: false
  silenceThreshold: -50, // Default: -50 (dB)
  silenceDuration: 1000, // Default: 1000 (ms)
  autoStopOnSilence: true, // Default: false

  // Audio routing
  includeDestination: true, // Default: true - routes audio to speakers
};
```

## Use Cases

### 1. OpenAI Whisper API Integration

Real-time speech-to-text using OpenAI's Whisper API:

```typescript
function WhisperTranscription() {
  const [transcript, setTranscript] = useState("");

  const { startStreaming, stopStreaming } = useVoiceStream({
    targetSampleRate: 16000, // Whisper's preferred sample rate
    onAudioChunked: async (base64Data) => {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Data,
          model: 'whisper-1',
          response_format: 'text'
        })
      });

      const text = await response.text();
      setTranscript(text);
    }
  });

  return (
    // ... UI implementation
  );
}
```

### 2. ElevenLabs WebSocket Integration

Real-time text-to-speech using ElevenLabs' WebSocket API:

```typescript
function ElevenLabsStreaming() {
  const ws = useRef<WebSocket | null>(null);

  const { startStreaming, stopStreaming } = useVoiceStream({
    targetSampleRate: 44100, // ElevenLabs preferred sample rate
    onAudioChunked: (base64Data) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          audio: base64Data,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }));
      }
    }
  });

  useEffect(() => {
    ws.current = new WebSocket('wss://api.elevenlabs.io/v1/text-to-speech');

    return () => {
      ws.current?.close();
    };
  }, []);

  return (
    // ... UI implementation
  );
}
```

### 3. Real-time Voice Activity Detection

Implement voice activity detection with automatic silence handling:

```typescript
function VoiceActivityDetection() {
  const { startStreaming, stopStreaming } = useVoiceStream({
    enableSilenceDetection: true,
    silenceThreshold: -50,
    silenceDuration: 1000,
    autoStopOnSilence: true,
    onStartStreaming: () => console.log("Voice detected"),
    onStopStreaming: () => console.log("Silence detected"),
  });

  return (
    // ... UI implementation
  );
}
```

## API Reference

### useVoiceStream Hook

#### Returns

- `startStreaming: () => Promise<void>` - Function to start voice streaming
- `stopStreaming: () => void` - Function to stop voice streaming
- `isStreaming: boolean` - Current streaming status

#### Options

- `onStartStreaming?: () => void` - Called when streaming starts
- `onStopStreaming?: () => void` - Called when streaming stops
- `onAudioChunked?: (chunkBase64: string) => void` - Called with each audio chunk
- `onError?: (error: Error) => void` - Called when an error occurs
- `targetSampleRate?: number` - Target sample rate for audio processing
- `bufferSize?: number` - Size of the audio processing buffer
- `enableSilenceDetection?: boolean` - Enable silence detection
- `silenceThreshold?: number` - Threshold for silence detection in dB
- `silenceDuration?: number` - Duration of silence before trigger in ms
- `autoStopOnSilence?: boolean` - Automatically stop streaming on silence
- `includeDestination?: boolean` - Route audio to speakers

## Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code contributions, please feel free to reach out or submit a pull request.

### Development Setup

1. Fork the repository
2. Install dependencies: `yarn install`
3. Run tests: `yarn test`

## License

MIT
