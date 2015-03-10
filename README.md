truncate.js
===========

a jQuery plugin for deep-HTML truncation and toggling
## Why use JavaScript to truncate text?

1. Server-side text truncation based on character counts is always incorrect. The width of the character string "iiiii" is approximately 58% less than the width of "MMMMM" unless a monospace font is used. 
2. The CSS3 property "text-overflow" can only truncate a single line of text, and is not supported by IE7 and below.

## Features

1. HTML truncation to a specified number of lines, including HTML that wraps around other floated elements.
2. Deep-HTML truncation with preservation of all non-type3 (text) nodes
3. Optional specification of a truncation suffix, e.g. …
4. Toggling between truncated and un-truncated states with configurable hyperlink text
5. Triggered events when the truncated state of the HTML is changed
6. O(log n) execution time for n := text length
7. Pre-truncation and re-truncation analyses are both performed on cloned elements to minimize DOM flicker
8. Optional console logging of execution time and number of steps for performance analysis
9. Ability to merge modifications to truncated HTML back into the original HTML

## Usage

Invocation
```
$('.selector').truncate(options);
```
Event Binding (after invocation)
```
$('.selector').truncate('bind', 'show', function(){
	// do something when full text is shown
});
```
### Events
Events are triggered on the following state changes of the selected element.  No events are triggered
on the initial invocation of the truncate plugin.  

___
`show` Triggered when full text is shown.  If [options.animate](#options_animate) is specified to be true, then this event will fire after the animation has completed.  
___
`hide` Triggered when full text is truncated.  If [options.animate](#options_animate) is specified to be true, then this event will fire after the animation has completed.  
___
`toggle` Triggered both when full text is shown and truncated.  If [options.animate](#options_animate) is specified to be true, then this event will fire after the animation has completed.

### Options

Options are passed as a flat javascript object with the following allowed keys:
___
<a name="options_maxLines"></a>
The maximum number of lines to display when the element is truncated.  

    maxLines

        Allowed Values: integer > 0
        Default Value: 1
___
<a name="options_lineHeight"></a>
The line-height value that should be used to calculate the vertical truncation point.  If unspecified, it will be calculated using the CSS value from each selected element.

	lineHeight

		Allowed Values: integer > 0
		Default Value: null
___
<a name="options_truncateString"></a>
Suffix to append to truncated text. e.g. &nbsp;&#8230; (non-breaking space followed by an ellipsis).
	truncateString
	
		Allowed Values: any string
		Default Value: ''
___
<a name="options_truncateAfterLinks"></a>
Indicates whether [options.truncateString](#options_truncateString) should be appended after anchor tags when the truncation point occurs inside an anchor tag.  Since the truncateString is not part of the original anchor text, it is desirable to exclude it from the anchor tag.  In cases where anchor tags display as block, however, this can cause the truncateString to display on a line below the anchor tag.

	truncateAfterLinks
	
		Allowed Values: true / false
		Default Value: true
___
<a name="options_showText"></a>
If specified, will be shown as a hyperlink appended to the truncated text.  When clicked, this link will toggle the truncated element to its full-text state. e.g. ("more")

	showText
	
		Allowed Values: any string
		Default Value: ''
___
<a name="options_hideText"></a>
If specified, will be shown as a hyperlink appended to the full text.  When clicked, this link will toggle the full-text element to its truncated state.  e.g. ("less")

	hideText 
	
		Allowed Values: any string
		Default Value: ''
___
<a name="options_collapsed"></a>
Indicates whether the truncated element should be initially displayed in a full-text or truncated state.

	collapsed
	
		Allowed Values: true / false
		Default Value: true
___
<a name="options_debug"></a>
Indicates whether messages should be written to **console.log** including the truncation execution time and number of binary search steps used to truncate the full text.  The usage of **console.log** in this plugin is always safe for inclusion in IE.

	debug
	
		Allowed Values: true / false
		Default Value: false
___
<a name="options_contextParent"></a>
A parent DOM element to use as the cloned element for measuring height of the cloned text.  This is necessary when the text node can have its text displaced by floated elements inside a common parent.

	contextParent
	
		Allowed Values: jQuery object
		Default Value: null
___
<a name="options_tooltip"></a>
Indicates whether the original TEXT content should be set in a title attribute on the truncated element.  This will strip all HTML for compatibility with HTML attribute syntax.

	tooltip
	
		Allowed Values: true / false
		Default Value: false
___
<a name="options_animate"></a>
Indicates whether the user-initiated transitions between truncated and full text should animate the height.

	animate
	
		Allowed Values: true / false
		Default Value: false
___
<a name="options_animateOptions"></a>
If specified, will be passed into jQuery's $.fn.animate options parameter.

	animateOptions
	
		Allowed Values: object
		Default Value: empty object

### Methods

Methods are invoked via $('.selector').truncate(methodName, arguments...)
___
`options` Pass an object argument to reset the options.  This does not immediately trigger an updated truncation.
___
`update` Takes an optional second argument to pass new HTML.  With or without the argument, the original truncated element will be re-truncated.  This is useful to hook into a callback when the truncated element can be subject to re-sizing (i.e. responsive design).  If no HTML is passed, but the contents of the truncated text have been modified, the modified text will be used in place of the original.

### Examples

Truncate to 3 lines with a trailing ellipsis, "Read More" text when collapsed, and no hide text.
```
$('.selector').truncate({
    'maxLines': 3,
    'truncateString': '&nbsp;&#8230;',
    'showText': 'Read More'
});
```
___
Truncate to 3 lines with a trailing ellipsis, relative to a context parent that includes a floated image.
```
var $el = $('.selector');
var $contextParent = $el.closest('.parent-selector');

$('.selector').truncate({
    'maxLines': 3,
    'truncateString': '&nbsp;&#8230;',
    'contextParent': $contextParent
});
```

### Known Issues

- Truncating HTML without consideration for the timing of web font loading will produce incorrectly truncated text. In cases where web fonts are used, either delay truncation until after the web fonts are loaded or call the "update" method after the web fonts have loaded.  [FontSpy](https://github.com/patrickmarabeas/jQuery-FontSpy.js) is a good plugin for detecting when an external font has been loaded.  It is based on [Remy Sharp's usage of Comic Sans for determining whether a named font is loaded](https://remysharp.com/2008/07/08/how-to-detect-if-a-font-is-installed-only-using-javascript)

- The "update" method with 0 parameters will fail to recognize a change in the truncated HTML if the HTML length is the same as before the change was made.
