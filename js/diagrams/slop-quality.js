// slop-quality.js — Signal-to-noise visualization of AI-generated slop
// Quality content degrades as generic filler accumulates

function SlopQualityDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  // Deterministic noise generator
  function noise(x, seed) {
    var v = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.08, my = h * 0.08;
    var usableW = w - mx * 2;
    var cy = h * 0.42;
    var ampBase = h * 0.08;

    var t = (time % CYCLE) / CYCLE;
    var progress = B.easeInOut(B.clamp(t / 0.75, 0, 1));

    // --- Zone boundaries ---
    var zone1 = 0.3, zone2 = 0.65;

    // Zone background shading
    var zones = [
      { start: 0, end: zone1, color: P.teal, label: 'human-written' },
      { start: zone1, end: zone2, color: P.yellow, label: 'AI-assisted' },
      { start: zone2, end: 1, color: P.coral, label: 'AI-generated slop' }
    ];
    for (var z = 0; z < zones.length; z++) {
      var zs = zones[z];
      var x0 = mx + usableW * zs.start, x1 = mx + usableW * Math.min(zs.end, progress);
      if (x1 > x0) {
        ctx.save();
        ctx.fillStyle = wA(zs.color, 0.04);
        ctx.fillRect(x0, cy - h * 0.2, x1 - x0, h * 0.4);
        ctx.restore();
        // Zone label at top
        var labelX = (x0 + Math.min(mx + usableW * zs.end, x1)) / 2;
        var labelA = B.clamp((progress - zs.start) / 0.15, 0, 1);
        B.drawLabel(ctx, zs.label, { x: labelX, y: cy - h * 0.22 },
          wA(zs.color, labelA * 0.6), '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // Zone divider lines
    if (progress > zone1) {
      B.drawLine(ctx, { x: mx + usableW * zone1, y: cy - h * 0.2 },
        { x: mx + usableW * zone1, y: cy + h * 0.2 }, wA(P.white, 0.1), 1, [3, 5]);
    }
    if (progress > zone2) {
      B.drawLine(ctx, { x: mx + usableW * zone2, y: cy - h * 0.2 },
        { x: mx + usableW * zone2, y: cy + h * 0.2 }, wA(P.white, 0.1), 1, [3, 5]);
    }

    // --- Clean signal curve (teal) ---
    var sigSteps = 120;
    ctx.save();
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = wA(P.teal, 0.7);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= sigSteps; i++) {
      var frac = i / sigSteps;
      if (frac > progress) break;
      var x = mx + usableW * frac;
      var sig = Math.sin(frac * Math.PI * 3 + 0.5) * ampBase * 0.8;
      // Signal fades in noisy zone
      var sigStrength = 1 - B.clamp((frac - zone1) / (1 - zone1), 0, 0.7);
      var y = cy + sig * sigStrength;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // --- Noise overlay (coral) — increases left to right ---
    ctx.save();
    ctx.shadowColor = P.coral;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = wA(P.coral, 0.6);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    var started = false;
    for (var i = 0; i <= sigSteps; i++) {
      var frac = i / sigSteps;
      if (frac > progress) break;
      var noiseAmt = B.clamp((frac - 0.15) / 0.85, 0, 1);
      if (noiseAmt <= 0) continue;
      var x = mx + usableW * frac;
      var sig = Math.sin(frac * Math.PI * 3 + 0.5) * ampBase * 0.8;
      var sigStrength = 1 - B.clamp((frac - zone1) / (1 - zone1), 0, 0.7);
      var n = (noise(frac * 40, 1) - 0.5) * 2 * ampBase * noiseAmt * 1.4;
      // Curlicue perturbations
      n += Math.sin(frac * 50 + time * 2) * ampBase * 0.3 * noiseAmt;
      var y = cy + sig * sigStrength + n;
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // --- Slop pattern markers ---
    var markers = [
      { frac: 0.45, text: 'filler phrases' },
      { frac: 0.58, text: 'hedge words' },
      { frac: 0.78, text: 'empty transitions' }
    ];
    for (var m = 0; m < markers.length; m++) {
      var mk = markers[m];
      if (progress > mk.frac) {
        var mA = B.clamp((progress - mk.frac) / 0.1, 0, 1);
        var mx2 = mx + usableW * mk.frac;
        B.drawLine(ctx, { x: mx2, y: cy + h * 0.12 }, { x: mx2, y: cy + h * 0.16 },
          wA(P.coral, mA * 0.5), 1);
        B.drawLabel(ctx, mk.text, { x: mx2, y: cy + h * 0.19 },
          wA(P.coral, mA * 0.5), '8px "JetBrains Mono", monospace', 'center');
      }
    }

    // --- Trust meter ---
    var meterX = mx, meterY = h * 0.76, meterW = usableW, meterH = 12;
    var trustVal = B.clamp(1 - progress * 0.65, 0.35, 1);
    var trustColor = trustVal > 0.6 ? P.teal : (trustVal > 0.45 ? P.yellow : P.coral);

    // Background
    ctx.save();
    ctx.strokeStyle = wA(P.white, 0.12);
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY, meterW, meterH);
    // Fill
    ctx.fillStyle = wA(trustColor, 0.5);
    ctx.fillRect(meterX, meterY, meterW * trustVal, meterH);
    ctx.restore();

    B.drawLabel(ctx, 'trust: ' + Math.round(trustVal * 100) + '%',
      { x: meterX + meterW + 8, y: meterY + meterH / 2 },
      wA(trustColor, 0.8), '10px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, 'trust meter', { x: meterX, y: meterY - 8 },
      wA(P.white, 0.35), '9px "JetBrains Mono", monospace', 'left');

    // --- Formula ---
    if (progress > 0.4) {
      var fA = B.clamp((progress - 0.4) / 0.2, 0, 1);
      B.drawLabel(ctx, 'trust = signal / (signal + noise)',
        { x: w * 0.5, y: h * 0.93 },
        wA(P.yellow, fA * 0.6), '10px "JetBrains Mono", monospace', 'center');
    }

    // Legend
    B.drawDot(ctx, { x: mx, y: cy }, 4, wA(P.white, 0.8), 10);
    B.drawLabel(ctx, 'signal-to-noise ratio', { x: mx, y: my },
      wA(P.white, 0.35), '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
