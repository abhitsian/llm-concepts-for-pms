// stopped-hiring.js — Workforce shrinking visualization
// Klarna headcount dropping as AI bot grows, then slight reversal

function StoppedHiringDiagram(canvas, container) {
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
    B.drawLabel(ctx, 'we stopped hiring', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    var mx = w * 0.10;
    var barAreaW = w * 0.38;
    var barAreaH = h * 0.52;
    var barBaseY = h * 0.74;

    // === BAR CHART: Headcount ===
    // Axis
    B.drawLine(ctx, { x: mx, y: barBaseY }, { x: mx + barAreaW, y: barBaseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: barBaseY }, { x: mx, y: barBaseY - barAreaH },
      wA(P.white, 0.2), 1);

    // Y-axis labels
    var yTicks = [
      { label: '4,500', frac: 0 },
      { label: '3,000', frac: 0.333 },
      { label: '1,500', frac: 0.667 },
      { label: '0', frac: 1 }
    ];
    for (var yi = 0; yi < yTicks.length; yi++) {
      var yy = barBaseY - barAreaH * (1 - yTicks[yi].frac);
      B.drawLine(ctx, { x: mx - 3, y: yy }, { x: mx, y: yy },
        wA(P.white, 0.2), 1);
      B.drawLabel(ctx, yTicks[yi].label, { x: mx - 6, y: yy },
        wA(P.white, 0.3), '7px "JetBrains Mono", monospace', 'right');
    }

    // Bar 1: Before (4,500)
    var bar1H = barAreaH * (4500 / 4500);
    var bar1X = mx + barAreaW * 0.15;
    var bar1W = barAreaW * 0.28;
    var bar1Anim = B.clamp(phase / 0.3, 0, 1);
    var animBar1H = bar1H * bar1Anim;

    ctx.save();
    ctx.fillStyle = wA(P.teal, 0.6);
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = 10;
    ctx.fillRect(bar1X, barBaseY - animBar1H, bar1W, animBar1H);
    ctx.restore();

    B.drawLabel(ctx, '4,500', { x: bar1X + bar1W / 2, y: barBaseY - animBar1H - 8 },
      wA(P.teal, bar1Anim * 0.8), '10px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'before', { x: bar1X + bar1W / 2, y: barBaseY + 14 },
      wA(P.white, 0.5), '8px "JetBrains Mono", monospace', 'center');

    // Bar 2: After (3,500 shrinking, then slight bump back)
    var shrinkPhase = B.clamp((phase - 0.3) / 0.4, 0, 1);
    var afterCount = 4500 - B.easeOut(shrinkPhase) * 1000; // 4500 → 3500

    // Slight reversal when quality drops
    var reversalPhase = B.clamp((phase - 0.8) / 0.2, 0, 1);
    afterCount += B.easeInOut(reversalPhase) * 150; // bump back up ~150

    var bar2H = barAreaH * (afterCount / 4500);
    var bar2X = mx + barAreaW * 0.57;
    var bar2W = barAreaW * 0.28;

    if (shrinkPhase > 0) {
      // Color shifts from teal to coral as it shrinks
      var shrinkColor = shrinkPhase > 0.5 ? P.coral : P.teal;
      ctx.save();
      ctx.fillStyle = wA(shrinkColor, 0.5 + shrinkPhase * 0.2);
      ctx.shadowColor = shrinkColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(bar2X, barBaseY - bar2H, bar2W, bar2H);
      ctx.restore();

      var countLabel = Math.round(afterCount).toLocaleString();
      B.drawLabel(ctx, countLabel, { x: bar2X + bar2W / 2, y: barBaseY - bar2H - 8 },
        wA(shrinkColor, 0.8), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'after', { x: bar2X + bar2W / 2, y: barBaseY + 14 },
        wA(P.white, 0.5), '8px "JetBrains Mono", monospace', 'center');
    }

    // Down arrow between bars
    if (shrinkPhase > 0.2) {
      var arrowAlpha = B.clamp((shrinkPhase - 0.2) / 0.3, 0, 1);
      var arrowX = (bar1X + bar1W + bar2X) / 2;
      B.drawLine(ctx,
        { x: arrowX, y: barBaseY - barAreaH * 0.7 },
        { x: arrowX, y: barBaseY - barAreaH * 0.3 },
        wA(P.coral, arrowAlpha * 0.5), 2);
      B.drawLabel(ctx, '\u2193', { x: arrowX, y: barBaseY - barAreaH * 0.25 },
        wA(P.coral, arrowAlpha * 0.6), '14px "JetBrains Mono", monospace', 'center');
    }

    // === AI BOT ICON (right side, growing) ===
    var botCenterX = w * 0.68;
    var botCenterY = h * 0.48;
    var botGrowth = B.easeOut(B.clamp((phase - 0.2) / 0.5, 0, 1));
    var botSize = 8 + botGrowth * 30;
    var botGlow = botGrowth * 25;

    // Bot body (rectangle-ish via lines)
    if (botGrowth > 0) {
      // Head
      B.drawDot(ctx, { x: botCenterX, y: botCenterY - botSize * 0.6 },
        botSize * 0.35, wA(P.blue, botGrowth * 0.5), botGlow);
      // Eyes
      if (botSize > 15) {
        B.drawDot(ctx, { x: botCenterX - botSize * 0.12, y: botCenterY - botSize * 0.65 },
          2, wA(P.white, botGrowth * 0.8));
        B.drawDot(ctx, { x: botCenterX + botSize * 0.12, y: botCenterY - botSize * 0.65 },
          2, wA(P.white, botGrowth * 0.8));
      }
      // Body
      ctx.save();
      ctx.fillStyle = wA(P.blue, botGrowth * 0.4);
      ctx.shadowColor = P.blue;
      ctx.shadowBlur = botGlow;
      var bodyW = botSize * 0.7;
      var bodyH = botSize * 0.8;
      ctx.fillRect(botCenterX - bodyW / 2, botCenterY - botSize * 0.2, bodyW, bodyH);
      ctx.restore();

      // Antenna
      B.drawLine(ctx,
        { x: botCenterX, y: botCenterY - botSize * 0.95 },
        { x: botCenterX, y: botCenterY - botSize * 1.15 },
        wA(P.blue, botGrowth * 0.5), 1.5);
      B.drawDot(ctx, { x: botCenterX, y: botCenterY - botSize * 1.15 },
        2, wA(P.blue, botGrowth * 0.7), 4);

      B.drawLabel(ctx, 'AI', { x: botCenterX, y: botCenterY + botSize * 0.15 },
        wA(P.white, botGrowth * 0.7), 'bold 10px "JetBrains Mono", monospace', 'center');
    }

    // "700 FTE equivalent" label
    if (phase > 0.5) {
      var fteAlpha = B.easeOut(B.clamp((phase - 0.5) / 0.2, 0, 1));
      B.drawLabel(ctx, '700 FTE', { x: botCenterX, y: botCenterY + botSize * 0.85 },
        wA(P.blue, fteAlpha * 0.8), 'bold 12px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'equivalent', { x: botCenterX, y: botCenterY + botSize * 0.85 + 15 },
        wA(P.blue, fteAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // Reversal annotation
    if (reversalPhase > 0) {
      var revAlpha = B.easeOut(reversalPhase);
      B.drawLabel(ctx, '\u2191 quality drops', { x: bar2X + bar2W + 8, y: barBaseY - bar2H + 10 },
        wA(P.yellow, revAlpha * 0.6), '8px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'hired back some', { x: bar2X + bar2W + 8, y: barBaseY - bar2H + 22 },
        wA(P.yellow, revAlpha * 0.4), '7px "JetBrains Mono", monospace', 'left');
    }

    // Klarna label
    if (phase > 0.15) {
      var klAlpha = B.clamp((phase - 0.15) / 0.2, 0, 1);
      B.drawLabel(ctx, 'Klarna', { x: mx + barAreaW * 0.5, y: barBaseY - barAreaH - 12 },
        wA(P.white, klAlpha * 0.7), 'bold 12px "JetBrains Mono", monospace', 'center');
    }

    // Bottom insight
    if (t > 0.7) {
      var insAlpha = B.easeOut(B.clamp((t - 0.7) / 0.15, 0, 1));
      B.drawLabel(ctx, 'AI replaces headcount \u2014 until quality demands humans back',
        { x: w * 0.5, y: h * 0.92 },
        wA(P.white, insAlpha * 0.45), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
