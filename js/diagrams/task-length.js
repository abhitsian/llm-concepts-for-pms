// task-length.js — METR data: AI task horizon doubles every 7 months
// Exponential growth curve with data points and extrapolation

function TaskLengthDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  var CYCLE = 9;

  // Data points: { month offset from Jan 2024, label, minutes }
  var dataPoints = [
    { mo: 0,  label: 'Jan 2024: 3 min',   mins: 3    },
    { mo: 7,  label: 'Aug 2024: 12 min',   mins: 12   },
    { mo: 14, label: 'Mar 2025: 1 hour',   mins: 60   },
    { mo: 21, label: 'Oct 2025: 4 hours',  mins: 240  },
  ];

  // Extrapolation extends to ~30 months
  var maxMonths = 32;

  // Y-axis ticks (minutes)
  var yTicks = [
    { mins: 1,    label: '1 min'  },
    { mins: 10,   label: '10 min' },
    { mins: 60,   label: '1 hour' },
    { mins: 480,  label: '8 hours'},
    { mins: 1440, label: '1 day'  },
    { mins: 10080,label: '1 week' },
  ];

  // Log scale helpers
  var logMin = Math.log(1);      // 1 min
  var logMax = Math.log(15000);   // ~10 days

  function minsToY(mins, originY, ih) {
    var logVal = Math.log(Math.max(mins, 0.5));
    var frac = (logVal - logMin) / (logMax - logMin);
    return originY - frac * ih;
  }

  function monthToX(mo, mx, iw) {
    return mx + (mo / maxMonths) * iw;
  }

  // The model: task_length = 3 * 2^(months/7)
  function taskMins(mo) {
    return 3 * Math.pow(2, mo / 7);
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.14, my = h * 0.12;
    var iw = w - mx * 1.8, ih = h - my * 2.6;
    var originY = my + ih;
    var phase = (time % CYCLE) / CYCLE;

    // Curve draw progress
    var curveT = B.easeOut(B.clamp(phase * 2.0, 0, 1));
    // Data points appear sequentially
    var pointPhase = B.clamp(phase * 2.5 - 0.3, 0, 1);

    // Axes
    B.drawLine(ctx, { x: mx, y: my }, { x: mx, y: originY },
      B.withAlpha(P.white, 0.15), 1);
    B.drawLine(ctx, { x: mx, y: originY }, { x: mx + iw, y: originY },
      B.withAlpha(P.white, 0.15), 1);

    // Y-axis ticks
    for (var yi = 0; yi < yTicks.length; yi++) {
      var tickY = minsToY(yTicks[yi].mins, originY, ih);
      if (tickY > my && tickY < originY) {
        B.drawLine(ctx, { x: mx - 4, y: tickY }, { x: mx + iw, y: tickY },
          B.withAlpha(P.white, 0.05), 1, [2, 6]);
        B.drawLabel(ctx, yTicks[yi].label, { x: mx - 8, y: tickY + 3 },
          P.textDim, '8px "JetBrains Mono", monospace', 'right');
      }
    }

    // X-axis label
    B.drawLabel(ctx, 'months →', { x: mx + iw * 0.5, y: originY + 26 },
      P.textDim, '9px "JetBrains Mono", monospace');

    // Y-axis label
    B.drawLabel(ctx, 'task complexity', { x: mx - 4, y: my - 8 },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');

    // Solid exponential curve (up to last data point)
    var solidMaxMo = 21;  // Oct 2025
    var STEPS = 80;
    var drawMo = solidMaxMo * curveT;

    ctx.beginPath();
    for (var i = 0; i <= STEPS; i++) {
      var mo = (i / STEPS) * drawMo;
      var cx = monthToX(mo, mx, iw);
      var cy = minsToY(taskMins(mo), originY, ih);
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = B.withAlpha(P.teal, 0.7);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dashed extrapolation line
    var extraAlpha = B.easeInOut(B.clamp(phase * 3 - 1.8, 0, 1));
    if (extraAlpha > 0.01) {
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      for (var j = 0; j <= 40; j++) {
        var emo = solidMaxMo + (j / 40) * (maxMonths - solidMaxMo);
        var ex = monthToX(emo, mx, iw);
        var ey = minsToY(taskMins(emo), originY, ih);
        if (j === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
      }
      ctx.strokeStyle = B.withAlpha(P.teal, extraAlpha * 0.35);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      B.drawLabel(ctx, 'extrapolated', { x: monthToX(28, mx, iw), y: minsToY(taskMins(28), originY, ih) - 14 },
        B.withAlpha(P.teal, extraAlpha * 0.4),
        '8px "JetBrains Mono", monospace');
    }

    // Data points (appear one by one)
    for (var di = 0; di < dataPoints.length; di++) {
      var dp = dataPoints[di];
      var dpT = B.easeOut(B.clamp((pointPhase - di * 0.22) * 5, 0, 1));
      if (dpT < 0.01) continue;

      var dpx = monthToX(dp.mo, mx, iw);
      var dpy = minsToY(dp.mins, originY, ih);
      var pulse = 0.5 + 0.5 * Math.sin(time * 2 + di * 1.5);

      B.drawDot(ctx, { x: dpx, y: dpy }, 5 + pulse, B.withAlpha(P.yellow, dpT * 0.8), 10);
      B.drawRing(ctx, { x: dpx, y: dpy }, 9 + pulse * 2, B.withAlpha(P.yellow, dpT * 0.2), 1);

      // Label — alternate above/below to avoid overlap
      var labelY = di % 2 === 0 ? dpy - 18 : dpy + 20;
      B.drawLabel(ctx, dp.label, { x: dpx, y: labelY },
        B.withAlpha(P.yellow, dpT * 0.7),
        '9px "JetBrains Mono", monospace');
    }

    // Doubling period annotation
    if (curveT > 0.5) {
      var annAlpha = B.easeOut(B.clamp((curveT - 0.5) * 4, 0, 1));
      var m1 = 7, m2 = 14;
      var x1 = monthToX(m1, mx, iw), x2 = monthToX(m2, mx, iw);
      var y1 = minsToY(taskMins(m1), originY, ih);
      var y2 = minsToY(taskMins(m2), originY, ih);
      var bracketY = Math.min(y1, y2) - 30;

      B.drawLine(ctx, { x: x1, y: bracketY }, { x: x2, y: bracketY },
        B.withAlpha(P.purple, annAlpha * 0.4), 1.5);
      B.drawLine(ctx, { x: x1, y: bracketY - 4 }, { x: x1, y: bracketY + 4 },
        B.withAlpha(P.purple, annAlpha * 0.4), 1.5);
      B.drawLine(ctx, { x: x2, y: bracketY - 4 }, { x: x2, y: bracketY + 4 },
        B.withAlpha(P.purple, annAlpha * 0.4), 1.5);
      B.drawLabel(ctx, '×2 every 7 months', { x: (x1 + x2) / 2, y: bracketY - 8 },
        B.withAlpha(P.purple, annAlpha * 0.7),
        '9px "JetBrains Mono", monospace');
    }

    // Formula
    var fAlpha = B.easeInOut(B.clamp(phase * 3 - 1.5, 0, 1));
    B.drawLabel(ctx, 'task_length = t₀ × 2^(months/7)',
      { x: w / 2, y: h - my * 0.3 },
      B.withAlpha(P.white, fAlpha * 0.45),
      '10px "JetBrains Mono", monospace');

    // Title
    B.drawLabel(ctx, 'AI task horizon — exponential growth',
      { x: w / 2, y: my * 0.45 },
      B.withAlpha(P.teal, 0.55), '11px "JetBrains Mono", monospace');
  }

  return B.animate(canvas, container, draw);
}
