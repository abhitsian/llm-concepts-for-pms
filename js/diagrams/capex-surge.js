// capex-surge.js — Stacking bars showing capex by company
// Meta, Amazon, Microsoft, Google stacking up. NVIDIA chip at bottom.

function CapexSurgeDiagram(canvas, container) {
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
    B.drawLabel(ctx, 'the capex surge', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Bar chart area
    var mx = w * 0.15;
    var barAreaW = w * 0.55;
    var barBaseY = h * 0.78;
    var maxBarH = h * 0.58;

    // Companies as stacked segments (total ~$320B)
    var segments = [
      { label: 'Meta', value: 65, color: P.blue, delay: 0 },
      { label: 'Google', value: 75, color: P.purple, delay: 0.1 },
      { label: 'Microsoft', value: 80, color: P.green, delay: 0.2 },
      { label: 'Amazon', value: 100, color: P.coral, delay: 0.3 }
    ];

    var totalValue = 0;
    for (var si = 0; si < segments.length; si++) totalValue += segments[si].value;

    // Y-axis
    B.drawLine(ctx, { x: mx, y: barBaseY }, { x: mx, y: barBaseY - maxBarH },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: barBaseY }, { x: mx + barAreaW, y: barBaseY },
      wA(P.white, 0.2), 1);

    // Y-axis labels
    var yTicks = [
      { label: '$0B', frac: 0 },
      { label: '$100B', frac: 0.3125 },
      { label: '$200B', frac: 0.625 },
      { label: '$300B', frac: 0.9375 }
    ];
    for (var yi = 0; yi < yTicks.length; yi++) {
      var yy = barBaseY - maxBarH * yTicks[yi].frac;
      B.drawLine(ctx, { x: mx - 3, y: yy }, { x: mx, y: yy },
        wA(P.white, 0.2), 1);
      B.drawLabel(ctx, yTicks[yi].label, { x: mx - 8, y: yy },
        wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'right');
      if (yi > 0) {
        B.drawLine(ctx, { x: mx, y: yy }, { x: mx + barAreaW, y: yy },
          wA(P.white, 0.04), 1, [4, 8]);
      }
    }

    // Draw stacked bar
    var barX = mx + barAreaW * 0.25;
    var barW = barAreaW * 0.5;
    var currentY = barBaseY;

    for (var sj = 0; sj < segments.length; sj++) {
      var seg = segments[sj];
      var segPhase = B.easeOut(B.clamp((phase - seg.delay) / (0.6 - seg.delay), 0, 1));
      var segH = (seg.value / totalValue) * maxBarH * segPhase;

      if (segH > 0) {
        ctx.save();
        ctx.fillStyle = wA(seg.color, 0.5);
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(barX, currentY - segH, barW, segH);
        ctx.restore();

        // Segment border
        ctx.save();
        ctx.strokeStyle = wA(seg.color, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, currentY - segH, barW, segH);
        ctx.restore();

        // Label inside or beside segment
        if (segH > 18) {
          var labelY = currentY - segH / 2;
          B.drawLabel(ctx, seg.label + ' $' + seg.value + 'B',
            { x: barX + barW + 12, y: labelY },
            wA(seg.color, segPhase * 0.8), '10px "JetBrains Mono", monospace', 'left');

          // Connecting line
          B.drawLine(ctx,
            { x: barX + barW, y: labelY },
            { x: barX + barW + 8, y: labelY },
            wA(seg.color, segPhase * 0.3), 1);
        }

        currentY -= segH;
      }
    }

    // Total label at top of stack
    if (phase > 0.5) {
      var totAlpha = B.easeOut(B.clamp((phase - 0.5) / 0.2, 0, 1));
      var runningTotal = Math.round(totalValue * B.clamp(phase / 0.8, 0, 1));
      B.drawLabel(ctx, '$' + runningTotal + 'B+',
        { x: barX + barW / 2, y: currentY - 16 },
        wA(P.yellow, totAlpha * 0.9), 'bold 14px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'total 2025 capex', { x: barX + barW / 2, y: currentY - 2 },
        wA(P.yellow, totAlpha * 0.5), '8px "JetBrains Mono", monospace', 'center');
    }

    // === NVIDIA chip icon (bottom left) ===
    var chipX = w * 0.82;
    var chipY = h * 0.55;
    var chipPhase = B.clamp((phase - 0.3) / 0.3, 0, 1);

    if (chipPhase > 0) {
      var chipSize = 22;
      // Chip body
      ctx.save();
      ctx.fillStyle = wA(P.green, chipPhase * 0.3);
      ctx.strokeStyle = wA(P.green, chipPhase * 0.6);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = P.green;
      ctx.shadowBlur = chipPhase * 12;
      ctx.fillRect(chipX - chipSize, chipY - chipSize, chipSize * 2, chipSize * 2);
      ctx.strokeRect(chipX - chipSize, chipY - chipSize, chipSize * 2, chipSize * 2);
      ctx.restore();

      // Chip pins (small lines on edges)
      for (var pi = 0; pi < 4; pi++) {
        var pinOff = -chipSize + chipSize * 0.5 * pi + chipSize * 0.25;
        // Top pins
        B.drawLine(ctx, { x: chipX + pinOff, y: chipY - chipSize },
          { x: chipX + pinOff, y: chipY - chipSize - 6 },
          wA(P.green, chipPhase * 0.4), 1);
        // Bottom pins
        B.drawLine(ctx, { x: chipX + pinOff, y: chipY + chipSize },
          { x: chipX + pinOff, y: chipY + chipSize + 6 },
          wA(P.green, chipPhase * 0.4), 1);
      }

      // Pulse glow
      var pulse = Math.sin(time * 2) * 0.3 + 0.7;
      B.drawDot(ctx, { x: chipX, y: chipY }, 6, wA(P.green, chipPhase * pulse * 0.5), 14);

      B.drawLabel(ctx, 'NVIDIA', { x: chipX, y: chipY + 3 },
        wA(P.green, chipPhase * 0.8), 'bold 8px "JetBrains Mono", monospace', 'center');

      // "feeds all of them" lines to bar
      if (chipPhase > 0.5) {
        var feedAlpha = B.clamp((chipPhase - 0.5) / 0.5, 0, 1);
        B.drawLine(ctx,
          { x: chipX - chipSize, y: chipY },
          { x: barX + barW + 4, y: barBaseY - maxBarH * 0.4 },
          wA(P.green, feedAlpha * 0.15), 1, [4, 6]);
      }
    }

    // Blackwell callout
    if (phase > 0.6) {
      var bwAlpha = B.easeOut(B.clamp((phase - 0.6) / 0.2, 0, 1));
      B.drawLabel(ctx, 'Blackwell', { x: chipX, y: chipY + chipSize + 18 },
        wA(P.green, bwAlpha * 0.7), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '$11B in one quarter', { x: chipX, y: chipY + chipSize + 32 },
        wA(P.yellow, bwAlpha * 0.6), '9px "JetBrains Mono", monospace', 'center');
    }

    // Bottom insight
    if (t > 0.7) {
      var insAlpha = B.easeOut(B.clamp((t - 0.7) / 0.15, 0, 1));
      B.drawLabel(ctx, 'the infrastructure build-out is unprecedented',
        { x: w * 0.5, y: h * 0.92 },
        wA(P.white, insAlpha * 0.45), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
