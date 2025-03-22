export class SilenceDetector {
  private silenceStartTime: number | null = null;
  private readonly threshold: number;
  private readonly duration: number;
  private readonly onSilenceDetected?: () => void;

  constructor(
    threshold: number,
    duration: number,
    onSilenceDetected?: () => void
  ) {
    this.threshold = threshold;
    this.duration = duration;
    this.onSilenceDetected = onSilenceDetected;
  }

  processAudioData(channelData: Float32Array): boolean {
    // Calculate RMS value
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);
    const db = 20 * Math.log10(rms);

    // Check if audio is below threshold
    if (db < this.threshold) {
      if (this.silenceStartTime === null) {
        this.silenceStartTime = Date.now();
      } else if (
        Date.now() - this.silenceStartTime >= this.duration &&
        this.onSilenceDetected
      ) {
        this.onSilenceDetected();
        return true;
      }
    } else {
      this.silenceStartTime = null;
    }

    return false;
  }

  reset(): void {
    this.silenceStartTime = null;
  }
}
