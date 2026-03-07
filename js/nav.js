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
    { section: "Mechanisms", series: 3, items: [
      ["40-hw-01-how-thinking-tokens-work", "How Thinking Tokens Work"],
      ["41-hw-02-how-prompt-caching-works", "How Prompt Caching Works"],
      ["42-hw-03-how-compaction-works", "How Compaction Works"],
      ["43-hw-04-how-speculative-decoding-works", "How Speculative Decoding Works"],
    ]},
    { section: "Training & Architecture", series: 3, items: [
      ["44-hw-05-how-rlhf-actually-works", "How RLHF Actually Works"],
      ["45-hw-06-how-mixture-of-experts-works", "How Mixture-of-Experts Works"],
      ["46-hw-07-how-distillation-changed-who-can-compete", "How Distillation Changed Who Can Compete"],
      ["47-hw-08-how-multi-token-prediction-works", "How Multi-Token Prediction Works"],
    ]},
    { section: "Breakthroughs", series: 3, items: [
      ["48-hw-09-how-deepseek-trained-r1-for-5m", "How DeepSeek Trained R1 for $5.5M"],
      ["49-hw-10-how-openclaw-became-an-os-for-ai", "How OpenClaw Became an OS for AI"],
      ["50-hw-11-how-gemini-hit-1m-token-context", "How Gemini Hit 1M Token Context"],
      ["51-hw-12-how-diffusion-llms-work", "How Diffusion LLMs Work"],
    ]},
    { section: "Products & Interface", series: 3, items: [
      ["52-hw-13-how-claude-codes-agentic-loop-works", "How Claude Code's Agentic Loop Works"],
      ["53-hw-14-how-mcp-won-in-8-days", "How MCP Won in 8 Days"],
      ["54-hw-15-how-gpt4o-imagegen-got-100m-signups", "How GPT-4o Image Generation Got 100M Signups"],
      ["55-hw-16-how-computer-use-works", "How Computer Use Works"],
    ]},
    { section: "The Race", series: 3, items: [
      ["56-hw-17-why-chinese-labs-dominate-the-leaderboard", "Why Chinese Labs Dominate the Leaderboard"],
      ["57-hw-18-the-200-month-tier-war", "The $200/Month Tier War"],
      ["58-hw-19-why-inference-costs-dropped-100x", "Why Inference Costs Dropped 100x"],
      ["59-hw-20-how-on-device-llms-work", "How On-Device LLMs Work"],
    ]},
    { section: "The Disruption", series: 4, items: [
      ["60-ec-01-the-day-chegg-lost-half-its-value", "The Day Chegg Lost Half Its Value"],
      ["61-ec-02-our-corpus-became-more-essential", "Our Corpus Became More Essential"],
    ]},
    { section: "The Workforce", series: 4, items: [
      ["62-ec-03-we-stopped-hiring", "We Stopped Hiring"],
      ["63-ec-04-before-asking-for-headcount", "Before Asking for Headcount, Prove AI Can't"],
    ]},
    { section: "The Returns", series: 4, items: [
      ["64-ec-05-2-billion-in-2-billion-back", "$2 Billion In, $2 Billion Back"],
      ["65-ec-06-850-million-data-points", "850 Million Data Points"],
    ]},
    { section: "The Infrastructure", series: 4, items: [
      ["66-ec-07-the-manhattan-sized-data-center", "The Manhattan-Sized Data Center"],
      ["67-ec-08-reasoning-consumes-100x-more-compute", "Reasoning Consumes 100x More Compute"],
    ]},
    { section: "The Strategy", series: 4, items: [
      ["68-ec-09-all-these-models-are-the-same", "All These Models Are the Same"],
      ["69-ec-10-the-physical-world-doesnt-care", "The Physical World Doesn't Care"],
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
      var seriesLabel = group.series === 1 ? 'LLM Concepts for PMs' : group.series === 2 ? 'Design Patterns of the AI Era' : group.series === 3 ? 'How It Actually Works' : 'The Earnings Call';
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
