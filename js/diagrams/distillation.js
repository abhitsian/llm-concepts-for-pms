// distillation.js — Large teacher model transferring knowledge to small student model
// Teacher circle → flowing soft labels → Student circle growing brighter

function DistillationDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.06;
    var cy = h * 0.45;

    // Layout
    var teacherX = w * 0.22, studentX = w * 0.78;
    var teacherR = Math.min(w * 0.12, h * 0.18);
    var studentR = teacherR * 0.50;

    var teacherPt = { x: teacherX, y: cy };
    var studentPt = { x: studentX, y: cy };

    // Knowledge transfer phase: 0.05 to 0.85
    var transferT = B.clamp((t - 0.05) / 0.80, 0, 1);
    var transferEased = B.easeInOut(transferT);

    // === TEACHER MODEL ===
    // Large, bright, blue circle
    var teacherGlow = 15 + 5 * Math.sin(time * 1.5);
    B.drawDot(ctx, teacherPt, teacherR, wA(P.blue, 0.12), teacherGlow);
    B.drawDot(ctx, teacherPt, teacherR * 0.85, wA(P.blue, 0.2), 10);
    B.drawDot(ctx, teacherPt, teacherR * 0.6, wA(P.blue, 0.25));
    B.drawDot(ctx, teacherPt, teacherR * 0.3, wA('#ffffff', 0.3));

    // Concentric rings (showing depth/knowledge)
    B.drawRing(ctx, teacherPt, teacherR * 0.45, wA(P.blue, 0.15), 1);
    B.drawRing(ctx, teacherPt, teacherR * 0.7, wA(P.blue, 0.1), 1);
    B.drawRing(ctx, teacherPt, teacherR, wA(P.blue, 0.3), 1.5);

    B.drawLabel(ctx, 'Teacher 70B', { x: teacherX, y: cy - teacherR - 16 },
      wA(P.blue, 0.8), '11px "JetBrains Mono", monospace', 'center');

    // === STUDENT MODEL ===
    // Small, growing brighter, green circle
    var studentBright = 0.3 + transferEased * 0.6;
    var studentGrowth = 1 + transferEased * 0.3; // grows slightly
    var sR = studentR * studentGrowth;
    var studentGlow = transferEased * 20;

    B.drawDot(ctx, studentPt, sR, wA(P.green, 0.08 + studentBright * 0.15), studentGlow);
    B.drawDot(ctx, studentPt, sR * 0.85, wA(P.green, studentBright * 0.25), studentGlow * 0.5);
    B.drawDot(ctx, studentPt, sR * 0.5, wA(P.green, studentBright * 0.3));
    B.drawDot(ctx, studentPt, sR * 0.2, wA('#ffffff', studentBright * 0.4));

    B.drawRing(ctx, studentPt, sR * 0.5, wA(P.green, 0.1 + transferEased * 0.15), 1);
    B.drawRing(ctx, studentPt, sR, wA(P.green, 0.15 + studentBright * 0.2), 1.5);

    B.drawLabel(ctx, 'Student 7B', { x: studentX, y: cy - sR - 16 },
      wA(P.green, 0.8), '11px "JetBrains Mono", monospace', 'center');

    // === KNOWLEDGE TRANSFER (flowing Bezier curves with soft label dots) ===
    var numStreams = 5;
    var streamOffsets = [-0.35, -0.17, 0, 0.17, 0.35];

    for (var s = 0; s < numStreams; s++) {
      var yOff = streamOffsets[s] * h * 0.4;
      var fromPt = { x: teacherX + teacherR * 0.9, y: cy + yOff * 0.3 };
      var toPt = { x: studentX - sR * 0.9, y: cy + yOff * 0.3 };

      var cp1 = {
        x: teacherX + (studentX - teacherX) * 0.30,
        y: cy + yOff * 0.8 + Math.sin(time * 1.2 + s) * 8
      };
      var cp2 = {
        x: teacherX + (studentX - teacherX) * 0.70,
        y: cy + yOff * 0.6 + Math.cos(time * 1.5 + s) * 6
      };

      // Draw dim path curve
      if (transferT > 0) {
        B.drawCurve(ctx, [fromPt, cp1, cp2, toPt], 40,
          wA(P.white, 0.06), 1, 0);
      }

      // Flowing dots (soft labels)
      if (transferT > 0) {
        var numDots = 4;
        for (var d = 0; d < numDots; d++) {
          var dotPhase = ((time * 0.4 + s * 0.15 + d * 0.25) % 1);
          // Only show if transfer is active
          if (dotPhase > transferEased) continue;

          var dotPt = B.cubicPt(fromPt, cp1, cp2, toPt, dotPhase);
          var dotAlpha = Math.sin(dotPhase * Math.PI) * 0.7; // fade at edges
          var dotR = 2 + Math.sin(dotPhase * Math.PI) * 1.5;

          // Color gradient: blue near teacher, green near student
          if (dotPhase < 0.5) {
            B.drawDot(ctx, dotPt, dotR, wA(P.blue, dotAlpha * transferEased), 6);
          } else {
            B.drawDot(ctx, dotPt, dotR, wA(P.green, dotAlpha * transferEased), 6);
          }
        }

        // Stream curve glow
        var streamAlpha = 0.15 * transferEased * (0.6 + 0.4 * Math.sin(time * 2 + s * 0.8));
        ctx.save();
        ctx.strokeStyle = wA(P.white, streamAlpha);
        ctx.lineWidth = 1;
        ctx.shadowColor = P.blue;
        ctx.shadowBlur = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var i = 0; i <= 40; i++) {
          var st = i / 40;
          var pt = B.cubicPt(fromPt, cp1, cp2, toPt, st);
          if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // "soft labels" label in the middle
    if (transferT > 0.1) {
      var slAlpha = B.clamp((transferT - 0.1) / 0.2, 0, 0.5);
      B.drawLabel(ctx, 'soft labels', { x: (teacherX + studentX) / 2, y: cy - h * 0.25 },
        wA(P.white, slAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // === QUALITY BARS ===
    var barX = w * 0.12, barW = w * 0.20;
    var barH = 8;
    var barTopY = h * 0.76;

    // Teacher bar (92%, static)
    var teacherBarAlpha = 0.6;
    B.drawLabel(ctx, 'Teacher:', { x: barX - 4, y: barTopY },
      wA(P.blue, teacherBarAlpha), '9px "JetBrains Mono", monospace', 'right');
    ctx.save();
    ctx.fillStyle = wA(P.blue, 0.15);
    ctx.fillRect(barX, barTopY - barH / 2, barW, barH);
    ctx.fillStyle = wA(P.blue, 0.5);
    ctx.fillRect(barX, barTopY - barH / 2, barW * 0.92, barH);
    ctx.restore();
    B.drawLabel(ctx, '92%', { x: barX + barW + 8, y: barTopY },
      wA(P.blue, 0.6), '10px "JetBrains Mono", monospace', 'left');

    // Student bar (grows from 60% to 85%)
    var studentBarY = barTopY + 24;
    var studentQuality = B.lerp(0.60, 0.85, transferEased);
    var studentBarColor = transferEased > 0.7 ? P.green : P.green;

    B.drawLabel(ctx, 'Student:', { x: barX - 4, y: studentBarY },
      wA(P.green, 0.6), '9px "JetBrains Mono", monospace', 'right');
    ctx.save();
    ctx.fillStyle = wA(P.green, 0.15);
    ctx.fillRect(barX, studentBarY - barH / 2, barW, barH);
    ctx.fillStyle = wA(P.green, 0.35 + transferEased * 0.25);
    ctx.fillRect(barX, studentBarY - barH / 2, barW * studentQuality, barH);
    ctx.restore();
    B.drawLabel(ctx, Math.round(studentQuality * 100) + '%',
      { x: barX + barW + 8, y: studentBarY },
      wA(P.green, 0.6), '10px "JetBrains Mono", monospace', 'left');

    // Gap indicator
    if (transferT > 0.5) {
      var gapAlpha = B.clamp((transferT - 0.5) / 0.3, 0, 0.5);
      var gapPct = Math.round((0.92 - studentQuality) * 100);
      B.drawLabel(ctx, gapPct + '% gap', { x: barX + barW + 50, y: (barTopY + studentBarY) / 2 },
        wA(P.yellow, gapAlpha), '9px "JetBrains Mono", monospace', 'left');
    }

    // === Size comparison ===
    var sizeY = h * 0.76;
    var sizeX = w * 0.65;
    B.drawLabel(ctx, '70B \u2192 7B', { x: sizeX, y: sizeY },
      wA(P.white, 0.4), '11px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, '10x smaller', { x: sizeX, y: sizeY + 16 },
      wA(P.yellow, 0.4), '9px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, '10x cheaper to run', { x: sizeX, y: sizeY + 30 },
      wA(P.green, 0.35), '9px "JetBrains Mono", monospace', 'left');

    // === Formula ===
    if (t > 0.85) {
      var fAlpha = B.clamp((t - 0.85) / 0.1, 0, 0.5);
      B.drawLabel(ctx, 'student learns soft probabilities, not just hard labels',
        { x: w / 2, y: h * 0.93 },
        wA(P.white, fAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'distillation', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
