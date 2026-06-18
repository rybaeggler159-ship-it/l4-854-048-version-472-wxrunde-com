(function () {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function setupNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    if (slides.length === 0) {
      return;
    }
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var active = 0;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === active);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(active - 1);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(active + 1);
      });
    }

    window.setInterval(function () {
      show(active + 1);
    }, 6500);
  }

  function setupSearch() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
    inputs.forEach(function (input) {
      var selector = input.getAttribute("data-search-scope");
      var scope = selector ? document.querySelector(selector) : document;
      if (!scope) {
        return;
      }
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".searchable-card"));
      var apply = function () {
        var query = normalize(input.value);
        cards.forEach(function (card) {
          var haystack = normalize(card.textContent + " " + (card.getAttribute("data-search") || ""));
          card.style.display = !query || haystack.indexOf(query) !== -1 ? "" : "none";
        });
      };
      input.addEventListener("input", apply);
      var url = new URL(window.location.href);
      var q = url.searchParams.get("q");
      if (q && !input.value) {
        input.value = q;
        apply();
      }
    });
  }

  function setupFilters() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-filter-button]"));
    if (buttons.length === 0) {
      return;
    }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var value = normalize(button.getAttribute("data-filter-button"));
        var section = button.closest("section") || document;
        var cards = Array.prototype.slice.call(section.querySelectorAll(".searchable-card"));
        buttons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        cards.forEach(function (card) {
          var kind = normalize(card.getAttribute("data-kind") || "");
          card.style.display = !value || kind.indexOf(value) !== -1 ? "" : "none";
        });
      });
    });
  }

  window.initMoviePlayer = function (sourceUrl) {
    var video = document.querySelector(".movie-player");
    var trigger = document.querySelector(".play-trigger");
    if (!video || !trigger || !sourceUrl) {
      return;
    }
    var started = false;

    function attachSource() {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        return new Promise(function (resolve) {
          var hls = new window.Hls();
          hls.loadSource(sourceUrl);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            resolve();
          });
        });
      }
      video.src = sourceUrl;
      return Promise.resolve();
    }

    function start() {
      if (started) {
        video.play();
        return;
      }
      started = true;
      trigger.classList.add("is-hidden");
      attachSource().then(function () {
        var action = video.play();
        if (action && typeof action.catch === "function") {
          action.catch(function () {});
        }
      });
    }

    trigger.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (!started) {
        start();
      }
    });
  };

  onReady(function () {
    setupNavigation();
    setupHero();
    setupSearch();
    setupFilters();
  });
})();
