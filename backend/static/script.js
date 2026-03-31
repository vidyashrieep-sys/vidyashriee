window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader").classList.add("hidden");
  }, 2200);
});

const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let W;
let H;
let particles = [];
let mouse = { x: null, y: null };

const COLORS = ["rgba(0,212,255,", "rgba(180,77,255,", "rgba(255,45,155,", "rgba(0,255,245,"];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.size = Math.random() * 1.5 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.opacity = Math.random() * 0.5 + 0.1;
    this.opacityDelta = (Math.random() - 0.5) * 0.006;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.opacity += this.opacityDelta;
    if (mouse.x) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        this.x += dx * 0.02;
        this.y += dy * 0.02;
      }
    }
    if (this.opacity <= 0.05 || this.opacity >= 0.6) this.opacityDelta *= -1;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color + this.opacity + ")";
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  const count = Math.min(Math.floor((W * H) / 8000), 180);
  for (let i = 0; i < count; i += 1) particles.push(new Particle());
}

function drawLines() {
  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.strokeStyle = `rgba(0,212,255,${(1 - dist / 100) * 0.12})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  drawLines();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  resize();
  initParticles();
});
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});
resize();
initParticles();
animate();

const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 30);
});

const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");
let menuOpen = false;
hamburger.addEventListener("click", () => {
  menuOpen = !menuOpen;
  mobileMenu.classList.toggle("open", menuOpen);
});
document.querySelectorAll(".mobile-link").forEach((link) => {
  link.addEventListener("click", () => {
    menuOpen = false;
    mobileMenu.classList.remove("open");
  });
});

const themeToggle = document.getElementById("theme-toggle");
const toggleKnob = document.getElementById("toggle-knob");
const html = document.documentElement;
let isDark = true;
themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  html.setAttribute("data-theme", isDark ? "dark" : "light");
  toggleKnob.textContent = isDark ? "🌙" : "☀️";
});

const phrases = ["Student", "Future Data Analyst", "Technology Enthusiast", "Problem Solver", "Finance Explorer"];
let phraseIdx = 0;
let charIdx = 0;
let deleting = false;
const typedEl = document.getElementById("typed-text");
function type() {
  const current = phrases[phraseIdx];
  if (!deleting) {
    typedEl.textContent = current.slice(0, charIdx + 1);
    charIdx += 1;
    if (charIdx === current.length) {
      deleting = true;
      setTimeout(type, 1800);
      return;
    }
  } else {
    typedEl.textContent = current.slice(0, charIdx - 1);
    charIdx -= 1;
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }
  }
  setTimeout(type, deleting ? 55 : 100);
}
setTimeout(type, 1800);

const reveals = document.querySelectorAll(".reveal");
const timelineItems = document.querySelectorAll(".timeline-item");
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add("visible");
  });
}, { threshold: 0.12 });
reveals.forEach((el) => revealObs.observe(el));
timelineItems.forEach((el) => revealObs.observe(el));

const skillBars = document.querySelectorAll(".skill-bar-fill");
const skillObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      const bar = e.target;
      bar.style.width = `${bar.dataset.width}%`;
      skillObs.unobserve(bar);
    }
  });
}, { threshold: 0.3 });
skillBars.forEach((bar) => skillObs.observe(bar));

const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("cstat");

function showError(id, show) {
  document.getElementById(id).classList.toggle("show", show);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.classList.remove("success", "error");
  if (kind) statusEl.classList.add(kind);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("f-name").value.trim();
  const email = document.getElementById("f-email").value.trim();
  const msg = document.getElementById("f-msg").value.trim();

  showError("err-name", !name);
  showError("err-email", !email || !isValidEmail(email));
  showError("err-msg", !msg);
  if (!name || !email || !isValidEmail(email) || !msg) {
    setStatus("Please fill all fields correctly.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("Sending...", "");
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message: msg }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to send message");

    setStatus("Message sent successfully!", "success");
    form.reset();
    submitBtn.classList.add("sent");
    setTimeout(() => submitBtn.classList.remove("sent"), 900);
  } catch (err) {
    setStatus(err.message || "Could not send message. Try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

["f-name", "f-email", "f-msg"].forEach((id, i) => {
  document.getElementById(id).addEventListener("input", () => {
    const errIds = ["err-name", "err-email", "err-msg"];
    showError(errIds[i], false);
    if (statusEl.classList.contains("error")) setStatus("", "");
  });
});

fetch("/api/visit", { method: "POST" }).catch(() => {});

const backTop = document.getElementById("back-top");
window.addEventListener("scroll", () => {
  backTop.classList.toggle("visible", window.scrollY > 400);
});
backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

document.querySelectorAll(".project-card, .stat-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    card.style.transform = `translateY(-8px) rotateX(${y}deg) rotateY(${x}deg)`;
    card.style.transition = "transform 0.1s ease";
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
    card.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  });
});
