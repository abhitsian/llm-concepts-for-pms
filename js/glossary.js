// glossary.js — interactive term glossary for LLM Concepts for PMs.
// Two parts: (1) GLOSSARY data — every term, a short hover definition, and the
// foundation primer that explains it in full. (2) a runtime that scans the
// article, underlines known terms, and shows a hover/tap definition card.
//
// Primers (all live in /articles/):
//   111-fd-01-the-physical-stack.html
//   112-fd-02-memory.html
//   113-fd-03-compute-and-precision.html
//   114-fd-04-how-an-llm-runs-on-silicon.html
//   115-fd-05-connecting-chips.html

var GLOSSARY = {
  // ---- Primer 1: The Physical Stack ----
  "transistor": { p: "111-fd-01-the-physical-stack.html", s: "A microscopic electrical switch — on or off, 1 or 0. A modern chip packs tens to hundreds of billions of them. Everything a chip does is transistors switching." },
  "silicon": { p: "111-fd-01-the-physical-stack.html", s: "The semiconductor material chips are made from — refined from ordinary sand. 'Silicon' is also shorthand for the chip industry itself." },
  "wafer": { p: "111-fd-01-the-physical-stack.html", s: "A thin, round disc of pure silicon (usually 300mm across) on which chips are printed. One wafer is sliced into many chips — unless you're Cerebras and use the whole thing as one chip." },
  "die": { p: "111-fd-01-the-physical-stack.html", s: "A single rectangle of silicon cut from a wafer — one chip's worth of circuitry. 'Die' and 'chip' are used almost interchangeably.", aliases: ["dies"] },
  "reticle": { p: "111-fd-01-the-physical-stack.html", s: "The photographic stamp used to print one chip pattern onto a wafer. Its maximum size (~858mm²) is the 'reticle limit' — the hard ceiling on how big a single chip can be." },
  "reticle limit": { p: "111-fd-01-the-physical-stack.html", s: "The ~858mm² maximum size of a single chip, set by the size of the lithography stamp. To go bigger you must stitch multiple dies together (chiplets) or use the whole wafer (Cerebras)." },
  "photolithography": { p: "111-fd-01-the-physical-stack.html", s: "Printing circuit patterns onto silicon using light projected through a mask. The core step of chip manufacturing.", aliases: ["lithography"] },
  "process node": { p: "111-fd-01-the-physical-stack.html", s: "A generation of chip manufacturing technology, named like 'N3' or '5nm'. Smaller number = more transistors in the same area = faster and cheaper per transistor.", aliases: ["node", "nodes"] },
  "Moore's Law": { p: "111-fd-01-the-physical-stack.html", s: "The decades-long trend of transistor density roughly doubling every ~2 years. It's now slowing sharply, which is why hardware progress increasingly comes from packaging and architecture, not just smaller transistors." },
  "TSMC": { p: "111-fd-01-the-physical-stack.html", s: "Taiwan Semiconductor Manufacturing Company — the contract factory that actually makes the leading-edge chips for Nvidia, AMD, Apple, and most others. The single biggest chokepoint in AI hardware." },
  "foundry": { p: "111-fd-01-the-physical-stack.html", s: "A factory that manufactures chips designed by other companies. TSMC, Samsung Foundry, and Intel Foundry are the leading-edge foundries.", aliases: ["fab", "fabs"] },
  "yield": { p: "111-fd-01-the-physical-stack.html", s: "The percentage of chips on a wafer that come out working. Defects are inevitable; bigger chips have worse yield, which is a core cost driver." },
  "tape-out": { p: "111-fd-01-the-physical-stack.html", s: "The milestone where a finished chip design is sent to the foundry to be manufactured — the chip-design equivalent of a production deploy.", aliases: ["tapeout"] },
  "EUV": { p: "111-fd-01-the-physical-stack.html", s: "Extreme Ultraviolet lithography — the advanced light source needed to print the smallest modern chip features. Made by a single company, ASML." },

  // ---- Primer 2: Memory ----
  "SRAM": { p: "112-fd-02-memory.html", s: "Static RAM — extremely fast memory built directly onto the chip. Blazing bandwidth and low latency, but tiny capacity and very expensive per bit. The basis of Groq and Cerebras chips." },
  "DRAM": { p: "112-fd-02-memory.html", s: "Dynamic RAM — the main, bulk memory of a computer. Much larger and cheaper than SRAM, but slower. HBM is a stacked, high-speed form of DRAM." },
  "HBM": { p: "112-fd-02-memory.html", s: "High Bandwidth Memory — stacks of DRAM placed right next to the chip for high bandwidth. The standard memory for AI GPUs; supply is chronically constrained." },
  "memory bandwidth": { p: "112-fd-02-memory.html", s: "How fast data can move between memory and the compute cores, measured in GB/s or TB/s. For AI inference, bandwidth — not raw compute — is usually the bottleneck.", aliases: ["bandwidth"] },
  "memory hierarchy": { p: "112-fd-02-memory.html", s: "The tiered stack of memory types — registers, SRAM, HBM/DRAM, SSD, disk — trading speed for capacity at each level. Closer to the compute = faster and smaller." },
  "memory wall": { p: "112-fd-02-memory.html", s: "The widening gap between how fast chips can compute and how fast memory can feed them data. Compute outran memory; closing that gap is the central problem of AI hardware." },
  "latency": { p: "112-fd-02-memory.html", s: "The delay before a result starts arriving — time-to-first-response. Distinct from throughput (total volume) and bandwidth (data rate)." },

  // ---- Primer 3: Compute & Precision ----
  "FLOP": { p: "113-fd-03-compute-and-precision.html", s: "Floating-Point Operation — one piece of arithmetic (a multiply or add). The basic unit of compute work." },
  "FLOPS": { p: "113-fd-03-compute-and-precision.html", s: "FLOPs per second — the speed of a chip's compute. PFLOPS = a quadrillion per second. The headline number on every chip spec sheet.", aliases: ["PFLOPS", "TFLOPS", "petaFLOPs", "PFLOPs", "TFLOPs"] },
  "precision": { p: "113-fd-03-compute-and-precision.html", s: "How many bits represent each number. Lower precision (FP8, FP4) = faster and smaller but less exact. AI has steadily moved down the precision ladder." },
  "FP4": { p: "113-fd-03-compute-and-precision.html", s: "4-bit floating point — a very low-precision number format. Cuts memory and doubles or quadruples compute speed vs FP16; most 2026 inference is shifting to it.", aliases: ["NVFP4", "FP8", "BF16", "FP16", "FP32"] },
  "quantization": { p: "113-fd-03-compute-and-precision.html", s: "Compressing a model's numbers to a lower precision (e.g. FP16 → FP4) to make it smaller and faster to run, accepting a small accuracy cost." },
  "dense": { p: "113-fd-03-compute-and-precision.html", s: "A 'dense' FLOP number counts real, fully-used compute. A 'sparse' number assumes many values are zero and can be skipped — a marketing-friendly multiplier. Always check which one a spec quotes.", aliases: ["sparse", "sparsity"] },
  "GPU": { p: "113-fd-03-compute-and-precision.html", s: "Graphics Processing Unit — a massively parallel, general-purpose chip. Nvidia's GPUs are the default AI workhorse: flexible, fast, and surrounded by mature software (CUDA)." },
  "ASIC": { p: "113-fd-03-compute-and-precision.html", s: "Application-Specific Integrated Circuit — a chip custom-built for one job. Google's TPU and Amazon's Trainium are AI ASICs: less flexible than a GPU but cheaper per unit of work." },
  "LPU": { p: "113-fd-03-compute-and-precision.html", s: "Language Processing Unit — Groq's inference chip, built around large on-chip SRAM for extreme speed at small batch sizes. Nvidia licensed the design." },
  "TPU": { p: "113-fd-03-compute-and-precision.html", s: "Tensor Processing Unit — Google's custom AI chip (an ASIC). The only hyperscaler ASIC that rivals Nvidia GPUs, now also sold to outside customers like Anthropic." },
  "Trainium": { p: "113-fd-03-compute-and-precision.html", s: "Amazon's custom AI chip (an ASIC), built with design partners. Anthropic is the anchor customer; it powers much of AWS's AI capacity." },
  "accelerator": { p: "113-fd-03-compute-and-precision.html", s: "Any chip specialized for AI math — GPU, TPU, Trainium, LPU. A catch-all for 'the expensive chip doing the actual AI work'.", aliases: ["XPU", "XPUs", "accelerators"] },
  "CUDA": { p: "113-fd-03-compute-and-precision.html", s: "Nvidia's software platform for programming its GPUs. Two decades of CUDA tooling and libraries is the 'moat' that makes Nvidia hard to replace." },
  "arithmetic intensity": { p: "113-fd-03-compute-and-precision.html", s: "How much math a workload does per byte of memory it moves (FLOPs per byte). Low intensity = memory-bound; high intensity = compute-bound. It decides which chip suits which job." },
  "compute-bound": { p: "113-fd-03-compute-and-precision.html", s: "A workload limited by raw math speed — the compute cores are the bottleneck, memory keeps up. Prefill is compute-bound." },
  "memory-bound": { p: "113-fd-03-compute-and-precision.html", s: "A workload limited by memory speed — compute cores sit idle waiting for data. Decode is memory-bound, which is why memory bandwidth matters so much for inference." },
  "tensor core": { p: "113-fd-03-compute-and-precision.html", s: "The specialized unit inside a modern GPU that does matrix multiplication — the operation at the heart of every neural network." },
  "GEMM": { p: "113-fd-03-compute-and-precision.html", s: "General Matrix Multiply — multiplying two matrices. The dominant computation in running a neural network; chip performance is largely 'how fast can you GEMM'." },

  // ---- Primer 4: How an LLM Runs on Silicon ----
  "token": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The unit an LLM reads and writes — roughly 4 characters of text. You pay per token in and per token out. Tokens are the API call and the billing unit of AI.", aliases: ["tokens"] },
  "parameter": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "One of the billions of numbers that make up a trained model — the 'weights' learned during training. More parameters generally means a more capable but more expensive model.", aliases: ["parameters", "weights"] },
  "training": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The compute-heavy process of building a model by adjusting its parameters over enormous datasets. Done once (per model); costs tens to hundreds of millions of dollars." },
  "inference": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "Running a finished model to answer a request — the everyday use of AI. Inference happens billions of times and is where ongoing cost and revenue live." },
  "pretraining": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The first, largest stage of training — learning general capability from a vast text corpus. A new 'pretrain' is a major, expensive event for an AI lab.", aliases: ["pre-train", "post-training"] },
  "prefill": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The first phase of inference: the model reads the entire prompt at once. Compute-bound, so it suits GPUs. Determines time-to-first-token." },
  "decode": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The second phase of inference: the model writes the answer one token at a time. Memory-bound and latency-sensitive — the phase SRAM chips and fast memory accelerate." },
  "KV cache": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The running memory of a conversation — what the model has 'read' so far, kept so it needn't re-read it for every new token. It grows with context length and consumes large amounts of memory.", aliases: ["KVCache", "KV Cache"] },
  "context window": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The maximum amount of text (in tokens) a model can consider at once — its working memory. Bigger context allows longer documents and agent histories but costs more memory.", aliases: ["context length"] },
  "attention": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The part of a transformer that lets each token look at every other token to decide what matters. It is memory-heavy because it must load the KV cache." },
  "FFN": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "Feed-Forward Network — the part of a transformer layer that processes each token independently. Stateless and compute-heavy, which is why it can be split onto specialized chips.", aliases: ["feed forward network", "feed-forward network"] },
  "transformer": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The neural-network architecture behind essentially every modern LLM. Built from stacked layers, each containing an attention block and an FFN block." },
  "MoE": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "Mixture of Experts — a model split into many specialist sub-networks ('experts'); each token uses only a few. Lets total size grow without proportionally growing the cost to run.", aliases: ["mixture of experts", "mixture-of-expert", "expert", "experts"] },
  "batch size": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "How many user requests a chip serves at once. Bigger batches raise total throughput but slow each individual user — the core inference tradeoff.", aliases: ["batching", "concurrency", "batch"] },
  "throughput": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "Total tokens produced per second across all users on a chip. The 'bus' side of the bus-vs-Ferrari tradeoff against interactivity." },
  "interactivity": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "Tokens per second delivered to a single user — how fast the answer appears to one person. The 'Ferrari' side of the tradeoff against total throughput." },
  "speculative decoding": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "A speed trick: a small fast model drafts several tokens, the big model verifies them in one pass. Produces more tokens per step when the draft is right." },
  "distillation": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "Training a smaller model to imitate a larger one. Yields a cheaper, faster model with much of the big model's quality — how GPT-5.3-Codex-Spark was made." },
  "reasoning model": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "A model that 'thinks' before answering, generating hidden chain-of-thought tokens. Far more capable on hard problems, but consumes 5–100x more tokens per response.", aliases: ["chain-of-thought", "chain of thought"] },
  "harness": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "The software wrapped around a model — context management, tools, memory, sandboxing. Claude Code and Codex are harnesses. The harness is as important as the model." },
  "agent": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "An AI that runs a multi-step loop on its own — reads, plans, acts, checks — rather than answering one prompt. Claude Code is the canonical example.", aliases: ["agents", "agentic"] },

  // ---- Primer 5: Connecting Chips & Datacenters ----
  "scale-up": { p: "115-fd-05-connecting-chips.html", s: "Connecting chips tightly into one fast pool — within a node or rack — so many chips act like one big chip. NVLink is Nvidia's scale-up fabric.", aliases: ["scale up"] },
  "scale-out": { p: "115-fd-05-connecting-chips.html", s: "Connecting many nodes or racks more loosely over a network (Ethernet/InfiniBand) into a large cluster. Looser and slower than scale-up.", aliases: ["scale out", "scale-across", "scale across"] },
  "NVLink": { p: "115-fd-05-connecting-chips.html", s: "Nvidia's high-speed interconnect for linking GPUs into a single scale-up domain. Far faster than standard networking; a key part of Nvidia's system advantage." },
  "SerDes": { p: "115-fd-05-connecting-chips.html", s: "Serializer/Deserializer — the circuitry that shoots data between chips over a wire, one bit-stream at a time. Measured in Gbps per lane; the building block of all chip-to-chip links." },
  "interconnect": { p: "115-fd-05-connecting-chips.html", s: "Any link that moves data between chips, packages, or racks. The faster the interconnect, the more chips can work as one." },
  "advanced packaging": { p: "115-fd-05-connecting-chips.html", s: "Techniques for combining multiple dies and memory stacks into one package — the way around the reticle limit and the slowdown of Moore's Law." },
  "CoWoS": { p: "115-fd-05-connecting-chips.html", s: "Chip-on-Wafer-on-Substrate — TSMC's advanced packaging that mounts a chip and its HBM stacks on a shared silicon base. Capacity for it is a key AI-supply bottleneck." },
  "chiplet": { p: "115-fd-05-connecting-chips.html", s: "A small die that is one piece of a larger multi-die chip. Splitting a big chip into chiplets improves yield and gets around the reticle limit.", aliases: ["chiplets"] },
  "hybrid bonding": { p: "115-fd-05-connecting-chips.html", s: "An advanced way to stack and fuse dies with extremely dense vertical connections — used to put memory or extra logic directly on top of a compute chip." },
  "rack": { p: "115-fd-05-connecting-chips.html", s: "A cabinet of servers wired into one tightly-coupled system. 'NVL72' means 72 GPUs in a rack connected by NVLink to behave as one giant accelerator." },
  "NVL72": { p: "115-fd-05-connecting-chips.html", s: "An Nvidia rack of 72 GPUs joined by NVLink into a single scale-up domain. Larger 'world sizes' (NVL144, NVL576) connect more chips still.", aliases: ["NVL144", "NVL576", "NVL288", "NVL1152", "world size"] },
  "InfiniBand": { p: "115-fd-05-connecting-chips.html", s: "A high-performance networking standard used for scale-out in AI clusters. RoCE and Ethernet are the competing options.", aliases: ["RoCE", "Ethernet"] },
  "CPO": { p: "115-fd-05-connecting-chips.html", s: "Co-Packaged Optics — putting the optical (light-based) data link right next to the chip instead of in a pluggable module. Needed when copper wires can't carry enough bandwidth far enough.", aliases: ["co-packaged optics", "optics", "optical"] },
  "datacenter": { p: "115-fd-05-connecting-chips.html", s: "The building that houses AI compute — racks, power, and cooling. Modern AI datacenters are measured in megawatts and cost billions.", aliases: ["data center", "data centers", "datacenters"] },
  "megawatt": { p: "115-fd-05-connecting-chips.html", s: "A unit of power (1 MW ≈ the draw of ~800 homes). AI datacenter capacity is measured in MW and GW; power, not chips, is increasingly the binding constraint.", aliases: ["MW", "gigawatt", "GW"] },
  "TCO": { p: "115-fd-05-connecting-chips.html", s: "Total Cost of Ownership — the real all-in cost of running compute, including power, cooling, downtime, setup, and support — not just the headline hardware price." },
  "neocloud": { p: "115-fd-05-connecting-chips.html", s: "A cloud company that exists specifically to rent out GPUs — CoreWeave, Nebius, Crusoe, Lambda. Sits between the chip makers and the AI labs.", aliases: ["neoclouds", "Neocloud", "Neoclouds"] },
  "hyperscaler": { p: "115-fd-05-connecting-chips.html", s: "A giant cloud operator — AWS, Microsoft Azure, Google Cloud. They build their own datacenters at vast scale and increasingly their own chips.", aliases: ["hyperscalers"] },
  "goodput": { p: "115-fd-05-connecting-chips.html", s: "The useful work a cluster actually produces — total throughput minus everything wasted on failures, restarts, and downtime. The metric that maps to real cost." },
  "AFD": { p: "115-fd-05-connecting-chips.html", s: "Attention–FFN Disaggregation — running the memory-heavy attention step and the compute-heavy FFN step on different chips, each suited to its job.", aliases: ["PD disaggregation", "prefill-decode disaggregation", "disaggregated"] },
  "ARR": { p: "114-fd-04-how-an-llm-runs-on-silicon.html", s: "Annual Recurring Revenue — annualized run-rate revenue. The headline growth metric for AI labs and SaaS companies alike." }
};

