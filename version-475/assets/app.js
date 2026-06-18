(function () {
  function siteRoot() {
    return window.SITE_ROOT || '';
  }

  function initMobileMenu() {
    var button = document.querySelector('.mobile-menu-button');
    var menu = document.querySelector('.mobile-menu');

    if (!button || !menu) {
      return;
    }

    button.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var previousButton = hero.querySelector('.hero-prev');
    var nextButton = hero.querySelector('.hero-next');
    var currentIndex = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      currentIndex = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === currentIndex);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === currentIndex);
      });
    }

    function startTimer() {
      stopTimer();
      timer = window.setInterval(function () {
        showSlide(currentIndex + 1);
      }, 5000);
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (previousButton) {
      previousButton.addEventListener('click', function () {
        showSlide(currentIndex - 1);
        startTimer();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        showSlide(currentIndex + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-slide')) || 0);
        startTimer();
      });
    });

    hero.addEventListener('mouseenter', stopTimer);
    hero.addEventListener('mouseleave', startTimer);
    showSlide(0);
    startTimer();
  }

  function createMovieCard(movie) {
    var root = siteRoot();
    var genre = String(movie.genreRaw || '').split(/[，,\/]/)[0].trim() || movie.type || '影视';

    return [
      '<article class="movie-card">',
      '  <a href="' + root + 'video/' + movie.id + '.html" class="movie-card-link">',
      '    <div class="movie-cover">',
      '      <img src="' + root + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '      <span class="movie-play" aria-hidden="true">▶</span>',
      '      <span class="movie-badge">' + escapeHtml(genre) + '</span>',
      '    </div>',
      '    <div class="movie-card-body">',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine || movie.summary || '') + '</p>',
      '      <div class="movie-meta">',
      '        <span>' + escapeHtml(movie.region || '') + '</span>',
      '        <span>' + escapeHtml(movie.year || '') + '年</span>',
      '      </div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join('\n');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    if (document.body.getAttribute('data-page') !== 'search') {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();
    var status = document.querySelector('[data-search-status]');
    var results = document.querySelector('[data-search-results]');
    var input = document.querySelector('.search-large input[name="q"]');

    if (input) {
      input.value = query;
    }

    if (!results || !status) {
      return;
    }

    if (!query) {
      status.textContent = '请输入关键词开始搜索。';
      return;
    }

    status.textContent = '正在搜索“' + query + '”...';

    function renderResults(movies) {
      var normalizedQuery = query.toLowerCase();
      var matched = movies.filter(function (movie) {
        return [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genreRaw,
          movie.oneLine,
          movie.summary,
          (movie.tags || []).join(' ')
        ].join(' ').toLowerCase().indexOf(normalizedQuery) !== -1;
      }).slice(0, 120);

      status.textContent = '搜索结果：' + matched.length + ' 条';
      results.innerHTML = matched.map(createMovieCard).join('\n');
    }

    if (Array.isArray(window.MOVIES)) {
      renderResults(window.MOVIES);
      return;
    }

    window.fetch(siteRoot() + 'data/movies.json')
      .then(function (response) {
        return response.json();
      })
      .then(renderResults)
      .catch(function () {
        status.textContent = '搜索数据加载失败，请刷新页面重试。';
      });
  }

  function initPlayers() {
    var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-video-src]'));

    videos.forEach(function (video) {
      var source = video.getAttribute('data-video-src');
      var shell = video.closest('.player-shell');
      var message = shell ? shell.querySelector('[data-player-message]') : null;
      var overlay = shell ? shell.querySelector('[data-player-overlay]') : null;
      var toggle = shell ? shell.querySelector('[data-player-toggle]') : null;

      function setMessage(text) {
        if (!message) {
          return;
        }

        message.textContent = text;
        message.classList.toggle('is-hidden', !text);
      }

      function hideOverlay() {
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
      }

      function showOverlay() {
        if (overlay && video.paused) {
          overlay.classList.remove('is-hidden');
        }
      }

      if (!source) {
        setMessage('播放源暂不可用');
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setMessage('播放源已就绪');
          window.setTimeout(function () {
            setMessage('');
          }, 1200);
        });
        hls.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            setMessage('视频加载失败，请稍后重试');
          }
        });
        video._hls = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', function () {
          setMessage('');
        });
      } else {
        video.src = source;
        setMessage('浏览器正在尝试直接播放');
      }

      if (toggle) {
        toggle.addEventListener('click', function () {
          var playPromise = video.play();

          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              setMessage('点击播放器控件即可开始播放');
            });
          }
        });
      }

      video.addEventListener('play', hideOverlay);
      video.addEventListener('pause', showOverlay);
      video.addEventListener('ended', showOverlay);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initSearchPage();
    initPlayers();
  });
}());
