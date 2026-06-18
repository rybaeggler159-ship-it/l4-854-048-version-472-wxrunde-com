(function () {
    function all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function one(selector, root) {
        return (root || document).querySelector(selector);
    }

    function setupMenu() {
        var toggle = one('.menu-toggle');
        var panel = one('.mobile-panel');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            var expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            panel.hidden = expanded;
        });
    }

    function setupHero() {
        var slides = all('[data-hero-slide]');
        if (!slides.length) {
            return;
        }
        var dots = all('[data-hero-dot]');
        var current = 0;
        var timer;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, pos) {
                slide.classList.toggle('is-active', pos === current);
            });
            dots.forEach(function (dot, pos) {
                dot.classList.toggle('is-active', pos === current);
            });
        }

        function next() {
            show(current + 1);
        }

        function start() {
            stop();
            timer = window.setInterval(next, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });

        var prev = one('[data-hero-prev]');
        var nextButton = one('[data-hero-next]');
        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }
        if (nextButton) {
            nextButton.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }
        start();
    }

    function normalize(text) {
        return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function applyFilters() {
        var queryInputs = all('[data-filter-input]');
        var cards = all('[data-card]');
        if (!cards.length) {
            return;
        }
        var activeCategory = 'all';
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q') || '';

        function filter() {
            var query = normalize(queryInputs[0] ? queryInputs[0].value : '');
            cards.forEach(function (card) {
                var text = normalize(card.getAttribute('data-search'));
                var category = card.getAttribute('data-category') || 'all';
                var queryMatch = !query || text.indexOf(query) !== -1;
                var categoryMatch = activeCategory === 'all' || category === activeCategory;
                card.classList.toggle('is-hidden', !(queryMatch && categoryMatch));
            });
        }

        queryInputs.forEach(function (input) {
            if (initialQuery) {
                input.value = initialQuery;
            }
            input.addEventListener('input', filter);
        });

        all('[data-category-filter]').forEach(function (button) {
            button.addEventListener('click', function () {
                activeCategory = button.getAttribute('data-category-filter') || 'all';
                all('[data-category-filter]').forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                filter();
            });
        });

        filter();
    }

    function mountPlayer(videoId, overlayId, sourceUrl) {
        var video = document.getElementById(videoId);
        var overlay = document.getElementById(overlayId);
        if (!video || !overlay || !sourceUrl) {
            return;
        }
        var attached = false;
        var hlsInstance = null;

        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = sourceUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(sourceUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = sourceUrl;
            }
        }

        function play() {
            attach();
            overlay.classList.add('is-hidden');
            video.controls = true;
            var playTask = video.play();
            if (playTask && typeof playTask.catch === 'function') {
                playTask.catch(function () {});
            }
        }

        overlay.addEventListener('click', play);
        video.addEventListener('click', function () {
            if (!attached) {
                play();
            }
        });
        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    window.MovieApp = {
        mountPlayer: mountPlayer
    };

    document.addEventListener('DOMContentLoaded', function () {
        setupMenu();
        setupHero();
        applyFilters();
    });
})();
