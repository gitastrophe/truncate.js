/*
 * jQuery truncate plugin
 * @author Brendan Brelsford
 * @email brendan@perfectsensedigital.com
 *
 * @version 1.0 [2012-03-01]
 *
 * Usage:
 *
 *     Invocation
 *
 *     $('.selector').truncate(options);
 *
 *     Event Binding (after invocation)
 *
 *     $('.selector').truncate('bind', 'show', function(){ // do something when full text is shown});
 *
 * Events:
 *
 *     Events are triggered on the following state changes of the selected element.  No events are triggered
 *     on the initial invocation of the truncate plugin.
 *
 *     "show" - Triggered when full text is shown
 *     "hide" - Triggered when full text is truncated
 *     "toggle" - Triggered both when full text is shown and truncated
 *
 * Options:
 *
 *     Options are passed as a flat javascript object with the following allowed keys:
 *
 *     "maxLines" - The maximum number of lines to display when the element is truncated.
 *                  Allowed Values: integer > 0
 *                  Default Value: 1
 *
 *     "lineHeight" - The line-height value that should be used to calculate the vertical truncation point.  If unspecified,
 *                  it will be calculated using the CSS value from each selected element.
 *                  Allowed Values: integer > 0
 *                  Default Value: null
 *
 *     "allowedExtraLines" - Target "maxLines", but allow up to this many extra lines if text is long enough.
 *                  Allowed Values: integer >= 0
 *                  Default Value: 0
 *
 *     "truncateString" - Suffix to append to truncated text. e.g. &nbsp;&#8230; (non-breaking space followed by an ellipsis).
 *                  Allowed Values: any string
 *                  Default Value: ''
 *
 *     "showText" - If specified, will be shown as a hyperlink appended to the truncated text.  When clicked, this link
 *                  will toggle the truncated element to its full-text state. e.g. ("more")
 *                  Allowed Values: true / false
 *                  Default Value: ''
 *
 *     "hideText" - If specified, will be shown as a hyperlink appended to the full text.  When clicked, this link will
 *                  toggle the full-text element to its truncated state.  e.g. ("less")
 *                  Allowed Values: any string
 *                  Default Value: ''
 *
 *     "collapsed" - Indicates whether the truncated element should be initially displayed in a full-text or truncated state.
 *                   Allowed Values: true / false
 *                   Default Value: true
 *
 *     "debug" - Indicates whether messages should be written to console.log including the truncation execution time and
 *                   number of binomal search steps used to truncate the full text.  The usage of console.log in this plugin
 *                   is always safe for inclusion in IE.
 *
 *     "contextParent" - A parent DOM element to use as the cloned element for measuring height of the cloned text.  This is necessary
 *                   when the text node can have its text displaced by floated elements inside a common parent.
 *
 * Methods:
 *
 *      Methods are invoked via $('.selector').truncate(methodName, arguments...)
 *
 *      "options" - Pass an object argument to reset the options.  This does not immediately trigger an updated truncation.
 *
 *      "update" - Takes an optional second argument to pass new HTML.  With or without the argument, the original truncated
 *                 element will be re-truncated.  This is useful to hook into a callback when the truncated element can be
 *                 subject to re-sizing (i.e. responsive design)
 *
 * Examples:
 *
 *     Truncate to 3 lines with a trailing ellipsis, "Read More" text when collapsed, and no hide text.
 *
 *     $('.selector').truncate({
 *         'maxLines': 3,
 *         'truncateString': '&nbsp;&#8230;',
 *         'showText': 'Read More'
 *     });
 *
 *     Truncate to 3 lines with a trailing ellipsis, relative to a context parent that includes a floated image.
 *
 *     var $el = $('.selector');
 *     var $contextParent = $el.closest('.parent-selector');
 *
 *     $('.selector').truncate({
 *         'maxLines': 3,
 *         'truncateString': '&nbsp;&#8230;',
 *         'contextParent': $contextParent
 *     });
 */


