// interface-free.js — Evolution of AI interfaces: Chat -> Copilot -> Inline -> Ambient
// Four paradigms shown as different Bezier curve patterns, morphing left to right.

function InterfaceFreeDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 14;
  var PHASE_DUR = 0.25; // each paradigm gets 25% of cycle

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var colW = w / 4;
    var topY = h * 0.18, botY = h * 0.8;

    // Column definitions
    var cols = [
      { label: 'Chat', trait: 'explicit', color: P.teal },
      { label: 'Copilot', trait: 'alongside', color: P.green },
      { label: 'Inline', trait: 'within', color: P.yellow },
      { label: 'Ambient', trait: 'invisible', color: P.purple }
    ];

    // Reveal progress: each column appears in sequence
    for (var c = 0; c < 4; c++) {
      var col = cols[c];
      var cx = colW * c + colW / 2;
      var revealT = B.clamp((t - c * PHASE_DUR) / (PHASE_DUR * 0.8), 0, 1);
      var alpha = B.easeOut(revealT);
      if (alpha < 0.01) continue;

      var x0 = colW * c + colW * 0.15;
      var x1 = colW * c + colW * 0.85;
      var spanX = x1 - x0;

      // Column header
      B.drawLabel(ctx, col.label, { x: cx, y: topY - 8 },
        wA(col.color, alpha * 0.9), '12px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, col.trait, { x: cx, y: topY + 10 },
        wA(col.color, alpha * 0.4), '8px "JetBrains Mono", monospace', 'center');

      // --- Draw each paradigm pattern ---
      if (c === 0) {
        // CHAT: zigzag back-and-forth
        var segments = 6;
        var stepY = (botY - topY - 40) / segments;
        var startY = topY + 30;
        for (var z = 0; z < segments; z++) {
          var isUser = z % 2 === 0;
          var zA = B.clamp((alpha - z * 0.05) / 0.5, 0, 1);
          var zColor = isUser ? P.white : col.color;
          var fromX = isUser ? x0 : x1;
          var toX = isUser ? x1 : x0;
          var fy = startY + z * stepY;
          var ty = startY + (z + 1) * stepY;
          // Animated zigzag with slight curve
          var zPulse = Math.sin(time * 2 + z) * 0.1;
          var cp1 = { x: B.lerp(fromX, toX, 0.3), y: fy + stepY * 0.3 + zPulse * 10 };
          var cp2 = { x: B.lerp(fromX, toX, 0.7), y: fy + stepY * 0.7 - zPulse * 10 };
          B.drawCurve(ctx, [{ x: fromX, y: fy }, cp1, cp2, { x: toX, y: ty }],
            30, wA(zColor, zA * 0.5), 1.5, zA * 4);
          // Dot at start
          B.drawDot(ctx, { x: fromX, y: fy }, 2.5, wA(zColor, zA * 0.6));
        }
        // Labels
        B.drawLabel(ctx, 'user', { x: x0 - 4, y: startY },
          wA(P.white, alpha * 0.35), '7px "JetBrains Mono", monospace', 'right');
        B.drawLabel(ctx, 'AI', { x: x1 + 4, y: startY + stepY },
          wA(col.color, alpha * 0.35), '7px "JetBrains Mono", monospace', 'left');

      } else if (c === 1) {
        // COPILOT: two parallel curves, user (white) + AI (green) alongside
        var cStartY = topY + 30, cEndY = botY - 10;
        var userX = cx - spanX * 0.18, aiX = cx + spanX * 0.18;
        var uPts = [{ x: userX, y: cStartY }, { x: userX - 8, y: B.lerp(cStartY, cEndY, 0.33) },
          { x: userX + 5, y: B.lerp(cStartY, cEndY, 0.66) }, { x: userX, y: cEndY }];
        B.drawCurve(ctx, uPts, 50, wA(P.white, alpha * 0.5), 2, alpha * 6);
        var wave = Math.sin(time * 1.5) * 6;
        var aPts = [{ x: aiX, y: cStartY }, { x: aiX + wave, y: B.lerp(cStartY, cEndY, 0.33) },
          { x: aiX - wave * 0.5, y: B.lerp(cStartY, cEndY, 0.66) }, { x: aiX, y: cEndY }];
        B.drawCurve(ctx, aPts, 50, wA(col.color, alpha * 0.5), 2, alpha * 6);
        // Dashed connections between them (assist moments)
        for (var ac = 0; ac < 3; ac++) {
          var acT2 = (ac + 1) * 0.25;
          var uP = B.cubicPt(uPts[0], uPts[1], uPts[2], uPts[3], acT2);
          var aP = B.cubicPt(aPts[0], aPts[1], aPts[2], aPts[3], acT2);
          B.drawLine(ctx, uP, aP, wA(col.color, alpha * (0.2 + Math.sin(time * 2 + ac) * 0.15)), 1, [3, 3]);
        }
        var cpPt = B.cubicPt(aPts[0], aPts[1], aPts[2], aPts[3], (time * 0.3) % 1);
        B.drawDot(ctx, cpPt, 3, wA(col.color, alpha * 0.7), 8);
        B.drawLabel(ctx, 'user', { x: userX, y: cStartY - 10 },
          wA(P.white, alpha * 0.35), '7px "JetBrains Mono", monospace', 'center');
        B.drawLabel(ctx, 'AI', { x: aiX, y: cStartY - 10 },
          wA(col.color, alpha * 0.35), '7px "JetBrains Mono", monospace', 'center');

      } else if (c === 2) {
        // INLINE: single user curve with glowing AI intervention nodes
        var iStartY = topY + 30;
        var iEndY = botY - 10;
        var iPts = [
          { x: cx, y: iStartY },
          { x: cx - 15, y: B.lerp(iStartY, iEndY, 0.33) },
          { x: cx + 15, y: B.lerp(iStartY, iEndY, 0.66) },
          { x: cx, y: iEndY }
        ];
        B.drawCurve(ctx, iPts, 60, wA(P.white, alpha * 0.4), 2, alpha * 4);

        // AI intervention points along the curve
        var interventions = [0.25, 0.5, 0.75];
        for (var iv = 0; iv < interventions.length; iv++) {
          var ivPt = B.cubicPt(iPts[0], iPts[1], iPts[2], iPts[3], interventions[iv]);
          var ivPulse = Math.sin(time * 3 + iv * 2) * 0.3 + 0.7;
          B.drawDot(ctx, ivPt, 6, wA(col.color, alpha * ivPulse * 0.4), 14);
          B.drawDot(ctx, ivPt, 3, wA(col.color, alpha * ivPulse * 0.8), 6);

          // Small "AI" label
          B.drawLabel(ctx, 'ai', { x: ivPt.x + 12, y: ivPt.y },
            wA(col.color, alpha * 0.3), '6px "JetBrains Mono", monospace', 'left');
        }

        // Flowing user dot
        var iDot = (time * 0.25) % 1;
        var iDotPt = B.cubicPt(iPts[0], iPts[1], iPts[2], iPts[3], iDot);
        B.drawDot(ctx, iDotPt, 3, wA(P.white, alpha * 0.7), 6);

      } else {
        // AMBIENT: smooth curve where AI is invisible, subtly shaping the path
        var aStartY = topY + 30;
        var aEndY = botY - 10;

        // Gentle, elegant S-curve (AI smoothed the path)
        var aw = Math.sin(time * 0.8) * 8;
        var amPts = [
          { x: cx, y: aStartY },
          { x: cx + 12 + aw, y: B.lerp(aStartY, aEndY, 0.33) },
          { x: cx - 12 - aw, y: B.lerp(aStartY, aEndY, 0.66) },
          { x: cx, y: aEndY }
        ];
        B.drawCurve(ctx, amPts, 60, wA(P.white, alpha * 0.5), 2, alpha * 5);

        // Subtle purple glow aura along the curve (the invisible AI)
        for (var ag = 0; ag <= 30; ag++) {
          var agT = ag / 30;
          var agPt = B.cubicPt(amPts[0], amPts[1], amPts[2], amPts[3], agT);
          var agPulse = Math.sin(time * 1.5 + agT * 6) * 0.15 + 0.15;
          B.drawDot(ctx, agPt, 8, wA(col.color, alpha * agPulse * 0.15));
        }

        // Smooth flowing dot
        var amDot = (time * 0.2) % 1;
        var amDotPt = B.cubicPt(amPts[0], amPts[1], amPts[2], amPts[3], amDot);
        B.drawDot(ctx, amDotPt, 3, wA(P.white, alpha * 0.6), 4);
      }

      // Vertical separator (except after last)
      if (c < 3) {
        B.drawLine(ctx,
          { x: colW * (c + 1), y: topY - 15 },
          { x: colW * (c + 1), y: botY + 10 },
          wA(P.white, 0.05), 1, [4, 8]);
      }
    }

    // Bottom arrows: human control decreasing, AI integration increasing
    var arrowY = botY + 25;
    var arrAlpha = B.clamp(t / 0.3, 0, 0.5);

    // Human control (decreasing bars left to right)
    B.drawLabel(ctx, 'human control', { x: w * 0.12, y: arrowY },
      wA(P.white, arrAlpha), '8px "JetBrains Mono", monospace', 'left');
    for (var ar = 0; ar < 4; ar++) {
      var arLen = (4 - ar) * 3;
      if (arLen > 1) B.drawLine(ctx, { x: w * 0.32 + ar * colW * 0.5, y: arrowY - arLen },
        { x: w * 0.32 + ar * colW * 0.5, y: arrowY + arLen }, wA(P.white, arrAlpha * (1 - ar * 0.2)), 1.5);
    }
    // AI integration (increasing bars left to right)
    B.drawLabel(ctx, 'AI integration', { x: w * 0.88, y: arrowY + 16 },
      wA(P.purple, arrAlpha), '8px "JetBrains Mono", monospace', 'right');
    for (var ar2 = 0; ar2 < 4; ar2++) {
      var ar2Len = (4 - ar2) * 3;
      if (ar2Len > 1) B.drawLine(ctx, { x: w * 0.88 - ar2 * colW * 0.5, y: arrowY + 16 - ar2Len },
        { x: w * 0.88 - ar2 * colW * 0.5, y: arrowY + 16 + ar2Len }, wA(P.purple, arrAlpha * (1 - ar2 * 0.2)), 1.5);
    }

    // Title
    B.drawLabel(ctx, 'beyond the chat interface', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
