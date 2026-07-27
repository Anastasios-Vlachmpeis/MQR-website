/**
 * MQR — events.js
 * Renders month-grouped calendar from data/events.json.
 */

(function () {
  "use strict";

  var TYPE_LABELS = {
    competition: "Competition",
    workshop: "Workshop",
    social: "Social",
    research: "Research"
  };

  function parseDate(dateStr) {
    var p = dateStr.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function formatTime(time) {
    if (!time) return "";
    var parts = time.split(":");
    var h = Number(parts[0]);
    var m = parts[1] || "00";
    var suffix = h >= 12 ? "PM" : "AM";
    return (h % 12 || 12) + ":" + m + " " + suffix;
  }

  function formatMonthYear(date) {
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  }

  function formatShortMonth(date) {
    return date.toLocaleDateString("en-GB", { month: "short" });
  }

  function isPast(dateStr) {
    var d = parseDate(dateStr);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  function groupByMonth(events) {
    var groups = {};
    events.forEach(function (event) {
      var date = parseDate(event.date);
      var key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      if (!groups[key]) {
        groups[key] = { label: formatMonthYear(date), events: [] };
      }
      groups[key].events.push(event);
    });
    return Object.keys(groups).sort().map(function (k) { return groups[k]; });
  }

  function renderUpcoming(container, events) {
    var upcoming = events
      .filter(function (e) { return !isPast(e.date); })
      .sort(function (a, b) { return parseDate(a.date) - parseDate(b.date); });

    if (!upcoming.length) {
      container.innerHTML =
        '<p class="calendar-empty">No upcoming events. <a href="join.html">Get in touch</a> to stay updated.</p>';
      return;
    }

    var html = "";
    groupByMonth(upcoming).forEach(function (group) {
      html += '<div class="calendar-month"><h3 class="calendar-month-title">' + group.label + "</h3>";
      group.events.forEach(function (event) {
        var date = parseDate(event.date);
        var timeStr = formatTime(event.time);
        if (event.endTime) timeStr += " – " + formatTime(event.endTime);

        html += '<article class="calendar-event">';
        html += '<div class="calendar-date-badge">';
        html += '<span class="calendar-date-day">' + date.getDate() + "</span>";
        html += '<span class="calendar-date-month">' + formatShortMonth(date) + "</span>";
        html += "</div>";
        html += "<div>";
        html += "<h3>" + event.title + "</h3>";
        html += '<p class="calendar-event-meta">' + timeStr;
        if (event.location) html += " · " + event.location;
        html += "</p>";
        if (event.description) {
          html += '<p class="calendar-event-detail">' + event.description + "</p>";
        }
        html += "</div>";
        html += '<span class="type-pill">' + (TYPE_LABELS[event.type] || event.type) + "</span>";
        html += "</article>";
      });
      html += "</div>";
    });

    container.innerHTML = html;
  }

  function renderPast(container, events) {
    if (!events.length) { container.innerHTML = ""; return; }
    var html = "";
    events.forEach(function (event) {
      var date = parseDate(event.date);
      var dateLabel = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      html += '<div class="past-event-item">';
      html += '<span class="past-event-date">' + dateLabel + "</span>";
      html += "<span>" + event.title;
      if (event.location) html += " · " + event.location;
      html += "</span></div>";
    });
    container.innerHTML = html;
  }

  function init() {
    var upcomingEl = document.getElementById("calendar-upcoming");
    var pastEl = document.getElementById("calendar-past");
    if (!upcomingEl) return;

    fetch("data/events.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then(function (data) {
        renderUpcoming(upcomingEl, data.upcoming || []);
        if (pastEl) renderPast(pastEl, data.past || []);
      })
      .catch(function () {
        upcomingEl.innerHTML = '<p class="calendar-empty">Could not load events.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