if (typeof jQuery !== 'undefined') {
    (function($) {

        // matching expression to determine the last word in a string.
        var lastWordPattern = /(?:^|\W)\w*$/;
        var firstWordPattern = /(?:^\W+)\w+/;

        var setNodeText = $.browser.msie ? function(node, text) {
            node.nodeValue = text;
        } : function(node, text) {
            node.textContent = text;
        };

        // defines a utility function to splice HTML at a text offset
        var getHtmlUntilTextOffset = function(html, offset, truncateString) {

            var queue = [];
            var $html = $('<div/>');
            $html.html(html);
            var textLen = 0;

            // testing var to prevent infinite loops
            var count = 0;

            // remove child nodes from this node and push all onto the queue in reverse order (this implements depth-first search).
            var rootChildren = $html.contents().detach();
            var n = 0;
            for(n = rootChildren.size() - 1; n >= 0; --n) {

                queue.push({$parent: $html, node: rootChildren.get(n)});
            }

            while((queue.length > 0) && (textLen < offset) && (count < 100)) {

                var queueItem = queue.pop();
                var node = queueItem.node;
                var $node = $(node);
                var nodeTextLen = 0;
                var nodeText;

                // process text nodes distinctly from other node types
                if(node.nodeType === 3) {

                    var $nodeParent = queueItem.$parent;

                    // append $node to $html with children.  if children were detached above, then this is an empty node
                    $nodeParent.append($node);

                    nodeText = $node.text();
                    nodeTextLen = nodeText.length;

                    // if the text node's contents would put textLen above offset, perform truncation
                    if (nodeTextLen > offset - textLen) {

                        var match = lastWordPattern.exec(nodeText.substring(0, offset - textLen));
                        var lastWordOffset = match.index + match[0].length;
                        setNodeText(node, nodeText.substring(0, lastWordOffset));

                        if(typeof truncateString !== 'undefined') {
                            if(!($nodeParent.is('a'))) {
                                $nodeParent.append(truncateString);
                            } else {
                                $nodeParent.parent().append(truncateString);
                            }
                        }

                        // stop processing nodes.  the last word that will not exceed the offset has been found.
                        textLen += lastWordOffset;
                        break;

                    } else {
                        textLen += nodeTextLen;
                    }

                } else {

                    nodeText = $node.text();
                    nodeTextLen = nodeText.length;

                    // if the text content of this node and its children is greater than the gap between the accumulated text length and offset
                    if(nodeTextLen > offset - textLen) {

                        // remove child nodes from this node and push all onto the queue in reverse order (this implements depth-first search).
                        var children = $node.contents().detach();
                        var i = 0;
                        for(i = children.size() - 1; i >= 0; --i) {

                            queue.push({$parent: $node, node: children.get(i)});
                        }
                    } else {

                        textLen += nodeTextLen;
                    }

                    // append $node to $html with children.  if children were detached above, then this is an empty node
                    queueItem.$parent.append($node);
                }
            }

            return $html.html();
        };

        var truncate = function($el, options, html) {

            var DEBUG = function(msg) {
                if((options.debug === true) && (typeof console !== 'undefined')) {
                    console.log(msg);
                }
            };

            // options-based variables
            var showLinkHtml = options.showText !== '' ? ' <a class="show" href="#">' + options.showText + '</a>' : '';
            var hideLinkHtml = options.hideText !== '' ? ' <a class="hide" href="#">' + options.hideText + '</a>' : '';
            var maxHeight = options.maxLines * options.lineHeight;
            var realMaxHeight = maxHeight + options.allowedExtraLines * options.lineHeight;

            var startTime = new Date();


            var $html = $('<div/>');
            $html.html(html);

            // proceed if the element has already been truncated, or if its height is larger than the real max height
            if (typeof $el.data('truncatePlugin') !== 'undefined' || $el.height() > realMaxHeight) {

                // check whether a $parent element was specified for a larger DOM context
                var $contextParent = (options.contextParent === null || options.contextParent === $el) ? $el : $(options.contextParent);

                var $doppleText;
                var $doppleParent;
                if($contextParent.find($el).size() > 0) {

                    var childOffsets = [];
                    var $node = $el;
                    var $closestParent = $node.parent();
                    while($closestParent.size() !== 0 && !($closestParent.find($contextParent).size() > 0)) {

                        childOffsets.unshift($node.index());
                        $node = $closestParent;
                        $closestParent = $closestParent.parent();
                    }

                    $doppleParent = $contextParent.clone();
                    $doppleText = $doppleParent;
                    var i;
                    for(i = 0; i < childOffsets.length; i++) {
                        var offset = childOffsets[i];
                        $doppleText = $doppleText.children().eq(offset);
                    }
                    $doppleText.html(html);
                } else {
                    $doppleText = $el.clone();
                    $doppleText.html(html);
                    $doppleParent = $doppleText;
                }

                $doppleParent.css({
                    position: 'absolute',
                    left: '-9999px',
                    width: $contextParent.width()
                });
                $doppleText.css({
                    'line-height': options.lineHeight + 'px'
                });

                $contextParent.after($doppleParent);

                var originalHeight;
                if(typeof $el.data('truncatePlugin') === 'undefined') {
                    originalHeight = $el.height();
                } else {
                    // if this element has already been truncated, need to check the height empirically using the supplied html
                    originalHeight = $doppleText.height();
                }
                
                // this second check is for elements that have already been truncated before, because the true "originalHeight"
                // can only be determined in these cases after the $doppleText has been appended to the DOM
                if(originalHeight > realMaxHeight) {
                    var textString = $html.text();
                    var near = 0;
                    var far = textString.length;
                    var mid = far;
                    var truncatedHtml;

                    var count = 0;

                    do {
                        if($doppleText.height() > maxHeight) {
                            far = mid;
                        } else {
                            near = mid;
                        }

                        var avg = Math.floor((far + near) / 2);
                        mid = lastWordPattern.exec(textString.substring(0, avg)).index;
                        if(mid === near) {
                            var nextWord = firstWordPattern.exec(textString.substring(avg, far));
                            if(nextWord !== null) {
                                mid = avg + nextWord.index;
                            }
                        }

                        truncatedHtml = getHtmlUntilTextOffset(html, mid, options.truncateString);
                        $doppleText.html(truncatedHtml + showLinkHtml);
                        count++;
                    } while((count < 100) && (mid > near));

                    $doppleParent.remove();

                    if(options.collapsed === false) {
                        $el.append(hideLinkHtml);
                    } else {
                        $el.html(truncatedHtml + showLinkHtml);
                    }

                    $el.css({
                        'display': 'block',
                        'line-height': options.lineHeight + 'px'
                    });

                    $el.delegate('.show', 'click', function(event) {

                        event.preventDefault();

                        $el.html(html + hideLinkHtml);
                        $el.css('height', 'auto');

                        $el.trigger('show');
                        $el.trigger('toggle');
                    });

                    $el.delegate('.hide', 'click', function(event) {

                        event.preventDefault();

                        $el.html(truncatedHtml + showLinkHtml);
                        $el.css('height', maxHeight + 'px');
                        $el.trigger('hide');
                        $el.trigger('toggle');
                    });
                    DEBUG("truncate.js: truncated element with height " + originalHeight + "px > " + realMaxHeight + "px in " + count + " steps.");
                } else {
                    DEBUG("How did the plugin get undefined??");
                    $doppleParent.remove();
                    $el.html(html);
                }

            } else {
                DEBUG("truncate.js: skipped processing element with height " + originalHeight + "px < " + realMaxHeight + "px");
            }

            var endTime = new Date();

            DEBUG("truncate.js: took " + (endTime - startTime) + "  ms to execute.");
        };
        
        function Truncate(el, options) {
            
            // --- Defaults ---
            this.defaults = {
                'maxLines': 1,
                'lineHeight': null,
                'allowedExtraLines': 0,
                'truncateString': '',
                'showText': '',
                'hideText': '',
                'collapsed': true,
                'debug': false,
                'contextParent': null
            };
            
            // extend the default config with specified options
            this.config = $.extend(this.defaults, options);
            
            // store a reference to the jQuery object
            this.$el = $(el);

            if(this.config['lineHeight'] === null) {
                var empiricalLineHeight = parseInt(this.$el.css('line-height'), 10);
                console.log("detected line-height of: " + empiricalLineHeight);
                if(typeof empiricalLineHeight === 'number' && !isNaN(empiricalLineHeight)) {
                    this.config['lineHeight'] = empiricalLineHeight;
                } else {
                    throw new Error("No \"lineHeight\" parameter was specified and none could be calculated.");
                }
            }
            
            this.html = this.$el.html();
        };
        
        Truncate.prototype = {
            
            options: function(options) {
                if(typeof options === 'object') {
                    this.config = $.extend(this.config, options);
                    return;
                }
                return this.config;
            },
            
            update: function(html) {
                
                if(typeof html === 'undefined') {
                    html = this.html;
                }
                truncate(this.$el, this.config, html);
            }
        };

        $.fn.truncate = function(methodName) {

            var $el = $(this);

            if(typeof methodName === 'undefined' || methodName === null || typeof methodName === 'object') {
    
                $el.each(function() {
                    var $this = $(this);
                    var plugin = new Truncate($this, methodName);
                    $this.data('truncatePlugin', plugin)
                    truncate($this, plugin.config, plugin.html);
                });
            }
            
            var result;
            var methodArgs = arguments;
            
            if(typeof methodName === 'string') {
                $el.each(function() {
                    var plugin = $(this).data('truncatePlugin');    
                    if(typeof plugin[methodName] === 'function') {
                        var newResult = plugin[methodName].apply(plugin, Array.prototype.slice.call(methodArgs, 1));
                        if(typeof result === 'undefined') {
                            result = newResult;
                        }
                    }
                });
            }
            
            return typeof result !== 'undefined' ? result : this;
       };

    })(jQuery);
}
