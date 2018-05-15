# elearn.js

The _elearn.js_ script is meant to simplify the creation of an information
based Website presented as a digital paper.
It can be used for higher education and Open Educational Ressources.

## Documentation

The comprehensive documentation is only available in german at the moment.
http://www.sumo.uni-hamburg.de/DigitaleSkripte/.

## Supported Languages

The _elearn.js_ supports a simple language selection. The default language
is _german_. To change it, you can do one of the following:

1. A `lang` attribute will cause this node and all included _elearn.js_ nodes to
appear in the selected language. E.g. `<html lang="en">` to change the language
for the whole document. Changing the `lang` attribute after the document was
loaded will not change already localized elements. Use method _2_ for this.
2. The `eLearnJS.setLanguage()` function can be used to set the language from
inside a script. You can use this for _atom-elearnjs_ projects in the
_meta custom_ block. This may be overwritten by the first method if present.

Available languages are:
* _de_: German (default)
* _en_: English

## Recommended Usage

For the editor [Atom](https://atom.io) there is the package
[atom-elearnjs](https://github.com/elb-min-uhh/atom-elearnjs).
This package converts Markdown files to HTML and PDF and is specifically
designed to use _elearn.js_ for styling and interactive elements.
Using makes the creation of scripts more simple and faster.

The markdown example
[Examples/Markdown/elearn_template.md](/Examples/Markdown/elearn_template.md)
uses _atom-elearnjs_ functions and uses nearly everything _elearn.js_ can do.
This file is a good start to get going.

### Examples

The examples in this repository are very helpful for beginners or
troubleshooting. Most of them are designed to be viewed as source and contain
helpful comments.

Following examples are included:
* __Markdown__: Basic markdown file containing a lot of _elearn.js_ and
    _atom-elearnjs_ functions.
* __ResizingIFrame__: Example for an _elearn.js_ script included as `iframe`.
    The example shows how to automatically resize your `iframe` based on the
    _elearn.js_ height.
* __TreeHierarchy__: Examples of encapsulated scripts. Helpful for more
    complex topics or splitting of large scripts into multiple files.

### Settings

The _elearn.js_ supports a few settings. Those have to be done by using
`JavaScript`. Examples for those settings can be viewed in the file  
[Template/index.html](/Template/index.html). The commands are contained
as comments in a `<script>` block in the file's `<head>`. Comments are currently
only written in _german_.

__Hint__: Using _atom-elearnjs_ you can use these settings as done in
[Examples/Markdown/elearn_template.md](/Examples/Markdown/elearn_template.md).
More information about the necessary tag `Custom` in the _meta block_
can be found in the documentation of
[atom-elearnjs](https://github.com/elb-min-uhh/atom-elearnjs).


## Manual Creation without _atom-elearnjs_

If you do not want to use the package _atom-elearnjs_ you can include
_elearn.js_ in your `html` file directly. It is recommended to write all
user changes in seperate files to not be overwritten by an _elearn.js_ update.
So do not change the files _elearn.js_ and _elearn.css_.
Which files might be overwritten by an update is described in the following
section.

You should include style changes (CSS) in the `html` page itself or a separate
file.

### Update an _elearn.js_ script manually

The most simple way is to use a markdown file and the _atom-elearnjs_ package
as described before. The _atom-elearnjs_ pacakge will always include the
latest stable releases.

Updating a script manually needs a few more steps.
1. Download the repository (as zip or clone)
2. Copy the `Template/assets/` in your script overwriting your `assets` folder
3. You can delete the folder `assets/img/template-media`
4. Check if the version displayed in the script imprint matches the current
version:
    * Open your script in a browser
    * Select the menu (top right) and then the _imprint_
    * The version is displayed in a grey bar at the bottom
    * The version of the downloaded script can be found in `assets/js/elearn.js`
    at the top

If you have changed some of the _elearn.js_ assets you downloaded, these changes
will be overwritten and lost.

## Extensions

There are multiple extensions for the _elearn.js_. Most of them can also be
used on their own:

* [quiz.js](https://github.com/elb-min-uhh/quiz.js) simple quiz elements
* [elearnvideo.js](https://github.com/elb-min-uhh/elearnvideo.js) HTML5 video
    player with support for annotations and user notes
* [clickimage.js](https://github.com/elb-min-uhh/clickimage.js) interactive
    images
* [timeslider.js](https://github.com/elb-min-uhh/timeslider.js) interactive
    timeline

## Versions

Please check the file
[CHANGELOG.md](https://github.com/elb-min-uhh/elearn.js/blob/master/CHANGELOG.md)
to get information about changes in different versions.

## License

elearn.js is developed by
[dl.min](https://www.min.uni-hamburg.de/studium/digitalisierung-lehre/ueber-uns.html)
of Universität Hamburg.

The software is using [MIT-License](http://opensource.org/licenses/mit-license.php).

cc-by Michael Heinecke, Arne Westphal, dl.min, Universität Hamburg
