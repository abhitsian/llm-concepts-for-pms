// context-engineering.js — The shift from prompt engineering to context engineering
// Multiple input streams converge into a context assembly zone before the model

function ContextEngineeringDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  const streams = [
    { label: 'system prompt',       color: P.white,  tokens: 820  },
    { label: 'conversation history', color: P.blue,   tokens: 3400 },
    { label: 'retrieved docs',       color: P.green,  tokens: 6100 },
    { label: 'tool results',         color: P.yellow, tokens: 1250 },
    { label: 'user message',         color: P.teal,   tokens: 140  },
  ];

  const CYCLE = 8;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.06, my = h * 0.10;
    var iw = w - mx * 2, ih = h - my * 2;
    var cx = w * 0.5, cy = h * 0.5;
    var n = streams.length;
    var phase = (time % CYCLE) / CYCLE;
    var mergeT = B.easeInOut(B.clamp(phase * 2.5, 0, 1));

    // Model box on right
    var modelX = mx + iw * 0.88, modelY = cy;
    var boxW = iw * 0.10, boxH = ih * 0.18;
    ctx.strokeStyle = B.withAlpha(P.teal, 0.5);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(modelX - boxW / 2, modelY - boxH / 2, boxW, boxH);
    B.drawLabel(ctx, 'MODEL', { x: modelX, y: modelY + 4 },
      P.teal, 'bold 12px "JetBrains Mono", monospace');

    // Merge zone
    var mergeX = mx + iw * 0.62;
    B.drawLine(ctx, { x: mergeX, y: my + ih * 0.12 }, { x: mergeX, y: my + ih * 0.88 },
      B.withAlpha(P.white, 0.08), 1, [3, 6]);
    B.drawLabel(ctx, 'context assembly', { x: mergeX, y: my + ih * 0.05 },
      P.textDim, '9px "JetBrains Mono", monospace');

    // Merged fat curve from merge zone to model
    var fatAlpha = B.clamp(mergeT * 1.2 - 0.2, 0, 0.8);
    if (fatAlpha > 0) {
      var fatStart = { x: mergeX + 6, y: cy };
      var fatEnd = { x: modelX - boxW / 2 - 4, y: cy };
      var fcp1 = { x: B.lerp(fatStart.x, fatEnd.x, 0.4), y: cy - 8 };
      var fcp2 = { x: B.lerp(fatStart.x, fatEnd.x, 0.7), y: cy + 5 };
      B.drawCurve(ctx, [fatStart, fcp1, fcp2, fatEnd], 60,
        B.withAlpha(P.teal, fatAlpha * 0.5), 6, 18);
      B.drawCurve(ctx, [fatStart, fcp1, fcp2, fatEnd], 60,
        B.withAlpha(P.white, fatAlpha * 0.7), 2.5, 8);
    }

    // Draw each stream
    var totalTokens = 0;
    streams.forEach(function(s) { totalTokens += s.tokens; });

    for (var i = 0; i < n; i++) {
      var s = streams[i];
      var yFrac = (i + 0.5) / n;
      var startY = my + ih * (0.08 + yFrac * 0.84);
      var startX = mx + iw * 0.02;
      var endY = B.lerp(startY, cy, mergeT);
      var endX = mergeX;

      var start = { x: startX, y: startY };
      var end = { x: endX, y: endY };
      var cp1 = { x: B.lerp(startX, endX, 0.4), y: startY };
      var cp2 = { x: B.lerp(startX, endX, 0.75), y: endY };

      // Flow particles
      var flowT = (phase * 3 + i * 0.13) % 1;
      var particlePos = B.cubicPt(start, cp1, cp2, end, flowT);

      B.drawCurve(ctx, [start, cp1, cp2, end], 60,
        B.withAlpha(s.color, 0.12), 3, 10);
      B.drawCurve(ctx, [start, cp1, cp2, end], 60,
        B.withAlpha(s.color, 0.55), 1.5, 4);

      // Flow dot
      B.drawDot(ctx, particlePos, 3, B.withAlpha(s.color, 0.9), 8);

      // Stream label
      B.drawLabel(ctx, s.label, { x: startX + 4, y: startY - 12 },
        B.withAlpha(s.color, 0.7), '10px "JetBrains Mono", monospace', 'left');

      // Token count — ticks up
      var displayTokens = Math.round(s.tokens * B.easeOut(B.clamp(phase * 2, 0, 1)));
      B.drawLabel(ctx, displayTokens.toLocaleString() + ' tok',
        { x: startX + 4, y: startY + 14 },
        B.withAlpha(s.color, 0.4), '9px "JetBrains Mono", monospace', 'left');

      // Start dot
      B.drawDot(ctx, start, 3, B.withAlpha(s.color, 0.7), 4);
    }

    // Total token count near merge zone
    var dispTotal = Math.round(totalTokens * B.easeOut(B.clamp(phase * 2, 0, 1)));
    B.drawLabel(ctx, 'Σ ' + dispTotal.toLocaleString() + ' tokens',
      { x: mergeX, y: my + ih * 0.92 },
      B.withAlpha(P.white, 0.5), '10px "JetBrains Mono", monospace');

    // Formula at bottom
    B.drawLabel(ctx, 'context = system + history + retrieval + tools + user',
      { x: w / 2, y: h - my * 0.3 },
      P.textDim, '10px "JetBrains Mono", monospace');

    // Key insight label
    var insightAlpha = B.easeInOut(B.clamp(phase * 3 - 1.5, 0, 1));
    B.drawLabel(ctx, 'the hard problem is assembly, not prompting',
      { x: w / 2, y: my * 0.5 },
      B.withAlpha(P.coral, insightAlpha * 0.7),
      '11px "JetBrains Mono", monospace');
  }

  return B.animate(canvas, container, draw);
}
