// productivity-scale.js — Multiplier visualization with horizontal bars
// Multiple companies showing productivity gains, bars fill left to right

function ProductivityScaleDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var phase = B.easeOut(B.clamp(t / 0.75, 0, 1));

    // Title
    B.drawLabel(ctx, 'productivity at scale', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    var mx = w * 0.32;
    var barAreaW = w * 0.58;
    var startY = h * 0.16;
    var barH = 18;
    var barGap = 14;

    var bars = [
      { label: 'Walmart catalog', stat: '100x', frac: 1.0, color: P.teal, delay: 0 },
      { label: 'Google code', stat: '30%', frac: 0.30, color: P.blue, delay: 0.08 },
      { label: 'Slack msgs', stat: '600M summarized', frac: 0.60, color: P.purple, delay: 0.16 },
      { label: 'Duolingo content', stat: '4-5x', frac: 0.45, color: P.green, delay: 0.24 },
      { label: 'Twilio leads', stat: '80% AI-handled', frac: 0.80, color: P.coral, delay: 0.32 }
    ];

    var totalBarHeight = bars.length * (barH + barGap) - barGap;
    var centerOffY = (h - totalBarHeight) / 2 - startY;
    if (centerOffY < 0) centerOffY = 0;
    var bStartY = startY + centerOffY * 0.3;

    for (var bi = 0; bi < bars.length; bi++) {
      var bar = bars[bi];
      var by = bStartY + bi * (barH + barGap);
      var barPhase = B.easeOut(B.clamp((phase - bar.delay) / (0.7 - bar.delay), 0, 1));

      // Label (left side)
      var labelAlpha = B.clamp(barPhase * 2, 0, 1);
      B.drawLabel(ctx, bar.label, { x: mx - 8, y: by + barH / 2 + 1 },
        wA(P.white, labelAlpha * 0.7), '10px "JetBrains Mono", monospace', 'right');

      // Background track
      ctx.save();
      ctx.fillStyle = wA(P.white, 0.04);
      ctx.fillRect(mx, by, barAreaW, barH);
      ctx.restore();

      // Filled bar (animates left to right)
      var fillW = barAreaW * bar.frac * barPhase;
      if (fillW > 0) {
        ctx.save();
        ctx.fillStyle = wA(bar.color, 0.45);
        ctx.shadowColor = bar.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(mx, by, fillW, barH);
        ctx.restore();

        // Brighter edge
        ctx.save();
        ctx.fillStyle = wA(bar.color, 0.7);
        ctx.fillRect(mx + fillW - 2, by, 2, barH);
        ctx.restore();

        // Glow at leading edge
        if (barPhase < 1) {
          B.drawDot(ctx, { x: mx + fillW, y: by + barH / 2 }, 3, bar.color, 10);
        }
      }

      // Stat label (right of bar)
      if (barPhase > 0.5) {
        var statAlpha = B.clamp((barPhase - 0.5) / 0.3, 0, 1);
        B.drawLabel(ctx, bar.stat, { x: mx + fillW + 10, y: by + barH / 2 + 1 },
          wA(bar.color, statAlpha * 0.9), 'bold 10px "JetBrains Mono", monospace', 'left');
      }
    }

    // Scale reference at bottom
    if (phase > 0.6) {
      var scaleAlpha = B.easeOut(B.clamp((phase - 0.6) / 0.2, 0, 1));
      var scaleY = bStartY + bars.length * (barH + barGap) + 20;

      // Tick marks
      var ticks = ['0%', '25%', '50%', '75%', '100%'];
      for (var ti = 0; ti < ticks.length; ti++) {
        var tx = mx + barAreaW * (ti / (ticks.length - 1));
        B.drawLine(ctx, { x: tx, y: scaleY }, { x: tx, y: scaleY + 4 },
          wA(P.white, scaleAlpha * 0.2), 1);
        B.drawLabel(ctx, ticks[ti], { x: tx, y: scaleY + 14 },
          wA(P.white, scaleAlpha * 0.25), '7px "JetBrains Mono", monospace', 'center');
      }

      B.drawLine(ctx, { x: mx, y: scaleY }, { x: mx + barAreaW, y: scaleY },
        wA(P.white, scaleAlpha * 0.15), 1);
    }

    // Bottom insight
    if (t > 0.7) {
      var insAlpha = B.easeOut(B.clamp((t - 0.7) / 0.15, 0, 1));
      B.drawLabel(ctx, 'AI is not a pilot anymore \u2014 it is production infrastructure',
        { x: w * 0.5, y: h * 0.90 },
        wA(P.white, insAlpha * 0.45), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
