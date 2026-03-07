// mixture-experts.js — Router directing tokens to 2-of-8 expert blocks
// Input token → Router → 2 active experts → combined output

function MixtureExpertsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;
  var NUM_EXPERTS = 8;

  // Different activation patterns per cycle phase
  var activationPatterns = [
    [1, 5],  // experts 1 and 5 active
    [0, 3],  // experts 0 and 3
    [2, 7],  // experts 2 and 7
    [4, 6],  // experts 4 and 6
  ];

  var expertColors = [P.teal, P.green, P.blue, P.purple, P.coral, P.yellow, P.teal, P.green];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.06;

    // Layout
    var inputX = w * 0.08, routerX = w * 0.30, expertX = w * 0.55, outputX = w * 0.85;
    var cy = h * 0.48;

    // Expert box dimensions
    var expertH = h * 0.07;
    var expertW = w * 0.14;
    var expertSpacing = (h * 0.78) / NUM_EXPERTS;
    var expertTopY = cy - (NUM_EXPERTS / 2) * expertSpacing + expertSpacing / 2;

    // Current activation pattern (cycles through patterns)
    var patternIdx = Math.floor((time / (CYCLE / activationPatterns.length))) % activationPatterns.length;
    var activeExperts = activationPatterns[patternIdx];

    // Sub-cycle within each pattern
    var subCycle = (time % (CYCLE / activationPatterns.length)) / (CYCLE / activationPatterns.length);

    // Phase 1: Token arrives at router (0 to 0.2)
    var arriveT = B.clamp(subCycle / 0.2, 0, 1);
    // Phase 2: Router activates and routes (0.2 to 0.5)
    var routeT = B.clamp((subCycle - 0.2) / 0.3, 0, 1);
    // Phase 3: Experts process and combine (0.5 to 0.8)
    var processT = B.clamp((subCycle - 0.5) / 0.3, 0, 1);
    // Phase 4: Output (0.8 to 1.0)
    var outputT = B.clamp((subCycle - 0.8) / 0.2, 0, 1);

    // --- Input token ---
    var inputPt = { x: inputX, y: cy };
    var routerPt = { x: routerX, y: cy };

    // Token moving to router
    var tokenPos;
    if (arriveT < 1) {
      var arrEased = B.easeOut(arriveT);
      tokenPos = B.lerpPt(inputPt, routerPt, arrEased);
      B.drawDot(ctx, tokenPos, 5, wA(P.white, 0.8), 10);

      // Trail curve
      var trailCp1 = { x: inputX + (routerX - inputX) * 0.4, y: cy - 5 };
      var trailCp2 = { x: inputX + (routerX - inputX) * 0.7, y: cy + 3 };
      ctx.save();
      ctx.strokeStyle = wA(P.white, 0.3 * arrEased);
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var s = 0; s <= 30; s++) {
        var st = s / 30;
        if (st > arrEased) break;
        var pt = B.cubicPt(inputPt, trailCp1, trailCp2, routerPt, st);
        if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    B.drawLabel(ctx, 'token', { x: inputX, y: cy - 16 },
      wA(P.white, 0.5), '9px "JetBrains Mono", monospace', 'center');

    // --- Router node ---
    var routerGlow = arriveT >= 1 ? 15 + 5 * Math.sin(time * 4) : 0;
    var routerAlpha = 0.3 + (arriveT >= 1 ? 0.5 : arriveT * 0.3);
    B.drawDot(ctx, routerPt, 12, wA(P.yellow, routerAlpha * 0.3), routerGlow);
    B.drawDot(ctx, routerPt, 8, wA(P.yellow, routerAlpha), routerGlow * 0.5);
    B.drawDot(ctx, routerPt, 3, wA('#ffffff', routerAlpha * 0.8));
    B.drawLabel(ctx, 'Router', { x: routerX, y: cy - 22 },
      wA(P.yellow, 0.7), '10px "JetBrains Mono", monospace', 'center');

    // --- Expert boxes ---
    for (var e = 0; e < NUM_EXPERTS; e++) {
      var ey = expertTopY + e * expertSpacing;
      var ex = expertX;
      var isActive = activeExperts.indexOf(e) !== -1;
      var eColor = expertColors[e % expertColors.length];

      // Determine alpha
      var boxAlpha, fillAlpha;
      if (isActive && routeT > 0) {
        var activeEased = B.easeOut(routeT);
        boxAlpha = 0.3 + activeEased * 0.5;
        fillAlpha = 0.1 + activeEased * 0.25;

        // Glow when processing
        if (processT > 0) {
          var procPulse = 0.5 + 0.3 * Math.sin(time * 5 + e);
          fillAlpha += processT * 0.15 * procPulse;
        }
      } else {
        boxAlpha = 0.12;
        fillAlpha = 0.03;
      }

      // Draw expert box
      ctx.save();
      ctx.fillStyle = wA(eColor, fillAlpha);
      ctx.strokeStyle = wA(eColor, boxAlpha);
      ctx.lineWidth = isActive && routeT > 0.5 ? 1.5 : 0.8;
      ctx.fillRect(ex, ey - expertH / 2, expertW, expertH);
      ctx.strokeRect(ex, ey - expertH / 2, expertW, expertH);
      ctx.restore();

      B.drawLabel(ctx, 'E' + (e + 1), { x: ex + expertW / 2, y: ey },
        wA(eColor, boxAlpha + 0.1), '9px "JetBrains Mono", monospace', 'center');

      // --- Bezier curves from router to active experts ---
      if (isActive && routeT > 0) {
        var routeEased = B.easeOut(routeT);
        var rcp1 = { x: routerX + (ex - routerX) * 0.3, y: cy + (ey - cy) * 0.1 };
        var rcp2 = { x: routerX + (ex - routerX) * 0.7, y: ey + (cy - ey) * 0.2 };

        ctx.save();
        ctx.strokeStyle = wA(eColor, 0.5 * routeEased);
        ctx.lineWidth = 2;
        ctx.shadowColor = eColor;
        ctx.shadowBlur = 8 * routeEased;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var s = 0; s <= 40; s++) {
          var st = s / 40;
          if (st > routeEased) break;
          var pt = B.cubicPt(routerPt, rcp1, rcp2, { x: ex, y: ey }, st);
          if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();

        // Tracer dot on route curve
        if (routeT < 1) {
          var rDot = B.cubicPt(routerPt, rcp1, rcp2, { x: ex, y: ey }, routeEased);
          B.drawDot(ctx, rDot, 3, eColor, 10);
        }

        // --- Curves from active experts to output ---
        if (processT > 0) {
          var procEased = B.easeOut(processT);
          var outputPt = { x: outputX, y: cy };
          var ocp1 = { x: ex + expertW + (outputX - ex - expertW) * 0.3, y: ey + (cy - ey) * 0.2 };
          var ocp2 = { x: ex + expertW + (outputX - ex - expertW) * 0.7, y: cy + (ey - cy) * 0.1 };

          ctx.save();
          ctx.strokeStyle = wA(eColor, 0.4 * procEased);
          ctx.lineWidth = 1.5;
          ctx.shadowColor = eColor;
          ctx.shadowBlur = 6 * procEased;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (var s = 0; s <= 30; s++) {
            var st = s / 30;
            if (st > procEased) break;
            var pt = B.cubicPt({ x: ex + expertW, y: ey }, ocp1, ocp2, outputPt, st);
            if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // --- Output node ---
    var outPt = { x: outputX, y: cy };
    if (outputT > 0) {
      var outEased = B.easeOut(outputT);
      B.drawDot(ctx, outPt, 8, wA(P.white, 0.3 * outEased), 15 * outEased);
      B.drawDot(ctx, outPt, 5, wA(P.white, 0.6 * outEased), 8 * outEased);
      B.drawDot(ctx, outPt, 2, wA('#ffffff', 0.8 * outEased));
    } else {
      B.drawDot(ctx, outPt, 5, wA(P.white, 0.2));
    }
    B.drawLabel(ctx, 'output', { x: outputX, y: cy - 18 },
      wA(P.white, 0.5), '9px "JetBrains Mono", monospace', 'center');

    // --- Stats ---
    B.drawLabel(ctx, '671B params \u2192 37B active', { x: w * 0.50, y: h * 0.88 },
      wA(P.yellow, 0.5), '11px "JetBrains Mono", monospace', 'center');

    // Active count
    B.drawLabel(ctx, '2 of ' + NUM_EXPERTS + ' experts per token',
      { x: w * 0.50, y: h * 0.93 },
      wA(P.white, 0.35), '9px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'mixture of experts', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
