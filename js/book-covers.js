// book-covers.js — 4 unique canvas-based cover animations for the bookshelf
// Each uses bezier-core.js primitives with a distinct visual identity

var BookCovers = (function() {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  // Book 1: LLM Concepts — Flowing knowledge curves
  // Gentle, educational — layered Bézier waves in teal
  function ConceptsCover(canvas, container) {
    var curves = [];
    for (var i = 0; i < 8; i++) {
      curves.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.12 + Math.random() * 0.15,
        amp: 0.08 + Math.random() * 0.18,
        yBase: 0.15 + (i / 8) * 0.7,
        opacity: 0.04 + Math.random() * 0.08
      });
    }

    return B.animate(canvas, container, function(ctx, w, h, time) {
      ctx.fillStyle = '#0a1a18';
      ctx.fillRect(0, 0, w, h);
      B.drawGrid(ctx, w, h, 60);

      // Flowing waves
      curves.forEach(function(c) {
        var t = time * c.speed + c.phase;
        var yBase = c.yBase * h;
        var amp = c.amp * h;

        var p0 = { x: -20, y: yBase + Math.sin(t) * amp };
        var p1 = { x: w * 0.3, y: yBase + Math.sin(t + 1.5) * amp };
        var p2 = { x: w * 0.7, y: yBase + Math.cos(t + 0.7) * amp };
        var p3 = { x: w + 20, y: yBase + Math.sin(t + 2.2) * amp };

        B.drawCurve(ctx, [p0, p1, p2, p3], 80, wA(P.teal, c.opacity + 0.06), 3, 12);
        B.drawCurve(ctx, [p0, p1, p2, p3], 80, wA(P.teal, c.opacity + 0.2), 1, 6);
      });

      // Knowledge nodes — small pulsing dots
      for (var i = 0; i < 5; i++) {
        var angle = time * 0.2 + i * 1.26;
        var px = w * (0.15 + 0.7 * ((Math.sin(angle * 0.6 + i) + 1) / 2));
        var py = h * (0.2 + 0.6 * ((Math.cos(angle * 0.4 + i * 1.5) + 1) / 2));
        var pulse = 0.3 + 0.7 * ((Math.sin(time * 1.5 + i * 0.8) + 1) / 2);
        B.drawDot(ctx, {x: px, y: py}, 2 + pulse, wA(P.teal, 0.4 * pulse), 8 * pulse);
      }
    });
  }

  // Book 2: Design Patterns — Intersecting geometric grids
  // Structured, architectural — rotating hexagonal lattice in coral
  function PatternsCover(canvas, container) {
    return B.animate(canvas, container, function(ctx, w, h, time) {
      ctx.fillStyle = '#1a0a0a';
      ctx.fillRect(0, 0, w, h);
      B.drawGrid(ctx, w, h, 60);

      var cx = w / 2, cy = h / 2;
      var maxR = Math.max(w, h) * 0.6;

      // Rotating grid of connected hexagonal points
      for (var ring = 1; ring <= 4; ring++) {
        var r = ring * maxR / 5;
        var pts = 6;
        var rotOffset = time * 0.15 * (ring % 2 === 0 ? 1 : -1);

        var nodes = [];
        for (var i = 0; i < pts; i++) {
          var angle = (i / pts) * Math.PI * 2 + rotOffset;
          var wobble = Math.sin(time * 0.5 + i + ring) * r * 0.05;
          nodes.push({
            x: cx + Math.cos(angle) * (r + wobble),
            y: cy + Math.sin(angle) * (r + wobble)
          });
        }

        // Connect adjacent nodes with curves
        for (var i = 0; i < nodes.length; i++) {
          var next = nodes[(i + 1) % nodes.length];
          var mid = { x: (nodes[i].x + next.x) / 2, y: (nodes[i].y + next.y) / 2 };
          var ctrl = {
            x: mid.x + (mid.y - cy) * 0.2,
            y: mid.y - (mid.x - cx) * 0.2
          };
          B.drawCurve(ctx, [nodes[i], ctrl, next], 40, wA(P.coral, 0.08 + ring * 0.03), 1.5, 8);
        }

        // Connect to inner ring
        if (ring > 1) {
          var innerR = (ring - 1) * maxR / 5;
          for (var i = 0; i < pts; i++) {
            var angle = (i / pts) * Math.PI * 2 + rotOffset;
            var prevAngle = (i / pts) * Math.PI * 2 + time * 0.15 * ((ring - 1) % 2 === 0 ? 1 : -1);
            var inner = {
              x: cx + Math.cos(prevAngle) * innerR,
              y: cy + Math.sin(prevAngle) * innerR
            };
            B.drawLine(ctx, nodes[i], inner, wA(P.coral, 0.04 + ring * 0.01), 0.5);
          }
        }

        // Node dots
        nodes.forEach(function(n, i) {
          var pulse = 0.3 + 0.7 * ((Math.sin(time * 2 + i + ring * 0.5) + 1) / 2);
          B.drawDot(ctx, n, 2 + pulse, wA(P.coral, 0.3 + pulse * 0.3), 6 * pulse);
        });
      }

      // Center dot
      var cPulse = 0.5 + 0.5 * Math.sin(time * 1.5);
      B.drawDot(ctx, {x: cx, y: cy}, 4 + cPulse * 2, wA(P.coral, 0.6), 15);
    });
  }

  // Book 3: How It Actually Works — Circuit/gear traces
  // Technical, precise — flowing signal paths in purple
  function MechanicsCover(canvas, container) {
    var paths = [];
    for (var i = 0; i < 6; i++) {
      paths.push({
        startY: 0.1 + (i / 6) * 0.8,
        segments: 3 + Math.floor(Math.random() * 3),
        speed: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }

    return B.animate(canvas, container, function(ctx, w, h, time) {
      ctx.fillStyle = '#0e0a1a';
      ctx.fillRect(0, 0, w, h);
      B.drawGrid(ctx, w, h, 60);

      // Signal paths — horizontal traces with right-angle bends
      paths.forEach(function(path) {
        var y = path.startY * h;
        var segW = w / path.segments;
        var signalPos = ((time * path.speed + path.phase) % (path.segments + 1));

        for (var s = 0; s < path.segments; s++) {
          var x1 = s * segW;
          var x2 = (s + 1) * segW;
          var yOff = Math.sin(time * 0.3 + s + path.phase) * h * 0.08;
          var nextYOff = Math.sin(time * 0.3 + s + 1 + path.phase) * h * 0.08;

          // Horizontal segment
          var a = { x: x1, y: y + yOff };
          var b = { x: x1 + segW * 0.4, y: y + yOff };
          B.drawLine(ctx, a, b, wA(P.purple, 0.12), 1.5);

          // Curved bend
          var bendStart = { x: x1 + segW * 0.4, y: y + yOff };
          var bendCtrl = { x: x1 + segW * 0.5, y: y + (yOff + nextYOff) / 2 };
          var bendEnd = { x: x1 + segW * 0.6, y: y + nextYOff };
          B.drawCurve(ctx, [bendStart, bendCtrl, bendEnd], 20, wA(P.purple, 0.12), 1.5, 4);

          // Continuation
          var c = { x: x1 + segW * 0.6, y: y + nextYOff };
          var d = { x: x2, y: y + nextYOff };
          B.drawLine(ctx, c, d, wA(P.purple, 0.12), 1.5);

          // Signal pulse traveling along path
          if (Math.abs(signalPos - s) < 1) {
            var frac = signalPos - Math.floor(signalPos);
            var px, py;
            if (frac < 0.4) {
              px = x1 + segW * frac;
              py = y + yOff;
            } else if (frac < 0.6) {
              var bf = (frac - 0.4) / 0.2;
              px = x1 + segW * (0.4 + bf * 0.2);
              py = y + yOff + (nextYOff - yOff) * bf;
            } else {
              px = x1 + segW * frac;
              py = y + nextYOff;
            }
            B.drawDot(ctx, {x: px, y: py}, 3, wA(P.purple, 0.8), 12);
          }

          // Junction nodes
          if (s > 0) {
            B.drawDot(ctx, a, 2, wA(P.purple, 0.2), 4);
          }
        }
      });

      // Processing nodes — larger circles at intersections
      for (var i = 0; i < 4; i++) {
        var nx = w * (0.2 + i * 0.2);
        var ny = h * (0.3 + Math.sin(time * 0.2 + i) * 0.15);
        var pulse = 0.4 + 0.6 * ((Math.sin(time * 1.2 + i * 1.5) + 1) / 2);
        B.drawRing(ctx, {x: nx, y: ny}, 8 + pulse * 4, wA(P.purple, 0.15 + pulse * 0.15), 1.5);
        B.drawDot(ctx, {x: nx, y: ny}, 2 + pulse, wA(P.purple, 0.4 + pulse * 0.3), 8);
      }
    });
  }

  // Book 4: The Earnings Call — Rising/falling chart lines
  // Financial, data-driven — candlestick-inspired curves in yellow
  function EarningsCover(canvas, container) {
    var series = [];
    for (var i = 0; i < 4; i++) {
      var points = [];
      for (var j = 0; j < 8; j++) {
        points.push({
          baseY: 0.3 + Math.random() * 0.4,
          volatility: 0.05 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2
        });
      }
      series.push({
        points: points,
        color: i === 0 ? P.yellow : i === 1 ? P.green : i === 2 ? P.coral : P.teal,
        speed: 0.15 + i * 0.05,
        opacity: 0.15 - i * 0.02
      });
    }

    return B.animate(canvas, container, function(ctx, w, h, time) {
      ctx.fillStyle = '#14120a';
      ctx.fillRect(0, 0, w, h);
      B.drawGrid(ctx, w, h, 60);

      // Chart lines
      series.forEach(function(s) {
        var pts = [];
        s.points.forEach(function(p, j) {
          var x = (j / (s.points.length - 1)) * w;
          var y = (p.baseY + Math.sin(time * s.speed + p.phase + j * 0.5) * p.volatility) * h;
          pts.push({ x: x, y: y });
        });

        // Draw smooth curve through points using cubic segments
        for (var j = 0; j < pts.length - 1; j++) {
          var curr = pts[j];
          var next = pts[j + 1];
          var cp1 = { x: curr.x + (next.x - curr.x) * 0.4, y: curr.y };
          var cp2 = { x: curr.x + (next.x - curr.x) * 0.6, y: next.y };
          B.drawCurve(ctx, [curr, cp1, cp2, next], 30, wA(s.color, s.opacity + 0.05), 2, 8);
          B.drawCurve(ctx, [curr, cp1, cp2, next], 30, wA(s.color, s.opacity + 0.15), 1, 4);
        }

        // Data points
        pts.forEach(function(p, j) {
          var pulse = 0.3 + 0.7 * ((Math.sin(time * 1.5 + j * 0.8 + s.speed) + 1) / 2);
          B.drawDot(ctx, p, 1.5 + pulse, wA(s.color, 0.3 + pulse * 0.3), 5 * pulse);
        });
      });

      // Vertical "earnings date" markers
      for (var i = 0; i < 3; i++) {
        var markerX = w * (0.25 + i * 0.25);
        var markerPhase = Math.sin(time * 0.3 + i) * w * 0.03;
        B.drawLine(ctx,
          { x: markerX + markerPhase, y: h * 0.1 },
          { x: markerX + markerPhase, y: h * 0.9 },
          wA(P.yellow, 0.06), 1, [4, 8]
        );
      }
    });
  }

  return {
    ConceptsCover: ConceptsCover,
    PatternsCover: PatternsCover,
    MechanicsCover: MechanicsCover,
    EarningsCover: EarningsCover
  };
})();
