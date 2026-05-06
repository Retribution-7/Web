import "../../src/scripts/preloader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryItem {
  src: string;
  alt: string;
  waveType: OscillatorType;
  frequency: number;
  duration: number;
}

// ─── Image → Sound mapping ────────────────────────────────────────────────────
// Each item has a unique (waveType, frequency) pair — no duplicates.

const ITEMS: GalleryItem[] = [
  { src: "/backgrounds/projects/project-1.png",                 alt: "Project 1",          waveType: "sine",     frequency: 261, duration: 1.2 },
  { src: "/backgrounds/projects/project-2.png",                 alt: "Project 2",          waveType: "sine",     frequency: 293, duration: 1.2 },
  { src: "/backgrounds/projects/project-3.png",                 alt: "Project 3",          waveType: "sine",     frequency: 329, duration: 1.2 },
  { src: "/backgrounds/wrapper-img.png",                        alt: "Wrapper",            waveType: "triangle", frequency: 349, duration: 1.0 },
  { src: "/backgrounds/quote-bg.png",                           alt: "Quote background",   waveType: "triangle", frequency: 392, duration: 1.0 },
  { src: "/images/blog/blog-1.svg",                             alt: "Blog post 1",        waveType: "square",   frequency: 440, duration: 0.7 },
  { src: "/images/blog/blog-2.svg",                             alt: "Blog post 2",        waveType: "square",   frequency: 493, duration: 0.7 },
  { src: "/images/blog/blog-3.svg",                             alt: "Blog post 3",        waveType: "sawtooth", frequency: 523, duration: 0.8 },
  { src: "/images/blog/blog-4.svg",                             alt: "Blog post 4",        waveType: "sawtooth", frequency: 587, duration: 0.8 },
  { src: "/images/about-us.svg",                                alt: "About us",           waveType: "sine",     frequency: 659, duration: 1.4 },
  { src: "/images/why-choose-us/why-choose-us-first.svg",       alt: "Why choose us 1",   waveType: "triangle", frequency: 698, duration: 1.1 },
  { src: "/images/why-choose-us/why-choose-us-second.svg",      alt: "Why choose us 2",   waveType: "sawtooth", frequency: 784, duration: 0.9 },
];

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const imgEl        = document.getElementById("gallery-img")      as HTMLImageElement;
const indicator    = document.getElementById("gallery-indicator") as HTMLDivElement;
const counter      = document.getElementById("gallery-counter")   as HTMLDivElement;
const btnPrev      = document.getElementById("btn-prev")          as HTMLButtonElement;
const btnRandom    = document.getElementById("btn-random")        as HTMLButtonElement;
const btnNext      = document.getElementById("btn-next")          as HTMLButtonElement;
const volumeSlider = document.getElementById("volume-slider")     as HTMLInputElement;
const volumeValue  = document.getElementById("volume-value")      as HTMLSpanElement;
const volumeIcon   = document.getElementById("volume-icon")       as HTMLSpanElement;

// ─── Audio state ──────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let currentSource: OscillatorNode | null = null;

function getAudioCtx(): { ctx: AudioContext; gain: GainNode } {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = Number(volumeSlider.value);
    gainNode.connect(audioCtx.destination);
  }
  return { ctx: audioCtx, gain: gainNode! };
}

function stopCurrent(): void {
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
    currentSource = null;
  }
}

function updateIndicator(playing: boolean): void {
  indicator.textContent = playing ? "▶ Playing" : "⏸ Stopped";
  indicator.classList.toggle("is-playing", playing);
}

function playItem(index: number): void {
  stopCurrent();
  const item = ITEMS[index];
  const { ctx, gain } = getAudioCtx();

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  osc.type = item.waveType;
  osc.frequency.value = item.frequency;
  osc.connect(gain);
  currentSource = osc;
  updateIndicator(true);

  osc.onended = () => {
    currentSource = null;
    updateIndicator(false);
  };

  osc.start();
  osc.stop(ctx.currentTime + item.duration);
}

// ─── Gallery state ────────────────────────────────────────────────────────────

let currentIndex = 0;

function updateCounter(): void {
  counter.textContent = `${currentIndex + 1} / ${ITEMS.length}`;
}

function showItem(index: number): void {
  currentIndex = index;
  updateCounter();

  imgEl.classList.add("is-transitioning");
  setTimeout(() => {
    imgEl.src = ITEMS[index].src;
    imgEl.alt = ITEMS[index].alt;
    imgEl.classList.remove("is-transitioning");
  }, 200);

  playItem(index);
}

function showRandom(): void {
  let next: number;
  do {
    next = Math.floor(Math.random() * ITEMS.length);
  } while (next === currentIndex && ITEMS.length > 1);
  showItem(next);
}

function showPrev(): void {
  showItem((currentIndex - 1 + ITEMS.length) % ITEMS.length);
}

function showNext(): void {
  showItem((currentIndex + 1) % ITEMS.length);
}

// ─── Volume control ───────────────────────────────────────────────────────────

function updateVolumeDisplay(value: number): void {
  const pct = Math.round(value * 100);
  volumeValue.textContent = `${pct}%`;
  volumeIcon.textContent = value === 0 ? "🔇" : value < 0.4 ? "🔉" : "🔊";
}

volumeSlider.addEventListener("input", () => {
  const value = Number(volumeSlider.value);
  updateVolumeDisplay(value);
  if (gainNode) gainNode.gain.value = value;
});

// ─── Button triggers ──────────────────────────────────────────────────────────

btnPrev.addEventListener("click", showPrev);
btnRandom.addEventListener("click", showRandom);
btnNext.addEventListener("click", showNext);

// ─── Keyboard triggers ────────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return; // don't hijack slider focus

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      showPrev();
      break;
    case "ArrowRight":
      e.preventDefault();
      showNext();
      break;
    case " ":
      e.preventDefault();
      playItem(currentIndex);
      break;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

updateCounter();
updateVolumeDisplay(Number(volumeSlider.value));
