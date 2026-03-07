// ai-roi.js — Balance scale: $2B spent vs $2B returns
// Scale balances perfectly. Company labels and revenue curve below.

function AiRoiDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var phase = B.easeOut(B.clamp(t / 0.7, 0, 1));

    // Title
    B.drawLabel(ctx, 'ai roi', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Scale center
    var pivotX = w * 0.5;
    var pivotY = h * 0.38;
    var beamLen = w * 0.32;
    var panDrop = 30;

    // Scale starts tilted left (costs heavy), then balances
    var tiltAngle = B.lerp(0.15, 0, B.easeInOut(B.clamp(phase / 0.8, 0, 1)));

    // Pivot triangle
    var triSize = 10;
    ctx.save();
    ctx.fillStyle = wA(P.white, 0.4);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX - triSize, pivotY + triSize * 1.5);
    ctx.lineTo(pivotX + triSize, pivotY + triSize * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Vertical stand
    B.drawLine(ctx, { x: pivotX, y: pivotY + triSize * 1.5 },
      { x: pivotX, y: pivotY + 60 },
      wA(P.white, 0.3), 2);

    // Base
    B.drawLine(ctx, { x: pivotX - 30, y: pivotY + 60 },
      { x: pivotX + 30, y: pivotY + 60 },
      wA(P.white, 0.3), 2);

    // Beam (tilts based on tiltAngle)
    var leftEnd = {
      x: pivotX - beamLen * Math.cos(tiltAngle),
      y: pivotY - beamLen * Math.sin(tiltAngle)
    };
    var rightEnd = {
      x: pivotX + beamLen * Math.cos(tiltAngle),
      y: pivotY + beamLen * Math.sin(tiltAngle)
    };

    B.drawLine(ctx, leftEnd, rightEnd, wA(P.white, 0.5), 2.5);

    // Left pan: costs (coral)
    var leftPanY = leftEnd.y + panDrop;
    var panW = 50;

    // Pan strings
    B.drawLine(ctx, leftEnd, { x: leftEnd.x - panW / 2, y: leftPanY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, leftEnd, { x: leftEnd.x + panW / 2, y: leftPanY },
      wA(P.white, 0.2), 1);

    // Pan plate
    B.drawLine(ctx,
      { x: leftEnd.x - panW / 2, y: leftPanY },
      { x: leftEnd.x + panW / 2, y: leftPanY },
      wA(P.coral, 0.5), 3);

    // Weight block on left
    var weightAppear = B.clamp(phase / 0.3, 0, 1);
    if (weightAppear > 0) {
      var wbH = 22 * weightAppear;
      ctx.save();
      ctx.fillStyle = wA(P.coral, 0.4);
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = 10;
      ctx.fillRect(leftEnd.x - 20, leftPanY - wbH, 40, wbH);
      ctx.restore();

      B.drawLabel(ctx, '$2B', { x: leftEnd.x, y: leftPanY - wbH - 8 },
        wA(P.coral, weightAppear * 0.9), 'bold 12px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'spent', { x: leftEnd.x, y: leftPanY + 14 },
        wA(P.coral, weightAppear * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // Right pan: returns (green)
    var rightPanY = rightEnd.y + panDrop;

    B.drawLine(ctx, rightEnd, { x: rightEnd.x - panW / 2, y: rightPanY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, rightEnd, { x: rightEnd.x + panW / 2, y: rightPanY },
      wA(P.white, 0.2), 1);

    B.drawLine(ctx,
      { x: rightEnd.x - panW / 2, y: rightPanY },
      { x: rightEnd.x + panW / 2, y: rightPanY },
      wA(P.green, 0.5), 3);

    // Weight block on right (appears slightly later)
    var retAppear = B.clamp((phase - 0.15) / 0.35, 0, 1);
    if (retAppear > 0) {
      var rbH = 22 * retAppear;
      ctx.save();
      ctx.fillStyle = wA(P.green, 0.4);
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 10;
      ctx.fillRect(rightEnd.x - 20, rightPanY - rbH, 40, rbH);
      ctx.restore();

      B.drawLabel(ctx, '$2B', { x: rightEnd.x, y: rightPanY - rbH - 8 },
        wA(P.green, retAppear * 0.9), 'bold 12px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'returns', { x: rightEnd.x, y: rightPanY + 14 },
        wA(P.green, retAppear * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // "Balanced" indicator when scale levels out
    if (tiltAngle < 0.02 && phase > 0.5) {
      var balAlpha = B.easeOut(B.clamp((phase - 0.7) / 0.2, 0, 1));
      B.drawLabel(ctx, '\u2696 balanced', { x: pivotX, y: pivotY - 22 },
        wA(P.yellow, balAlpha * 0.7), '11px "JetBrains Mono", monospace', 'center');
    }

    // === Company labels (bottom section) ===
    var compY = h * 0.72;
    var companies = [
      { label: 'JPMorgan', sub: '$2B AI budget', color: P.blue },
      { label: 'Microsoft', sub: '$13B ARR', color: P.green },
      { label: 'GitHub', sub: '4.7M subscribers', color: P.teal }
    ];

    for (var ci = 0; ci < companies.length; ci++) {
      var comp = companies[ci];
      var compPhase = B.clamp((phase - 0.4 - ci * 0.1) / 0.2, 0, 1);
      if (compPhase > 0) {
        var cx = w * (0.2 + ci * 0.3);
        B.drawDot(ctx, { x: cx - 35, y: compY }, 3, wA(comp.color, compPhase * 0.6), 4);
        B.drawLabel(ctx, comp.label, { x: cx - 20, y: compY - 1 },
          wA(comp.color, compPhase * 0.8), '10px "JetBrains Mono", monospace', 'left');
        B.drawLabel(ctx, comp.sub, { x: cx - 20, y: compY + 13 },
          wA(comp.color, compPhase * 0.4), '8px "JetBrains Mono", monospace', 'left');
      }
    }

    // === Small revenue growth curve (bottom right) ===
    if (phase > 0.5) {
      var rcAlpha = B.clamp((phase - 0.5) / 0.3, 0, 1);
      var rcX = w * 0.72;
      var rcY = h * 0.82;
      var rcW = w * 0.22;
      var rcH = h * 0.12;

      // Mini growth curve
      ctx.save();
      ctx.strokeStyle = wA(P.green, rcAlpha * 0.5);
      ctx.lineWidth = 2;
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var ri = 0; ri <= 30; ri++) {
        var rs = ri / 30;
        var rx = rcX + rs * rcW;
        var ry = rcY - Math.pow(rs, 2) * rcH;
        if (ri === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
      ctx.restore();

      B.drawLabel(ctx, 'revenue \u2191', { x: rcX + rcW + 6, y: rcY - rcH * 0.8 },
        wA(P.green, rcAlpha * 0.5), '8px "JetBrains Mono", monospace', 'left');
    }

    // Bottom insight
    if (t > 0.75) {
      var insAlpha = B.easeOut(B.clamp((t - 0.75) / 0.15, 0, 1));
      B.drawLabel(ctx, 'AI spend is paying for itself \u2014 the ROI is real',
        { x: w * 0.5, y: h * 0.94 },
        wA(P.white, insAlpha * 0.45), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
