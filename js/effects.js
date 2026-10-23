// Optional juice: key sounds and a burst of confetti. Both are off by default.

let audio = null;

// A short synthesized tick. Mistakes play a lower, softer tone.
export function keySound(ok) {
  try {
    audio ??= new AudioContext();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(ok ? 1400 + Math.random() * 200 : 220, t);
    gain.gain.setValueAtTime(ok ? 0.05 : 0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.04 : 0.09));
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch (err) {
    console.warn("[effects] audio unavailable", err);
  }
}

export function confetti(colors) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const bits = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2,
    y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 12 - 3,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    size: 5 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (now) => {
    const life = (now - start) / 1600;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - life);
    for (const b of bits) {
      b.vy += 0.35;
      b.vx *= 0.99;
      b.x += b.vx;
      b.y += b.vy;
      b.r += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.r);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.restore();
    }
    if (life < 1) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
