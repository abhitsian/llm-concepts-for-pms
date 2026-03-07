// rlhf.js — Three stages of RLHF training pipeline
// Pretrain → Reward Model → RL Fine-tune, flowing left to right

function RlhfDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 12;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.06;
    var cy = h * 0.48;

    // Three phase regions
    var p1L = w * 0.04, p1R = w * 0.30;
    var p2L = w * 0.34, p2R = w * 0.62;
    var p3L = w * 0.66, p3R = w * 0.96;

    var phaseW1 = p1R - p1L, phaseW2 = p2R - p2L, phaseW3 = p3R - p3L;

    // Phase timing: each phase gets a third
    var phase1T = B.clamp(t / 0.30, 0, 1);
    var phase2T = B.clamp((t - 0.30) / 0.30, 0, 1);
    var phase3T = B.clamp((t - 0.60) / 0.30, 0, 1);

    // === PHASE 1: Pretrain (teal) ===
    var p1CenterX = (p1L + p1R) / 2, p1CenterY = cy;
    var p1Eased = B.easeOut(phase1T);

    // Phase box
    ctx.save();
    ctx.fillStyle = wA(P.teal, 0.06 * p1Eased);
    ctx.strokeStyle = wA(P.teal, 0.25 * p1Eased);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    var p1BoxT = cy - h * 0.28, p1BoxH = h * 0.56;
    ctx.fillRect(p1L, p1BoxT, phaseW1, p1BoxH);
    ctx.strokeRect(p1L, p1BoxT, phaseW1, p1BoxH);
    ctx.restore();

    B.drawLabel(ctx, '1. Pretrain', { x: p1CenterX, y: p1BoxT - 10 },
      wA(P.teal, 0.8 * p1Eased), '10px "JetBrains Mono", monospace', 'center');

    // Data flowing in (tiny dots from edges to center block)
    var modelPt1 = { x: p1CenterX + phaseW1 * 0.15, y: cy };
    var numDataPts = 12;
    for (var i = 0; i < numDataPts; i++) {
      var angle = (i / numDataPts) * Math.PI * 2;
      var dataR = Math.min(phaseW1, p1BoxH) * 0.42;
      var fromPt = {
        x: p1CenterX - phaseW1 * 0.1 + Math.cos(angle) * dataR,
        y: cy + Math.sin(angle) * dataR * 0.8
      };

      var dataDelay = i * 0.05;
      var dataT = B.clamp((p1Eased - dataDelay) / (1 - dataDelay), 0, 1);
      if (dataT <= 0) continue;

      // Bezier curve from data point to model center
      var dcp1 = {
        x: fromPt.x + (modelPt1.x - fromPt.x) * 0.4,
        y: fromPt.y + (modelPt1.y - fromPt.y) * 0.2 + Math.sin(i * 2) * 8
      };
      var dcp2 = {
        x: fromPt.x + (modelPt1.x - fromPt.x) * 0.7,
        y: modelPt1.y + Math.cos(i * 1.5) * 5
      };

      var dataAlpha = 0.15 + dataT * 0.35;
      ctx.save();
      ctx.strokeStyle = wA(P.teal, dataAlpha);
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var s = 0; s <= 30; s++) {
        var st = s / 30;
        if (st > dataT) break;
        var pt = B.cubicPt(fromPt, dcp1, dcp2, modelPt1, st);
        if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      B.drawDot(ctx, fromPt, 1.5, wA(P.teal, 0.3 * (1 - dataT)));
    }

    // Model dot growing
    var m1R = 5 + p1Eased * 8;
    B.drawDot(ctx, modelPt1, m1R, wA(P.teal, 0.2 + p1Eased * 0.3), p1Eased * 12);
    B.drawDot(ctx, modelPt1, m1R * 0.4, wA('#ffffff', p1Eased * 0.4));

    B.drawLabel(ctx, 'internet text', { x: p1CenterX - phaseW1 * 0.12, y: cy + h * 0.22 },
      wA(P.teal, 0.4 * p1Eased), '8px "JetBrains Mono", monospace', 'center');

    // === PHASE 2: Reward Model (coral) ===
    var p2CenterX = (p2L + p2R) / 2;
    var p2Eased = B.easeOut(phase2T);

    // Phase box
    ctx.save();
    ctx.fillStyle = wA(P.coral, 0.06 * p2Eased);
    ctx.strokeStyle = wA(P.coral, 0.25 * p2Eased);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.fillRect(p2L, p1BoxT, phaseW2, p1BoxH);
    ctx.strokeRect(p2L, p1BoxT, phaseW2, p1BoxH);
    ctx.restore();

    B.drawLabel(ctx, '2. Reward Model', { x: p2CenterX, y: p1BoxT - 10 },
      wA(P.coral, 0.8 * p2Eased), '10px "JetBrains Mono", monospace', 'center');

    if (p2Eased > 0) {
      // Two outputs (A and B) for comparison
      var outAY = cy - h * 0.14, outBY = cy + h * 0.14;
      var outAX = p2CenterX + phaseW2 * 0.1;
      var outBX = p2CenterX + phaseW2 * 0.1;
      var inputX = p2L + phaseW2 * 0.15;

      // Input dot
      B.drawDot(ctx, { x: inputX, y: cy }, 5, wA(P.white, 0.5 * p2Eased), 6);
      B.drawLabel(ctx, 'prompt', { x: inputX, y: cy + 14 },
        wA(P.white, 0.4 * p2Eased), '7px "JetBrains Mono", monospace', 'center');

      // Curves to output A and B
      var branchT = B.clamp(p2Eased / 0.5, 0, 1);
      var aCp1 = { x: inputX + (outAX - inputX) * 0.4, y: cy - 5 };
      var aCp2 = { x: inputX + (outAX - inputX) * 0.7, y: outAY + 5 };
      var bCp1 = { x: inputX + (outBX - inputX) * 0.4, y: cy + 5 };
      var bCp2 = { x: inputX + (outBX - inputX) * 0.7, y: outBY - 5 };

      B.drawCurve(ctx, [{ x: inputX, y: cy }, aCp1, aCp2, { x: outAX, y: outAY }], 30,
        wA(P.green, 0.5 * branchT), 1.5, 4);
      B.drawCurve(ctx, [{ x: inputX, y: cy }, bCp1, bCp2, { x: outBX, y: outBY }], 30,
        wA(P.coral, 0.4 * branchT), 1.5, 0);

      // Output A (preferred)
      B.drawDot(ctx, { x: outAX, y: outAY }, 5, wA(P.green, 0.6 * branchT), 8 * branchT);
      B.drawLabel(ctx, 'Output A', { x: outAX + 8, y: outAY - 10 },
        wA(P.green, 0.6 * branchT), '8px "JetBrains Mono", monospace', 'left');

      // Output B (not preferred)
      B.drawDot(ctx, { x: outBX, y: outBY }, 4, wA(P.coral, 0.4 * branchT));
      B.drawLabel(ctx, 'Output B', { x: outBX + 8, y: outBY - 10 },
        wA(P.coral, 0.4 * branchT), '8px "JetBrains Mono", monospace', 'left');

      // Human preference arrow (appears in second half)
      var prefT = B.clamp((p2Eased - 0.5) / 0.5, 0, 1);
      if (prefT > 0) {
        var prefEased = B.easeOut(prefT);
        // Arrow pointing to A
        var arrowX = outAX + phaseW2 * 0.2;
        B.drawLine(ctx, { x: arrowX, y: cy }, { x: arrowX, y: outAY + 4 },
          wA(P.yellow, 0.6 * prefEased), 2);
        B.drawDot(ctx, { x: arrowX, y: outAY + 4 }, 3, wA(P.yellow, 0.6 * prefEased), 6);

        B.drawLabel(ctx, '\u2191 preferred', { x: arrowX + 8, y: outAY + 4 },
          wA(P.yellow, 0.5 * prefEased), '8px "JetBrains Mono", monospace', 'left');

        // Human icon
        B.drawLabel(ctx, 'human', { x: arrowX, y: cy + 12 },
          wA(P.yellow, 0.4 * prefEased), '7px "JetBrains Mono", monospace', 'center');
      }
    }

    // === PHASE 3: RL Fine-tune (purple) ===
    var p3CenterX = (p3L + p3R) / 2;
    var p3Eased = B.easeOut(phase3T);

    // Phase box
    ctx.save();
    ctx.fillStyle = wA(P.purple, 0.06 * p3Eased);
    ctx.strokeStyle = wA(P.purple, 0.25 * p3Eased);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.fillRect(p3L, p1BoxT, phaseW3, p1BoxH);
    ctx.strokeRect(p3L, p1BoxT, phaseW3, p1BoxH);
    ctx.restore();

    B.drawLabel(ctx, '3. RL Fine-tune', { x: p3CenterX, y: p1BoxT - 10 },
      wA(P.purple, 0.8 * p3Eased), '10px "JetBrains Mono", monospace', 'center');

    if (p3Eased > 0) {
      // Circular loop: generate → score → update
      var loopCX = p3CenterX, loopCY = cy;
      var loopR = Math.min(phaseW3, p1BoxH) * 0.28;

      // Three nodes on the loop
      var genPt = { x: loopCX - loopR * 0.9, y: loopCY - loopR * 0.5 };
      var scorePt = { x: loopCX + loopR * 0.9, y: loopCY - loopR * 0.5 };
      var updatePt = { x: loopCX, y: loopCY + loopR * 0.8 };

      // Draw loop arrows as bezier curves
      var loopAlpha = 0.4 * p3Eased;

      // Generate → Score
      var gs1 = { x: genPt.x + (scorePt.x - genPt.x) * 0.3, y: genPt.y - loopR * 0.4 };
      var gs2 = { x: genPt.x + (scorePt.x - genPt.x) * 0.7, y: scorePt.y - loopR * 0.4 };
      B.drawCurve(ctx, [genPt, gs1, gs2, scorePt], 30, wA(P.purple, loopAlpha), 1.5, 4);

      // Score → Update
      var su1 = { x: scorePt.x + loopR * 0.3, y: scorePt.y + (updatePt.y - scorePt.y) * 0.4 };
      var su2 = { x: updatePt.x + loopR * 0.4, y: updatePt.y - (updatePt.y - scorePt.y) * 0.1 };
      B.drawCurve(ctx, [scorePt, su1, su2, updatePt], 30, wA(P.purple, loopAlpha), 1.5, 4);

      // Update → Generate
      var ug1 = { x: updatePt.x - loopR * 0.4, y: updatePt.y - (updatePt.y - genPt.y) * 0.1 };
      var ug2 = { x: genPt.x - loopR * 0.3, y: genPt.y + (updatePt.y - genPt.y) * 0.4 };
      B.drawCurve(ctx, [updatePt, ug1, ug2, genPt], 30, wA(P.purple, loopAlpha), 1.5, 4);

      // Nodes
      B.drawDot(ctx, genPt, 5, wA(P.purple, 0.6 * p3Eased), 8);
      B.drawLabel(ctx, 'generate', { x: genPt.x, y: genPt.y - 14 },
        wA(P.purple, 0.6 * p3Eased), '8px "JetBrains Mono", monospace', 'center');

      B.drawDot(ctx, scorePt, 5, wA(P.yellow, 0.6 * p3Eased), 8);
      B.drawLabel(ctx, 'reward', { x: scorePt.x, y: scorePt.y - 14 },
        wA(P.yellow, 0.6 * p3Eased), '8px "JetBrains Mono", monospace', 'center');

      B.drawDot(ctx, updatePt, 5, wA(P.green, 0.6 * p3Eased), 8);
      B.drawLabel(ctx, 'update', { x: updatePt.x, y: updatePt.y + 16 },
        wA(P.green, 0.6 * p3Eased), '8px "JetBrains Mono", monospace', 'center');

      // Tracer dot orbiting the loop
      var orbitT = (time * 0.3) % 1;
      var orbitPt;
      if (orbitT < 0.333) {
        var lt = orbitT / 0.333;
        orbitPt = B.cubicPt(genPt, gs1, gs2, scorePt, lt);
      } else if (orbitT < 0.666) {
        var lt = (orbitT - 0.333) / 0.333;
        orbitPt = B.cubicPt(scorePt, su1, su2, updatePt, lt);
      } else {
        var lt = (orbitT - 0.666) / 0.334;
        orbitPt = B.cubicPt(updatePt, ug1, ug2, genPt, lt);
      }
      B.drawDot(ctx, orbitPt, 3, wA(P.purple, 0.8 * p3Eased), 12);
    }

    // === Connection arrows between phases ===
    if (phase1T > 0.7) {
      var connAlpha = B.clamp((phase1T - 0.7) / 0.3, 0, 0.4);
      var a1 = { x: p1R + 2, y: cy }, a2 = { x: p2L - 2, y: cy };
      B.drawLine(ctx, a1, a2, wA(P.white, connAlpha), 1.5);
      B.drawDot(ctx, a2, 3, wA(P.white, connAlpha));
    }
    if (phase2T > 0.7) {
      var connAlpha = B.clamp((phase2T - 0.7) / 0.3, 0, 0.4);
      var a1 = { x: p2R + 2, y: cy }, a2 = { x: p3L - 2, y: cy };
      B.drawLine(ctx, a1, a2, wA(P.white, connAlpha), 1.5);
      B.drawDot(ctx, a2, 3, wA(P.white, connAlpha));
    }

    // === Output: refined model ===
    if (t > 0.90) {
      var outAlpha = B.clamp((t - 0.90) / 0.08, 0, 1);
      var outPt = { x: p3R - 10, y: cy };
      var outR = 4 + outAlpha * 8;
      B.drawDot(ctx, outPt, outR, wA(P.purple, 0.3 * outAlpha), 20 * outAlpha);
      B.drawDot(ctx, outPt, outR * 0.5, wA('#ffffff', 0.7 * outAlpha));
      B.drawLabel(ctx, 'aligned', { x: outPt.x, y: outPt.y + outR + 12 },
        wA(P.purple, 0.7 * outAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Formula
    if (t > 0.92) {
      var fAlpha = B.clamp((t - 0.92) / 0.06, 0, 0.5);
      B.drawLabel(ctx, 'pretrain \u2192 rank preferences \u2192 optimize policy',
        { x: w / 2, y: h * 0.93 },
        wA(P.white, fAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'rlhf', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
