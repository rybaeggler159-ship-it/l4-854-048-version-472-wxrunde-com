(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-menu]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function setSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        setSlide(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        setSlide(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        setSlide(index + 1);
        start();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        setSlide(dotIndex);
        start();
      });
    });

    setSlide(0);
    start();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var scope = document.querySelector(panel.getAttribute("data-filter-panel"));
      if (!scope) {
        return;
      }
      var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card, .rank-item"));
      var keyword = panel.querySelector("[data-filter-keyword]");
      var year = panel.querySelector("[data-filter-year]");
      var region = panel.querySelector("[data-filter-region]");

      function apply() {
        var q = keyword ? keyword.value.trim().toLowerCase() : "";
        var y = year ? year.value : "";
        var r = region ? region.value : "";
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute("data-title"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-region")
          ].join(" ").toLowerCase();
          var ok = true;
          if (q && haystack.indexOf(q) === -1) {
            ok = false;
          }
          if (y && card.getAttribute("data-year") !== y) {
            ok = false;
          }
          if (r && card.getAttribute("data-region") !== r) {
            ok = false;
          }
          card.style.display = ok ? "" : "none";
        });
      }

      [keyword, year, region].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
    });
  }

  function renderSearchPage() {
    var root = document.querySelector("[data-search-page]");
    if (!root || !window.MOVIES) {
      return;
    }
    var resultNode = document.querySelector("[data-search-results]");
    var titleNode = document.querySelector("[data-search-title]");
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim().toLowerCase();
    var list = window.MOVIES.filter(function (movie) {
      if (!query) {
        return Number(movie.score) >= 9.5;
      }
      return [movie.title, movie.oneLine, movie.genre, movie.region, movie.year]
        .join(" ")
        .toLowerCase()
        .indexOf(query) !== -1;
    }).slice(0, query ? 240 : 80);

    if (titleNode) {
      titleNode.textContent = query ? "搜索结果：" + params.get("q") : "高分推荐";
    }

    if (!resultNode) {
      return;
    }

    if (!list.length) {
      resultNode.innerHTML = '<div class="empty-state">没有找到匹配的影片</div>';
      return;
    }

    resultNode.innerHTML = list.map(function (movie) {
      return [
        '<article class="movie-card" data-title="' + escapeHtml(movie.title) + '" data-region="' + escapeHtml(movie.region) + '" data-genre="' + escapeHtml(movie.genre) + '" data-year="' + escapeHtml(movie.year) + '">',
        '  <a class="poster-link" href="' + escapeHtml(movie.href) + '">',
        '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '">',
        '    <span class="score-badge">' + escapeHtml(movie.score) + '</span>',
        '    <span class="genre-badge">' + escapeHtml(movie.genre) + '</span>',
        '  </a>',
        '  <div class="movie-card-body">',
        '    <h3><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>',
        '    <p>' + escapeHtml(movie.oneLine) + '</p>',
        '    <div class="card-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.year) + '年</span></div>',
        '  </div>',
        '</article>'
      ].join("");
    }).join("");
  }

  window.initVideoPlayer = function (videoId, url) {
    var video = document.getElementById(videoId);
    var overlay = document.querySelector('[data-player-overlay="' + videoId + '"]');
    if (!video || !url) {
      return;
    }
    var loaded = false;
    var hls = null;

    function play() {
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          if (overlay) {
            overlay.classList.remove("is-hidden");
          }
        });
      }
    }

    function start() {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      video.controls = true;
      if (loaded) {
        play();
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadedmetadata", play, { once: true });
        video.load();
        play();
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, play);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          }
        });
      } else {
        video.src = url;
        video.addEventListener("loadedmetadata", play, { once: true });
        video.load();
        play();
      }
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
      if (!loaded) {
        start();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    renderSearchPage();
  });
})();
