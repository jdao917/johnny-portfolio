document.addEventListener("DOMContentLoaded", () => {
  markCurrentProjectViewed();
  setupViewedProjectBadges();
  setupProjectLinkTracking();
  setupSingleDemoLoader();
  setupCicdSimulator();
  setupEmailReveal();
  setupPortfolioAssistant();
});

function markCurrentProjectViewed() {
  const projectId = document.body.dataset.projectId;
  if (projectId) {
    localStorage.setItem(`viewed-${projectId}`, "true");
  }
}

function setupProjectLinkTracking() {
  document.querySelectorAll("[data-view-project]").forEach((link) => {
    link.addEventListener("click", () => {
      localStorage.setItem(`viewed-${link.dataset.viewProject}`, "true");
    });
  });
}

function setupViewedProjectBadges() {
  document.querySelectorAll("[data-project-id]").forEach((card) => {
    const projectId = card.dataset.projectId;

    if (localStorage.getItem(`viewed-${projectId}`) === "true") {
      card.classList.add("viewed");

      if (!card.querySelector(".viewed-badge")) {
        const badge = document.createElement("span");
        badge.className = "viewed-badge";
        badge.textContent = "Viewed";
        card.appendChild(badge);
      }
    }
  });
}

function setupSingleDemoLoader() {
  const button = document.querySelector("[data-demo-file]");
  if (!button) return;

  const output = document.getElementById("demo-output");
  const title = document.getElementById("demo-title");
  const summary = document.getElementById("demo-summary");
  const log = document.getElementById("demo-log");
  const metrics = document.getElementById("demo-metrics");
  const table = document.getElementById("demo-table");
  const architecture = document.getElementById("demo-architecture");
  const steps = document.getElementById("demo-steps"); const demoLinks = document.getElementById("demo-links");

  if (!output || !title || !summary || !log || !metrics || !table || !architecture || !steps) return;

  button.addEventListener("click", async () => {
    output.classList.remove("hidden");
    output.scrollIntoView({ behavior: "smooth", block: "start" });

    title.textContent = "Loading demo...";
    summary.textContent = "Reading cached sample output...";
    log.textContent = "";
    metrics.innerHTML = "";
    table.innerHTML = "";
    architecture.textContent = ""; if (demoLinks) demoLinks.innerHTML = "";
    steps.innerHTML = "";

    try {
      const response = await fetch(button.dataset.demoFile);
      const demo = await response.json();

      title.textContent = demo.title;
      summary.textContent = demo.summary;
      renderSteps(demo.steps, steps);

      let i = 0;
      const timer = setInterval(() => {
        log.textContent += demo.logs[i] + "\n";
        i++;

        if (i >= demo.logs.length) {
          clearInterval(timer);
          renderMetrics(demo.metrics, metrics);
          renderTable(demo.table, table);
          architecture.textContent = demo.architecture; renderDemoLinks(demo.links, demoLinks);
        }
      }, 250);
    } catch (error) {
      title.textContent = "Demo failed to load";
      summary.textContent = "The cached demo file could not be loaded.";
      log.textContent = error;
    }
  });
}

function renderMetrics(items, metrics) {
  if (!items || items.length === 0) return;

  metrics.innerHTML = items.map(item => `
    <div class="metric">
      <strong>${item.value}</strong>
      <span>${item.label}</span>
    </div>
  `).join("");
}

function renderTable(rows, table) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  table.innerHTML = `
    <table>
      <thead>
        <tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>${headers.map(header => `<td>${row[header]}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderSteps(items, steps) {
  if (!items || items.length === 0) return;
  const listItems = items.map(item => `<li>${item}</li>`).join("");
  steps.innerHTML = `<h4>What this demo is showing</h4><ul>${listItems}</ul>`;
}

