// tier-war.js — Price tiers stacking with capability gates

function TierWarDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.06;
    var barLeft = mx + w * 0.04;
    var barMaxW = w * 0.52;
    var barRight = barLeft + barMaxW;

    var tiers = [
      {
        label: 'Free', price: '$0', color: P.green, height: 0.12,
        caps: ['basic chat'],
        fillDelay: 0, fillDur: 0.2
      },
      {
        label: 'Pro', price: '$20/mo', color: P.blue, height: 0.18,
        caps: ['+ longer context', '+ tools'],
        fillDelay: 0.2, fillDur: 0.2
      },
      {
        label: 'Ultra', price: '$200/mo', color: P.purple, height: 0.26,
        caps: ['+ unlimited reasoning', '+ priority', '+ early access'],
        fillDelay: 0.4, fillDur: 0.25
      }
    ];

    // Calculate stacking positions (bottom-up)
    var stackBottom = h * 0.72;
    var gap = 6;
    var positions = [];
    var yPos = stackBottom;
    for (var i = 0; i < tiers.length; i++) {
      var barH = h * tiers[i].height;
      var top = yPos - barH;
      positions.push({ top: top, bottom: yPos, height: barH });
      yPos = top - gap;
    }

    // Draw tier bars filling left to right
    for (var i = 0; i < tiers.length; i++) {
      var tier = tiers[i];
      var pos = positions[i];

      // Fill progress for this tier
      var fillT = B.easeOut(B.clamp((t - tier.fillDelay) / tier.fillDur, 0, 1));
      var fillW = barMaxW * fillT;

      // Bar outline (dim)
      ctx.save();
      ctx.strokeStyle = wA(tier.color, 0.15);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(barLeft, pos.top, barMaxW, pos.height);
      ctx.restore();

      // Filled portion
      if (fillW > 0) {
        ctx.save();
        // Gradient fill
        var grad = ctx.createLinearGradient(barLeft, 0, barLeft + fillW, 0);
        grad.addColorStop(0, wA(tier.color, 0.2));
        grad.addColorStop(1, wA(tier.color, 0.08));
        ctx.fillStyle = grad;
        ctx.fillRect(barLeft, pos.top, fillW, pos.height);

        // Bright edge
        ctx.strokeStyle = wA(tier.color, 0.6);
        ctx.lineWidth = 2;
        ctx.shadowColor = tier.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(barLeft + fillW, pos.top);
        ctx.lineTo(barLeft + fillW, pos.bottom);
        ctx.stroke();
        ctx.restore();
      }

      // Tier label (left side)
      B.drawLabel(ctx, tier.label, { x: barLeft - 4, y: pos.top + pos.height * 0.35 },
        wA(tier.color, 0.8), 'bold 11px "JetBrains Mono", monospace', 'right');
      B.drawLabel(ctx, tier.price, { x: barLeft - 4, y: pos.top + pos.height * 0.65 },
        wA(tier.color, 0.5), '9px "JetBrains Mono", monospace', 'right');

      // Capability labels (appear as fill completes)
      if (fillT > 0.6) {
        var capAlpha = B.clamp((fillT - 0.6) / 0.3, 0, 1);
        for (var c = 0; c < tier.caps.length; c++) {
          var capY = pos.top + pos.height * 0.3 + c * 13;
          if (capY < pos.bottom - 4) {
            B.drawLabel(ctx, tier.caps[c],
              { x: barLeft + 12, y: capY },
              wA(tier.color, capAlpha * 0.6),
              '8px "JetBrains Mono", monospace', 'left');
          }
        }
      }
    }

    // Right side: User distribution vs Revenue distribution
    var distLeft = w * 0.68;
    var distW = w * 0.12;

    // Only show distributions after bars fill
    var distDelay = 0.65;
    var distAlpha = B.easeOut(B.clamp((t - distDelay) / 0.2, 0, 1));

    if (distAlpha > 0) {
      // User distribution header
      B.drawLabel(ctx, 'Users', { x: distLeft + distW * 0.5, y: h * 0.15 },
        wA(P.white, distAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');

      // Revenue distribution header
      var revLeft = w * 0.84;
      B.drawLabel(ctx, 'Revenue', { x: revLeft + distW * 0.5, y: h * 0.15 },
        wA(P.white, distAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');

      // User distribution (most at free, fewer at pro, fewest at ultra)
      var userDist = [0.75, 0.20, 0.05]; // free, pro, ultra
      var revDist = [0.0, 0.25, 0.75];   // free, pro, ultra

      var distTop = h * 0.22;
      var distH = h * 0.50;

      // Draw user distribution bar
      var uY = distTop;
      for (var d = 0; d < 3; d++) {
        var segH = distH * userDist[d];
        var tier = tiers[d];
        ctx.save();
        ctx.fillStyle = wA(tier.color, distAlpha * 0.25);
        ctx.fillRect(distLeft, uY, distW, segH);
        ctx.strokeStyle = wA(tier.color, distAlpha * 0.4);
        ctx.lineWidth = 1;
        ctx.strokeRect(distLeft, uY, distW, segH);
        ctx.restore();

        // Percentage
        if (segH > 12) {
          B.drawLabel(ctx, (userDist[d] * 100) + '%',
            { x: distLeft + distW * 0.5, y: uY + segH * 0.5 },
            wA(tier.color, distAlpha * 0.7),
            '8px "JetBrains Mono", monospace', 'center');
        }
        uY += segH;
      }

      // Draw revenue distribution bar (inverted!)
      var rY = distTop;
      for (var d = 0; d < 3; d++) {
        var segH = distH * revDist[d];
        var tier = tiers[d];
        if (segH > 0) {
          ctx.save();
          ctx.fillStyle = wA(tier.color, distAlpha * 0.25);
          ctx.fillRect(revLeft, rY, distW, segH);
          ctx.strokeStyle = wA(tier.color, distAlpha * 0.4);
          ctx.lineWidth = 1;
          ctx.strokeRect(revLeft, rY, distW, segH);
          ctx.restore();

          // Percentage
          if (segH > 12) {
            B.drawLabel(ctx, (revDist[d] * 100) + '%',
              { x: revLeft + distW * 0.5, y: rY + segH * 0.5 },
              wA(tier.color, distAlpha * 0.7),
              '8px "JetBrains Mono", monospace', 'center');
          }
        }
        rY += segH;
      }

      // "inverted" label connecting the two bars
      if (t > 0.8) {
        var invAlpha = B.easeOut(B.clamp((t - 0.8) / 0.15, 0, 1));
        B.drawLine(ctx,
          { x: distLeft + distW + 4, y: distTop + distH * 0.5 },
          { x: revLeft - 4, y: distTop + distH * 0.5 },
          wA(P.yellow, invAlpha * 0.3), 1, [3, 3]);
        B.drawLabel(ctx, 'inverted',
          { x: (distLeft + distW + revLeft) * 0.5, y: distTop + distH * 0.5 - 8 },
          wA(P.yellow, invAlpha * 0.5),
          '8px "JetBrains Mono", monospace', 'center');
      }
    }

    // Bottom insight
    if (t > 0.85) {
      var insAlpha = B.easeOut(B.clamp((t - 0.85) / 0.12, 0, 1));
      B.drawLabel(ctx, '5% of users drive 75% of revenue',
        { x: w * 0.5, y: h * 0.88 },
        wA(P.yellow, insAlpha * 0.5),
        '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'the free tier is a funnel, not a product',
        { x: w * 0.5, y: h * 0.94 },
        wA(P.white, insAlpha * 0.3),
        '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'the tier war', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
