/**
 * Quiet, mechanical garage audio — understated enough for a premium brand.
 */

function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

export function playButtonClick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.05);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);

  window.setTimeout(() => void ctx.close(), 160);
}

export type GarageDoorAudio = {
  startMotor: () => void;
  playClunk: () => void;
  stop: () => void;
};

export function createGarageDoorAudio(): GarageDoorAudio | null {
  const ctx = getAudioContext();
  if (!ctx) return null;

  let motorNodes: AudioNode[] = [];
  let stopped = false;

  const startMotor = () => {
    if (stopped) return;
    void ctx.resume();

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 3);
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 280;

    const motorGain = ctx.createGain();
    motorGain.gain.value = 0.0001;

    const master = ctx.createGain();
    master.gain.value = 0.09;

    noise.connect(lowpass);
    lowpass.connect(motorGain);
    motorGain.connect(master);
    master.connect(ctx.destination);

    const now = ctx.currentTime;
    motorGain.gain.exponentialRampToValueAtTime(0.028, now + 0.25);
    motorGain.gain.exponentialRampToValueAtTime(0.02, now + 1.5);

    noise.start();
    motorNodes = [noise, lowpass, motorGain, master];
  };

  const playClunk = () => {
    if (stopped) return;
    void ctx.resume();

    const now = ctx.currentTime;
    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(70, now);
    thud.frequency.exponentialRampToValueAtTime(32, now + 0.16);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.0001, now);
    thudGain.gain.exponentialRampToValueAtTime(0.14, now + 0.012);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.25);
  };

  const stop = () => {
    stopped = true;
    for (const node of motorNodes) {
      try {
        if ("stop" in node && typeof (node as AudioScheduledSourceNode).stop === "function") {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Already stopped.
      }
    }
    motorNodes = [];
    void ctx.close();
  };

  return { startMotor, playClunk, stop };
}
