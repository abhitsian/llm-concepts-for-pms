// api-layer.js — Animated HTTP request/response flow between app and LLM API
// Shows a Bezier curve carrying prompt tokens out and completion tokens back,
// with a ticking latency timer and cost formula.

function ApiLayerDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 6; // seconds per loop

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const mx = w * 0.12;
    const cy = h * 0.45;
    const t = (time % CYCLE) / CYCLE;

    // Endpoints
    const appPt = { x: mx, y: cy };
    const apiPt = { x: w - mx, y: cy };
    const span = apiPt.x - appPt.x;

    // Outbound curve (arcs upward): app -> api
    const outCp1 = { x: appPt.x + span * 0.3, y: cy - h * 0.22 };
    const outCp2 = { x: appPt.x + span * 0.7, y: cy - h * 0.22 };
    const outPts = [appPt, outCp1, outCp2, apiPt];

    // Return curve (arcs downward): api -> app
    const retCp1 = { x: apiPt.x - span * 0.3, y: cy + h * 0.22 };
    const retCp2 = { x: apiPt.x - span * 0.7, y: cy + h * 0.22 };
    const retPts = [apiPt, retCp1, retCp2, appPt];

    // Phase timing: 0-0.35 outbound travel, 0.35-0.50 wait, 0.50-0.85 return, 0.85-1 idle
    var outT = B.clamp(t / 0.35, 0, 1);
    var waitT = B.clamp((t - 0.35) / 0.15, 0, 1);
    var retT = B.clamp((t - 0.50) / 0.35, 0, 1);

    // Draw dim path curves
    B.drawCurve(ctx, outPts, 60, wA(P.teal, 0.12), 1.5, 0);
    B.drawCurve(ctx, retPts, 60, wA(P.coral, 0.12), 1.5, 0);

    // Draw active outbound curve (partial)
    if (t < 0.85) {
      var outDraw = B.easeInOut(outT);
      // Draw partial outbound
      ctx.save();
      ctx.strokeStyle = wA(P.teal, 0.7);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = P.teal;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var s = i / 60;
        if (s > outDraw) break;
        var pt = B.cubicPt(outPts[0], outPts[1], outPts[2], outPts[3], s);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Outbound dot
      if (outT > 0 && outT < 1) {
        var dotPt = B.cubicPt(outPts[0], outPts[1], outPts[2], outPts[3], outDraw);
        B.drawDot(ctx, dotPt, 5, P.teal, 15);
        B.drawDot(ctx, dotPt, 2.5, '#ffffff', 0);
      }
    }

    // Outbound label
    if (outT > 0.3) {
      var labelAlpha = B.clamp((outT - 0.3) / 0.3, 0, 0.8);
      var midOut = B.cubicPt(outPts[0], outPts[1], outPts[2], outPts[3], 0.5);
      B.drawLabel(ctx, 'prompt: 500 tokens', { x: midOut.x, y: midOut.y - 16 },
        wA(P.teal, labelAlpha), '10px "JetBrains Mono", monospace', 'center');
    }

    // Draw active return curve (partial)
    if (t > 0.50) {
      var retDraw = B.easeInOut(retT);
      ctx.save();
      ctx.strokeStyle = wA(P.coral, 0.7);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var s = i / 60;
        if (s > retDraw) break;
        var pt = B.cubicPt(retPts[0], retPts[1], retPts[2], retPts[3], s);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Return dot
      if (retT > 0 && retT < 1) {
        var dotPt = B.cubicPt(retPts[0], retPts[1], retPts[2], retPts[3], retDraw);
        B.drawDot(ctx, dotPt, 5, P.coral, 15);
        B.drawDot(ctx, dotPt, 2.5, '#ffffff', 0);
      }

      // Return label
      if (retT > 0.3) {
        var labelAlpha = B.clamp((retT - 0.3) / 0.3, 0, 0.8);
        var midRet = B.cubicPt(retPts[0], retPts[1], retPts[2], retPts[3], 0.5);
        B.drawLabel(ctx, 'completion: 200 tokens', { x: midRet.x, y: midRet.y + 16 },
          wA(P.coral, labelAlpha), '10px "JetBrains Mono", monospace', 'center');
      }
    }

    // Waiting pulse at API endpoint
    if (t > 0.35 && t < 0.50) {
      var pulseR = 6 + Math.sin(waitT * Math.PI * 4) * 3;
      B.drawDot(ctx, apiPt, pulseR, wA(P.yellow, 0.5), 12);
    }

    // Endpoint dots and labels
    B.drawDot(ctx, appPt, 7, wA(P.teal, 0.4), 8);
    B.drawDot(ctx, appPt, 4, P.teal, 0);
    B.drawLabel(ctx, 'Your App', { x: appPt.x, y: appPt.y - 18 },
      P.white, '12px "JetBrains Mono", monospace', 'center');

    B.drawDot(ctx, apiPt, 7, wA(P.coral, 0.4), 8);
    B.drawDot(ctx, apiPt, 4, P.coral, 0);
    B.drawLabel(ctx, 'LLM API', { x: apiPt.x, y: apiPt.y - 18 },
      P.white, '12px "JetBrains Mono", monospace', 'center');

    // Latency timer
    var latency = 0;
    if (t < 0.35) latency = Math.floor(t / 0.35 * 890);
    else if (t < 0.50) latency = 890 + Math.floor(waitT * 350);
    else if (t < 0.85) latency = 1240;
    else latency = 0;

    var timerAlpha = t > 0.01 && t < 0.88 ? 0.8 : 0.3;
    B.drawLabel(ctx, 'latency: ' + latency + 'ms',
      { x: w / 2, y: cy + 4 },
      wA(P.yellow, timerAlpha), '11px "JetBrains Mono", monospace', 'center');

    // Cost formula at bottom
    var formulaY = h * 0.82;
    B.drawLabel(ctx, 'cost = (input x $0.003 + output x $0.015) / 1000',
      { x: w / 2, y: formulaY },
      wA(P.white, 0.5), '10px "JetBrains Mono", monospace', 'center');

    // Computed cost
    var cost = ((500 * 0.003 + 200 * 0.015) / 1000);
    var showCost = t > 0.85 ? cost.toFixed(4) : '...';
    B.drawLabel(ctx, '= $' + showCost + ' per call',
      { x: w / 2, y: formulaY + 18 },
      wA(P.yellow, t > 0.85 ? 0.7 : 0.3), '10px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'api request / response', { x: mx + 4, y: h * 0.08 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
