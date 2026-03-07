// model-commodity.js — Multiple model dots converging (commoditizing)
// Value arrow points up toward Data + Workflow layer; cost arrow points down

function ModelCommodityDiagram(canvas, container) {
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
    B.drawLabel(ctx, 'model commoditization', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Model dots — start spread, converge to center
    var centerX = w * 0.5;
    var centerY = h * 0.52;
    var convergePhase = B.easeInOut(B.clamp(phase / 0.7, 0, 1));

    var models = [
      { label: 'GPT', startX: w * 0.2, startY: h * 0.4, color: P.green },
      { label: 'Claude', startX: w * 0.35, startY: h * 0.62, color: P.teal },
      { label: 'Gemini', startX: w * 0.65, startY: h * 0.38, color: P.blue },
      { label: 'DeepSeek', startX: w * 0.8, startY: h * 0.58, color: P.coral }
    ];

    // Capability level line (they converge to this)
    var capLineY = centerY;
    if (convergePhase > 0.3) {
      var lineAlpha = B.clamp((convergePhase - 0.3) / 0.3, 0, 1);
      B.drawLine(ctx,
        { x: w * 0.15, y: capLineY },
        { x: w * 0.85, y: capLineY },
        wA(P.white, lineAlpha * 0.1), 1, [6, 6]);
      B.drawLabel(ctx, 'capability level', { x: w * 0.87, y: capLineY },
        wA(P.white, lineAlpha * 0.25), '7px "JetBrains Mono", monospace', 'left');
    }

    // Draw each model dot converging
    for (var mi = 0; mi < models.length; mi++) {
      var m = models[mi];
      // Current position: lerp from start toward center
      var cx = B.lerp(m.startX, centerX + (mi - 1.5) * 35, convergePhase);
      var cy = B.lerp(m.startY, capLineY, convergePhase);

      // Models dim as they converge
      var modelAlpha = B.lerp(0.9, 0.35, convergePhase);
      var modelGlow = B.lerp(14, 4, convergePhase);
      var modelRadius = B.lerp(10, 7, convergePhase);

      B.drawDot(ctx, { x: cx, y: cy }, modelRadius, wA(m.color, modelAlpha), modelGlow);
      B.drawLabel(ctx, m.label, { x: cx, y: cy + modelRadius + 12 },
        wA(m.color, modelAlpha * 0.8), '9px "JetBrains Mono", monospace', 'center');

      // Trail showing convergence
      if (convergePhase > 0.1 && convergePhase < 0.9) {
        ctx.save();
        ctx.strokeStyle = wA(m.color, 0.1);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(m.startX, m.startY);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.restore();
      }
    }

    // === APPLICATION LAYER (above, brightening) ===
    var appY = h * 0.2;
    var appPhase = B.clamp((phase - 0.35) / 0.4, 0, 1);
    var appBrightness = B.easeOut(appPhase);

    if (appPhase > 0) {
      // Application layer box
      var appBoxW = w * 0.6;
      var appBoxH = 40;
      ctx.save();
      ctx.fillStyle = wA(P.yellow, appBrightness * 0.08);
      ctx.strokeStyle = wA(P.yellow, appBrightness * 0.5);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = P.yellow;
      ctx.shadowBlur = appBrightness * 16;
      ctx.beginPath();
      ctx.roundRect(centerX - appBoxW / 2, appY - appBoxH / 2, appBoxW, appBoxH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      B.drawLabel(ctx, 'Data + Workflow + Distribution',
        { x: centerX, y: appY + 2 },
        wA(P.yellow, appBrightness * 0.9), 'bold 11px "JetBrains Mono", monospace', 'center');

      // "value" arrow pointing up to this layer
      var arrowAlpha = appBrightness * 0.6;
      B.drawLine(ctx,
        { x: centerX - 60, y: capLineY - 20 },
        { x: centerX - 60, y: appY + appBoxH / 2 + 6 },
        wA(P.green, arrowAlpha), 2);
      // Arrowhead
      B.drawLine(ctx,
        { x: centerX - 60, y: appY + appBoxH / 2 + 6 },
        { x: centerX - 64, y: appY + appBoxH / 2 + 14 },
        wA(P.green, arrowAlpha), 1.5);
      B.drawLine(ctx,
        { x: centerX - 60, y: appY + appBoxH / 2 + 6 },
        { x: centerX - 56, y: appY + appBoxH / 2 + 14 },
        wA(P.green, arrowAlpha), 1.5);
      B.drawLabel(ctx, 'value \u2191', { x: centerX - 75, y: (capLineY + appY) / 2 },
        wA(P.green, arrowAlpha * 0.8), '10px "JetBrains Mono", monospace', 'right');
    }

    // === COST ARROW (below models, pointing down) ===
    if (phase > 0.45) {
      var costPhase = B.easeOut(B.clamp((phase - 0.45) / 0.3, 0, 1));
      var costArrowTop = capLineY + 30;
      var costArrowBot = h * 0.75;

      B.drawLine(ctx,
        { x: centerX + 60, y: costArrowTop },
        { x: centerX + 60, y: costArrowBot },
        wA(P.coral, costPhase * 0.5), 2);
      // Arrowhead
      B.drawLine(ctx,
        { x: centerX + 60, y: costArrowBot },
        { x: centerX + 56, y: costArrowBot - 8 },
        wA(P.coral, costPhase * 0.5), 1.5);
      B.drawLine(ctx,
        { x: centerX + 60, y: costArrowBot },
        { x: centerX + 64, y: costArrowBot - 8 },
        wA(P.coral, costPhase * 0.5), 1.5);
      B.drawLabel(ctx, 'cost \u2193', { x: centerX + 75, y: (costArrowTop + costArrowBot) / 2 },
        wA(P.coral, costPhase * 0.7), '10px "JetBrains Mono", monospace', 'left');
    }

    // === "all the same" quote ===
    if (t > 0.65) {
      var quoteAlpha = B.easeOut(B.clamp((t - 0.65) / 0.15, 0, 1));
      B.drawLabel(ctx, '"all the same"', { x: w * 0.5, y: h * 0.82 },
        wA(P.white, quoteAlpha * 0.5), '12px "JetBrains Mono", monospace', 'center');
    }

    // Bottom insight
    if (t > 0.75) {
      var insAlpha = B.easeOut(B.clamp((t - 0.75) / 0.15, 0, 1));
      B.drawLabel(ctx, 'the model is not the moat \u2014 the application layer is',
        { x: w * 0.5, y: h * 0.92 },
        wA(P.yellow, insAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
