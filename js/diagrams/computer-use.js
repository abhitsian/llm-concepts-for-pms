// computer-use.js — Screenshot → Analyze → Execute → Observe loop

function ComputerUseDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.08;
    var pipeY = h * 0.42;
    var stageW = (w - mx * 2) / 4;

    var stages = [
      { label: 'Screenshot', color: P.blue, x: mx + stageW * 0.5 },
      { label: 'Analyze', color: P.purple, x: mx + stageW * 1.5 },
      { label: 'Execute', color: P.coral, x: mx + stageW * 2.5 },
      { label: 'Observe', color: P.teal, x: mx + stageW * 3.5 }
    ];

    // Draw stage boxes and icons
    for (var i = 0; i < 4; i++) {
      var s = stages[i];
      var bx = s.x - stageW * 0.38;
      var by = pipeY - 28;
      var bw = stageW * 0.76;
      var bh = 56;

      // Box background
      ctx.save();
      ctx.fillStyle = wA(s.color, 0.06);
      ctx.strokeStyle = wA(s.color, 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Rounded rect
      var r = 6;
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + bw - r, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      ctx.lineTo(bx + bw, by + bh - r);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
      ctx.lineTo(bx + r, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Stage icon
      ctx.save();
      if (i === 0) {
        // Screen capture rectangle
        ctx.strokeStyle = wA(s.color, 0.5);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x - 10, pipeY - 12, 20, 14);
        // Screen content lines
        ctx.fillStyle = wA(s.color, 0.25);
        ctx.fillRect(s.x - 7, pipeY - 9, 14, 2);
        ctx.fillRect(s.x - 7, pipeY - 5, 10, 2);
        ctx.fillRect(s.x - 7, pipeY - 1, 12, 2);
        // Stand
        B.drawLine(ctx, { x: s.x, y: pipeY + 2 }, { x: s.x, y: pipeY + 6 },
          wA(s.color, 0.4), 1.5);
      } else if (i === 1) {
        // Brain/processing glow dot
        var pulse = 0.5 + 0.5 * Math.sin(time * 4);
        B.drawDot(ctx, { x: s.x, y: pipeY - 4 }, 8 + pulse * 2, wA(s.color, 0.15), 15);
        B.drawDot(ctx, { x: s.x, y: pipeY - 4 }, 4, wA(s.color, 0.6), 8);
        // Small thinking dots
        for (var td = 0; td < 3; td++) {
          var tdAngle = (time * 2 + td * 2.1) % (Math.PI * 2);
          var tdx = s.x + Math.cos(tdAngle) * 10;
          var tdy = pipeY - 4 + Math.sin(tdAngle) * 6;
          B.drawDot(ctx, { x: tdx, y: tdy }, 1.5, wA(s.color, 0.3));
        }
      } else if (i === 2) {
        // Crosshair cursor
        var cursorPhase = B.easeInOut((t * 3 + 0.5) % 1);
        var curX = s.x - 8 + cursorPhase * 16;
        var curY = pipeY - 6 + Math.sin(cursorPhase * Math.PI) * 4;
        B.drawLine(ctx, { x: curX - 5, y: curY }, { x: curX + 5, y: curY },
          wA(s.color, 0.6), 1);
        B.drawLine(ctx, { x: curX, y: curY - 5 }, { x: curX, y: curY + 5 },
          wA(s.color, 0.6), 1);
        B.drawRing(ctx, { x: curX, y: curY }, 3, wA(s.color, 0.4), 1);
        // Click ripple
        if (cursorPhase > 0.7) {
          var ripple = (cursorPhase - 0.7) / 0.3;
          B.drawRing(ctx, { x: curX, y: curY }, 3 + ripple * 8,
            wA(s.color, (1 - ripple) * 0.3), 1);
        }
      } else {
        // New screenshot — eye icon
        ctx.strokeStyle = wA(s.color, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x - 10, pipeY - 3);
        ctx.quadraticCurveTo(s.x, pipeY - 12, s.x + 10, pipeY - 3);
        ctx.quadraticCurveTo(s.x, pipeY + 6, s.x - 10, pipeY - 3);
        ctx.stroke();
        B.drawDot(ctx, { x: s.x, y: pipeY - 3 }, 2.5, wA(s.color, 0.6));
      }
      ctx.restore();

      // Stage label below box
      B.drawLabel(ctx, s.label, { x: s.x, y: pipeY + 40 },
        wA(s.color, 0.7), '10px "JetBrains Mono", monospace', 'center');

      // Step number
      B.drawLabel(ctx, (i + 1).toString(), { x: s.x, y: pipeY + 18 },
        wA(s.color, 0.3), '8px "JetBrains Mono", monospace', 'center');
    }

    // Draw connecting Bézier curves between stages
    for (var c = 0; c < 3; c++) {
      var fromX = stages[c].x + stageW * 0.38;
      var toX = stages[c + 1].x - stageW * 0.38;
      var pts = [
        { x: fromX, y: pipeY },
        { x: fromX + (toX - fromX) * 0.4, y: pipeY - 8 },
        { x: fromX + (toX - fromX) * 0.6, y: pipeY + 8 },
        { x: toX, y: pipeY }
      ];
      B.drawCurve(ctx, pts, 30, wA(P.white, 0.1), 1.5, 0);
      // Arrow
      var arPt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], 0.85);
      ctx.save();
      ctx.fillStyle = wA(P.white, 0.2);
      ctx.beginPath();
      ctx.moveTo(toX - 2, pipeY);
      ctx.lineTo(toX - 7, pipeY - 3);
      ctx.lineTo(toX - 7, pipeY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Loop-back curve from Observe → Screenshot (below)
    var loopY = pipeY + 70;
    var loopPts = [
      { x: stages[3].x, y: pipeY + 28 },
      { x: stages[3].x + 20, y: loopY + 20 },
      { x: stages[0].x - 20, y: loopY + 20 },
      { x: stages[0].x, y: pipeY + 28 }
    ];
    B.drawCurve(ctx, loopPts, 50, wA(P.white, 0.08), 1.5, 0);
    // Loop arrow
    ctx.save();
    ctx.fillStyle = wA(P.white, 0.15);
    ctx.beginPath();
    ctx.moveTo(stages[0].x, pipeY + 28);
    ctx.lineTo(stages[0].x - 3, pipeY + 35);
    ctx.lineTo(stages[0].x + 3, pipeY + 35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    B.drawLabel(ctx, 'loop', { x: w * 0.5, y: loopY + 26 },
      wA(P.white, 0.2), '8px "JetBrains Mono", monospace', 'center');

    // Tracer dot moving through pipeline
    // Total path: 4 stages + 1 loop-back = 5 segments
    var totalSegs = 5;
    var tracerProgress = t;
    var segFloat = tracerProgress * totalSegs;
    var seg = Math.floor(segFloat);
    var segT = segFloat - seg;

    if (seg < 4) {
      // Forward through pipeline stages
      var tracerPt;
      if (seg < 3) {
        var fromX = stages[seg].x + stageW * 0.38;
        var toX = stages[seg + 1].x - stageW * 0.38;

        // Include time in box + travel between boxes
        var inBox = segT < 0.4;
        if (inBox) {
          // Inside the box
          var boxT = segT / 0.4;
          tracerPt = { x: stages[seg].x - stageW * 0.3 + boxT * stageW * 0.68, y: pipeY };
        } else {
          // Traveling between boxes
          var travelT = (segT - 0.4) / 0.6;
          var pts = [
            { x: fromX, y: pipeY },
            { x: fromX + (toX - fromX) * 0.4, y: pipeY - 8 },
            { x: fromX + (toX - fromX) * 0.6, y: pipeY + 8 },
            { x: toX, y: pipeY }
          ];
          tracerPt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], B.easeInOut(travelT));
        }
      } else {
        // In the last stage box (Observe)
        tracerPt = { x: stages[3].x - stageW * 0.3 + segT * stageW * 0.68, y: pipeY };
      }

      // Highlight the current stage box
      var activeStage = stages[seg < 4 ? seg : 3];
      B.drawRing(ctx, { x: activeStage.x, y: pipeY }, stageW * 0.4,
        wA(activeStage.color, 0.15 + 0.1 * Math.sin(time * 5)), 1);

      B.drawDot(ctx, tracerPt, 4, P.white, 12);
      B.drawDot(ctx, tracerPt, 2, '#ffffff');
    } else {
      // Loop-back
      var loopT = B.easeInOut(segT);
      var tracerPt = B.cubicPt(loopPts[0], loopPts[1], loopPts[2], loopPts[3], loopT);
      B.drawDot(ctx, tracerPt, 4, P.white, 12);
      B.drawDot(ctx, tracerPt, 2, '#ffffff');
    }

    // Latency label
    var latencyAlpha = 0.25 + 0.15 * Math.sin(time * 1.5);
    B.drawLabel(ctx, '2-5s per action', { x: w * 0.5, y: h * 0.14 },
      wA(P.yellow, latencyAlpha), '10px "JetBrains Mono", monospace', 'center');

    // Iteration counter
    var iteration = Math.floor(time / CYCLE) % 10 + 1;
    B.drawLabel(ctx, 'iteration ' + iteration,
      { x: w * 0.5, y: h * 0.21 },
      wA(P.white, 0.2), '8px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'computer use', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
