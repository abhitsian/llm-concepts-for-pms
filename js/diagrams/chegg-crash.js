// chegg-crash.js — Stock price crash visualization
// Line chart dropping steeply after ChatGPT launch, $15 → $0.60

function CheggCrashDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  // Stock price curve: hold steady, then plummet
  // Normalized: 0=start, 0.4=ChatGPT moment, 1.0=bottom
  function stockPrice(t) {
    if (t < 0.35) return 15 - t * 2;               // ~$15 → $14.3 steady-ish
    if (t < 0.45) return 14.3 - (t - 0.35) * 68;   // cliff: $14.3 → $7.5
    if (t < 0.6) return 7.5 - (t - 0.45) * 30;     // continued drop to $3
    return 3 * Math.exp(-2.5 * (t - 0.6)) + 0.6;    // decay toward $0.60
  }

  // Market cap curve (correlated, different scale)
  function marketCap(t) {
    var price = stockPrice(t);
    return price / 15 * 14.5; // rough scale: $14.5B at top
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var drawT = B.easeOut(B.clamp(t / 0.75, 0, 1));

    var mx = w * 0.12;
    var my = h * 0.14;
    var gw = w - mx * 2;
    var gh = h * 0.54;
    var baseY = my + gh;

    // Title
    B.drawLabel(ctx, 'the chegg crash', { x: mx + 4, y: h * 0.05 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Axes
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + gw, y: baseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx, y: my },
      wA(P.white, 0.2), 1);

    // Y-axis labels (stock price)
    var yTicks = [
      { label: '$15', frac: 0 },
      { label: '$10', frac: 0.333 },
      { label: '$5', frac: 0.667 },
      { label: '$0', frac: 1 }
    ];
    for (var yi = 0; yi < yTicks.length; yi++) {
      var yy = my + gh * yTicks[yi].frac;
      B.drawLine(ctx, { x: mx - 3, y: yy }, { x: mx, y: yy },
        wA(P.white, 0.25), 1);
      B.drawLabel(ctx, yTicks[yi].label, { x: mx - 8, y: yy },
        wA(P.white, 0.35), '8px "JetBrains Mono", monospace', 'right');
      if (yi > 0 && yi < yTicks.length - 1) {
        B.drawLine(ctx, { x: mx, y: yy }, { x: mx + gw, y: yy },
          wA(P.white, 0.04), 1, [4, 8]);
      }
    }

    // X-axis labels
    var xLabels = ['2022', 'Nov 2022', 'May 2023', '2024'];
    for (var xi = 0; xi < xLabels.length; xi++) {
      var xx = mx + gw * xi / (xLabels.length - 1);
      B.drawLine(ctx, { x: xx, y: baseY }, { x: xx, y: baseY + 4 },
        wA(P.white, 0.25), 1);
      B.drawLabel(ctx, xLabels[xi], { x: xx, y: baseY + 16 },
        wA(P.white, 0.4), '8px "JetBrains Mono", monospace', 'center');
    }

    // Draw stock price curve
    var STEPS = 100;
    var maxStep = Math.ceil(STEPS * drawT);

    // Determine color per segment (green when high, coral when dropping)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5;

    for (var i = 1; i <= maxStep; i++) {
      var s0 = (i - 1) / STEPS;
      var s1 = i / STEPS;
      var price0 = stockPrice(s0);
      var price1 = stockPrice(s1);
      var px0 = mx + s0 * gw;
      var py0 = my + gh * (1 - price0 / 15);
      var px1 = mx + s1 * gw;
      var py1 = my + gh * (1 - price1 / 15);

      // Color interpolation: green when price > $10, coral when < $5, blend between
      var colorFrac = B.clamp((10 - price1) / 5, 0, 1);
      var r = Math.round(B.lerp(107, 255, colorFrac));   // green→coral R
      var g = Math.round(B.lerp(203, 107, colorFrac));   // green→coral G
      var b = Math.round(B.lerp(119, 107, colorFrac));   // green→coral B
      var segColor = 'rgba(' + r + ',' + g + ',' + b + ',0.85)';

      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(px1, py1);
      ctx.strokeStyle = segColor;
      ctx.shadowColor = colorFrac > 0.5 ? P.coral : P.green;
      ctx.shadowBlur = 8;
      ctx.stroke();
    }
    ctx.restore();

    // Market cap curve (smaller, dimmer, below)
    if (drawT > 0.1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = wA(P.purple, 0.4);
      ctx.shadowColor = P.purple;
      ctx.shadowBlur = 6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (var j = 0; j <= maxStep; j++) {
        var s = j / STEPS;
        var mc = marketCap(s);
        var mcx = mx + s * gw;
        // Scale: 14.5B maps to top, 0 to bottom
        var mcy = my + gh * (1 - mc / 14.5);
        if (j === 0) ctx.moveTo(mcx, mcy); else ctx.lineTo(mcx, mcy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Tracer dot on main curve
    if (drawT > 0 && drawT < 1) {
      var tracePrice = stockPrice(drawT);
      var traceX = mx + drawT * gw;
      var traceY = my + gh * (1 - tracePrice / 15);
      var dotColor = tracePrice > 10 ? P.green : P.coral;
      B.drawDot(ctx, { x: traceX, y: traceY }, 5, dotColor, 14);
    }

    // "ChatGPT" marker vertical line
    var chatgptX = mx + gw * 0.35;
    var markerAlpha = drawT > 0.25 ? B.easeOut(B.clamp((drawT - 0.25) / 0.1, 0, 1)) : 0;
    if (markerAlpha > 0) {
      B.drawLine(ctx, { x: chatgptX, y: my }, { x: chatgptX, y: baseY },
        wA(P.yellow, markerAlpha * 0.3), 1, [3, 3]);
      B.drawLabel(ctx, 'ChatGPT', { x: chatgptX, y: my - 6 },
        wA(P.yellow, markerAlpha * 0.8), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'launches', { x: chatgptX, y: my + 8 },
        wA(P.yellow, markerAlpha * 0.5), '8px "JetBrains Mono", monospace', 'center');
    }

    // "-48% in one day" annotation
    if (drawT > 0.45) {
      var annAlpha = B.easeOut(B.clamp((drawT - 0.45) / 0.12, 0, 1));
      var annX = mx + gw * 0.55;
      var annY = my + gh * 0.35;
      B.drawLabel(ctx, '-48% in one day', { x: annX, y: annY },
        wA(P.coral, annAlpha * 0.9), 'bold 12px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'May 1, 2023', { x: annX, y: annY + 16 },
        wA(P.coral, annAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // Market cap annotation
    if (drawT > 0.7) {
      var mcAlpha = B.easeOut(B.clamp((drawT - 0.7) / 0.15, 0, 1));
      B.drawLabel(ctx, 'market cap', { x: mx + gw * 0.82, y: my + gh * 0.7 },
        wA(P.purple, mcAlpha * 0.5), '8px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '$14.5B', { x: mx + gw * 0.08, y: my + gh * 0.06 },
        wA(P.purple, mcAlpha * 0.5), '9px "JetBrains Mono", monospace', 'left');
    }

    // Bottom summary
    if (t > 0.7) {
      var sumAlpha = B.easeOut(B.clamp((t - 0.7) / 0.15, 0, 1));
      B.drawLabel(ctx, '$14.5B \u2192 $191M', { x: w * 0.5, y: h * 0.82 },
        wA(P.coral, sumAlpha * 0.8), 'bold 13px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'stock: $15 \u2192 $0.60  \u2014  one AI chatbot destroyed the moat',
        { x: w * 0.5, y: h * 0.90 },
        wA(P.white, sumAlpha * 0.4), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
