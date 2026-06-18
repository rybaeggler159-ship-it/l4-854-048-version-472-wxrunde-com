(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function setupMobileMenu() {
    var button = qs('[data-mobile-menu-button]');
    var menu = qs('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function setupHeaderSearch() {
    qsa('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = qs('input[name="q"]', form);
        var query = input ? input.value.trim() : '';
        window.location.href = 'search.html' + (query ? '?q=' + encodeURIComponent(query) : '');
      });
    });
  }

  function setupFilters() {
    var panel = qs('[data-filter-panel]');
    var list = qs('[data-filter-list]');
    if (!panel || !list) {
      return;
    }
    var input = qs('[data-filter-input]', panel);
    var year = qs('[data-filter-year]', panel);
    var type = qs('[data-filter-type]', panel);
    var empty = qs('[data-empty-state]');
    var cards = qsa('.movie-card', list);

    function apply() {
      var query = normalize(input && input.value);
      var yearValue = normalize(year && year.value);
      var typeValue = normalize(type && type.value);
      var shown = 0;
      cards.forEach(function (card) {
        var title = normalize(card.getAttribute('data-title'));
        var cardYear = normalize(card.getAttribute('data-year'));
        var cardType = normalize(card.getAttribute('data-type'));
        var matched = true;
        if (query && title.indexOf(query) === -1) {
          matched = false;
        }
        if (yearValue && cardYear !== yearValue) {
          matched = false;
        }
        if (typeValue && cardType !== typeValue) {
          matched = false;
        }
        card.style.display = matched ? '' : 'none';
        if (matched) {
          shown += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('is-visible', shown === 0);
      }
    }

    [input, year, type].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
  }

  function setupPlayer() {
    var holder = qs('[data-player]');
    if (!holder) {
      return;
    }
    var video = qs('video', holder);
    var overlay = qs('[data-play-button]', holder);
    var src = holder.getAttribute('data-video');
    var loaded = false;
    var hls = null;

    function attach() {
      if (!video || !src || loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }
    }

    function play() {
      attach();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      if (video) {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      }
    }

    if (overlay) {
      overlay.addEventListener('click', play);
    }

    if (video) {
      video.addEventListener('play', function () {
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
      });
      video.addEventListener('click', function () {
        if (!loaded) {
          play();
        }
      });
      window.addEventListener('pagehide', function () {
        if (hls) {
          hls.destroy();
          hls = null;
        }
      });
    }
  }

  function createCard(movie) {
    var tags = Array.isArray(movie.tags) ? movie.tags.slice(0, 3) : [];
    return [
      '<article class="movie-card">',
      '<a class="movie-cover-link" href="' + escapeAttr(movie.url) + '" aria-label="观看 ' + escapeAttr(movie.title) + '">',
      '<img src="' + escapeAttr(movie.cover) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy">',
      '<span class="cover-shade"></span>',
      '<span class="movie-pill">' + escapeHtml(movie.category || movie.type || '剧集') + '</span>',
      '</a>',
      '<div class="movie-card-body">',
      '<a class="movie-title-link" href="' + escapeAttr(movie.url) + '">' + escapeHtml(movie.title) + '</a>',
      '<div class="movie-meta-line"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
      '<div class="movie-tags">' + tags.map(function (tag) { return '<span>' + escapeHtml(tag) + '</span>'; }).join('') + '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function setupSearchPage() {
    var form = qs('[data-search-page-form]');
    var results = qs('[data-search-results]');
    var empty = qs('[data-search-empty]');
    if (!form || !results || !window.SEARCH_MOVIES) {
      return;
    }
    var input = qs('input[name="q"]', form);
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    if (input) {
      input.value = initial;
    }

    function render(query) {
      var normalized = normalize(query);
      var data = window.SEARCH_MOVIES.filter(function (movie) {
        if (!normalized) {
          return true;
        }
        var haystack = normalize([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          movie.oneLine,
          movie.category,
          Array.isArray(movie.tags) ? movie.tags.join(' ') : ''
        ].join(' '));
        return haystack.indexOf(normalized) !== -1;
      }).slice(0, 120);
      results.innerHTML = data.map(createCard).join('');
      if (empty) {
        empty.classList.toggle('is-visible', data.length === 0);
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var query = input ? input.value.trim() : '';
      var newUrl = 'search.html' + (query ? '?q=' + encodeURIComponent(query) : '');
      window.history.replaceState({}, '', newUrl);
      render(query);
    });

    if (input) {
      input.addEventListener('input', function () {
        render(input.value);
      });
    }

    render(initial);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupHeaderSearch();
    setupFilters();
    setupPlayer();
    setupSearchPage();
  });
})();
