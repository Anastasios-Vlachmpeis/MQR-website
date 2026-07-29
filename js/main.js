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
    var header = document.getElementById("site-header");
    var hero = document.querySelector(".hero-full");
    if (!header || !hero) return;

    function update() {
      if (window.scrollY > 80) {
        header.classList.remove("site-header--dark");
      } else {
        header.classList.add("site-header--dark");
      }
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

  function init() {
    initNav();
    initHeaderScroll();
    initSponsorCarousel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
