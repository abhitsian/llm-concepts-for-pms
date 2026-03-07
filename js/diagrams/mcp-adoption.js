// mcp-adoption.js — MCP protocol adoption S-curve with architecture diagram
// Sigmoid curve with milestones + simple Client <-> Protocol <-> Server architecture below.

function McpAdoptionDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  // Sigmoid function for S-curve
  function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.12;
    var my = h * 0.12;

    // === S-CURVE AREA ===
    var chartLeft = mx;
    var chartRight = w - mx;
    var chartTop = my + 10;
    var chartBottom = h * 0.55;
    var chartW = chartRight - chartLeft;
    var chartH = chartBottom - chartTop;

    // Axes
    B.drawLine(ctx, { x: chartLeft, y: chartBottom }, { x: chartRight, y: chartBottom },
      wA(P.white, 0.15), 1);
    B.drawLine(ctx, { x: chartLeft, y: chartBottom }, { x: chartLeft, y: chartTop },
      wA(P.white, 0.15), 1);

    // Axis labels
    B.drawLabel(ctx, 'days', { x: chartRight, y: chartBottom + 16 },
      wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'right');
    B.drawLabel(ctx, 'servers', { x: chartLeft - 8, y: chartTop },
      wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'right');

    // Draw the S-curve using Bezier approximation
    // The S-curve goes from bottom-left to top-right
    var sCurveP0 = { x: chartLeft, y: chartBottom - chartH * 0.02 };
    var sCurveP1 = { x: chartLeft + chartW * 0.35, y: chartBottom - chartH * 0.02 };
    var sCurveP2 = { x: chartLeft + chartW * 0.65, y: chartTop + chartH * 0.02 };
    var sCurveP3 = { x: chartRight, y: chartTop + chartH * 0.02 };

    // Draw dim full curve
    B.drawCurve(ctx, [sCurveP0, sCurveP1, sCurveP2, sCurveP3],
      80, wA(P.teal, 0.12), 2, 0);

    // Animated partial curve
    var curveProgress = B.clamp(t / 0.75, 0, 1);
    var curveEased = B.easeInOut(curveProgress);

    if (curveEased > 0) {
      ctx.save();
      ctx.strokeStyle = wA(P.teal, 0.7);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = P.teal;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      var steps = 80;
      var maxStep = Math.ceil(steps * curveEased);
      for (var i = 0; i <= maxStep; i++) {
        var st = Math.min(i / steps, curveEased);
        var pt = B.cubicPt(sCurveP0, sCurveP1, sCurveP2, sCurveP3, st);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Tracer dot
      var tracerPt = B.cubicPt(sCurveP0, sCurveP1, sCurveP2, sCurveP3, curveEased);
      B.drawDot(ctx, tracerPt, 5, P.teal, 15);
      B.drawDot(ctx, tracerPt, 2.5, wA('#ffffff', 0.7));
    }

    // === MILESTONES ===
    var milestones = [
      { label: 'launch', tPos: 0.08, triggerAt: 0.1 },
      { label: '1K servers', tPos: 0.5, triggerAt: 0.45 },
      { label: 'ecosystem', tPos: 0.92, triggerAt: 0.72 }
    ];

    for (var mi = 0; mi < milestones.length; mi++) {
      var ms = milestones[mi];
      var msVisible = curveEased >= ms.tPos;

      if (msVisible) {
        var msAlpha = B.clamp((curveEased - ms.tPos) / 0.08, 0, 0.7);
        var msPt = B.cubicPt(sCurveP0, sCurveP1, sCurveP2, sCurveP3, ms.tPos);

        // Vertical dashed line to x-axis
        B.drawLine(ctx, { x: msPt.x, y: msPt.y }, { x: msPt.x, y: chartBottom },
          wA(P.teal, msAlpha * 0.2), 1, [3, 4]);

        // Milestone dot on curve
        B.drawDot(ctx, msPt, 4, wA(P.teal, msAlpha), 8 * msAlpha);

        // Milestone label
        var labelY = msPt.y - 16;
        // Alternate label position for 1K servers to avoid overlap
        if (mi === 1) labelY = msPt.y + 18;
        B.drawLabel(ctx, ms.label, { x: msPt.x, y: labelY },
          wA(P.teal, msAlpha),
          '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // === ARCHITECTURE DIAGRAM (below S-curve) ===
    var archY = h * 0.72;
    var archPhase = B.clamp((t - 0.3) / 0.2, 0, 1);
    var archEased = B.easeOut(archPhase);

    if (archEased > 0) {
      var archAlpha = archEased * 0.7;
      var archCx = w * 0.5;

      // Three boxes: Client -- Protocol -- Server
      var boxW = w * 0.18;
      var boxH = h * 0.09;
      var gap = w * 0.06;

      var clientBox = { x: archCx - boxW * 1.5 - gap, y: archY - boxH / 2 };
      var protoBox = { x: archCx - boxW / 2, y: archY - boxH / 2 };
      var serverBox = { x: archCx + boxW * 0.5 + gap, y: archY - boxH / 2 };

      var boxes = [
        { pos: clientBox, label: 'Client', color: P.blue },
        { pos: protoBox, label: 'MCP', color: P.teal },
        { pos: serverBox, label: 'Server', color: P.green }
      ];

      for (var bi = 0; bi < boxes.length; bi++) {
        var box = boxes[bi];
        var bx = box.pos.x;
        var by = box.pos.y;

        // Box
        ctx.save();
        ctx.fillStyle = wA(box.color, archAlpha * 0.08);
        ctx.strokeStyle = wA(box.color, archAlpha * 0.4);
        ctx.lineWidth = 1.5;
        // Rounded rect
        var br = 5;
        ctx.beginPath();
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + boxW - br, by);
        ctx.quadraticCurveTo(bx + boxW, by, bx + boxW, by + br);
        ctx.lineTo(bx + boxW, by + boxH - br);
        ctx.quadraticCurveTo(bx + boxW, by + boxH, bx + boxW - br, by + boxH);
        ctx.lineTo(bx + br, by + boxH);
        ctx.quadraticCurveTo(bx, by + boxH, bx, by + boxH - br);
        ctx.lineTo(bx, by + br);
        ctx.quadraticCurveTo(bx, by, bx + br, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Label
        B.drawLabel(ctx, box.label,
          { x: bx + boxW / 2, y: by + boxH / 2 },
          wA(box.color, archAlpha * 0.8),
          'bold 10px "JetBrains Mono", monospace', 'center');
      }

      // Arrows between boxes (bidirectional)
      // Client <-> Protocol
      var arrow1Start = { x: clientBox.x + boxW, y: archY };
      var arrow1End = { x: protoBox.x, y: archY };
      B.drawLine(ctx, arrow1Start, arrow1End,
        wA(P.white, archAlpha * 0.3), 1.5);

      // Arrow heads
      B.drawLine(ctx,
        { x: arrow1End.x - 5, y: archY - 3 },
        { x: arrow1End.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);
      B.drawLine(ctx,
        { x: arrow1End.x - 5, y: archY + 3 },
        { x: arrow1End.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);
      B.drawLine(ctx,
        { x: arrow1Start.x + 5, y: archY - 3 },
        { x: arrow1Start.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);
      B.drawLine(ctx,
        { x: arrow1Start.x + 5, y: archY + 3 },
        { x: arrow1Start.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);

      // Protocol <-> Server
      var arrow2Start = { x: protoBox.x + boxW, y: archY };
      var arrow2End = { x: serverBox.x, y: archY };
      B.drawLine(ctx, arrow2Start, arrow2End,
        wA(P.white, archAlpha * 0.3), 1.5);

      B.drawLine(ctx,
        { x: arrow2End.x - 5, y: archY - 3 },
        { x: arrow2End.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);
      B.drawLine(ctx,
        { x: arrow2End.x - 5, y: archY + 3 },
        { x: arrow2End.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);
      B.drawLine(ctx,
        { x: arrow2Start.x + 5, y: archY - 3 },
        { x: arrow2Start.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);
      B.drawLine(ctx,
        { x: arrow2Start.x + 5, y: archY + 3 },
        { x: arrow2Start.x, y: archY },
        wA(P.white, archAlpha * 0.3), 1.5);

      // JSON-RPC label
      B.drawLabel(ctx, 'JSON-RPC', { x: archCx, y: archY - boxH / 2 - 10 },
        wA(P.teal, archAlpha * 0.4),
        '8px "JetBrains Mono", monospace', 'center');

      // Data dots flowing between boxes
      if (archEased > 0.5) {
        var flowT1 = (time * 0.6) % 1;
        var flowPt1 = { x: B.lerp(arrow1Start.x, arrow1End.x, flowT1), y: archY - 2 };
        B.drawDot(ctx, flowPt1, 2, wA(P.blue, 0.5), 6);

        var flowT2 = (time * 0.6 + 0.5) % 1;
        var flowPt2 = { x: B.lerp(arrow2Start.x, arrow2End.x, flowT2), y: archY + 2 };
        B.drawDot(ctx, flowPt2, 2, wA(P.green, 0.5), 6);
      }

      // "Simplicity wins" label
      if (archEased > 0.8) {
        var simpAlpha = B.clamp((archEased - 0.8) / 0.2, 0, 0.35);
        B.drawLabel(ctx, 'simplicity wins: one standard protocol',
          { x: archCx, y: archY + boxH / 2 + 18 },
          wA(P.white, simpAlpha),
          '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // Title
    B.drawLabel(ctx, 'mcp adoption', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
