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
            vert = (o.orientation != "horizontal");

        this._detectOrientation();
        this._detectNavigation();
        this._running = false;

		this.element
			.addClass("ui-carousel"
				+ " ui-carousel-" + this.orientation
				+ " ui-widget"
				+ " ui-widget-content"
				+ " ui-corner-all"
				+ " ui-helper-clearfix");
        o.animCss = vert ? "top" : "left";
        o.sizeCss = vert ? "height" : "width";

        var ul = $("ul", div),
          clip = $(".ui-carousel-clip", div),
          v = o.visible;

        // Auto add clip wrapper if missing.
        if (clip.size() == 0) {
            ul.wrap('<div class="ui-carousel-clip"></div>');
            clip = $(".ui-carousel-clip", div);
        }

        if (o.circular) {
            var tLi = $("li", ul),
              tl = tLi.size();
            ul.prepend(tLi.slice(tl-v).clone())
              .append(tLi.slice(0,v).clone());
            o.start += v;
        }

        var li = $("li", ul);
        this._curr = o.start;
        o.itemLength = li.size();

        div.css("visibility", "visible"); // Why not just show?

        li.addClass("ui-carousel-item");
        ul.addClass("ui-carousel-slide");

        o.liSize = vert ? this._height(li) : this._width(li);   // Full li size(incl margin)-Used for animation
        var ulSize = o.liSize * o.itemLength;                   // size of full ul(total length, not just for the visible items)
        var clipSize = o.liSize * v;                           // size of entire div(total length for just the visible items)

        li.css({width: li.width(), height: li.height()});
        ul.css(o.sizeCss, ulSize + "px").css(o.animCss, -(this._curr * o.liSize));

        clip.css(o.sizeCss, clipSize + "px");                   // Width of the DIV. length of visible images

        if (o.auto) {
            setInterval(function() {
                self.next();
            }, o.auto+o.speed);
        }
    },

    prev: function() {
        return this._go(this._curr - this.options.scroll);
    },

    next: function() {
        return this._go(this._curr + this.options.scroll);
    },

    visible: function(from) {
        if (from == undefined)
            from = this._curr;
        return this.element.find('li').slice(from).slice(0, this.options.visible);
    },

    at: function() {
        return this._curr;
    },

    view: function(item) {
        var o = this.options, curr = this._curr;
        if (o.circular)
            item = item + o.visible;
        if (item >= curr && item < curr + o.visible)
            return;
        var s = o.scroll;
        return this._go((item < curr)? (curr - (Math.floor((curr-item)/s)*s + s)) : (curr + (Math.floor((item-curr)/s)*s)));
    },

    reset: function() {
        var o = this.options;
        if (this._curr == o.start) return;
        this._curr = o.start;
        ul.css(o.animCss, -(this._curr * o.liSize));
    },

    _go: function(to) {
        var self = this, o = this.options, e = this.element;
        var v = o.visible, ul = this.element.find('ul');

        if (!self._running) {
            var prev = self._curr;
            var next;

            if (o.circular) {            // If circular we are in first or last, then goto the other end
                if (to == self._curr) return;
                if (to <= o.start-v-1) {           // If first, then goto last
                    ul.css(o.animCss, -((o.itemLength-(v*2))*o.liSize)+"px");
                    // If "scroll" > 1, then the "to" might not be equal to the condition; it can be lesser depending on the number of elements.
                    next = to==o.start-v-1 ? o.itemLength-(v*2)-1 : o.itemLength-(v*2)-o.scroll;
                } else if (to >= o.itemLength - v + 1) { // If last, then goto first
                    ul.css(o.animCss, -((v)*o.liSize)+"px");
                    // If "scroll" > 1, then the "to" might not be equal to the condition; it can be greater depending on the number of elements.
                    next = to==o.itemLength-v+1 ? v+1 : v+o.scroll;
                } else {
                    next = to;
                }
            } else {
                if (to > o.itemLength-v)
                    to = o.itemLength-v;
                if (to < 0)
                    to = 0;
                // If non-circular and to points to first or last, we just return.
                if (to == self._curr) return;
                else next = to;
            }

            o.beforeStart.call(e, self.visible(self._curr), self.visible(next));
            self._running = true;
            self._curr = next;

            ul.animate(
                o.animCss == "left" ? { left: -(self._curr*o.liSize) } : { top: -(self._curr*o.liSize) } , o.speed, o.easing,
                function() {
                    self._running = false;
                    o.afterEnd.call(e, self.visible(self._curr), self.visible(prev));
                }
            );
        }
        return false;
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