function setupCicdSimulator() {
  const cicdButton = document.getElementById("run-cicd-sim");
  const cicdClose = document.getElementById("close-cicd-sim");
  const cicdBackdrop = document.getElementById("sim-backdrop");
  const mergeButton = document.getElementById("merge-pr-btn");

  if (!cicdButton) return;

  let selectedAnimal = null;

  const animalMap = {
    fox: { emoji: "🦊", label: "Fox" },
    owl: { emoji: "🦉", label: "Owl" },
    otter: { emoji: "🦦", label: "Otter" },
    panda: { emoji: "🐼", label: "Panda" }
  };

  function closeCicdModal() {
    const output = document.getElementById("cicd-sim-output");
    if (output) output.classList.add("hidden");
    if (cicdBackdrop) cicdBackdrop.classList.add("hidden");
  }

  if (cicdClose) cicdClose.addEventListener("click", closeCicdModal);
  if (cicdBackdrop) cicdBackdrop.addEventListener("click", closeCicdModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCicdModal();
  });

  cicdButton.addEventListener("click", () => {
    const dropdown = document.getElementById("visitor-name");
    selectedAnimal = animalMap[dropdown.value] || animalMap.fox;

    const output = document.getElementById("cicd-sim-output");
    const diff = document.getElementById("sim-diff");
    const pipe = document.getElementById("sim-pipeline");
    const preview = document.getElementById("sim-preview-text");
    const animalIcon = document.getElementById("sim-animal");
    const animalLabel = document.getElementById("sim-animal-label");

    output.classList.remove("hidden");
    if (cicdBackdrop) cicdBackdrop.classList.remove("hidden");

    if (mergeButton) {
      mergeButton.disabled = false;
      mergeButton.textContent = "Approve & Merge Pull Request";
    }

    pipe.innerHTML = "";
    diff.textContent = "- const deployedMascot = null;\n+ const deployedMascot = " + JSON.stringify(selectedAnimal.label) + ";";

    if (animalIcon) {
      animalIcon.classList.add("hidden");
      animalIcon.textContent = selectedAnimal.emoji;
    }

    if (animalLabel) animalLabel.textContent = "Waiting for pull request merge...";
    preview.textContent = "Deployment has not started yet";
  });

  if (mergeButton) {
    mergeButton.addEventListener("click", () => {
      if (!selectedAnimal) return;

      const pipe = document.getElementById("sim-pipeline");
      const preview = document.getElementById("sim-preview-text");
      const animalIcon = document.getElementById("sim-animal");
      const animalLabel = document.getElementById("sim-animal-label");

      mergeButton.disabled = true;
      mergeButton.textContent = "Merged - pipeline running...";

      pipe.innerHTML = "";
      preview.textContent = "Deployment running...";

      if (animalLabel) animalLabel.textContent = "Pull request merged. Deploying " + selectedAnimal.label + "...";

      const steps = [
        "Pull request approved",
        "Merged into main branch",
        "GitHub Actions triggered",
        "Static validation passed",
        "Build completed",
        "GitHub Pages deployment simulated",
        "Live preview updated"
      ];

      steps.forEach((step, index) => {
        const row = document.createElement("div");
        row.className = "sim-step";
        row.textContent = "○ " + step;
        pipe.appendChild(row);

        setTimeout(() => {
          row.classList.add("done");
          row.textContent = "✓ " + step;

          if (index === steps.length - 1) {
            if (animalIcon) animalIcon.classList.remove("hidden");
            if (animalLabel) animalLabel.textContent = "Live preview deployed: " + selectedAnimal.label;
            preview.textContent = "Deployment complete: " + selectedAnimal.label;
            mergeButton.textContent = "Deployment Complete";
          }
        }, 550 * (index + 1));
      });
    });
  }
}

