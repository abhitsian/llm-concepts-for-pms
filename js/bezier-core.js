// bezier-core.js — Shared Bézier curve utilities
// Inspired by Freya Holmér's "The Beauty of Bézier Curves"

const Bezier = (() => {
  // --- Math ---
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpPt(p0, p1, t) { return { x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) }; }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Evaluate cubic Bézier at t
  function cubicPt(p0, p1, p2, p3, t) {
    const a = lerpPt(p0, p1, t);
    const b = lerpPt(p1, p2, t);
    const c = lerpPt(p2, p3, t);
    const d = lerpPt(a, b, t);
    const e = lerpPt(b, c, t);
    return lerpPt(d, e, t);
  }

  // Evaluate quadratic Bézier at t
  function quadPt(p0, p1, p2, t) {
    const a = lerpPt(p0, p1, t);
    const b = lerpPt(p1, p2, t);
    return lerpPt(a, b, t);
  }

  // De Casteljau construction points for cubic
  function deCasteljau(p0, p1, p2, p3, t) {
    const a = lerpPt(p0, p1, t);
    const b = lerpPt(p1, p2, t);
    const c = lerpPt(p2, p3, t);
    const d = lerpPt(a, b, t);
    const e = lerpPt(b, c, t);
    const f = lerpPt(d, e, t);
    return { l1: [a, b, c], l2: [d, e], pt: f };
  }

  // --- Colors ---
  const palette = {
    bg:       '#0a0a0f',
    teal:     '#4ecdc4',
    coral:    '#ff6b6b',
    yellow:   '#ffd93d',
    green:    '#6bcb77',
    blue:     '#4d96ff',
    purple:   '#b07aff',
    white:    '#e8e8e8',
    dim:      'rgba(255,255,255,0.15)',
    dimmer:   'rgba(255,255,255,0.06)',
    gridLine: 'rgba(255,255,255,0.04)',
    text:     'rgba(255,255,255,0.7)',
    textDim:  'rgba(255,255,255,0.35)',
  };

  function withAlpha(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // --- Drawing ---
  function initCanvas(canvas, container) {
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w: rect.width, h: rect.height };
  }

  function clear(ctx, w, h) {
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);
  }

  function drawGrid(ctx, w, h, spacing = 40) {
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 1;
    for (let x = spacing; x < w; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  function drawCurve(ctx, points, steps, color, width, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let pt;
      if (points.length === 4) pt = cubicPt(points[0], points[1], points[2], points[3], t);
      else if (points.length === 3) pt = quadPt(points[0], points[1], points[2], t);
      else pt = lerpPt(points[0], points[1], t);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawDot(ctx, pt, radius, color, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRing(ctx, pt, radius, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawLine(ctx, a, b, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawLabel(ctx, text, pt, color, font, align) {
    ctx.save();
    ctx.fillStyle = color || palette.text;
    ctx.font = font || '11px "JetBrains Mono", monospace';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pt.x, pt.y);
    ctx.restore();
  }

  function drawConstructionLines(ctx, p0, p1, p2, p3, t, color) {
    const dc = deCasteljau(p0, p1, p2, p3, t);
    const dimColor = withAlpha(color, 0.25);
    const midColor = withAlpha(color, 0.5);
    // Level 1 lines
    drawLine(ctx, dc.l1[0], dc.l1[1], dimColor, 1);
    drawLine(ctx, dc.l1[1], dc.l1[2], dimColor, 1);
    // Level 2 lines
    drawLine(ctx, dc.l2[0], dc.l2[1], midColor, 1);
    // Level 1 points
    dc.l1.forEach(p => drawDot(ctx, p, 3, dimColor));
    // Level 2 points
    dc.l2.forEach(p => drawDot(ctx, p, 3, midColor));
    // Final point
    drawDot(ctx, dc.pt, 5, color, 10);
  }

  function drawControlPoints(ctx, points, color) {
    const dimColor = withAlpha(color, 0.3);
    // Lines between control points
    for (let i = 0; i < points.length - 1; i++) {
      drawLine(ctx, points[i], points[i+1], dimColor, 1, [4, 4]);
    }
    // Points
    points.forEach((p, i) => {
      if (i === 0 || i === points.length - 1) {
        drawDot(ctx, p, 4, color);
      } else {
        drawRing(ctx, p, 4, color, 1.5);
      }
    });
  }

  // --- Animation ---
  function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function easeIn(t) { return t * t; }
  function pingPong(t) { return t < 0.5 ? t * 2 : 2 - t * 2; }

  // Create an animation loop with automatic DPR handling
  function animate(canvas, container, drawFn) {
    let raf;
    let running = true;
    let { ctx, w, h } = initCanvas(canvas, container);

    function frame(time) {
      if (!running) return;
      drawFn(ctx, w, h, time / 1000);
      raf = requestAnimationFrame(frame);
    }

    function resize() {
      ({ ctx, w, h } = initCanvas(canvas, container));
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    raf = requestAnimationFrame(frame);

    return {
      stop() { running = false; cancelAnimationFrame(raf); ro.disconnect(); },
      resize
    };
  }

  return {
    lerp, lerpPt, dist, clamp,
    cubicPt, quadPt, deCasteljau,
    palette, withAlpha,
    initCanvas, clear, drawGrid,
    drawCurve, drawDot, drawRing, drawLine, drawLabel,
    drawConstructionLines, drawControlPoints,
    easeInOut, easeOut, easeIn, pingPong,
    animate
  };
})();
