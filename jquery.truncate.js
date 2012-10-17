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

        $.fn.truncate = function(opts) {

            var options = $.extend({

                // --- Defaults ---
                'maxLines': 1,
                'lineHeight': 15,
                'allowedExtraLines': 0,
                'truncateString': '',
                'showText': '',
                'hideText': '',
                'collapsed': true,
                'debug': false,
                'contextParent': null

            }, opts);

            var DEBUG = function(msg) {
                if((options.debug === true) && (typeof console !== 'undefined')) {
                    console.log(msg);
                }
            };

            // matching expression to determine the last word in a string.
            var lastWordPattern = /(?:^|\W)\w*$/;
            var firstWordPattern = /(?:^\W+)\w+/;
            var showLinkHtml = options.showText !== '' ? ' <a class="show" href="#">' + options.showText + '</a>' : '';
            var hideLinkHtml = options.hideText !== '' ? ' <a class="hide" href="#">' + options.hideText + '</a>' : '';

            var maxHeight = options.maxLines * options.lineHeight;
            var realMaxHeight = maxHeight + options.allowedExtraLines * options.lineHeight;

            var setNodeText = $.browser.msie ? function(node, text) {
                node.nodeValue = text;
            } : function(node, text) {
                node.textContent = text;
            };

            // defines a utility function to splice HTML at a text offset
            var getHtmlUntilTextOffset = function($el, offset) {

                var queue = [];
                var $html = $('<div/>');
                var textLen = 0;

                // testing var to prevent infinite loops
                var count = 0;

                // remove child nodes from this node and push all onto the queue in reverse order (this implements depth-first search).
                var rootChildren = $el.clone().contents().detach();
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

                            if(!($nodeParent.is('a'))) {
                                $nodeParent.append(options.truncateString);
                            } else {
                                $nodeParent.parent().append(options.truncateString);
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

                return $html;
            };

            $(this).each(function() {

                var startTime = new Date();

                var $text = $(this);

                var originalHeight = $text.height();

                if (originalHeight > realMaxHeight) {

                    var originalHtml = $text.html();

                    // check whether a $parent element was specified for a larger DOM context
                    var $contextParent = (options.contextParent === null || options.contextParent === $text) ? $text : $(options.contextParent);

                    var $doppleText;
                    var $doppleParent;
                    if($contextParent.find($text).size() > 0) {

                        var childOffsets = [];
                        var $node = $text;
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
                    } else {
                        $doppleText = $text.clone();
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

                    var textString = $text.text();
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

                        truncatedHtml = getHtmlUntilTextOffset($text, mid).html();
                        $doppleText.html(truncatedHtml + showLinkHtml);
                        count++;
                    } while((count < 100) && (mid > near));

                    $doppleParent.remove();

                    if(options.collapsed === false) {
                        $text.append(hideLinkHtml);
                    } else {
                        $text.html(truncatedHtml + showLinkHtml);
                    }

                    $text.css({
                        'display': 'block',
                        'line-height': options.lineHeight + 'px'
                    });

                    $text.delegate('.show', 'click', function(event) {

                        event.preventDefault();

                        $text.html(originalHtml + hideLinkHtml);
                        $text.css('height', 'auto');

                        $text.trigger('show');
                        $text.trigger('toggle');
                    });

                    $text.delegate('.hide', 'click', function(event) {

                        event.preventDefault();

                        $text.html(truncatedHtml + showLinkHtml);
                        $text.css('height', maxHeight + 'px');
                        $text.trigger('hide');
                        $text.trigger('toggle');
                    });
                    DEBUG("truncate.js: truncated element with height " + originalHeight + "px > " + realMaxHeight + "px in " + count + " steps.");
                } else {
                    DEBUG("truncate.js: skipped processing element with height " + originalHeight + "px < " + realMaxHeight + "px");
                }

                var endTime = new Date();

                DEBUG("truncate.js: took " + (endTime - startTime) + "  ms to execute.");
            });
        };

    })(jQuery);
}
