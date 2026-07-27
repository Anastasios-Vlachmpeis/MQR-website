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

  function init() {
    initNav();
    initHeaderScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
