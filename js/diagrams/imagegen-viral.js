// imagegen-viral.js — Viral adoption loop: generate → share → attract → generate

function ImagegenViralDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var cx = w * 0.5;
    var cy = h * 0.48;
    var radius = Math.min(w, h) * 0.28;

    // Four node positions around the loop (top, right, bottom, left)
    var nodes = [
      { x: cx, y: cy - radius, label: 'Generate', color: P.purple, icon: 'img' },
      { x: cx + radius, y: cy, label: 'Share', color: P.coral, icon: 'soc' },
      { x: cx, y: cy + radius, label: 'Attract', color: P.yellow, icon: 'usr' },
      { x: cx - radius, y: cy, label: 'Generate', color: P.green, icon: 'more' }
    ];

    // Draw subtle image squares generating at the Generate node
    var genNode = nodes[0];
    var numSquares = 3 + Math.floor(t * 4);
    for (var sq = 0; sq < numSquares; sq++) {
      var sqPhase = (t * 3 + sq * 0.3) % 1;
      var sqAlpha = (1 - sqPhase) * 0.12;
      var sqSize = 6 + sqPhase * 10;
      var sqX = genNode.x - 30 + (sq % 3) * 14;
      var sqY = genNode.y - 8 - sqPhase * 20;
      ctx.save();
      ctx.fillStyle = wA(P.purple, sqAlpha);
      ctx.strokeStyle = wA(P.purple, sqAlpha * 1.5);
      ctx.lineWidth = 0.5;
      ctx.fillRect(sqX - sqSize / 2, sqY - sqSize / 2, sqSize, sqSize);
      ctx.strokeRect(sqX - sqSize / 2, sqY - sqSize / 2, sqSize, sqSize);
      ctx.restore();
    }

    // Draw Bézier curves connecting nodes in a loop
    for (var i = 0; i < 4; i++) {
      var from = nodes[i];
      var to = nodes[(i + 1) % 4];
      var midX = (from.x + to.x) / 2;
      var midY = (from.y + to.y) / 2;
      // Pull control points outward from center for a nice curve
      var outX = midX + (midX - cx) * 0.5;
      var outY = midY + (midY - cy) * 0.5;
      var pts = [
        from,
        { x: from.x + (outX - from.x) * 0.6, y: from.y + (outY - from.y) * 0.6 },
        { x: to.x + (outX - to.x) * 0.6, y: to.y + (outY - to.y) * 0.6 },
        to
      ];

      // Dim base curve
      B.drawCurve(ctx, pts, 40, wA(from.color, 0.1), 1.5, 0);

      // Bright curve
      B.drawCurve(ctx, pts, 40, wA(from.color, 0.35), 2, 8);

      // Draw arrow hint near destination
      var arrowT = 0.8;
      var arrowPt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], arrowT);
      var arrowPt2 = B.cubicPt(pts[0], pts[1], pts[2], pts[3], arrowT - 0.05);
      var angle = Math.atan2(arrowPt.y - arrowPt2.y, arrowPt.x - arrowPt2.x);
      ctx.save();
      ctx.translate(arrowPt.x, arrowPt.y);
      ctx.rotate(angle);
      ctx.fillStyle = wA(from.color, 0.4);
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-4, -3);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Determine dot count based on cycle phase (viral growth: 1 → 3 → 9)
    var growthPhase = Math.floor(t * 3); // 0, 1, 2
    var dotCounts = [1, 3, 9];
    var numDots = dotCounts[Math.min(growthPhase, 2)];

    // Transition between phases
    var localT = (t * 3) % 1;

    // Draw flowing dots around the loop
    for (var d = 0; d < numDots; d++) {
      var dotOffset = d / numDots;
      var dotProgress = (localT + dotOffset) % 1;
      var segFloat = dotProgress * 4;
      var seg = Math.floor(segFloat);
      var segT = segFloat - seg;
      seg = seg % 4;

      var from = nodes[seg];
      var to = nodes[(seg + 1) % 4];
      var midX = (from.x + to.x) / 2;
      var midY = (from.y + to.y) / 2;
      var outX = midX + (midX - cx) * 0.5;
      var outY = midY + (midY - cy) * 0.5;
      var pts = [
        from,
        { x: from.x + (outX - from.x) * 0.6, y: from.y + (outY - from.y) * 0.6 },
        { x: to.x + (outX - to.x) * 0.6, y: to.y + (outY - to.y) * 0.6 },
        to
      ];

      var dotPt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], B.easeInOut(segT));
      var dotColor = from.color;
      var dotSize = 3 - (numDots > 3 ? 1 : 0);
      B.drawDot(ctx, dotPt, dotSize, dotColor, 10);
    }

    // Draw node dots and labels
    for (var n = 0; n < 4; n++) {
      var node = nodes[n];

      // Outer glow ring
      B.drawRing(ctx, node, 16, wA(node.color, 0.15), 1);

      // Node dot
      B.drawDot(ctx, node, 8, wA(node.color, 0.3), 12);
      B.drawDot(ctx, node, 5, wA(node.color, 0.7), 6);

      // Icon inside node
      ctx.save();
      ctx.fillStyle = wA(node.color, 0.9);
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (node.icon === 'img') {
        // Small square icon
        ctx.strokeStyle = wA(node.color, 0.8);
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x - 3, node.y - 3, 6, 6);
      } else if (node.icon === 'soc') {
        // Arrow-up icon (share)
        ctx.beginPath();
        ctx.moveTo(node.x, node.y - 3);
        ctx.lineTo(node.x + 3, node.y + 2);
        ctx.lineTo(node.x - 3, node.y + 2);
        ctx.closePath();
        ctx.fill();
      } else if (node.icon === 'usr') {
        // Small circle (person)
        ctx.beginPath();
        ctx.arc(node.x, node.y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y + 3, 3, Math.PI, 0);
        ctx.fill();
      } else {
        // Plus icon (more)
        ctx.fillRect(node.x - 3, node.y - 0.5, 6, 1);
        ctx.fillRect(node.x - 0.5, node.y - 3, 1, 6);
      }
      ctx.restore();

      // Label offset from node
      var lOffY = (n === 0) ? -24 : (n === 2) ? 24 : 0;
      var lOffX = (n === 1) ? 24 : (n === 3) ? -24 : 0;
      var align = (n === 1) ? 'left' : (n === 3) ? 'right' : 'center';
      B.drawLabel(ctx, node.label, { x: node.x + lOffX, y: node.y + lOffY },
        wA(node.color, 0.7), '10px "JetBrains Mono", monospace', align);
    }

    // Center counter — signup numbers
    var counterPhase = t;
    var milestones = ['10M', '50M', '100M'];
    var milestoneIdx = Math.min(Math.floor(counterPhase * 3), 2);
    var counterAlpha = 0.4 + 0.3 * Math.sin(time * 2);

    B.drawLabel(ctx, milestones[milestoneIdx] + ' signups',
      { x: cx, y: cy },
      wA(P.white, counterAlpha), '12px "JetBrains Mono", monospace', 'center');

    // Dot count indicator
    B.drawLabel(ctx, numDots + ' user' + (numDots > 1 ? 's' : '') + ' generating',
      { x: cx, y: cy + 16 },
      wA(P.white, 0.25), '8px "JetBrains Mono", monospace', 'center');

    // Growth rate accelerating (loop speed label)
    if (t > 0.5) {
      var accAlpha = B.easeOut(B.clamp((t - 0.5) / 0.3, 0, 1));
      B.drawLabel(ctx, 'loop accelerating...',
        { x: cx, y: cy + 30 },
        wA(P.yellow, accAlpha * 0.35), '8px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'viral adoption loop', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
