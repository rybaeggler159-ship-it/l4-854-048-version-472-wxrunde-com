(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var menuButton = document.querySelector('.mobile-menu-button');
    var mobilePanel = document.querySelector('.mobile-panel');

    if (menuButton && mobilePanel) {
      menuButton.addEventListener('click', function () {
        var isOpen = mobilePanel.hasAttribute('hidden') === false;
        if (isOpen) {
          mobilePanel.setAttribute('hidden', '');
          menuButton.setAttribute('aria-expanded', 'false');
        } else {
          mobilePanel.removeAttribute('hidden');
          menuButton.setAttribute('aria-expanded', 'true');
        }
      });
    }

    document.querySelectorAll('.hero-carousel').forEach(function (carousel) {
      var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(carousel.querySelectorAll('.hero-dot'));
      var prev = carousel.querySelector('.hero-arrow.prev');
      var next = carousel.querySelector('.hero-arrow.next');
      var index = 0;
      var timer = null;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('active', slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('active', dotIndex === index);
        });
      }

      function start() {
        stop();
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5200);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener('click', function () {
          show(dotIndex);
          start();
        });
      });

      if (prev) {
        prev.addEventListener('click', function () {
          show(index - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          show(index + 1);
          start();
        });
      }

      carousel.addEventListener('mouseenter', stop);
      carousel.addEventListener('mouseleave', start);
      show(0);
      start();
    });

    document.querySelectorAll('[data-filter-scope]').forEach(function (panel) {
      var section = panel.closest('section') || document;
      var input = panel.querySelector('.filter-input');
      var selects = Array.prototype.slice.call(panel.querySelectorAll('.filter-select'));
      var cards = Array.prototype.slice.call(section.querySelectorAll('.movie-card'));
      var count = panel.querySelector('.filter-count');
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get('q');

      if (input && initialQuery) {
        input.value = initialQuery;
      }

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var shown = 0;

        cards.forEach(function (card) {
          var matched = true;
          var searchText = card.getAttribute('data-search') || '';

          if (query && searchText.indexOf(query) === -1) {
            matched = false;
          }

          selects.forEach(function (select) {
            var field = select.getAttribute('data-filter-field');
            var value = select.value;
            if (value && card.getAttribute('data-' + field) !== value) {
              matched = false;
            }
          });

          card.classList.toggle('hidden-card', !matched);
          if (matched) {
            shown += 1;
          }
        });

        if (count) {
          count.textContent = shown ? '已筛选 ' + shown + ' 部' : '未找到匹配内容';
        }
      }

      if (input) {
        input.addEventListener('input', apply);
      }

      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });

      apply();
    });

    document.querySelectorAll('.video-player').forEach(function (player) {
      var video = player.querySelector('video');
      var source = video ? video.querySelector('source') : null;
      var button = player.querySelector('.play-cover');
      var hls = null;
      var attached = false;

      if (!video || !source) {
        return;
      }

      function attach() {
        var url = source.getAttribute('src');
        if (attached) {
          return Promise.resolve();
        }
        attached = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          return new Promise(function (resolve) {
            hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              resolve();
            });
          });
        }

        video.src = url;
        return Promise.resolve();
      }

      function play() {
        player.classList.add('is-playing');
        attach().then(function () {
          var promise = video.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
          }
        });
      }

      if (button) {
        button.addEventListener('click', play);
      }

      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });

      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        if (!video.ended) {
          player.classList.remove('is-playing');
        }
      });

      window.addEventListener('beforeunload', function () {
        if (hls && typeof hls.destroy === 'function') {
          hls.destroy();
        }
      });
    });
  });
})();
