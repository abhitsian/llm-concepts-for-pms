// nav.js — Site header + hamburger sidebar navigation
(function() {
  var ARTICLES = [
    { section: "Foundations", series: 1, items: [
      ["01-00a-what-is-an-llm-actually", "What Is an LLM, Actually?"],
      ["02-00b-the-api-layer", "The API Layer"],
      ["03-00c-training-vs-inference", "Training vs. Inference"],
      ["04-00d-embeddings-and-the-shape-of-meaning", "Embeddings & the Shape of Meaning"],
      ["05-00e-three-ways-to-customize-an-llm", "Three Ways to Customize an LLM"],
      ["06-00f-the-llm-landscape", "The LLM Landscape"],
    ]},
    { section: "Core Mechanics", series: 1, items: [
      ["07-01-tokens-are-the-new-api-calls", "Tokens Are the New API Calls"],
      ["08-02-hallucinations-arent-bugs", "Hallucinations Aren't Bugs"],
      ["09-03-the-prompt-is-the-product", "The Prompt Is the Product"],
      ["10-04-same-input-different-output", "Same Input, Different Output"],
      ["11-07-the-temperature-dial", "The Temperature Dial"],
      ["12-05-context-is-all-you-have", "Context Is All You Have"],
      ["13-06-evals-are-the-new-ab-tests", "Evals Are the New A/B Tests"],
    ]},
    { section: "UX & Economics", series: 1, items: [
      ["14-08-streaming-changed-everything", "Streaming Changed Everything"],
      ["15-09-the-feature-math-changed", "The Feature Math Changed"],
      ["16-11-when-not-to-use-an-llm", "When Not to Use an LLM"],
      ["17-10-build-vs-buy-in-llm-world", "Build vs. Buy in an LLM World"],
    ]},
    { section: "Architecture & Market", series: 1, items: [
      ["18-12-the-architecture-tax", "The Architecture Tax"],
      ["19-15-open-models-and-the-race-to-zero", "Open Models & the Race to Zero"],
    ]},
    { section: "Advanced Capabilities", series: 1, items: [
      ["20-16-tools-gave-models-hands", "Tools Gave Models Hands"],
      ["21-13-agents-are-loops-not-features", "Agents Are Loops, Not Features"],
      ["22-14-reasoning-models-changed-the-ceiling", "Reasoning Models Changed the Ceiling"],
      ["23-17-your-ai-can-see-now", "Your AI Can See Now"],
      ["24-18-the-interface-broke-free", "The Interface Broke Free"],
    ]},
    { section: "The Architecture", series: 2, items: [
      ["25-dp-01-the-loop-is-the-product", "The Loop Is the Product"],
      ["26-dp-02-context-engineering-replaced-prompt-engineering", "Context Engineering"],
      ["27-dp-03-thinking-became-a-dial", "Thinking Became a Dial"],
      ["28-dp-04-mcp-won-because-it-was-boring", "MCP Won Because It Was Boring"],
      ["29-dp-05-subagents-and-the-swarm", "Subagents & the Swarm"],
    ]},
    { section: "The Economics", series: 2, items: [
      ["30-dp-06-the-jevons-paradox-hit-ai", "The Jevons Paradox Hit AI"],
      ["31-dp-07-vibe-coding-and-the-skill-inversion", "Vibe Coding & the Skill Inversion"],
      ["32-dp-08-task-length-doubled-every-seven-months", "Task Length Doubled Every 7 Months"],
    ]},
    { section: "The Patterns", series: 2, items: [
      ["33-dp-09-the-permission-gradient", "The Permission Gradient"],
      ["34-dp-10-hooks-not-hope", "Hooks Not Hope"],
      ["35-dp-11-slop-and-the-quality-collapse", "Slop & the Quality Collapse"],
      ["36-dp-12-the-normalization-of-deviance", "The Normalization of Deviance"],
    ]},
    { section: "The Frontier", series: 2, items: [
      ["37-dp-13-async-agents-changed-the-clock", "Async Agents Changed the Clock"],
      ["38-dp-14-the-memory-problem-nobody-solved", "The Memory Problem Nobody Solved"],
      ["39-dp-15-the-harness-designed-to-shrink", "The Harness Designed to Shrink"],
    ]},
  ];

  // Detect if we're on an article page or the index
  var path = window.location.pathname;
  var isArticle = path.indexOf('/articles/') !== -1;
  var basePath = isArticle ? '../' : '';
  var articlesPath = isArticle ? '' : 'articles/';

  // Find current article slug
  var currentSlug = '';
  if (isArticle) {
    var match = path.match(/\/([^/]+)\.html$/);
    if (match) currentSlug = match[1];
  }

  // --- Build header ---
  var header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML =
    '<button class="hamburger" aria-label="Open navigation" id="nav-toggle">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
    '<a class="site-header-title" href="' + basePath + 'index.html">LLM Concepts for PMs</a>' +
    '<div class="site-header-right"></div>';

  document.body.insertBefore(header, document.body.firstChild);

  // --- Build sidebar ---
  var overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';

  var sidebar = document.createElement('nav');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  var sidebarHTML = '<div class="sidebar-header">' +
    '<span class="sidebar-title">Index</span>' +
    '<button class="sidebar-close" id="sidebar-close" aria-label="Close navigation">&times;</button>' +
    '</div><div class="sidebar-scroll">';

  var lastSeries = 0;
  ARTICLES.forEach(function(group) {
    if (group.series !== lastSeries) {
      var seriesLabel = group.series === 1 ? 'LLM Concepts for PMs' : 'Design Patterns of the AI Era';
      sidebarHTML += '<div class="sidebar-series">' + seriesLabel + '</div>';
      lastSeries = group.series;
    }
    sidebarHTML += '<div class="sidebar-section">' + group.section + '</div>';
    group.items.forEach(function(item) {
      var slug = item[0], title = item[1];
      var activeClass = slug === currentSlug ? ' sidebar-link-active' : '';
      sidebarHTML += '<a class="sidebar-link' + activeClass + '" href="' + basePath + articlesPath + slug + '.html">' + title + '</a>';
    });
  });
  sidebarHTML += '</div>';
  sidebar.innerHTML = sidebarHTML;

  document.body.appendChild(overlay);
  document.body.appendChild(sidebar);

  // Scroll to active item
  setTimeout(function() {
    var active = sidebar.querySelector('.sidebar-link-active');
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, 100);

  // --- Toggle logic ---
  var toggle = document.getElementById('nav-toggle');
  var close = document.getElementById('sidebar-close');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', openSidebar);
  close.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSidebar();
  });
})();
