import { get } from 'svelte/store';
import { soundEnabled, soundVolume, soundStyle, musicEnabled, musicVolume, ambientTrack } from '../stores/dojo-store.js';

let audioCtx = null;
let ambientInterval = null;
let currentNotesSource = []; // track active oscillators for smooth stopping
let ambientBeatCount = 0;
let masterCompressor = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Safely catch autoplay block warnings
    });
  }
  return audioCtx;
}

// Global user-gesture handler to resume AudioContext automatically on first interaction
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
      }).catch(() => {});
    }
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
}

function getMasterCompressor(ctx) {
  if (!masterCompressor) {
    masterCompressor = ctx.createDynamicsCompressor();
    masterCompressor.connect(ctx.destination);
  }
  return masterCompressor;
}

// Play sound effects based on style & volume
export function playSuccessChime() {
  if (!get(soundEnabled)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const volume = get(soundVolume);
  const style = get(soundStyle);

  let frequencies = [523.25, 659.25, 783.99, 1046.50]; // Dojo standard C-major
  let oscType = 'sine';

  if (style === 'arcade') {
    frequencies = [587.33, 880.00, 1174.66, 1760.00]; // Arcade major 6th chord
    oscType = 'square';
  } else if (style === 'cyberpunk') {
    frequencies = [440.00, 554.37, 659.25, 987.77]; // Cyber minor 9th feel
    oscType = 'sawtooth';
  } else if (style === 'retro') {
    frequencies = [523.25, 783.99, 1046.50];
    oscType = 'triangle';
  }

  const dest = getMasterCompressor(ctx);

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
    
    gain.gain.setValueAtTime(0, now + idx * 0.06);
    gain.gain.linearRampToValueAtTime(volume * 0.15, now + idx * 0.06 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);
    
    osc.connect(gain);
    gain.connect(dest);
    
    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.4);
    
    currentNotesSource.push(osc);
    osc.onended = () => {
      currentNotesSource = currentNotesSource.filter(node => node !== osc);
    };
  });
}

export function playLevelUpFanfare() {
  if (!get(soundEnabled)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const volume = get(soundVolume);
  const style = get(soundStyle);

  const chords = [
    [261.63, 329.63, 392.00], // C4
    [349.23, 440.00, 523.25], // F4
    [392.00, 493.88, 587.33], // G4
    [523.25, 659.25, 783.99, 1046.50] // C5
  ];

  let oscType = style === 'arcade' ? 'square' : style === 'cyberpunk' ? 'sawtooth' : 'triangle';
  const dest = getMasterCompressor(ctx);

  chords.forEach((chord, chordIdx) => {
    const startTime = now + chordIdx * 0.22;
    const duration = chordIdx === 3 ? 0.75 : 0.18;
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.12, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(dest);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
      
      currentNotesSource.push(osc);
      osc.onended = () => {
        currentNotesSource = currentNotesSource.filter(node => node !== osc);
      };
    });
  });
}

export function playErrorBuzz() {
  if (!get(soundEnabled)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const volume = get(soundVolume);
  const style = get(soundStyle);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const dest = getMasterCompressor(ctx);

  osc.type = style === 'arcade' ? 'square' : style === 'cyberpunk' ? 'sawtooth' : 'sawtooth';
  osc.frequency.setValueAtTime(style === 'cyberpunk' ? 120 : 160, now);
  osc.frequency.linearRampToValueAtTime(style === 'cyberpunk' ? 80 : 110, now + 0.22);

  gain.gain.setValueAtTime(volume * 0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(now);
  osc.stop(now + 0.25);
  
  currentNotesSource.push(osc);
  osc.onended = () => {
    currentNotesSource = currentNotesSource.filter(node => node !== osc);
  };
}

// Procedural Ambient Music Synthesizer (Item 193)
export function startAmbientSynth() {
  if (typeof window === 'undefined') return;
  stopAmbientSynth();

  if (!get(musicEnabled)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  ambientBeatCount = 0;
  
  // Schedule a beat step every 400ms
  ambientInterval = setInterval(() => {
    if (!get(musicEnabled)) {
      stopAmbientSynth();
      return;
    }
    triggerAmbientStep(ctx);
  }, 400);
}

export function stopAmbientSynth() {
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
  // Stop any lingering oscillators
  currentNotesSource.forEach(node => {
    try {
      node.stop();
    } catch (e) {}
  });
  currentNotesSource = [];
}

// Run a single tick of the backing track loop
function triggerAmbientStep(ctx) {
  const now = ctx.currentTime;
  const track = get(ambientTrack);
  const vol = get(musicVolume) * 0.08; // safety cap
  const dest = getMasterCompressor(ctx);

  if (track === 'zen') {
    // Zero rhythm, floating warm drone chords every 8 beats
    if (ambientBeatCount % 8 === 0) {
      const chords = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [349.23, 440.00, 523.25, 587.33], // Fmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [293.66, 349.23, 440.00, 523.25]  // Dm7
      ];
      const selected = chords[Math.floor(ambientBeatCount / 8) % chords.length];
      selected.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol * 0.8, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
        
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 3.25);
        
        currentNotesSource.push(osc);
        osc.onended = () => {
          currentNotesSource = currentNotesSource.filter(node => node !== osc);
        };
      });
    }
  } else if (track === 'lofi') {
    // Lofi beat: soft tick on every beat, warm chord on every 4 beats, soft bass note
    // Soft hihat noise burst
    if (vol > 0) {
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(vol * 0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.connect(noiseGain);
      noiseGain.connect(dest);
      noise.start(now);
      
      currentNotesSource.push(noise);
      noise.onended = () => {
        currentNotesSource = currentNotesSource.filter(node => node !== noise);
      };
    }

    // Chord every 4 beats
    if (ambientBeatCount % 4 === 0) {
      const lofiChords = [
        [164.81, 261.63, 329.63, 392.00], // Em7 feel
        [146.83, 220.00, 293.66, 349.23]  // Dm7 feel
      ];
      const chord = lofiChords[Math.floor(ambientBeatCount / 4) % lofiChords.length];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 1.6);
        
        currentNotesSource.push(osc);
        osc.onended = () => {
          currentNotesSource = currentNotesSource.filter(node => node !== osc);
        };
      });
    }
  } else if (track === 'synthwave') {
    // Arpeggiated bass line on every beat, saw chord swells every 4 beats
    const bassScale = [110.00, 130.81, 146.83, 164.81]; // A2, C3, D3, E3
    const bassFreq = bassScale[ambientBeatCount % bassScale.length];
    
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    
    bassGain.gain.setValueAtTime(vol * 0.5, now);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    
    bassOsc.connect(bassGain);
    bassGain.connect(dest);
    bassOsc.start(now);
    bassOsc.stop(now + 0.38);
    
    currentNotesSource.push(bassOsc);
    bassOsc.onended = () => {
      currentNotesSource = currentNotesSource.filter(node => node !== bassOsc);
    };

    if (ambientBeatCount % 4 === 0) {
      const synthChords = [
        [220.00, 277.18, 329.63], // A-major
        [261.63, 329.63, 392.00]  // C-major
      ];
      const chord = synthChords[Math.floor(ambientBeatCount / 4) % synthChords.length];
      chord.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 1.3);
        
        currentNotesSource.push(osc);
        osc.onended = () => {
          currentNotesSource = currentNotesSource.filter(node => node !== osc);
        };
      });
    }
  }

  ambientBeatCount = (ambientBeatCount + 1) % 32;
}
