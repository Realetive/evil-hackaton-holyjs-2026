/* vn-typewriter.js — typewriter effect for VN dialog messages (variant A).
   Plain script, loaded after Reveal.initialize(). Honors prefers-reduced-motion. */
(function () {
	'use strict';

	var DEFAULT_SPEED = 28; // ms per character
	var PAUSE_AFTER = '.!?…—'; // extra pause (speed * 6) after these
	var FORWARD_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
	var timer = null; // single pending setTimeout handle
	var generation = 0; // bumped to cancel stale timer chains
	var slide = null;
	var fullTexts = new WeakMap(); // message element -> full text

	function reduceMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function fullText(el) {
		if (!fullTexts.has(el)) fullTexts.set(el, el.textContent);
		return fullTexts.get(el);
	}

	function showFull(el) {
		el.textContent = fullText(el);
		el.classList.remove('vn-typing');
	}

	function speedOf(el) {
		var speed = parseInt(el.getAttribute('data-type-speed'), 10);
		return speed > 0 ? speed : DEFAULT_SPEED;
	}

	function isTyping() {
		return !!slide && slide.querySelectorAll('.vn__message.vn-typing').length > 0;
	}

	function cancel() {
		generation += 1;
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	}

	function typeOne(el, gen, done) {
		var text = fullText(el);
		var speed = speedOf(el);
		var pos = 0;
		el.classList.add('vn-typing');

		function step() {
			if (gen !== generation) return;
			if (pos >= text.length) {
				el.classList.remove('vn-typing');
				done();
				return;
			}
			pos += 1;
			el.textContent = text.slice(0, pos);
			var paused = PAUSE_AFTER.indexOf(text.charAt(pos - 1)) !== -1;
			timer = setTimeout(step, paused ? speed * 6 : speed);
		}

		step();
	}

	function play() {
		cancel();
		var gen = generation;
		var queue = slide ? Array.prototype.slice.call(slide.querySelectorAll('.vn__message')) : [];
		var i = 0;

		(function next() {
			if (gen !== generation || i >= queue.length) return;
			var el = queue[i++];
			if (el.hasAttribute('data-type-off') || reduceMotion()) {
				showFull(el);
				next();
				return;
			}
			typeOne(el, gen, next);
		})();
	}

	function skip() {
		if (!isTyping()) return;
		cancel();
		Array.prototype.forEach.call(slide.querySelectorAll('.vn__message'), showFull);
	}

	// Capture phase: runs before reveal's own keydown handler, so a skip
	// keypress can swallow the event and keep reveal on the current slide.
	window.addEventListener(
		'keydown',
		function (event) {
			if (!isTyping() || FORWARD_KEYS.indexOf(event.key) === -1) return;
			event.preventDefault();
			event.stopPropagation();
			skip();
		},
		true
	);

	function onSlideChange() {
		slide = Reveal.getCurrentSlide();
		play();
	}

	Reveal.on('ready', onSlideChange);
	Reveal.on('slidechanged', onSlideChange);
})();
