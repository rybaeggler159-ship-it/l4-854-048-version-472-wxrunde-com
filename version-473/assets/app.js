(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function start() {
      if (slides.length < 2) {
        return;
      }
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupFilters() {
    var toolbars = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
    toolbars.forEach(function (toolbar) {
      var scopeSelector = toolbar.getAttribute('data-filter-scope');
      var scope = document.querySelector(scopeSelector);
      if (!scope) {
        return;
      }
      var input = toolbar.querySelector('[data-filter-input]');
      var sort = toolbar.querySelector('[data-sort-select]');
      var empty = document.querySelector(toolbar.getAttribute('data-empty-target') || '');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : '';
        var visibleCount = 0;
        cards.forEach(function (card) {
          var haystack = (card.getAttribute('data-search') || '').toLowerCase();
          var visible = !keyword || haystack.indexOf(keyword) !== -1;
          card.style.display = visible ? '' : 'none';
          if (visible) {
            visibleCount += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('show', visibleCount === 0);
        }
      }

      function applySort() {
        if (!sort) {
          return;
        }
        var mode = sort.value;
        var sorted = cards.slice().sort(function (a, b) {
          if (mode === 'year') {
            return (parseInt(b.getAttribute('data-year'), 10) || 0) - (parseInt(a.getAttribute('data-year'), 10) || 0);
          }
          if (mode === 'heat') {
            return (parseInt(b.getAttribute('data-heat'), 10) || 0) - (parseInt(a.getAttribute('data-heat'), 10) || 0);
          }
          return cards.indexOf(a) - cards.indexOf(b);
        });
        sorted.forEach(function (card) {
          scope.appendChild(card);
        });
        cards = sorted;
        apply();
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      if (sort) {
        sort.addEventListener('change', applySort);
      }
      applySort();
      apply();
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play]');
      var stream = player.getAttribute('data-stream');
      var attached = false;
      var hlsInstance = null;

      function attach() {
        if (attached || !video || !stream) {
          return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
        } else {
          video.src = stream;
        }
        attached = true;
      }

      function play() {
        attach();
        player.classList.add('is-playing');
        if (video) {
          var promise = video.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
          }
        }
      }

      if (button) {
        button.addEventListener('click', play);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (video.paused) {
            play();
          }
        });
        video.addEventListener('error', function () {
          player.classList.remove('is-playing');
          if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
            attached = false;
          }
        });
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
