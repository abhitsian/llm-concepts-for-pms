// multimodal.js — Three input modalities converging into a single model node
// Text, image, and audio streams flow in via Bezier curves; output exits right.

function MultimodalDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 8;
  var DOT_COUNT = 6;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var modelPt = { x: w * 0.55, y: h * 0.5 };
    var outPt = { x: w * 0.9, y: h * 0.5 };
    var lx = w * 0.08;

    // Input stream definitions
    var streams = [
      { name: 'text', tokens: '1K tokens', y: h * 0.22, color: P.teal, icon: 'text' },
      { name: 'image', tokens: '1.5K tokens', y: h * 0.50, color: P.coral, icon: 'image' },
      { name: 'audio', tokens: '4K tokens', y: h * 0.78, color: P.yellow, icon: 'audio' }
    ];

    // Draw each input stream
    for (var s = 0; s < streams.length; s++) {
      var stream = streams[s];
      var from = { x: lx, y: stream.y };
      var dx = modelPt.x - from.x;
      var dy = modelPt.y - from.y;
      var pts = [
        from,
        { x: from.x + dx * 0.35, y: from.y + dy * 0.1 },
        { x: from.x + dx * 0.65, y: from.y + dy * 0.7 },
        modelPt
      ];

      // Dim base curve
      B.drawCurve(ctx, pts, 60, wA(stream.color, 0.12), 1.5, 0);

      // Bright curve draws in over 0..0.5
      var drawProg = B.clamp(t / 0.5, 0, 1);
      if (drawProg > 0) {
        B.drawCurve(ctx, pts, 60, wA(stream.color, 0.35), 2, 6);
      }

      // Flowing data dots along the curve
      for (var d = 0; d < DOT_COUNT; d++) {
        var dotPhase = (t * 2 + d / DOT_COUNT + s * 0.12) % 1;
        var dotPt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], dotPhase);
        var dotAlpha = Math.sin(dotPhase * Math.PI) * 0.8;
        B.drawDot(ctx, dotPt, 2.5 + dotAlpha, wA(stream.color, dotAlpha), 8 * dotAlpha);
      }

      // Source icon area
      B.drawDot(ctx, from, 5, wA(stream.color, 0.5), 6);

      // Icon visualization
      if (stream.icon === 'text') {
        // Small text lines
        for (var ln = 0; ln < 3; ln++) {
          var lw = 14 - ln * 3;
          var ly = from.y - 6 + ln * 6;
          B.drawLine(ctx,
            { x: from.x - lw / 2 + 18, y: ly },
            { x: from.x + lw / 2 + 18, y: ly },
            wA(stream.color, 0.4), 1.5);
        }
      } else if (stream.icon === 'image') {
        // Small rectangle with pixel dots
        ctx.save();
        ctx.strokeStyle = wA(stream.color, 0.4);
        ctx.lineWidth = 1;
        ctx.strokeRect(from.x + 12, from.y - 8, 16, 12);
        ctx.restore();
        B.drawDot(ctx, { x: from.x + 17, y: from.y - 3 }, 1.5, wA(stream.color, 0.5));
        B.drawDot(ctx, { x: from.x + 23, y: from.y - 1 }, 1, wA(stream.color, 0.3));
      } else {
        // Waveform for audio
        for (var wv = 0; wv < 8; wv++) {
          var wx = from.x + 12 + wv * 2.5;
          var wh2 = Math.sin(wv * 1.2 + time * 4) * 5 + 2;
          B.drawLine(ctx,
            { x: wx, y: from.y - wh2 },
            { x: wx, y: from.y + wh2 },
            wA(stream.color, 0.5), 1);
        }
      }

      // Labels
      B.drawLabel(ctx, stream.name, { x: from.x, y: from.y - 18 },
        wA(stream.color, 0.7), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, stream.tokens, { x: from.x, y: from.y + 20 },
        wA(stream.color, 0.4), '8px "JetBrains Mono", monospace', 'left');
    }

    // Central model node — pulses as data arrives
    var pulse = 0.5 + Math.sin(time * 3) * 0.15;
    var mR = 16 + Math.sin(time * 2) * 2;
    B.drawDot(ctx, modelPt, mR + 6, wA(P.white, 0.04), 30);
    B.drawDot(ctx, modelPt, mR, wA(P.purple, pulse * 0.5), 18);
    B.drawDot(ctx, modelPt, 6, wA('#ffffff', 0.6));
    B.drawLabel(ctx, 'model', { x: modelPt.x, y: modelPt.y - mR - 12 },
      wA(P.purple, 0.8), '12px "JetBrains Mono", monospace', 'center');

    // Output curve (model -> output)
    var outCp1 = { x: modelPt.x + (outPt.x - modelPt.x) * 0.4, y: modelPt.y - 5 };
    var outCp2 = { x: modelPt.x + (outPt.x - modelPt.x) * 0.7, y: outPt.y + 5 };
    var outPts = [modelPt, outCp1, outCp2, outPt];

    // Output emerges after input reaches model: 0.3..0.7
    var outT = B.clamp((t - 0.3) / 0.4, 0, 1);
    B.drawCurve(ctx, outPts, 50, wA(P.white, 0.1), 1.5, 0);

    if (outT > 0) {
      ctx.save();
      ctx.strokeStyle = wA(P.white, 0.6);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = P.white;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i <= 50; i++) {
        var st2 = i / 50;
        if (st2 > B.easeOut(outT)) break;
        var pt = B.cubicPt(outPts[0], outPts[1], outPts[2], outPts[3], st2);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Output flowing dots
      for (var od = 0; od < 3; od++) {
        var odPhase = B.clamp(((t - 0.35) * 3 + od / 3) % 1, 0, 1);
        if (t < 0.35) continue;
        var odPt = B.cubicPt(outPts[0], outPts[1], outPts[2], outPts[3], odPhase);
        var odAlpha = Math.sin(odPhase * Math.PI) * 0.7;
        B.drawDot(ctx, odPt, 3, wA(P.white, odAlpha), 8 * odAlpha);
      }
    }

    // Output endpoint
    B.drawDot(ctx, outPt, 5, wA(P.white, 0.4 + outT * 0.3), outT * 8);
    B.drawLabel(ctx, 'output', { x: outPt.x, y: outPt.y - 14 },
      wA(P.white, 0.5), '10px "JetBrains Mono", monospace', 'center');

    // Formula at bottom
    B.drawLabel(ctx, 'total_input = text_tokens + image_tokens + audio_tokens',
      { x: w * 0.5, y: h * 0.93 },
      wA(P.white, 0.35), '9px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'multimodal input', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