function setupEmailReveal() {
  const reveal = document.getElementById("email-reveal");
  const email = document.getElementById("contact-email");
  const copyButton = document.getElementById("copy-email-btn");
  const status = document.getElementById("copy-email-status");

  if (!reveal || !email) return;

  document.querySelectorAll("[data-show-email]").forEach((button) => {
    button.addEventListener("click", () => {
      reveal.classList.remove("hidden");
      reveal.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const emailText = email.textContent.trim();

      try {
        await navigator.clipboard.writeText(emailText);
        if (status) status.textContent = "Copied to clipboard.";
      } catch {
        if (status) status.textContent = "Copy manually: " + emailText;
      }
    });
  }
}

function setupPortfolioAssistant() {
  const launcher = document.getElementById("assistant-launcher");
  const panel = document.getElementById("assistant-panel");
  const closeButton = document.getElementById("assistant-close");
  const messages = document.getElementById("assistant-messages");
  const form = document.getElementById("assistant-form");
  const input = document.getElementById("assistant-input");

  if (!launcher || !panel || !messages) return;

  const isProjectPage = window.location.pathname.includes("/projects/");
  const root = isProjectPage ? "../" : "";
  const homeProjects = root + "index.html#projects";

  function projectLink(fileName) {
    return root + "projects/" + fileName;
  }

  const responses = {
    path: {
      text: "Recommended path: start with the CI/CD Simulator to see how the site deploys, then review AWS Inventory Report, CloudFormation Remediation, AI CV Extraction Pipeline, and StockScanner Challenger Model. This gives a quick tour of Johnny's cloud, automation, CI/CD, and AI workflow skills.",
      links: [
        { label: "Start with CI/CD", href: projectLink("cicd-simulator.html") },
        { label: "AWS Inventory", href: projectLink("aws-inventory-report.html") },
        { label: "AI CV Extraction", href: projectLink("ai-cv-extraction.html") }
      ]
    },
    who: {
      text: "Johnny Dao is a Cloud / Python Automation Engineer with 10+ years of IT experience across AWS, automation, infrastructure reporting, CI/CD, endpoint support, and AI workflow experimentation.",
      links: [{ label: "View Projects", href: homeProjects }]
    },
    site: {
      text: "This site is a sanitized public portfolio. It shows cloud automation, Python scripting, CI/CD, AWS reporting, and AI/LLM workflow demos without exposing employer names, private systems, account IDs, secrets, internal logs, or screenshots.",
      links: [
        { label: "Recommended Path", href: homeProjects },
        { label: "View Projects", href: homeProjects }
      ]
    },
    projects: {
      text: "Featured projects include the CI/CD Simulator, AWS Inventory Report, CloudFormation Remediation, EC2 Kernel / CVE Scanner, AI CV Extraction Pipeline, and StockScanner Challenger Model.",
      links: [
        { label: "CI/CD Simulator", href: projectLink("cicd-simulator.html") },
        { label: "CloudFormation", href: projectLink("cloudformation-remediation.html") },
        { label: "StockScanner", href: projectLink("stockscanner-challenger.html") }
      ]
    },
    aws: {
      text: "Johnny's AWS work focuses on automation, multi-account inventory, security reporting, remediation planning, cost visibility, CloudFormation, Terraform, Lambda, EventBridge, Systems Manager, EC2, S3, and operational reporting.",
      links: [
        { label: "AWS Inventory", href: projectLink("aws-inventory-report.html") },
        { label: "CloudFormation", href: projectLink("cloudformation-remediation.html") },
        { label: "EC2 CVE Scanner", href: projectLink("ec2-kernel-cve-scanner.html") }
      ]
    },
    ai: { text: "Johnny is building AI/LLM workflow experience around document extraction, chunking, structured JSON output, cached safe demos, knowledge base assistants, and cloud infrastructure that supports AI/ML workloads.", links: [{ label: "AI CV Extraction", href: projectLink("ai-cv-extraction.html") }, { label: "AI Knowledge Base", href: projectLink("ai-knowledgebase-assistant.html") }] },
    cicd: {
      text: "The CI/CD Simulator is a safe front-end demo that shows a pull request, merge, GitHub Actions workflow, and GitHub Pages deployment flow without triggering real infrastructure.",
      links: [{ label: "Open CI/CD Simulator", href: projectLink("cicd-simulator.html") }]
    },
    contact: {
      text: "Johnny can be contacted by email at jdao917@gmail.com. The site reveals the email in-page so visitors can copy and paste it instead of opening an email app.",
      links: [{ label: "Show Contact Section", href: root + "index.html#contact" }]
    },
    kb: { text: "The AI Knowledge Base Assistant is a sanitized RAG-style demo. It shows how employees could ask questions about dev setup, coding templates, support contacts, and recommended reading, then receive grounded answers from approved sample documentation.", links: [{ label: "Open Knowledge Base Demo", href: projectLink("ai-knowledgebase-assistant.html") }] }, fallback: {
      text: "I can answer questions about Johnny, this site, AWS automation, AI/LLM work, CI/CD, featured projects, and contact information. Try the Recommended path button for the fastest tour.",
      links: [
        { label: "Recommended Path", href: homeProjects },
        { label: "View Projects", href: homeProjects }
      ]
    }
  };

  function openAssistant() {
    panel.classList.remove("hidden");
    launcher.setAttribute("aria-expanded", "true");
    if (input) input.focus();
  }

  function closeAssistant() {
    panel.classList.add("hidden");
    launcher.setAttribute("aria-expanded", "false");
  }

  function addMessage(text, sender, links = []) {
    const bubble = document.createElement("div");
    bubble.className = "assistant-message " + sender;

    const messageText = document.createElement("p");
    messageText.textContent = text;
    bubble.appendChild(messageText);

    if (links.length > 0) {
      const linkWrap = document.createElement("div");
      linkWrap.className = "assistant-links";

      links.forEach((link) => {
        const anchor = document.createElement("a");
        anchor.href = link.href;
        anchor.textContent = link.label;
        anchor.className = "assistant-link";
        linkWrap.appendChild(anchor);
      });

      bubble.appendChild(linkWrap);
    }

    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function getResponseKey(question) {
    const q = question.toLowerCase();

    if (q.includes("recommend") || q.includes("start") || q.includes("path") || q.includes("where should")) return "path";
    if (q.includes("contact") || q.includes("email") || q.includes("reach")) return "contact";
    if (q.includes("ci") || q.includes("cd") || q.includes("github") || q.includes("deploy") || q.includes("pipeline")) return "cicd";
    if (q.includes("aws") || q.includes("cloud") || q.includes("terraform") || q.includes("cloudformation") || q.includes("inventory") || q.includes("security")) return "aws";
    if (q.includes("knowledge") || q.includes("kb") || q.includes("docs") || q.includes("documentation") || q.includes("dev environment") || q.includes("coding template") || q.includes("who do i contact")) return "kb"; if (q.includes("ai") || q.includes("llm") || q.includes("cv") || q.includes("resume") || q.includes("extraction")) return "ai";
    if (q.includes("project") || q.includes("demo") || q.includes("case study")) return "projects";
    if (q.includes("site") || q.includes("portfolio") || q.includes("what does")) return "site";
    if (q.includes("johnny") || q.includes("who") || q.includes("experience")) return "who";

    return "fallback";
  }

  function answerQuestion(key, label) {
    const response = responses[key] || responses.fallback;
    addMessage(label, "user");

    window.setTimeout(() => {
      addMessage(response.text, "bot", response.links);
    }, 150);
  }

  launcher.addEventListener("click", () => {
    if (panel.classList.contains("hidden")) {
      openAssistant();
    } else {
      closeAssistant();
    }
  });

  if (closeButton) {
    closeButton.addEventListener("click", closeAssistant);
  }

  document.querySelectorAll("[data-assistant-question]").forEach((button) => {
    button.addEventListener("click", () => {
      answerQuestion(button.dataset.assistantQuestion, button.textContent.trim());
    });
  });

  if (form && input) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const question = input.value.trim();
      if (!question) return;

      const key = getResponseKey(question);
      input.value = "";
      answerQuestion(key, question);
    });
  }
}


function renderDemoLinks(items, target) {
  if (!target || !items || items.length === 0) return;

  target.innerHTML = `
    <h4>Sources and recommended docs</h4>
    <div class="demo-link-grid">
      ${items.map(item => `
        <a class="doc-link-card" href="${item.href}">
          <strong>${item.label}</strong>
          <span>${item.description}</span>
        </a>
      `).join("")}
    </div>
  `;
}
