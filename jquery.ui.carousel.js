/**
 * jQuery UI Carousel 1.0.2
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
    // Initialize the carousel. Called on startup by jQuery UI.
    _init: function() {
        var o = this.options,
            e = this.element;

        this.orientation = this.options.orientation == 'vertical' ? 'vertical' : 'horizontal';
        this.running = false;
        this.curr = o.start;
        this._detectNavigation();

        e.addClass("ui-carousel" +
                " ui-carousel-" + this.orientation +
                " ui-widget" +
                " ui-widget-content" +
                " ui-corner-all" +
                " ui-helper-clearfix");

        this.slide = $(">ul, .ui-carousel-clip>ul", e)
            .addClass("ui-carousel-slide");
        this.clip = $(".ui-carousel-clip", e);

        // Auto add clip wrapper if missing.
        if (this.clip.size() === 0) {
            this.slide.wrap('<div class="ui-carousel-clip"></div>');
            this.clip = $(".ui-carousel-clip", e);
        }

        // Build internals. This is the same as when rebuild and we want to
        // make sure things are made visible in case they where hidden during
        // load.
        this.rebuild(true);

        // Start auto rotation.
        this.autoReset();
    },

    // Rebuild the carousel's internals values.
    // This is useful for displays that may be built dynamically.
    rebuild: function(show) {
        var o = this.options;

        // Reset the position back into a safe location.
        // @todo - It's possible that itemLength isn't set.
        if (this.curr >= this.itemLength) {
            this.curr -= this.itemLength;
        }
        else if (this.curr < 0) {
            this.curr += this.itemLength;
        }

        // Make sure buffers are clear before we rebuild them.
        this.slide.children(".ui-carousel-buffer").remove();
        this.offset = 0;

        // Build an updated list of items.
        this.li = this.slide.children()
            .addClass("ui-carousel-item");

        // Special handling when circular for smooth scrolling.
        if (o.circular) {
            var li = this.li;
            this.offset = Math.max(o.visible, o.scroll);

            this.slide
                .prepend(
                    li.slice(li.size() - this.offset)
                        .clone()
                        .addClass("ui-carousel-buffer"))
                .append(
                    li.slice(0, this.offset)
                        .clone()
                        .addClass("ui-carousel-buffer"));

            // Refresh list with new buffer items.
            this.li = this.slide.children();
        }

        // Update our item length.
        this.itemLength = this.li.size() - (2 * this.offset);

        // Now that everything is loaded, make sure things are visible. This
        // should help developers mitigate flashing content on slower DOM loads.
        if (show) {
            this.element.show();
        }

        // Refresh/setup all the item widths.
        this.refresh();
    },

    // Move the carousel backwards one iteration.
    prev: function() {
        return this._go(this.curr - this.options.scroll);
    },

    // Move the carousel forward one iteration.
    next: function() {
        return this._go(this.curr + this.options.scroll);
    },

    // Returns a list of visible items.
    // @param from
    // Starting place to get visible items from. Default to current item.
    visible: function(from) {
        if (from === undefined) {
            from = this.curr;
        }
        return this.slide.children().slice(from, from + this.options.visible);
    },

    // Returns the offset of the first visible carousel item.
    at: function() {
        return this.curr;
    },

    // Bring a carousel item into view.
    view: function(item) {
        var o = this.options,
            curr = this.curr;
        if (item > curr && item <= curr + o.visible) {
            return;
        }
        var s = o.scroll,
            next = 0;
        if (item <= curr) {
            next = curr - (Math.floor((curr - item) / s) * s + s);
        }
        else {
            next = curr + (Math.floor((item - curr) / s) * s - s);
        }
        return this._go(next);
    },

    // Reset the carousel to the initial position.
    reset: function() {
        var o = this.options;
        if (this.curr == o.start) {
            return;
        }
        this.set(o.start);
    },

    // Refresh measurements.
    refresh: function() {
        var o = this.options,
            vert = (this.orientation != "horizontal"),
            sizeCss = vert ? "height" : "width";

        this.animCss = vert ? "top" : "left";

        // reset css attributes before detecting ul measurements
        this.li.css({width: '', height: ''});

        // Store the visible size for the scoll dimension. This is the
        // full li size(including margin) and is used for slider placement.
        this.liSize = vert ? this.li.outerHeight(true) : this.li.outerWidth(true);

        // Fix the the width so everything looks correct.
        this.li.css({width: this.li.width(), height: this.li.height()});

        // make width full length of items.
        this.slide.css(sizeCss, this.liSize * (this.itemLength + 2 * this.offset));

        // Size of entire div (total length for the visible items)
        this.clip.css(sizeCss, this.liSize * o.visible);

        // Make sure we're in the right location.
        this.set(this.curr);

        this._updateNav();
    },

    autoReset: function() {
        var o = this.options;

        // If we need to, clear the old timer.
        if (typeof this.autoTimer !== 'undefined') {
            clearTimeout(this.autoTimer);
            delete this.autoTimer;
        }

        if (o.auto) {
            // Calculate the rotation delay.
            var delay = o.auto,
                self = this;

            // Start a new interval timer.
            this.autoTimer = setTimeout(function() {
                self.next();
            }, delay);
        }
    },

    auto: function(time) {
        this.options.auto = time;
        this.autoReset();
    },

    // Helper function that animates the carousel to a point on the carousel.
    // @param to
    //   The integer offset of the element. Between 0 and this.itemLength
    _go: function(to) {
        var o = this.options,
            v = o.visible;

        // This is a little redundant now because of the state-disabled stuff but necessary since this
        // can be called indirectly though prev and next using the UI API.
        if (!o.circular) {
            // If non-circular and to points to first or last, we just return.
            if (to > this.itemLength - v) {
                to = this.itemLength - v;
            }
            if (to < 0) {
                to = 0;
            }
        }

        // Make sure we actually want to go somewhere.
        if (!(this.running || to == this.curr)) {
            var prev = this.curr,
                e = this.element,
                l = this.itemLength,
                b = this.offset, // buffer size.
                self = this;
            this.running = true;

            if (o.circular) {           // If circular we need to shift at the ends to emulate rotation.
                if (to < -b) {          // If at the beginning, then go to end.
                    prev += l;
                    to += l;
                    this.set(prev);
                }
                else if (to > l) {      // If at end, then go to beginning.
                    prev -= l;
                    to -= l;
                    this.set(prev);
                }
            }

            this.curr = to; // reset internal pointer.
            to += b;        // adjust to with offset(buffer size).

            o.beforeStart.call(e, this.visible(this.curr), this.visible(to));

            this.slide.animate(
                this.animCss == "left" ?
                    { left: -(to * this.liSize) } :
                    { top: -(to * this.liSize) },
                o.speed, o.easing,
                function() {
                    self.running = false;
                    self._updateNav();
                    self.autoReset();
                    o.afterEnd.call(e, self.visible(to), self.visible(prev));
                }
            );
            return true;
        }
        return false;
    },

    // Directly set the location of the carousel instead of animating to a location.
    set: function(p) {
        // Set the internal pointer.
        this.curr = p;
        // make sure the slider is in the correct position.
        this.slide.css(this.animCss, -((p + this.offset) * this.liSize) + "px");
    },

    // Update nav links, enabling/disabling as needed.
    _updateNav: function() {
        var o = this.options;
        if (!o.circular) {
            var prev = this.visible(this.curr - 1).length === 0,
                next = this.visible(this.curr + o.visible).length === 0;
            // If the first element is visible, disable the previous button.
            _setDisabled(this.nav.prev, prev);
            // If the last element is visible or the carousel is small, disable the next button.
            _setDisabled(this.nav.next, next);
        }
        else {
            // If the carousel items are all visible, disable. Otherwise we're good.
            var small = this.itemLength <= o.visible;
            _setDisabled(this.nav.prev, small);
            _setDisabled(this.nav.next, small);
        }
    },

    // Automated detection and setup of navigation buttons.
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

        this.nav = {};
        this.nav.prev = $(".ui-carousel-prev", this.element)
            .addClass("ui-icon" + class_p)
            .click(function(e) {
                e.preventDefault();
                if ($(this).not(".ui-state-disabled").length)
                    self.prev();
            });

        this.nav.next = $(".ui-carousel-next", this.element)
            .addClass("ui-icon" + class_n)
            .click(function(e) {
                e.preventDefault();
                if ($(this).not(".ui-state-disabled").length)
                    self.next();
            });
    }
});

// Disable element using the jQuery UI disabled state class.
function _setDisabled(el, state) {
    if (state) {
        $(el).addClass('ui-state-disabled');
    }
    else {
        $(el).removeClass('ui-state-disabled');
    }
}

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