(function () {
  if (typeof document === "undefined") return;

  // Expose data for the glossary index page.
  window.GLOSSARY = GLOSSARY;
  if (document.body && document.body.classList.contains("glossary-index-page")) return;

  var currentFile = (location.pathname.split("/").pop() || "");

  function injectStyles() {
    var css =
      ".gloss{border-bottom:1px dotted var(--color-accent);cursor:help;}" +
      ".gloss:hover{background:var(--color-active-bg);}" +
      ".gloss-pop{position:fixed;z-index:9999;max-width:320px;background:var(--color-card);" +
      "color:var(--color-text-80);border:1px solid var(--color-border);" +
      "box-shadow:var(--color-shadow);padding:14px 16px;border-radius:4px;" +
      "font-family:var(--font-serif);font-size:14px;line-height:1.6;" +
      "opacity:0;visibility:hidden;transition:opacity .12s ease;pointer-events:none;}" +
      ".gloss-pop.show{opacity:1;visibility:visible;pointer-events:auto;}" +
      ".gloss-pop .gp-term{font-family:var(--font-mono);font-size:11px;text-transform:uppercase;" +
      "letter-spacing:0.5px;color:var(--color-accent);margin-bottom:6px;}" +
      ".gloss-pop .gp-link{display:inline-block;margin-top:9px;font-family:var(--font-mono);" +
      "font-size:11px;color:var(--color-accent);text-decoration:none;}" +
      ".gloss-pop .gp-link:hover{text-decoration:underline;}" +
      ".buildup{max-width:var(--max-prose);margin:28px auto 0;border:1px solid var(--color-border);" +
      "border-left:3px solid var(--color-accent);background:var(--color-hover-bg);padding:14px 18px;border-radius:3px;}" +
      ".buildup-title{font-family:var(--font-mono);font-size:10px;text-transform:uppercase;" +
      "letter-spacing:0.6px;color:var(--color-accent);margin-bottom:8px;}" +
      ".buildup ol{margin:0;padding-left:18px;}" +
      ".buildup li{font-size:13px;line-height:1.5;margin-bottom:6px;color:var(--color-text-80);}" +
      ".buildup a{color:var(--color-accent);text-decoration:none;font-weight:600;}" +
      ".buildup a:hover{text-decoration:underline;}" +
      ".buildup-foot{font-size:11.5px;color:var(--color-text-50);margin-top:9px;font-style:italic;}";
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  // Build a single case-insensitive regex of every term + alias, longest first
  // (so "memory bandwidth" wins over "bandwidth").
  function buildIndex() {
    var entries = [];
    Object.keys(GLOSSARY).forEach(function (key) {
      var def = GLOSSARY[key];
      entries.push({ label: key, key: key });
      (def.aliases || []).forEach(function (a) {
        entries.push({ label: a, key: key });
      });
    });
    entries.sort(function (a, b) { return b.label.length - a.label.length; });
    var lookup = {};
    var parts = entries.map(function (e) {
      lookup[e.label.toLowerCase()] = e.key;
      return e.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
    return { regex: new RegExp("\\b(" + parts.join("|") + ")\\b", "i"), lookup: lookup };
  }

  var SKIP = { A: 1, H1: 1, H2: 1, H3: 1, H4: 1, CODE: 1, SUP: 1, NAV: 1, BUTTON: 1, STYLE: 1, SCRIPT: 1 };
  var SKIP_CLASS = { gloss: 1, "gloss-pop": 1, "article-meta": 1, "article-subtitle": 1, "divider": 1, "end-mark": 1, "article-nav": 1, "buildup": 1 };

  function skipAncestor(node) {
    var n = node.parentNode;
    while (n && n !== document.body) {
      if (n.nodeType === 1) {
        if (SKIP[n.tagName]) return true;
        var cl = n.className;
        if (typeof cl === "string") {
          var bits = cl.split(/\s+/);
          for (var i = 0; i < bits.length; i++) if (SKIP_CLASS[bits[i]]) return true;
        }
      }
      n = n.parentNode;
    }
    return false;
  }

  function wrapTerms() {
    var root = document.querySelector(".article-card");
    if (!root) return;
    var idx = buildIndex();
    var used = {}; // wrap each term once per page

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var t;
    while ((t = walker.nextNode())) textNodes.push(t);

    textNodes.forEach(function (textNode) {
      if (skipAncestor(textNode)) return;
      var remaining = textNode;
      // A text node may hold several different terms — loop until none left.
      for (var guard = 0; guard < 12; guard++) {
        var text = remaining.nodeValue;
        var m = idx.regex.exec(text);
        if (!m) break;
        var key = idx.lookup[m[1].toLowerCase()];
        if (!key || used[key]) {
          // Already used this term — neutralise just this match and re-scan.
          var skipSpan = document.createElement("span");
          skipSpan.appendChild(document.createTextNode(m[1]));
          var afterSkip = remaining.splitText(m.index);
          afterSkip.nodeValue = afterSkip.nodeValue.substring(m[1].length);
          remaining.parentNode.insertBefore(skipSpan, afterSkip);
          remaining = afterSkip;
          continue;
        }
        used[key] = true;
        var after = remaining.splitText(m.index);
        after.nodeValue = after.nodeValue.substring(m[1].length);
        var span = document.createElement("span");
        span.className = "gloss";
        span.setAttribute("data-term", key);
        span.appendChild(document.createTextNode(m[1]));
        remaining.parentNode.insertBefore(span, after);
        remaining = after;
      }
    });
  }

  var pop, hideTimer;

  function buildPop() {
    pop = document.createElement("div");
    pop.className = "gloss-pop";
    document.body.appendChild(pop);
    pop.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
    pop.addEventListener("mouseleave", scheduleHide);
  }

  function showPop(span) {
    clearTimeout(hideTimer);
    var key = span.getAttribute("data-term");
    var def = GLOSSARY[key];
    if (!def) return;
    var samePage = def.p === currentFile;
    var link = samePage
      ? '<a class="gp-link" href="fd-glossary.html">Full glossary &rarr;</a>'
      : '<a class="gp-link" href="' + def.p + '">Read the primer &rarr;</a>';
    pop.innerHTML = '<div class="gp-term">' + key + "</div>" + def.s + link;
    pop.classList.add("show");
    var r = span.getBoundingClientRect();
    var pw = Math.min(320, window.innerWidth - 24);
    var left = r.left;
    if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
    if (left < 12) left = 12;
    var top = r.bottom + 8;
    pop.style.left = left + "px";
    pop.style.top = top + "px";
    // Flip above if it would run off the bottom.
    var ph = pop.offsetHeight;
    if (top + ph > window.innerHeight - 12 && r.top - ph - 8 > 12) {
      pop.style.top = (r.top - ph - 8) + "px";
    }
  }

  function scheduleHide() {
    hideTimer = setTimeout(function () { pop.classList.remove("show"); }, 220);
  }

  function wire() {
    document.querySelectorAll(".gloss").forEach(function (span) {
      span.addEventListener("mouseenter", function () { showPop(span); });
      span.addEventListener("mouseleave", scheduleHide);
      span.addEventListener("click", function (e) {
        // Tap (touch) or click: open the sticky card rather than navigating.
        e.preventDefault();
        showPop(span);
      });
    });
  }

  function init() {
    injectStyles();
    buildPop();
    wrapTerms();
    wire();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
