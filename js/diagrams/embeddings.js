// embeddings.js — "Embeddings & the Shape of Meaning"
// Animated semantic-space diagram showing word clusters and query connections

function EmbeddingsDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  // --- Semantic points with cluster assignments ---
  // Positions are in normalized [0,1] space, mapped to canvas in draw fn.
  const clusters = [
    {
      label: 'emotion',
      color: P.teal,
      words: [
        { word: 'happy',    nx: 0.18, ny: 0.22 },
        { word: 'joyful',   nx: 0.24, ny: 0.16 },
        { word: 'cheerful', nx: 0.14, ny: 0.30 },
      ],
    },
    {
      label: 'animals',
      color: P.green,
      words: [
        { word: 'dog',    nx: 0.30, ny: 0.38 },
        { word: 'puppy',  nx: 0.24, ny: 0.44 },
        { word: 'canine', nx: 0.34, ny: 0.46 },
      ],
    },
    {
      label: 'governance',
      color: P.coral,
      words: [
        { word: 'tax',        nx: 0.76, ny: 0.68 },
        { word: 'policy',     nx: 0.82, ny: 0.76 },
        { word: 'regulation', nx: 0.70, ny: 0.78 },
      ],
    },
    {
      label: 'computing',
      color: P.blue,
      words: [
        { word: 'code',     nx: 0.72, ny: 0.38 },
        { word: 'program',  nx: 0.80, ny: 0.32 },
        { word: 'software', nx: 0.78, ny: 0.44 },
      ],
    },
  ];

  // Flatten for convenience
  function allPoints() {
    var pts = [];
    clusters.forEach(function(c) {
      c.words.forEach(function(w) {
        pts.push({ word: w.word, nx: w.nx, ny: w.ny, color: c.color });
      });
    });
    return pts;
  }

  // --- Query definitions ---
  var queries = [
    { label: 'joyful puppy', nx: 0.22, ny: 0.34 },
    { label: 'tax code',     nx: 0.74, ny: 0.54 },
  ];

  // Cycle duration: 3s connections visible + 1.5s transition
  var SHOW_DUR = 3.0;
  var TRANS_DUR = 1.5;
  var CYCLE = SHOW_DUR + TRANS_DUR;

  // Maximum distance (normalized) for a connection to appear
  var MAX_CONN_DIST = 0.50;

  // --- Bézier control-point helper ---
  // Creates a gentle cubic curve between two points by offsetting
  // control points perpendicular to the line.
  function curvePoints(from, to, bulge) {
    var mx = (from.x + to.x) / 2;
    var my = (from.y + to.y) / 2;
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    // perpendicular offset
    var px = -dy * bulge;
    var py =  dx * bulge;
    return [
      from,
      { x: mx + px * 0.6, y: my + py * 0.6 },
      { x: mx - px * 0.3, y: my - py * 0.3 },
      to
    ];
  }

  // --- Draw function ---
  function draw(ctx, w, h, t) {
    B.clear(ctx, w, h);

    // Responsive padding
    var pad = Math.min(w, h) * 0.08;
    var iw = w - pad * 2;
    var ih = h - pad * 2;

    // Map normalized coords to canvas
    function toCanvas(nx, ny) {
      return { x: pad + nx * iw, y: pad + ny * ih };
    }

    // Subtle grid
    B.drawGrid(ctx, w, h, 40);

    // --- Determine current query state ---
    var cycleTime = t % (CYCLE * queries.length);
    var qIndex = Math.floor(cycleTime / CYCLE);
    var localT = cycleTime - qIndex * CYCLE;

    var currentQuery = queries[qIndex];
    var nextQuery = queries[(qIndex + 1) % queries.length];

    // Phase: showing (0..SHOW_DUR) or transitioning (SHOW_DUR..CYCLE)
    var isTransitioning = localT > SHOW_DUR;
    var showProgress = isTransitioning ? 1.0 : B.clamp(localT / 0.8, 0, 1); // fade in over 0.8s
    var transProgress = isTransitioning
      ? B.easeInOut((localT - SHOW_DUR) / TRANS_DUR)
      : 0;

    // Interpolated query position during transition
    var qNx = B.lerp(currentQuery.nx, nextQuery.nx, transProgress);
    var qNy = B.lerp(currentQuery.ny, nextQuery.ny, transProgress);
    var qPos = toCanvas(qNx, qNy);

    // Connection fade: full during show, fading out during transition
    var connAlpha;
    if (!isTransitioning) {
      connAlpha = B.easeOut(showProgress);
    } else {
      // Fade out in first half of transition, fade in new in second half
      if (transProgress < 0.5) {
        connAlpha = 1.0 - B.easeIn(transProgress * 2);
      } else {
        connAlpha = B.easeOut((transProgress - 0.5) * 2);
      }
    }

    // Which query's connections to show
    var activeQuery = transProgress < 0.5 ? currentQuery : nextQuery;

    // --- Compute connections ---
    var points = allPoints();
    var connections = [];

    points.forEach(function(p) {
      var pPos = toCanvas(p.nx, p.ny);
      var d = B.dist(
        { x: activeQuery.nx, y: activeQuery.ny },
        { x: p.nx, y: p.ny }
      );
      if (d < MAX_CONN_DIST && d > 0.01) {
        // Similarity is inverse of distance, normalized
        var similarity = 1.0 - (d / MAX_CONN_DIST);
        similarity = similarity * similarity; // emphasize close points
        connections.push({
          point: p,
          pos: pPos,
          dist: d,
          similarity: similarity,
        });
      }
    });

    // Sort by similarity descending (closest first)
    connections.sort(function(a, b) { return b.similarity - a.similarity; });

    // --- Draw connection curves ---
    connections.forEach(function(conn, i) {
      var alpha = conn.similarity * connAlpha * 0.8;
      if (alpha < 0.02) return;

      var lineWidth = 1 + conn.similarity * 2.5;
      var glowSize = conn.similarity * 18;

      // Bulge factor varies per connection for organic feel
      var bulge = 0.15 + (i % 3) * 0.08;
      if (i % 2 === 0) bulge = -bulge;

      var pts = curvePoints(qPos, conn.pos, bulge);
      var color = B.withAlpha(conn.point.color, alpha);

      B.drawCurve(ctx, pts, 60, color, lineWidth, glowSize > 2 ? glowSize : 0);
    });

    // --- Draw cluster points ---
    points.forEach(function(p) {
      var pos = toCanvas(p.nx, p.ny);

      // Check if this point is connected to active query
      var isConnected = false;
      var similarity = 0;
      connections.forEach(function(conn) {
        if (conn.point.word === p.word) {
          isConnected = true;
          similarity = conn.similarity;
        }
      });

      var dotAlpha, dotGlow, dotRadius;
      if (isConnected && connAlpha > 0.1) {
        // Glow proportional to similarity
        var glow = similarity * connAlpha;
        dotAlpha = 0.4 + glow * 0.6;
        dotGlow = glow * 15;
        dotRadius = 3 + glow * 3;
      } else {
        dotAlpha = 0.3;
        dotGlow = 0;
        dotRadius = 3;
      }

      var dotColor = B.withAlpha(p.color, dotAlpha);
      B.drawDot(ctx, pos, dotRadius, dotColor, dotGlow);

      // Label
      var labelAlpha = isConnected && connAlpha > 0.1
        ? 0.4 + similarity * connAlpha * 0.5
        : 0.30;
      var labelColor = B.withAlpha(p.color, labelAlpha);
      var fontSize = Math.max(10, Math.min(12, w * 0.022));
      B.drawLabel(
        ctx, p.word,
        { x: pos.x, y: pos.y + dotRadius + fontSize * 0.9 },
        labelColor,
        fontSize + 'px "JetBrains Mono", monospace'
      );
    });

    // --- Draw query point ---
    // Pulse animation
    var pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
    var qRadius = 5 + pulse * 2;
    var qGlow = 12 + pulse * 8;

    B.drawDot(ctx, qPos, qRadius, B.withAlpha(P.yellow, 0.9), qGlow);

    // Outer ring that breathes
    var ringRadius = qRadius + 4 + pulse * 3;
    B.drawRing(ctx, qPos, ringRadius, B.withAlpha(P.yellow, 0.2 + pulse * 0.15), 1.5);

    // Query label — crossfade during transition
    var qFontSize = Math.max(11, Math.min(14, w * 0.026));
    var labelY = qPos.y - qRadius - 12;
    if (isTransitioning && transProgress > 0.3 && transProgress < 0.7) {
      // Crossfade zone: show both labels fading
      var fadeOut = 1.0 - B.easeInOut((transProgress - 0.3) / 0.4);
      var fadeIn = B.easeInOut((transProgress - 0.3) / 0.4);
      B.drawLabel(
        ctx, currentQuery.label,
        { x: qPos.x, y: labelY },
        B.withAlpha(P.yellow, fadeOut * 0.9),
        'bold ' + qFontSize + 'px "JetBrains Mono", monospace'
      );
      B.drawLabel(
        ctx, nextQuery.label,
        { x: qPos.x, y: labelY },
        B.withAlpha(P.yellow, fadeIn * 0.9),
        'bold ' + qFontSize + 'px "JetBrains Mono", monospace'
      );
    } else {
      var displayLabel = transProgress < 0.5 ? currentQuery.label : nextQuery.label;
      var qLabelAlpha = isTransitioning
        ? (transProgress < 0.3 ? 1.0 - transProgress / 0.3 * 0.2 : 0.9)
        : 0.9;
      B.drawLabel(
        ctx, displayLabel,
        { x: qPos.x, y: labelY },
        B.withAlpha(P.yellow, qLabelAlpha),
        'bold ' + qFontSize + 'px "JetBrains Mono", monospace'
      );
    }

    // --- Axis hints (very subtle) ---
    var axisAlpha = 0.15;
    var axisFontSize = Math.max(9, Math.min(10, w * 0.018));
    B.drawLabel(
      ctx, 'semantic space',
      { x: w / 2, y: h - 8 },
      B.withAlpha(P.white, axisAlpha),
      axisFontSize + 'px "JetBrains Mono", monospace'
    );
  }

  return B.animate(canvas, container, draw);
}
