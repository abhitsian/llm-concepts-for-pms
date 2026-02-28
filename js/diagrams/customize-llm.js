// customize-llm.js — Three customization paths: Prompting, RAG, Fine-tuning
// Branching Bezier paths from a base model, each with different complexity.

function CustomizeLlmDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 9;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.10;
    var cy = h * 0.50;
    var t = (time % CYCLE) / CYCLE;

    // Base model dot
    var basePt = { x: mx + w * 0.08, y: cy };
    var endX = w - mx - w * 0.06;

    // Three paths: prompting (top), RAG (mid), fine-tuning (bottom)
    var pathSpacing = h * 0.22;

    // Path 1: Prompting — short, direct, green
    var p1End = { x: endX, y: cy - pathSpacing };
    var p1Cp1 = { x: basePt.x + (endX - basePt.x) * 0.3, y: cy - pathSpacing * 0.3 };
    var p1Cp2 = { x: basePt.x + (endX - basePt.x) * 0.6, y: p1End.y + 5 };
    var p1Pts = [basePt, p1Cp1, p1Cp2, p1End];

    // Path 2: RAG — medium curve through retrieval node, teal
    var ragNode = { x: basePt.x + (endX - basePt.x) * 0.5, y: cy + 8 };
    var p2End = { x: endX, y: cy };
    var p2Cp1 = { x: basePt.x + (endX - basePt.x) * 0.2, y: cy + 15 };
    var p2Cp2 = { x: ragNode.x - 20, y: cy + 12 };
    var p2aPts = [basePt, p2Cp1, p2Cp2, ragNode]; // first half
    var p2bCp1 = { x: ragNode.x + 30, y: cy - 5 };
    var p2bCp2 = { x: endX - (endX - ragNode.x) * 0.3, y: cy + 2 };
    var p2bPts = [ragNode, p2bCp1, p2bCp2, p2End]; // second half

    // Path 3: Fine-tuning — deep curve, purple
    var p3End = { x: endX, y: cy + pathSpacing };
    var p3Cp1 = { x: basePt.x + (endX - basePt.x) * 0.2, y: cy + pathSpacing * 0.5 };
    var p3Cp2 = { x: basePt.x + (endX - basePt.x) * 0.5, y: p3End.y + pathSpacing * 0.3 };
    var p3Pts = [basePt, p3Cp1, p3Cp2, p3End];

    // Animation phases: path1 draws 0.0-0.25, path2 0.25-0.55, path3 0.55-0.85, hold 0.85-1.0
    var p1T = B.easeOut(B.clamp(t / 0.25, 0, 1));
    var p2T = B.easeOut(B.clamp((t - 0.25) / 0.30, 0, 1));
    var p3T = B.easeOut(B.clamp((t - 0.55) / 0.30, 0, 1));

    // Helper to draw partial curve
    function drawPartial(pts, progress, color, width, glow) {
      if (progress <= 0) return;
      ctx.save();
      if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var s = i / 60;
        if (s > progress) break;
        var pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], s);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw dim base paths
    B.drawCurve(ctx, p1Pts, 60, wA(P.green, 0.08), 1, 0);
    B.drawCurve(ctx, p2aPts, 40, wA(P.teal, 0.08), 1, 0);
    B.drawCurve(ctx, p2bPts, 40, wA(P.teal, 0.08), 1, 0);
    B.drawCurve(ctx, p3Pts, 60, wA(P.purple, 0.08), 1, 0);

    // Path 1: Prompting (fast, green)
    drawPartial(p1Pts, p1T, wA(P.green, 0.8), 2.5, 10);
    if (p1T > 0 && p1T < 1) {
      var d = B.cubicPt(p1Pts[0], p1Pts[1], p1Pts[2], p1Pts[3], p1T);
      B.drawDot(ctx, d, 4, P.green, 12);
    }
    if (p1T > 0.5) {
      var la = B.clamp((p1T - 0.5) / 0.5, 0, 0.8);
      B.drawLabel(ctx, 'PROMPTING', { x: p1End.x - 6, y: p1End.y - 16 },
        wA(P.green, la), '11px "JetBrains Mono", monospace', 'right');
      B.drawLabel(ctx, 'minutes / $0', { x: p1End.x - 6, y: p1End.y + 16 },
        wA(P.green, la * 0.6), '9px "JetBrains Mono", monospace', 'right');
    }
    if (p1T >= 1) B.drawDot(ctx, p1End, 5, wA(P.green, 0.6), 8);

    // Path 2: RAG (medium, teal) — two halves
    var p2aT = B.clamp(p2T / 0.5, 0, 1);
    var p2bT = B.clamp((p2T - 0.5) / 0.5, 0, 1);
    drawPartial(p2aPts, p2aT, wA(P.teal, 0.8), 2.5, 10);
    if (p2aT >= 1) {
      drawPartial(p2bPts, p2bT, wA(P.teal, 0.8), 2.5, 10);
    }
    // Travelling dot
    if (p2T > 0 && p2T < 1) {
      var dp;
      if (p2T < 0.5) {
        dp = B.cubicPt(p2aPts[0], p2aPts[1], p2aPts[2], p2aPts[3], p2aT);
      } else {
        dp = B.cubicPt(p2bPts[0], p2bPts[1], p2bPts[2], p2bPts[3], p2bT);
      }
      B.drawDot(ctx, dp, 4, P.teal, 12);
    }
    // Retrieval node
    if (p2aT >= 0.9) {
      var ragAlpha = B.clamp((p2aT - 0.9) / 0.1, 0, 0.7);
      B.drawRing(ctx, ragNode, 8, wA(P.teal, ragAlpha), 1.5);
      B.drawLabel(ctx, 'retrieval', { x: ragNode.x, y: ragNode.y - 16 },
        wA(P.teal, ragAlpha * 0.7), '9px "JetBrains Mono", monospace', 'center');
    }
    if (p2T > 0.5) {
      var la = B.clamp((p2T - 0.5) / 0.5, 0, 0.8);
      B.drawLabel(ctx, 'RAG', { x: p2End.x - 6, y: p2End.y - 16 },
        wA(P.teal, la), '11px "JetBrains Mono", monospace', 'right');
      B.drawLabel(ctx, 'days / $1K', { x: p2End.x - 6, y: p2End.y + 16 },
        wA(P.teal, la * 0.6), '9px "JetBrains Mono", monospace', 'right');
    }
    if (p2T >= 1) B.drawDot(ctx, p2End, 5, wA(P.teal, 0.6), 8);

    // Path 3: Fine-tuning (slow, purple)
    drawPartial(p3Pts, p3T, wA(P.purple, 0.8), 2.5, 10);
    if (p3T > 0 && p3T < 1) {
      var d = B.cubicPt(p3Pts[0], p3Pts[1], p3Pts[2], p3Pts[3], p3T);
      B.drawDot(ctx, d, 4, P.purple, 12);
    }
    if (p3T > 0.5) {
      var la = B.clamp((p3T - 0.5) / 0.5, 0, 0.8);
      B.drawLabel(ctx, 'FINE-TUNING', { x: p3End.x - 6, y: p3End.y - 16 },
        wA(P.purple, la), '11px "JetBrains Mono", monospace', 'right');
      B.drawLabel(ctx, 'weeks / $10K+', { x: p3End.x - 6, y: p3End.y + 16 },
        wA(P.purple, la * 0.6), '9px "JetBrains Mono", monospace', 'right');
    }
    if (p3T >= 1) B.drawDot(ctx, p3End, 5, wA(P.purple, 0.6), 8);

    // Base model dot
    B.drawDot(ctx, basePt, 8, wA(P.white, 0.3), 12);
    B.drawDot(ctx, basePt, 5, P.white, 0);
    B.drawLabel(ctx, 'base model', { x: basePt.x, y: basePt.y - 20 },
      wA(P.white, 0.7), '10px "JetBrains Mono", monospace', 'center');

    // Effort scale on right edge
    if (t > 0.85) {
      var scaleAlpha = B.clamp((t - 0.85) / 0.10, 0, 0.5);
      var sx = w - mx * 0.5;
      B.drawLine(ctx, { x: sx, y: p1End.y }, { x: sx, y: p3End.y },
        wA(P.white, scaleAlpha), 1, [3, 3]);
      B.drawLabel(ctx, 'low', { x: sx + 4, y: p1End.y },
        wA(P.white, scaleAlpha), '8px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'high', { x: sx + 4, y: p3End.y },
        wA(P.white, scaleAlpha), '8px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'effort', { x: sx, y: cy },
        wA(P.white, scaleAlpha * 0.7), '8px "JetBrains Mono", monospace', 'center');
    }

    // Formula at bottom
    B.drawLabel(ctx, 'quality = f(data, effort, cost)',
      { x: w / 2, y: h * 0.93 },
      wA(P.white, 0.4), '10px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'customization approaches', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
