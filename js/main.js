/**
 * MQR — main.js
 * Mobile nav, header scroll state on home hero.
 */

(function () {
  "use strict";

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".header-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      nav.classList.toggle("is-open", !expanded);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function initSponsorCarousel() {
    var viewport = document.querySelector(".sponsor-carousel-viewport");
    var track = document.querySelector(".sponsor-carousel-track");
    var template = document.querySelector(".sponsor-carousel-set");
    if (!viewport || !track || !template) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var itemsHtml = template.innerHTML;

    function createSet(isHidden) {
      var set = document.createElement("ul");
      set.className = "sponsor-carousel-set";
      set.innerHTML = itemsHtml;
      if (isHidden) set.setAttribute("aria-hidden", "true");
      return set;
    }

    function build() {
      track.replaceChildren(createSet(false));

      while (track.scrollWidth < viewport.clientWidth) {
        track.appendChild(createSet(true));
      }

      var half = track.innerHTML;
      var shift = track.scrollWidth;
      track.innerHTML = half + half;
      track.style.setProperty("--carousel-shift", "-" + shift + "px");

      var speed = 55;
      var duration = Math.max(20, shift / speed);
      track.style.setProperty("--carousel-duration", duration + "s");
    }

    function whenReady(callback) {
      var images = track.querySelectorAll("img");
      var pending = 0;

      images.forEach(function (img) {
        if (!img.complete) pending += 1;
      });

      if (!pending) {
        callback();
        return;
      }

      images.forEach(function (img) {
        if (img.complete) return;
        img.addEventListener("load", function onLoad() {
          img.removeEventListener("load", onLoad);
          pending -= 1;
          if (!pending) callback();
        });
        img.addEventListener("error", function onError() {
          img.removeEventListener("error", onError);
          pending -= 1;
          if (!pending) callback();
        });
      });
    }

    whenReady(build);
    window.addEventListener("resize", build);
  }

  function initHeroFractal() {
    var canvas = document.querySelector(".hero-fractal");
    if (!canvas) return;

    var ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hero = canvas.closest(".hero");
    var running = false;
    var raf = 0;
    var last = 0;
    var started = performance.now();
    var maxIter = 90;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width * 0.42));
      var h = Math.max(1, Math.round(rect.height * 0.42));
      if (w > 520) {
        h = Math.round(h * (520 / w));
        w = 520;
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function draw(now) {
      var w = canvas.width;
      var h = canvas.height;
      var img = ctx.createImageData(w, h);
      var data = img.data;
      var t = reduce ? 0.8 : (now - started) / 1000;
      var angle = t * 0.35;
      var cx = -0.745 + 0.055 * Math.cos(angle);
      var cy = 0.186 + 0.055 * Math.sin(angle);
      var zoom = 3;
      var aspect = w / h;

      for (var y = 0; y < h; y++) {
        var zy0 = ((y / h) - 0.5) * 2.4 / zoom;
        for (var x = 0; x < w; x++) {
          var zx = ((x / w) - 0.5) * 2.4 * aspect / zoom;
          var zy = zy0;
          var i = 0;
          var zx2 = zx * zx;
          var zy2 = zy * zy;

          while (i < maxIter && zx2 + zy2 < 4) {
            zy = 2 * zx * zy + cy;
            zx = zx2 - zy2 + cx;
            zx2 = zx * zx;
            zy2 = zy * zy;
            i++;
          }

          var p = (y * w + x) * 4;
          if (i === maxIter) {
            data[p] = 3;
            data[p + 1] = 6;
            data[p + 2] = 14;
          } else {
            var mag = Math.sqrt(zx2 + zy2);
            var n = i + 1 - Math.log(Math.log(mag)) / Math.LN2;
            var u = Math.pow(Math.max(0, n) / maxIter, 0.55);
            data[p] = (4 + u * 66) | 0;
            data[p + 1] = (12 + u * 130) | 0;
            data[p + 2] = (28 + u * 168) | 0;
          }
          data[p + 3] = 255;
        }
      }

      ctx.putImageData(img, 0, 0);
    }

    function frame(now) {
      if (!running) return;
      if (now - last > 70) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    draw(started);

    if (!reduce) start();

    window.addEventListener("resize", function () {
      resize();
      draw(performance.now());
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (!reduce) start();
    });

    if (!reduce && hero && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start();
        else stop();
      });
      observer.observe(hero);
    }
  }

  function init() {
    initNav();
    initHeaderScroll();
    initSponsorCarousel();
    initHeroFractal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
