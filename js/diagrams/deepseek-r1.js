// deepseek-r1.js — Cost comparison and architectural innovations of DeepSeek R1
// Left: cost bars. Right: MoE, MLA, GRPO innovation pipeline.

function DeepseekR1Diagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var divX = w * 0.38;

    // === LEFT SIDE: Cost Bars ===
    var barPhase = B.clamp(t / 0.3, 0, 1);
    var barEased = B.easeOut(barPhase);

    var barAreaX = w * 0.06;
    var barAreaW = divX - w * 0.12;
    var barBottom = h * 0.82;
    var barTop = h * 0.18;
    var maxBarH = barBottom - barTop;

    // "Typical" bar (coral, tall — $100M)
    var typBarW = barAreaW * 0.35;
    var typBarX = barAreaX + barAreaW * 0.15;
    var typBarH = maxBarH * 0.9 * barEased;

    ctx.save();
    ctx.fillStyle = wA(P.coral, 0.3);
    ctx.shadowColor = P.coral;
    ctx.shadowBlur = 12;
    ctx.fillRect(typBarX, barBottom - typBarH, typBarW, typBarH);
    ctx.restore();

    // Inner gradient overlay
    ctx.save();
    ctx.fillStyle = wA(P.coral, 0.15);
    ctx.fillRect(typBarX + 2, barBottom - typBarH + 2, typBarW - 4, typBarH - 4);
    ctx.restore();

    if (barEased > 0.3) {
      var lAlpha = B.clamp((barEased - 0.3) / 0.3, 0, 0.7);
      B.drawLabel(ctx, '$100M', { x: typBarX + typBarW / 2, y: barBottom - typBarH - 12 },
        wA(P.coral, lAlpha), 'bold 11px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'Typical', { x: typBarX + typBarW / 2, y: barBottom + 14 },
        wA(P.coral, lAlpha * 0.7), '9px "JetBrains Mono", monospace', 'center');
    }

    // "DeepSeek R1" bar (green, short — $5.5M)
    var dsBarW = typBarW;
    var dsBarX = typBarX + typBarW + barAreaW * 0.15;
    var dsBarH = maxBarH * 0.05 * barEased; // 5.5% of 100M

    // Delay the DS bar slightly
    var dsPhase = B.clamp((t - 0.1) / 0.3, 0, 1);
    var dsEased = B.easeOut(dsPhase);
    dsBarH = maxBarH * 0.055 * dsEased;

    ctx.save();
    ctx.fillStyle = wA(P.green, 0.5);
    ctx.shadowColor = P.green;
    ctx.shadowBlur = 15;
    ctx.fillRect(dsBarX, barBottom - dsBarH, dsBarW, dsBarH);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = wA(P.green, 0.25);
    ctx.fillRect(dsBarX + 2, barBottom - dsBarH + 2, dsBarW - 4, Math.max(0, dsBarH - 4));
    ctx.restore();

    if (dsEased > 0.5) {
      var dsAlpha = B.clamp((dsEased - 0.5) / 0.3, 0, 0.8);
      B.drawLabel(ctx, '$5.5M', { x: dsBarX + dsBarW / 2, y: barBottom - dsBarH - 12 },
        wA(P.green, dsAlpha), 'bold 11px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'DeepSeek', { x: dsBarX + dsBarW / 2, y: barBottom + 14 },
        wA(P.green, dsAlpha * 0.7), '9px "JetBrains Mono", monospace', 'center');
    }

    // Cost ratio label
    if (t > 0.35) {
      var ratioAlpha = B.clamp((t - 0.35) / 0.1, 0, 0.6);
      B.drawLabel(ctx, '18x cheaper', { x: (typBarX + dsBarX + dsBarW) / 2, y: barBottom + 34 },
        wA(P.green, ratioAlpha), 'bold 10px "JetBrains Mono", monospace', 'center');
    }

    // === Divider line ===
    B.drawLine(ctx, { x: divX, y: h * 0.1 }, { x: divX, y: h * 0.9 },
      wA(P.white, 0.06), 1, [2, 6]);

    // === RIGHT SIDE: Innovation Pipeline ===
    var rightX = divX + w * 0.04;
    var rightW = w - rightX - w * 0.04;
    var boxW = rightW * 0.8;
    var boxH = h * 0.16;
    var boxX = rightX + (rightW - boxW) / 2;

    var innovations = [
      {
        label: 'MoE', color: P.teal,
        desc: '671B total / 37B active',
        detail: 'Mixture of Experts',
        triggerT: 0.35
      },
      {
        label: 'MLA', color: P.blue,
        desc: 'compressed KV cache',
        detail: 'Multi-head Latent Attention',
        triggerT: 0.52
      },
      {
        label: 'GRPO', color: P.purple,
        desc: 'no reward model needed',
        detail: 'Group Relative Policy Opt.',
        triggerT: 0.69
      }
    ];

    var startY = h * 0.14;
    var gapY = (h * 0.72) / innovations.length;

    for (var i = 0; i < innovations.length; i++) {
      var inn = innovations[i];
      var boxY = startY + i * gapY;
      var innPhase = B.clamp((t - inn.triggerT) / 0.15, 0, 1);
      var innEased = B.easeOut(innPhase);

      if (innEased <= 0) continue;

      var alpha = innEased * 0.7;

      // Box background
      ctx.save();
      ctx.fillStyle = wA(inn.color, alpha * 0.08);
      ctx.strokeStyle = wA(inn.color, alpha * 0.3);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var r = 6;
      ctx.moveTo(boxX + r, boxY);
      ctx.lineTo(boxX + boxW - r, boxY);
      ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
      ctx.lineTo(boxX + boxW, boxY + boxH - r);
      ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
      ctx.lineTo(boxX + r, boxY + boxH);
      ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
      ctx.lineTo(boxX, boxY + r);
      ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Innovation-specific visuals inside the box
      var innerX = boxX + 10;
      var innerY = boxY + boxH * 0.35;
      var innerW = boxW - 20;

      if (i === 0) {
        // MoE: router + expert boxes
        // Large block on left, small active blocks on right
        var routerX = innerX + innerW * 0.05;
        var routerW = innerW * 0.15;
        var routerH = boxH * 0.4;
        ctx.save();
        ctx.fillStyle = wA(inn.color, alpha * 0.2);
        ctx.fillRect(routerX, innerY - routerH / 2, routerW, routerH);
        ctx.restore();
        B.drawLabel(ctx, 'R', { x: routerX + routerW / 2, y: innerY },
          wA(inn.color, alpha * 0.6), '8px "JetBrains Mono", monospace', 'center');

        // Expert boxes — 8 total, 2 active
        var expStartX = routerX + routerW + innerW * 0.08;
        var expW = innerW * 0.06;
        var expH = boxH * 0.18;
        for (var e = 0; e < 8; e++) {
          var ex = expStartX + (e % 4) * (expW + 4);
          var ey = innerY - expH - 2 + Math.floor(e / 4) * (expH + 4);
          var isActive = (e === 1 || e === 5);
          ctx.save();
          ctx.fillStyle = wA(inn.color, isActive ? alpha * 0.5 : alpha * 0.08);
          ctx.fillRect(ex, ey, expW, expH);
          if (isActive) {
            ctx.shadowColor = inn.color;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = wA(inn.color, alpha * 0.6);
            ctx.lineWidth = 1;
            ctx.strokeRect(ex, ey, expW, expH);
          }
          ctx.restore();
        }
      } else if (i === 1) {
        // MLA: large block compresses to small block
        var bigW = innerW * 0.2;
        var bigH = boxH * 0.5;
        var smallW = innerW * 0.08;
        var smallH = boxH * 0.25;
        var bigX = innerX + innerW * 0.08;
        var smallX = innerX + innerW * 0.45;

        ctx.save();
        ctx.fillStyle = wA(inn.color, alpha * 0.15);
        ctx.strokeStyle = wA(inn.color, alpha * 0.3);
        ctx.lineWidth = 1;
        ctx.fillRect(bigX, innerY - bigH / 2, bigW, bigH);
        ctx.strokeRect(bigX, innerY - bigH / 2, bigW, bigH);
        ctx.restore();
        B.drawLabel(ctx, 'KV', { x: bigX + bigW / 2, y: innerY },
          wA(inn.color, alpha * 0.5), '7px "JetBrains Mono", monospace', 'center');

        // Arrow
        var arrowStartX = bigX + bigW + 4;
        var arrowEndX = smallX - 4;
        B.drawLine(ctx, { x: arrowStartX, y: innerY }, { x: arrowEndX, y: innerY },
          wA(inn.color, alpha * 0.4), 1.5);
        // Arrowhead
        B.drawLine(ctx, { x: arrowEndX - 4, y: innerY - 3 }, { x: arrowEndX, y: innerY },
          wA(inn.color, alpha * 0.4), 1.5);
        B.drawLine(ctx, { x: arrowEndX - 4, y: innerY + 3 }, { x: arrowEndX, y: innerY },
          wA(inn.color, alpha * 0.4), 1.5);

        ctx.save();
        ctx.fillStyle = wA(inn.color, alpha * 0.35);
        ctx.shadowColor = inn.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(smallX, innerY - smallH / 2, smallW, smallH);
        ctx.restore();
      } else if (i === 2) {
        // GRPO: circular loop without extra node (self-referencing)
        var loopCx = innerX + innerW * 0.2;
        var loopCy = innerY;
        var loopR = boxH * 0.2;

        B.drawRing(ctx, { x: loopCx, y: loopCy }, loopR,
          wA(inn.color, alpha * 0.4), 1.5);

        // Pulsing dot on the loop
        var loopAngle = time * 2;
        var ldx = Math.cos(loopAngle) * loopR;
        var ldy = Math.sin(loopAngle) * loopR;
        B.drawDot(ctx, { x: loopCx + ldx, y: loopCy + ldy }, 3,
          wA(inn.color, alpha * 0.7), 8);

        // "no RM" label with a crossed-out circle
        var rmX = loopCx + loopR + innerW * 0.15;
        ctx.save();
        ctx.strokeStyle = wA(P.coral, alpha * 0.4);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rmX, loopCy, 8, 0, Math.PI * 2);
        ctx.stroke();
        // Cross it out
        ctx.beginPath();
        ctx.moveTo(rmX - 6, loopCy - 6);
        ctx.lineTo(rmX + 6, loopCy + 6);
        ctx.stroke();
        ctx.restore();
        B.drawLabel(ctx, 'RM', { x: rmX, y: loopCy },
          wA(P.coral, alpha * 0.35), '6px "JetBrains Mono", monospace', 'center');
      }

      // Labels
      B.drawLabel(ctx, inn.label, { x: boxX + boxW - 8, y: boxY + 12 },
        wA(inn.color, alpha), 'bold 11px "JetBrains Mono", monospace', 'right');

      B.drawLabel(ctx, inn.detail, { x: boxX + 10, y: boxY + boxH - 10 },
        wA(inn.color, alpha * 0.45), '7px "JetBrains Mono", monospace', 'left');

      B.drawLabel(ctx, inn.desc, { x: boxX + boxW - 8, y: boxY + boxH - 10 },
        wA(P.white, alpha * 0.4), '8px "JetBrains Mono", monospace', 'right');

      // Connecting line between innovation boxes
      if (i > 0 && innEased > 0) {
        var prevBoxBottom = startY + (i - 1) * gapY + boxH;
        var curBoxTop = boxY;
        var midConnX = boxX + boxW / 2;
        B.drawLine(ctx, { x: midConnX, y: prevBoxBottom + 2 }, { x: midConnX, y: curBoxTop - 2 },
          wA(P.white, innEased * 0.12), 1, [3, 4]);
      }
    }

    // Title
    B.drawLabel(ctx, 'deepseek r1', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
