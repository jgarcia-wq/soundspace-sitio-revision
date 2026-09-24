(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const storage = {
    get(key) {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch {}
    },
  };
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];
  const params = new URLSearchParams(location.search);
  let attribution = {};
  try {
    attribution = JSON.parse(storage.get("ssa_attribution") || "{}");
  } catch {}
  if (keys.some((key) => params.has(key))) {
    attribution = {};
    keys.forEach((key) => {
      if (params.has(key)) attribution[key] = params.get(key).slice(0, 200);
    });
    storage.set("ssa_attribution", JSON.stringify(attribution));
  }
  const landing = storage.get("ssa_landing") || location.pathname;
  storage.set("ssa_landing", landing);
  const event = (name, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: name,
      event_version: 1,
      page_path: location.pathname,
      landing_path: landing,
      ...attribution,
      ...details,
    });
  };
  document.querySelectorAll("[data-track]").forEach((link) => {
    const url = new URL(link.href);
    Object.entries(attribution).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
    url.searchParams.set("origin", "soundspace_website");
    url.searchParams.set("cta_id", link.dataset.ctaId);
    url.searchParams.set("source_path", location.pathname);
    if (document.body.dataset.program)
      url.searchParams.set("program", document.body.dataset.program);
    if (document.body.dataset.avatar)
      url.searchParams.set("avatar", document.body.dataset.avatar);
    if (link.dataset.track === "whatsapp_click") {
      const tracking = new URLSearchParams({
        ...attribution,
        origin: "soundspace_website",
        source_path: location.pathname,
        cta_id: link.dataset.ctaId,
      });
      url.searchParams.set(
        "text",
        `Hola, quiero información sobre ${link.dataset.program || "Soundspace Academy"}.\nReferencia: ${tracking.toString()}`,
      );
    }
    link.href = url.toString();
    link.addEventListener("click", () =>
      event(link.dataset.track, {
        cta_id: link.dataset.ctaId,
        program: link.dataset.program || null,
        event_context:
          link.dataset.track === "quiz_start"
            ? "outbound_intent"
            : "outbound_click",
      }),
    );
  });
  /* page_view + program_view con plantilla, programa y avatar */
  (() => {
    const body = document.body.dataset || {};
    const program = body.program || null;
    const avatar = body.avatar || null;
    const template = body.template || "generic";
    event("page_view", { template, program, avatar });
    if (
      program &&
      ["dj_integral", "master_dj_producer", "produccion_musical"].includes(
        program,
      )
    ) {
      event("program_view", { template, program, avatar });
    }
  })();

  const toggle = document.querySelector(".menu-toggle"),
    nav = document.querySelector("#main-nav");
  const closeMenu = () => {
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menú");
    nav?.classList.remove("is-open");
  };
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("is-open", open);
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      toggle?.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".site-header")) closeMenu();
  });
  matchMedia("(min-width: 701px)").addEventListener("change", closeMenu);
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === button));
        b.classList.toggle("is-active", b === button);
      });
      let count = 0;
      document.querySelectorAll("[data-category]").forEach((card) => {
        card.hidden =
          !!button.dataset.filter &&
          card.dataset.category !== button.dataset.filter;
        if (!card.hidden) count++;
      });
      document.querySelector("#filter-status").textContent =
        `${count} programas disponibles`;
    }),
  );
  const form = document.querySelector("#contact-form");
  if (form) {
    const status = document.querySelector("#form-status"),
      submit = form.querySelector("[type=submit]"),
      fallback = document.querySelector("#form-fallback");
    const opened = Date.now();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity() || submit.disabled) return;
      const data = Object.fromEntries(new FormData(form));
      submit.disabled = true;
      status.textContent = "Enviando tu consulta…";
      fallback.hidden = true;
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            consent: data.consent === "on",
            attribution,
            source_path: location.pathname,
            elapsed_ms: Date.now() - opened,
          }),
        });
        if (!response.ok) throw new Error("unavailable");
        const result = await response.json();
        if (!result.ok) throw new Error("unconfirmed");
        event("form_submit", {
          cta_id: "contact-submit",
          form_id: "contact-form",
          program: data.program,
        });
        form.reset();
        status.textContent =
          "Recibimos tu consulta. El equipo de Soundspace se pondrá en contacto contigo.";
      } catch {
        status.textContent =
          "No pudimos enviar tu consulta. Puedes continuar por WhatsApp; tus datos siguen aquí.";
        fallback.hidden = false;
      } finally {
        submit.disabled = false;
      }
    });
  }

  /* ═══ Movimiento al scroll: tornamesa y consola ═══ */
  (() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;

    const fader = document.createElement("div");
    fader.className = "scroll-fader";
    document.body.appendChild(fader);

    const hero = document.querySelector(".hero-photo");
    let ticking = false;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const y = scrollY;
      root.style.setProperty(
        "--scroll-progress",
        max > 0 ? (y / max).toFixed(4) : 0,
      );
      // el plato gira proporcional al recorrido
      root.style.setProperty("--scroll-spin", (y * 0.06).toFixed(2));
      // el hero se desplaza suave
      if (hero)
        root.style.setProperty(
          "--hero-shift",
          (Math.min(y, 700) * 0.06).toFixed(2),
        );
      ticking = false;
    };

    addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onScroll);
        }
      },
      { passive: true },
    );
    onScroll();

    /* Reveal escalonado de bloques */
    const targets = document.querySelectorAll(
      ".section-head, .program-card, .include-card, .module-card, .feature-row > div, .includes-grid > *, .program-grid > *, .topic-list > li, .steps > li, .preparation-list > li, .faq-list > details, .trust-strip span, .ph-tile, .ph-slot",
    );
    targets.forEach((el) => el.setAttribute("data-reveal", ""));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));
  })();
})();
