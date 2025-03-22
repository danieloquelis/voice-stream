// Make this file a module
export {};

// Mock the AudioContext and MediaDevices API
declare global {
  interface Window {
    AudioContext: any;
    AudioProcessingEvent: any;
  }
}

const MockAudioContext = class {
  createMediaStreamSource = jest.fn();
  createScriptProcessor = jest.fn();
  sampleRate = 44100;
  close = jest.fn();
  destination = {};
};

const MockMediaStream = class {
  getTracks = () => [{ stop: jest.fn() }];
};

const MockAudioProcessingEvent = class extends Event {
  constructor() {
    super("audioprocess");
    this.inputBuffer = {
      getChannelData: jest.fn(),
    };
    this.outputBuffer = {
      getChannelData: jest.fn(),
    };
    this.playbackTime = 0;
  }

  inputBuffer: { getChannelData: jest.Mock };
  outputBuffer: { getChannelData: jest.Mock };
  playbackTime: number;
};

Object.defineProperty(window, "AudioContext", {
  writable: true,
  value: MockAudioContext,
});

Object.defineProperty(global.navigator, "mediaDevices", {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

Object.defineProperty(window, "AudioProcessingEvent", {
  writable: true,
  value: MockAudioProcessingEvent,
});
