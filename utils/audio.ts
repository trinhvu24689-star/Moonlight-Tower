
// A simple synth to generate game sounds without external files
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  
  // Cache mechanism
  private _cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    // Eager load voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
            this._cachedVoices = window.speechSynthesis.getVoices();
        };
        // Try getting them immediately
        this._cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3; // Default volume
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.value = mute ? 0 : 0.3;
    }
    if (mute) {
        this.stopBGM();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    else this.playBGM();
  }

  // --- VOICE HELPER FOR UI ---
  public getVietnameseVoice(): SpeechSynthesisVoice | undefined {
      let availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) availableVoices = this._cachedVoices;

      return (
          // Priority 0: "Microsoft An" (Exact name match often works best on Windows)
          availableVoices.find(v => v.name.includes('Microsoft An')) ||
          availableVoices.find(v => v.name === 'An') ||
          // Priority 1: Google (Best on Android/Chrome)
          availableVoices.find(v => v.name.includes('Google') && v.lang.includes('vi')) ||
          // Priority 2: Any Microsoft Vietnamese
          availableVoices.find(v => v.name.includes('Microsoft') && v.lang.includes('vi')) ||
          // Priority 3: Any voice with 'vi-VN'
          availableVoices.find(v => v.lang === 'vi-VN') ||
          // Priority 4: Loose match
          availableVoices.find(v => v.lang.includes('vi'))
      );
  }

  // --- TEXT TO SPEECH ---
  public speak(text: string, persona: 'narrator' | 'guide' | 'ice' | 'fire' | 'archer' | 'cannon' | 'system' = 'system') {
      if (this.isMuted || !('speechSynthesis' in window)) return;

      // Ensure we have fresh voices
      let availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
          this._cachedVoices = availableVoices;
      }

      // Cancel previous to prevent overlap
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN'; // Base requirement
      
      const vietVoice = this.getVietnameseVoice();

      if (vietVoice) {
          utter.voice = vietVoice;
          // Sync utterance lang with voice lang to be safe
          utter.lang = vietVoice.lang;
      } else {
          console.warn("SoundManager: No Vietnamese voice found. Using default.");
      }
      
      // PERSONA CONFIGURATION
      switch (persona) {
          case 'narrator':
              utter.pitch = 0.8; 
              utter.rate = 0.9;
              break;
          case 'guide':
              utter.pitch = 1.1; 
              utter.rate = 1.1; 
              break;
          case 'ice':
              utter.pitch = 1.1; 
              utter.rate = 1.0;
              break;
          case 'fire':
              utter.pitch = 0.6; 
              utter.rate = 1.1;
              break;
          case 'cannon':
              utter.pitch = 0.5; 
              utter.rate = 0.8;
              break;
          case 'archer':
              utter.pitch = 1.2; 
              utter.rate = 1.2;
              break;
          default:
              utter.pitch = 1.0;
              utter.rate = 1.0;
      }

      window.speechSynthesis.speak(utter);
  }

  public playBGM() {
    if (this.isMuted) return;
    this.init();
    // Placeholder for BGM
  }

  public stopBGM() {
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.bgmOscillators = [];
  }

  // Generic sound generator
  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 1, slideTo: number | null = null) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playShoot() { this.playTone(600, 'square', 0.1, 0.5, 200); }
  public playHit() { this.playTone(100, 'sawtooth', 0.1, 0.8, 50); }
  public playCoin() { 
      this.playTone(1200, 'sine', 0.1, 0.6);
      setTimeout(() => this.playTone(1800, 'sine', 0.2, 0.6), 50);
  }
  public playCook() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.5; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }
  public playPlant() { this.playTone(300, 'triangle', 0.2, 0.5, 400); }
  public playUltimate() {
    this.playTone(100, 'sawtooth', 1.5, 1, 800);
    setTimeout(() => this.playTone(50, 'square', 1.0, 1), 200);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.5, 1, 50), 500);
  }

  // New Sound: Cinematic Intro Boom
  public playLogoIntro() {
      if (this.isMuted) return;
      this.init();
      // Deep Boom
      this.playTone(100, 'sine', 1.5, 0.8, 30);
      // High shimmer
      setTimeout(() => this.playTone(800, 'triangle', 0.5, 0.2, 1200), 100);
      // Noise burst impact
      this.playCook();
  }
}

export const soundManager = new SoundManager();
