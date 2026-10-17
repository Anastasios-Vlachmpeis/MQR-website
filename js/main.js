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

    function hash01(n) {
      n = n >>> 0;
      n = Math.imul(n ^ (n >>> 16), 2146121005);
      n = Math.imul(n ^ (n >>> 15), 2221713035);
      return ((n ^ (n >>> 16)) >>> 8) / 16777216;
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
      var block = 2;
      var sky = [24, 80, 127];
      var violet = [18, 58, 102];
      var plum = [0, 16, 40];
      var silver = [142, 180, 212];
      var black = [5, 7, 12];

      for (var y = 0; y < h; y += block) {
        var zy0 = (((y + 0.5) / h) - 0.5) * 2.4 / zoom;
        for (var x = 0; x < w; x += block) {
          var zx = (((x + 0.5) / w) - 0.5) * 2.4 * aspect / zoom;
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

          var cell = (y * w + x) ^ 539363090;
          var pick = hash01(cell);
          var col = black;
          var bright = 0.35;

          if (i === maxIter) {
            col = pick < 0.42 ? plum : violet;
            bright = 0.62 + pick * 0.38;
          } else {
            var mag = Math.sqrt(zx2 + zy2);
            var n = i + 1 - Math.log(Math.log(mag)) / Math.LN2;
            var u = Math.pow(Math.max(0, n) / maxIter, 0.55);
            if (!reduce) {
              u += Math.sin(t * 0.45) * 0.78 * (pick - 0.5);
              if (u < 0) u = 0;
              if (u > 1) u = 1;
            }

            if (u > 0.78) {
              col = pick < 0.72 ? sky : violet;
              bright = 0.72 + (u - 0.78) * 1.3;
            } else if (u > 0.22) {
              var density = (u - 0.22) / 0.56;
              if (pick < density * 0.92) {
                col = pick < density * 0.22 ? sky : (pick < density * 0.55 ? violet : plum);
                bright = 0.48 + density * 0.55;
              } else {
                bright = 0.22 + density * 0.25;
              }
            } else if (pick < 0.018) {
              col = silver;
              bright = 0.85;
            }
          }

          var yMax = Math.min(h, y + block);
          var xMax = Math.min(w, x + block);
          for (var py = y; py < yMax; py++) {
            for (var px = x; px < xMax; px++) {
              var grain = (hash01((py * w + px) ^ 2654435769) - 0.5) * 24;
              var speck = hash01(((py & 511) * 512 + (px & 511)) ^ 3266489909);
              var r = col[0] * bright + grain;
              var g = col[1] * bright + grain;
              var b = col[2] * bright + grain;
              if (!reduce && col !== black) {
                var wave = Math.sin(t * 0.7 + pick * 6.28318) * 15;
                r += wave;
                g += wave;
                b += wave;
              }
              if (speck < 0.045) {
                var mix = 10 / 255;
                if (speck < 0.023) {
                  r += (0 - r) * mix;
                  g += (0 - g) * mix;
                  b += (0 - b) * mix;
                } else {
                  r += (142 - r) * mix;
                  g += (180 - g) * mix;
                  b += (212 - b) * mix;
                }
              }
              var p = (py * w + px) * 4;
              data[p] = r < 0 ? 0 : r > 255 ? 255 : r | 0;
              data[p + 1] = g < 0 ? 0 : g > 255 ? 255 : g | 0;
              data[p + 2] = b < 0 ? 0 : b > 255 ? 255 : b | 0;
              data[p + 3] = 255;
            }
          }
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

  function initPageHeroPixels() {
    var heroes = document.querySelectorAll(".page-hero");
    if (!heroes.length) return;

    function hash01(n) {
      n = n >>> 0;
      n = Math.imul(n ^ (n >>> 16), 2146121005);
      n = Math.imul(n ^ (n >>> 15), 2221713035);
      return ((n ^ (n >>> 16)) >>> 8) / 16777216;
    }

    function clampByte(v) {
      return v < 0 ? 0 : v > 255 ? 255 : v | 0;
    }

    heroes.forEach(function (hero) {
      var canvas = document.createElement("canvas");
      canvas.className = "page-hero-pixels";
      canvas.setAttribute("aria-hidden", "true");
      hero.insertBefore(canvas, hero.firstChild);

      var ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var running = false;
      var raf = 0;
      var last = 0;
      var started = performance.now();

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
        var block = 2;
        var black = [0, 0, 0];
        var navy = [0, 16, 40];
        var bg = [5, 7, 12];
        var glow = [18, 58, 102];
        var t = reduce ? 0 : (now - started) / 1000;
        var shimmer = 15;
        var drift = Math.sin(t * 0.45) * 0.78;

        for (var y = 0; y < h; y += block) {
          for (var x = 0; x < w; x += block) {
            var pick = hash01((y * w + x) ^ 539363090);
            var v = ((y + 0.5) / h) + (pick - 0.5) * 0.16 + drift * (pick - 0.5);
            if (v < 0) v = 0;
            if (v > 1) v = 1;
            var base = v < 0.58
              ? [
                black[0] + (navy[0] - black[0]) * (v / 0.58),
                black[1] + (navy[1] - black[1]) * (v / 0.58),
                black[2] + (navy[2] - black[2]) * (v / 0.58)
              ]
              : [
                navy[0] + (bg[0] - navy[0]) * ((v - 0.58) / 0.42),
                navy[1] + (bg[1] - navy[1]) * ((v - 0.58) / 0.42),
                navy[2] + (bg[2] - navy[2]) * ((v - 0.58) / 0.42)
              ];
            var dx = ((x + 0.5) / w - 0.78) / 0.7;
            var dy = ((y + 0.5) / h - 0.78) / 0.55;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var alpha = dist >= 0.62 ? 0 : 0.55 * (1 - dist / 0.62);
            alpha += (pick - 0.5) * 0.2;
            if (alpha < 0) alpha = 0;
            if (alpha > 0.7) alpha = 0.7;
            var cr = base[0] * (1 - alpha) + glow[0] * alpha;
            var cg = base[1] * (1 - alpha) + glow[1] * alpha;
            var cb = base[2] * (1 - alpha) + glow[2] * alpha;

            var yMax = Math.min(h, y + block);
            var xMax = Math.min(w, x + block);
            for (var py = y; py < yMax; py++) {
              for (var px = x; px < xMax; px++) {
                var grain = (hash01((py * w + px) ^ 2654435769) - 0.5) * 24;
                var wave = Math.sin(t * 0.7 + pick * 6.28318) * shimmer;
                var speck = hash01(((py & 511) * 512 + (px & 511)) ^ 3266489909);
                var r = cr + grain + wave;
                var g = cg + grain + wave;
                var b = cb + grain + wave;
                if (speck < 0.045) {
                  var mix = 10 / 255;
                  if (speck < 0.023) {
                    r += (0 - r) * mix;
                    g += (0 - g) * mix;
                    b += (0 - b) * mix;
                  } else {
                    r += (142 - r) * mix;
                    g += (180 - g) * mix;
                    b += (212 - b) * mix;
                  }
                }
                var p = (py * w + px) * 4;
                data[p] = clampByte(r);
                data[p + 1] = clampByte(g);
                data[p + 2] = clampByte(b);
                data[p + 3] = 255;
              }
            }
          }
        }

        ctx.putImageData(img, 0, 0);
      }

      function frame(now) {
        if (!running) return;
        if (now - last > 140) {
          last = now;
          draw(now);
        }
        raf = requestAnimationFrame(frame);
      }

      function start() {
        if (running || reduce || document.hidden) return;
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
        else start();
      });

      if (!reduce && "IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) start();
          else stop();
        });
        observer.observe(hero);
      }
    });
  }

  function initFooterMark() {
    var footer = document.querySelector(".site-footer");
    if (!footer || footer.querySelector(".footer-mark")) return;

    var canvas = document.createElement("canvas");
    canvas.className = "footer-mark";
    canvas.setAttribute("aria-hidden", "true");
    footer.insertBefore(canvas, footer.firstChild);

    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var sky = [24, 80, 127];
    var violet = [18, 58, 102];
    var plum = [0, 16, 40];
    var silver = [142, 180, 212];

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var started = performance.now();
    var last = 0;
    var raf = 0;
    var running = false;

    function hash01(n) {
      n = n >>> 0;
      n = Math.imul(n ^ (n >>> 16), 2146121005);
      n = Math.imul(n ^ (n >>> 15), 2221713035);
      return ((n ^ (n >>> 16)) >>> 8) / 16777216;
    }

    function resize() {
      var rect = footer.getBoundingClientRect();
      var cssW = Math.min(rect.width, Math.max(rect.height * 2.4, 280));
      var cssH = rect.height;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      var w = Math.max(1, Math.round(cssW * 0.42));
      var h = Math.max(1, Math.round(cssH * 0.42));
      if (w > 420) {
        h = Math.round(h * (420 / w));
        w = 420;
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
      var time = reduce ? 0 : (now - started) / 1000;
      var shimmer = 15;
      var drift = Math.sin(time * 0.45) * 0.78;
      var block = 2;
      var turns = 1.45;
      var span = turns * Math.PI * 2;
      var scx = h * 0.78;
      var scy = h * 0.42;
      var angCorner = Math.atan2((h - 1) - scy, 0 - scx);
      var rCorner = Math.hypot(scx, (h - 1) - scy);
      var coreR = Math.max(2, h * 0.02);
      var growth = Math.log(rCorner / coreR) / span;

      for (var y = 0; y < h; y += block) {
        for (var x = 0; x < w; x += block) {
          var dx = (x + 1) - scx;
          var dy = (y + 1) - scy;
          var rad = Math.hypot(dx, dy) + 0.001;
          var ang = Math.atan2(dy, dx);
          var delta = angCorner - ang;
          delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          var best = 1e9;
          var along = 0;
          var rLine = coreR;
          for (var k = 0; k < 4; k++) {
            var dth = delta + k * Math.PI * 2;
            if (dth > span + 0.15) continue;
            var rl = rCorner * Math.exp(-growth * dth);
            var dist = Math.abs(rad - rl);
            if (dist < best) {
              best = dist;
              along = Math.max(0, Math.min(1, 1 - dth / span));
              rLine = rl;
            }
          }
          var half = Math.max(h * 0.1, rLine * 0.34);
          var pick = hash01((y * w + x) ^ 539363090);
          var pick2 = hash01((y * w + x) ^ 2654435769);
          var edge = best / half;
          if (rad < half * 0.55 && along < 0.25) {
            edge = Math.min(edge, rad / (half * 0.55));
          }
          if (!reduce) edge += drift * (pick - 0.5);
          var col = plum;
          var bright = 0.7;
          if (edge > 0.92 + (pick - 0.5) * 0.55) {
            if (!(edge < 1.55 && pick > 0.94)) continue;
            col = plum;
            bright = 0.7;
          } else {
            var t = edge < 0 ? 0 : edge;
            if (t > 0.15 && pick2 > 0.82 + (1 - t) * 0.2) continue;
            if (t < 0.22) {
              col = pick < 0.18 ? silver : (pick < 0.72 ? sky : violet);
              bright = 0.9 - along * 0.15;
            } else if (t < 0.55) {
              col = pick < 0.35 ? sky : (pick < 0.7 ? violet : plum);
              bright = 0.72;
            } else {
              col = pick < 0.6 ? plum : violet;
              bright = 0.55;
            }
            bright *= 0.78 + pick2 * 0.4;
          }

          var yMax = Math.min(h, y + block);
          var xMax = Math.min(w, x + block);
          for (var py = y; py < yMax; py++) {
            for (var px = x; px < xMax; px++) {
              var grain = (hash01((py * w + px) ^ 2654435769) - 0.5) * 18;
              var p = (py * w + px) * 4;
              var r = col[0] * bright + grain;
              var g = col[1] * bright + grain;
              var b = col[2] * bright + grain;
              if (!reduce) {
                var wave = Math.sin(time * 0.7 + pick * 6.28318) * shimmer;
                r += wave;
                g += wave;
                b += wave;
              }
              data[p] = r < 0 ? 0 : r > 255 ? 255 : r | 0;
              data[p + 1] = g < 0 ? 0 : g > 255 ? 255 : g | 0;
              data[p + 2] = b < 0 ? 0 : b > 255 ? 255 : b | 0;
              data[p + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function frame(now) {
      if (!running) return;
      if (now - last > 140) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduce || document.hidden) return;
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
      else start();
    });

    if (!reduce && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start();
        else stop();
      });
      observer.observe(footer);
    }
  }

  function init() {
    initNav();
    initHeaderScroll();
    initSponsorCarousel();
    initHeroFractal();
    initPageHeroPixels();
    initFooterMark();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
