(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }

      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
        restart();
      });
    });

    showSlide(0);
    restart();
  }

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-search-input]'));

  searchInputs.forEach(function (input) {
    var panel = input.closest('.filter-panel');
    var list = document.querySelector('[data-search-list]');
    var chips = panel ? Array.prototype.slice.call(panel.querySelectorAll('[data-filter-value]')) : [];
    var activeFilter = '';

    function normalize(value) {
      return (value || '').toString().toLowerCase().trim();
    }

    function applySearch() {
      var query = normalize(input.value);
      var filter = normalize(activeFilter);
      var items = list ? Array.prototype.slice.call(list.querySelectorAll('.search-item')) : [];

      items.forEach(function (item) {
        var content = normalize([
          item.getAttribute('data-title'),
          item.getAttribute('data-region'),
          item.getAttribute('data-type'),
          item.getAttribute('data-year'),
          item.getAttribute('data-genre'),
          item.getAttribute('data-tags')
        ].join(' '));
        var queryOk = !query || content.indexOf(query) !== -1;
        var filterOk = !filter || content.indexOf(filter) !== -1;
        item.classList.toggle('is-hidden', !(queryOk && filterOk));
      });
    }

    input.addEventListener('input', applySearch);

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (item) {
          item.classList.remove('is-active');
        });
        chip.classList.add('is-active');
        activeFilter = chip.getAttribute('data-filter-value') || '';
        applySearch();
      });
    });
  });

  window.initMoviePlayer = function (id, stream) {
    var video = document.getElementById(id);

    if (!video || !stream) {
      return;
    }

    var cover = document.querySelector('[data-player="' + id + '"]');
    var started = false;
    var hlsInstance = null;

    function hideCover() {
      if (cover) {
        cover.classList.add('is-hidden');
      }
    }

    function beginPlayback() {
      hideCover();
      video.setAttribute('controls', 'controls');

      if (started) {
        video.play().catch(function () {});
        return;
      }

      started = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        video.play().catch(function () {});
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
            video.src = stream;
            video.play().catch(function () {});
          }
        });
        return;
      }

      video.src = stream;
      video.play().catch(function () {});
    }

    if (cover) {
      cover.addEventListener('click', beginPlayback);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        beginPlayback();
      }
    });

    video.addEventListener('play', hideCover);
  };
})();
