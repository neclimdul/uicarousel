/**
 * jQuery UI Carousel 1.0.0
 *
 * (based on jCarouselLite 1.0.1)
 *
 * Copyright (c) 2008 Chris Leishman (chrisleishman.com)
 * Copyright (c) 2009 James Gilliland (nerdpalace.net)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 */
(function($) {

$.widget('ui.carousel', {
    _init: function() {
        var self = this,
            o = this.options,
            div = this.element,
            vert = (o.orientation != "horizontal"),
            sizeCss = vert ? "height" : "width";

        this._detectOrientation();
        this._detectNavigation();
        this.running = false;
        this.curr = o.start;
        this.offset = 0;
        this.animCss = vert ? "top" : "left";

		this.element
			.addClass("ui-carousel"
				+ " ui-carousel-" + this.orientation
				+ " ui-widget"
				+ " ui-widget-content"
				+ " ui-corner-all"
				+ " ui-helper-clearfix");

        var ul = this.slide = $("ul", div),
          clip = $(".ui-carousel-clip", div),
          v = o.visible;

        // Auto add clip wrapper if missing.
        if (clip.size() == 0) {
            ul.wrap('<div class="ui-carousel-clip"></div>');
            clip = $(".ui-carousel-clip", div);
        }

        // Special handling when circular for smooth scrolling.
        if (o.circular) {
            this.offset = Math.max(v, o.scroll);
            var tLi = $("li", ul),
              tl = tLi.size();
            ul.prepend(tLi.slice(tl - this.offset).clone())
              .append(tLi.slice(0, this.offset).clone());
        }

        // Setup items and item information.
        var li = $("li", ul).addClass("ui-carousel-item");
        this.itemLength = li.size() - (2 * this.offset);
        li.css({width: li.width(), height: li.height()});

        // Store the visible size for the scoll dimension.
        this.liSize = vert ? this._height(li) : this._width(li);    // Full li size(incl margin)-Used for animation

        // Setup our slide ul.
        ul.addClass("ui-carousel-slide")
            // make width full length of items.
            .css(sizeCss, (this.liSize * (this.itemLength + 2 * this.offset)) + "px");

        // Make sure we start in the right location.
        this._set(o.start);

        // Size of entire div (total length for the visible items)
        clip.css(sizeCss, (this.liSize * v) + "px");

        // Make things visible.
        div.css("visibility", "visible");

        if (o.auto) {
            setInterval(function() {
                self.next();
            }, o.auto+o.speed);
        }
    },

    prev: function() {
        return this._go(this.curr - this.options.scroll);
    },

    next: function() {
        return this._go(this.curr + this.options.scroll);
    },

    visible: function(from) {
        if (from == undefined)
            from = this.curr;
        return this.element.find('li').slice(from).slice(0, this.options.visible);
    },

    at: function() {
        return this.curr;
    },

    view: function(item) {
        var o = this.options, curr = this.curr;
        if (item > curr && item <= curr + o.visible) {
            return;
        }
        var s = o.scroll, tmp = 0;
        if (item <= curr) {
            tmp = curr - (Math.floor((curr - item) / s) * s + s);
        }
        else {
            tmp = curr + (Math.floor((item - curr) / s) * s - s);
        }
        return this._go(tmp);
    },

    reset: function() {
        var o = this.options;
        if (this.curr == o.start) return;
        this.curr = o.start;
        this._set(o.start);
    },

    _go: function(to) {
        var self = this,
            o = this.options,
            v = o.visible;
        if (!o.circular) {
            // If non-circular and to points to first or last, we just return.
            if (to > this.itemLength - v)
                to = this.itemLength - v;
            if (to < 0)
                to = 0;
        }

        // Make sure we actually want to go somewhere.
        if (!(this.running || to == this.curr)) {
            var prev = this.curr,
                l = this.itemLength,
                b = this.offset; // buffer size.

            if (o.circular) {           // If circular we need to shift at the ends to emulate rotation.
                if (to < -b) {          // If at the beginning, then go to end.
                    prev += l;
                    to += l;
                    this._set(prev);
                }
                else if (to > l) {      // If at end, then go to beginning.
                    prev -= l;
                    to -= l;
                    this._set(prev);
                }
                to = to;
            }

            this.curr = to;     // reset internal pointer.
            to += this.offset;  // adjust fo any offset.

            o.beforeStart.call(e, this.visible(this.curr), this.visible(to));
            this.running = true;

            this.slide.animate(
                this.animCss == "left" ?
                    { left: -(to * this.liSize) } :
                    { top: -(to * this.liSize) },
                o.speed, o.easing,
                function() {
                    self.running = false;
                    o.afterEnd.call(e, self.visible(to), self.visible(prev));
                }
            );
            return true;
        }
        return false;
    },

    // Directly set the location of the carousel instead of animating to a location.
    _set: function(p) {
        this.slide.css(this.animCss, -((p + this.offset) * this.liSize) + "px");
    },

	_detectOrientation: function() {
		this.orientation = this.options.orientation == 'vertical' ? 'vertical' : 'horizontal';
	},
	
	_detectNavigation: function() {
	    var self = this,
	        class_p = " ui-icon-triangle-1-",
	        class_n = " ui-icon-triangle-1-";
        if (this.orientation == "horizontal") {
            class_p += "w";
            class_n += "e";
        }
        else {
            class_p += "n";
            class_n += "s";
        }
	    $(".ui-carousel-prev", this.element)
	        .addClass("ui-icon" + class_p)
	        .click(function() {
	            self.prev();
    	    });
	    $(".ui-carousel-next", this.element)
	        .addClass("ui-icon" + class_n)
    	    .click(function() {
    	        self.next();
    	    });
	},

    _css: function(el, prop) {
        return parseInt($.css(el[0], prop)) || 0;
    },
    _width: function(el) {
        return  el[0].offsetWidth + this._css(el, 'marginLeft') + this._css(el, 'marginRight');
    },
    _height: function(el) {
        return el[0].offsetHeight + this._css(el, 'marginTop') + this._css(el, 'marginBottom');
    }
});


$.extend($.ui.carousel, {
    defaults: {
        auto: null,
        speed: 200,
        easing: null,
        orientation: "horizontal",
        circular: true,
        visible: 3,
        start: 0,
        scroll: 1,
        beforeStart: function(visibleBefore, visibleAfter) { },
        afterEnd: function(visibleAfter, visibleBefore) { }
    }
});


})(jQuery);
