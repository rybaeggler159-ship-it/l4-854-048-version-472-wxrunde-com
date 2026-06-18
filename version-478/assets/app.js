(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function setupMobileNav() {
        var toggle = document.querySelector("[data-mobile-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", menu.classList.contains("is-open") ? "true" : "false");
        });
    }

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                start();
            });
        });
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function setupFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
        panels.forEach(function (panel) {
            var rootSelector = panel.getAttribute("data-filter-panel");
            var root = rootSelector ? document.querySelector(rootSelector) : document;
            var input = panel.querySelector("[data-filter-input]");
            var region = panel.querySelector("[data-filter-region]");
            var year = panel.querySelector("[data-filter-year]");
            var button = panel.querySelector("[data-filter-button]");
            var cards = Array.prototype.slice.call((root || document).querySelectorAll("[data-movie-card]"));
            var empty = document.querySelector(panel.getAttribute("data-empty-target") || "");

            function run() {
                var query = input ? input.value.trim().toLowerCase() : "";
                var regionValue = region ? region.value : "";
                var yearValue = year ? year.value : "";
                var visibleCount = 0;
                cards.forEach(function (card) {
                    var haystack = [
                        card.getAttribute("data-title") || "",
                        card.getAttribute("data-genre") || "",
                        card.getAttribute("data-tags") || "",
                        card.getAttribute("data-region") || "",
                        card.getAttribute("data-year") || ""
                    ].join(" ").toLowerCase();
                    var matchesQuery = !query || haystack.indexOf(query) !== -1;
                    var matchesRegion = !regionValue || card.getAttribute("data-region") === regionValue;
                    var matchesYear = !yearValue || card.getAttribute("data-year") === yearValue;
                    var visible = matchesQuery && matchesRegion && matchesYear;
                    card.style.display = visible ? "" : "none";
                    if (visible) {
                        visibleCount += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visibleCount === 0);
                }
            }

            [input, region, year].forEach(function (item) {
                if (item) {
                    item.addEventListener("input", run);
                    item.addEventListener("change", run);
                }
            });
            if (button) {
                button.addEventListener("click", run);
            }
            run();
        });
    }

    function setupSearchPage() {
        var input = document.querySelector("[data-search-page-input]");
        if (!input) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q") || params.get("search") || "";
        if (q) {
            input.value = q;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    window.initMoviePlayer = function (source, videoId, coverId) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        if (!video || !source) {
            return;
        }
        var loaded = false;
        var hls = null;

        function load() {
            if (loaded) {
                return;
            }
            loaded = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
        }

        function hideCover() {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        }

        function play() {
            load();
            hideCover();
            video.setAttribute("controls", "controls");
            var attempt = video.play();
            if (attempt && typeof attempt.catch === "function") {
                attempt.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener("click", play);
        }
        video.addEventListener("click", function () {
            if (!loaded) {
                play();
            }
        });
        video.addEventListener("play", hideCover);
        video.addEventListener("canplay", function () {
            if (cover && cover.classList.contains("is-hidden")) {
                var replay = video.play();
                if (replay && typeof replay.catch === "function") {
                    replay.catch(function () {});
                }
            }
        });
    };

    ready(function () {
        setupMobileNav();
        setupHero();
        setupFilters();
        setupSearchPage();
    });
})();
