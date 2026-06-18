(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var menuButton = document.querySelector('.mobile-menu-button');
    var mobileNav = document.querySelector('.mobile-nav');
    if (menuButton && mobileNav) {
      menuButton.addEventListener('click', function () {
        var isOpen = mobileNav.hasAttribute('hidden') === false;
        if (isOpen) {
          mobileNav.setAttribute('hidden', '');
          menuButton.setAttribute('aria-expanded', 'false');
        } else {
          mobileNav.removeAttribute('hidden');
          menuButton.setAttribute('aria-expanded', 'true');
        }
      });
    }

    bindHeroCarousel();
    bindPageFilter();
    bindSearchPage();
  });

  function bindHeroCarousel() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var prev = document.querySelector('.hero-prev');
    var next = document.querySelector('.hero-next');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-slide') || 0));
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    restart();
  }

  function bindPageFilter() {
    var input = document.querySelector('.page-filter');
    if (!input) {
      return;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
    input.addEventListener('input', function () {
      var keyword = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-filter') || card.textContent || '').toLowerCase();
        card.classList.toggle('is-hidden', keyword !== '' && text.indexOf(keyword) === -1);
      });
    });
  }

  function bindSearchPage() {
    var input = document.getElementById('site-search-input');
    var resultBox = document.getElementById('search-results');
    if (!input || !resultBox || typeof MOVIE_INDEX === 'undefined') {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;

    function createCard(item) {
      var article = document.createElement('article');
      article.className = 'movie-card';
      article.setAttribute('data-filter', item.text || '');
      article.innerHTML = [
        '<a class="movie-card-cover" href="' + escapeHtml(item.url) + '">',
        '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
        '<span class="play-dot">▶</span>',
        '</a>',
        '<div class="movie-card-body">',
        '<h3><a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a></h3>',
        '<p>' + escapeHtml(item.line || '') + '</p>',
        '<div class="movie-meta"><span>' + escapeHtml(item.region || '') + '</span><span>' + escapeHtml(String(item.year || '')) + '</span><span>' + escapeHtml(item.type || '') + '</span></div>',
        '<div class="tag-row"><span>' + escapeHtml(item.genre || '') + '</span></div>',
        '</div>'
      ].join('');
      return article;
    }

    function render() {
      var keyword = input.value.trim().toLowerCase();
      var source = MOVIE_INDEX;
      var matched = keyword ? source.filter(function (item) {
        return (item.text || '').toLowerCase().indexOf(keyword) !== -1;
      }) : source.slice(0, 60);
      resultBox.innerHTML = '';
      matched.slice(0, 120).forEach(function (item) {
        resultBox.appendChild(createCard(item));
      });
    }

    input.addEventListener('input', render);
    render();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  window.initMoviePlayer = function (streamUrl) {
    var video = document.getElementById('movie-player');
    var wrap = document.querySelector('.player-wrap');
    var button = document.querySelector('.play-overlay');
    if (!video || !streamUrl) {
      return;
    }
    var hlsInstance = null;
    var prepared = false;

    function prepare() {
      if (prepared) {
        return;
      }
      prepared = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      prepare();
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
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
      if (wrap) {
        wrap.classList.add('is-playing');
      }
    });

    video.addEventListener('pause', function () {
      if (wrap) {
        wrap.classList.remove('is-playing');
      }
    });

    video.addEventListener('ended', function () {
      if (wrap) {
        wrap.classList.remove('is-playing');
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };
})();
