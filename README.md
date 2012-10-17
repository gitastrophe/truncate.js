truncate.js
===========

a jQuery plugin for deep-HTML truncation and toggling

## Why?

1. Server-side text truncation based on character counts is always incorrect. The width of the character string "iiiii" is 58.3% less than the width of "MMMMM" unless a monospace font is used. 
2. The CSS3 property "text-overflow" can only truncate a single line of text, and is not supported by IE7 and below.

## Features

1. Text truncation to a specified number of lines, including text that wraps around other floated elements.
2. Deep-HTML truncation with preservation of all non-type3 (text) nodes
3. Optional specification of a truncation suffix, e.g. …
4. Toggling between truncated and un-truncated states with configurable hyperlink text
5. Triggered events when the truncated state of the text is changed
6. O(log n) execution time for n := text length