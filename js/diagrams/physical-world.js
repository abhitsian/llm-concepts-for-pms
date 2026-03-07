// physical-world.js — Virtual vs physical world split
// Disruption wave destroys virtual-world dots, bounces off physical-world dots

function PhysicalWorldDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var phase = B.easeOut(B.clamp(t / 0.8, 0, 1));

    // Title
    B.drawLabel(ctx, 'physical world moat', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Divider line (horizontal, middle)
    var divY = h * 0.48;
    B.drawLine(ctx, { x: w * 0.08, y: divY }, { x: w * 0.92, y: divY },
      wA(P.white, 0.12), 1, [6, 6]);

    // Section labels
    B.drawLabel(ctx, 'VIRTUAL WORLD', { x: w * 0.5, y: h * 0.13 },
      wA(P.white, 0.35), '10px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'PHYSICAL WORLD', { x: w * 0.5, y: h * 0.54 },
      wA(P.white, 0.35), '10px "JetBrains Mono", monospace', 'center');

    // === Disruption wave (purple, sweeps left to right) ===
    var wavePhase = B.clamp((phase - 0.2) / 0.5, 0, 1);
    var waveX = w * 0.05 + wavePhase * w * 0.9;

    if (wavePhase > 0 && wavePhase < 1) {
      // Vertical wave line
      ctx.save();
      ctx.strokeStyle = wA(P.purple, 0.4);
      ctx.lineWidth = 2;
      ctx.shadowColor = P.purple;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      // Wavy line
      for (var wy = h * 0.1; wy < h * 0.9; wy += 2) {
        var wOff = Math.sin(wy * 0.08 + time * 3) * 4;
        if (wy === h * 0.1) ctx.moveTo(waveX + wOff, wy);
        else ctx.lineTo(waveX + wOff, wy);
      }
      ctx.stroke();
      ctx.restore();

      // Wave glow band
      ctx.save();
      var grad = ctx.createLinearGradient(waveX - 20, 0, waveX + 20, 0);
      grad.addColorStop(0, wA(P.purple, 0));
      grad.addColorStop(0.5, wA(P.purple, 0.06));
      grad.addColorStop(1, wA(P.purple, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(waveX - 20, h * 0.1, 40, h * 0.8);
      ctx.restore();
    }

    // === Virtual world dots (top half, fading when wave passes) ===
    var virtualDots = [
      { label: 'Chegg', x: w * 0.25, y: h * 0.28, color: P.coral },
      { label: 'Stack Overflow', x: w * 0.5, y: h * 0.22, color: P.yellow },
      { label: 'Buzzfeed', x: w * 0.72, y: h * 0.32, color: P.coral }
    ];

    for (var vi = 0; vi < virtualDots.length; vi++) {
      var vd = virtualDots[vi];
      // Fade when wave passes this dot
      var waveHit = waveX > vd.x;
      var fadeOut = waveHit ? B.easeOut(B.clamp((waveX - vd.x) / (w * 0.15), 0, 1)) : 0;
      var dotAlpha = 1 - fadeOut * 0.85;
      var dotRadius = B.lerp(9, 3, fadeOut);
      var dotGlow = B.lerp(10, 0, fadeOut);

      // Glitchy effect before wave hits
      var glitchOff = 0;
      if (!waveHit && wavePhase > 0 && Math.abs(waveX - vd.x) < w * 0.15) {
        glitchOff = Math.sin(time * 20 + vi * 5) * 3;
      }

      B.drawDot(ctx, { x: vd.x + glitchOff, y: vd.y }, dotRadius,
        wA(vd.color, dotAlpha * 0.6), dotGlow);
      B.drawLabel(ctx, vd.label, { x: vd.x + glitchOff, y: vd.y + dotRadius + 10 },
        wA(vd.color, dotAlpha * 0.7), '9px "JetBrains Mono", monospace', 'center');

      // "X" mark after destruction
      if (fadeOut > 0.7) {
        var xAlpha = B.clamp((fadeOut - 0.7) / 0.3, 0, 1);
        B.drawLine(ctx,
          { x: vd.x - 6, y: vd.y - 6 }, { x: vd.x + 6, y: vd.y + 6 },
          wA(P.coral, xAlpha * 0.4), 1.5);
        B.drawLine(ctx,
          { x: vd.x + 6, y: vd.y - 6 }, { x: vd.x - 6, y: vd.y + 6 },
          wA(P.coral, xAlpha * 0.4), 1.5);
      }
    }

    // Unstable/glitchy background in virtual section
    if (phase > 0.1) {
      ctx.save();
      ctx.fillStyle = wA(P.coral, 0.015);
      // Random flicker rectangles
      var flickerSeed = Math.floor(time * 8);
      for (var fi = 0; fi < 3; fi++) {
        var fx = (Math.sin(flickerSeed + fi * 3.7) * 0.5 + 0.5) * w * 0.8 + w * 0.1;
        var fy = h * 0.1 + (Math.cos(flickerSeed + fi * 2.3) * 0.5 + 0.5) * (divY - h * 0.12);
        ctx.fillRect(fx, fy, 30 + fi * 10, 2);
      }
      ctx.restore();
    }

    // === Physical world dots (bottom half, brightening when wave passes) ===
    var physicalDots = [
      { label: 'Uber', x: w * 0.25, y: h * 0.68, color: P.teal },
      { label: 'DoorDash', x: w * 0.48, y: h * 0.74, color: P.green },
      { label: 'Walmart', x: w * 0.72, y: h * 0.66, color: P.blue }
    ];

    for (var pi = 0; pi < physicalDots.length; pi++) {
      var pd = physicalDots[pi];
      // Brighten when wave passes (enhanced, not destroyed)
      var pWaveHit = waveX > pd.x;
      var enhance = pWaveHit ? B.easeOut(B.clamp((waveX - pd.x) / (w * 0.12), 0, 1)) : 0;
      var pDotAlpha = 0.5 + enhance * 0.5;
      var pDotRadius = 9 + enhance * 5;
      var pDotGlow = 6 + enhance * 20;

      B.drawDot(ctx, { x: pd.x, y: pd.y }, pDotRadius,
        wA(pd.color, pDotAlpha), pDotGlow);

      // Extra glow ring when enhanced
      if (enhance > 0.5) {
        var ringAlpha = B.clamp((enhance - 0.5) / 0.5, 0, 1);
        B.drawDot(ctx, { x: pd.x, y: pd.y }, pDotRadius + 6,
          wA(pd.color, ringAlpha * 0.1), ringAlpha * 15);
      }

      B.drawLabel(ctx, pd.label, { x: pd.x, y: pd.y + pDotRadius + 10 },
        wA(pd.color, pDotAlpha * 0.9), '10px "JetBrains Mono", monospace', 'center');

      // Shield bounce effect when wave hits
      if (pWaveHit && enhance < 0.8 && enhance > 0.1) {
        var bounceAlpha = B.clamp(enhance * 2, 0, 0.5);
        // Small arc on the left side of dot
        ctx.save();
        ctx.strokeStyle = wA(P.purple, bounceAlpha);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pd.x, pd.y, pDotRadius + 8, Math.PI * 0.7, Math.PI * 1.3);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Solid background hint in physical section
    if (phase > 0.3) {
      var solidAlpha = B.clamp((phase - 0.3) / 0.4, 0, 1) * 0.02;
      ctx.save();
      ctx.fillStyle = wA(P.teal, solidAlpha);
      ctx.fillRect(w * 0.05, divY + 8, w * 0.9, h * 0.38);
      ctx.restore();
    }

    // === "atoms > bits" label ===
    if (t > 0.6) {
      var labelAlpha = B.easeOut(B.clamp((t - 0.6) / 0.15, 0, 1));
      B.drawLabel(ctx, 'atoms > bits', { x: w * 0.5, y: h * 0.88 },
        wA(P.teal, labelAlpha * 0.8), 'bold 14px "JetBrains Mono", monospace', 'center');
    }

    // Bottom insight
    if (t > 0.75) {
      var insAlpha = B.easeOut(B.clamp((t - 0.75) / 0.15, 0, 1));
      B.drawLabel(ctx, 'AI disrupts bits easily \u2014 atoms fight back',
        { x: w * 0.5, y: h * 0.94 },
        wA(P.white, insAlpha * 0.4), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
