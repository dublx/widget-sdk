# Widget API Reference

This document describes the API that a custom widget can use to
communicate with the Contentful Management App.

### Table of Contents
* [Inclusion into your project](#inclusion-into-your-project)
* [Initialization](#initialization)
* [`widget.contentType`](#widgetcontenttype)
* [`widget.field`](#widgetfield)
* [`widget.entry`](#widgetentry)
  * [`entry.fields[name]`](#entryfieldsname-field)
* [`widget.space`](#widgetspace)
  * [Content Types](#content-types)
  * [Entries](#entries)
  * [Assets](#assets)
* [`widget.locales`](#widgetlocales)
* [`widget.window`](#widgetwindow)

## Inclusion into your project

You will need to include the `contentful-widget-api` library in your HTML5 app like
so:
~~~html
<script src="https://contentful.github.io/widget-sdk/cf-widget-api.js"></script>
~~~

The Contentful Widget SDK including the JavaScript API is also distributed as an
[NPM package][package].

~~~bash
npm install --save contentful-widget-sdk
~~~

[package]: https://www.npmjs.com/package/contentful-widget-sdk

## Initialization

The `widget-api` library exposes the `contentfulWidget.init()` method.
This is the main entry point for all widget related code. If you require the
script from the web without any module system the entry point is available as

~~~js
window.contentfulWidget.init(function (widget) {
  var value = widget.field.getValue()
  widget.field.setValue("Hello world!")
})
~~~

If you use a CommonJS packager for the browser (e.g. [Browserify][]) you need
to require the Widget API.

~~~js
var contentfulWidget = require('contentful-widget-sdk')
contentfulWidget.init(function (widget) {
  /* ... */
})
~~~

[Browserify]: http://browserify.org/

## `widget.contentType`

This API gives you access to data about the content type and the entry.
It has the shape as described under "content type properties" [here](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/content-types).

## `widget.field`

This API gives you access to the value and metadata of the field the widget is
attached to.

If you use localization, a widget instance will be rendered for each locale.
This means you can only change the value for the given locale. See the
[`entry.fields` API](#entryfieldsname-field) on how to change values for different
locales.

Suppose an entry returned by the Contentful Management API looks like this
~~~js
{
  sys: { ... },
  fields: {
    title: {
      "en_US": "My Post"
    },
    ...
  }
}
~~~
and the widget is attached to the `title` field and the `en_US` locale.


##### `widget.field.getValue(): mixed`
Gets the current value of the field and locale. In the example this would yield `"My Post"`.

##### `widget.field.setValue(value): Promise<void>`
Sets the value for the field and locale. The promise is resolved when the change
has been acknowledged. The type of the value must match the expected field type.
For example, if the widget is attached to a “Symbol” field you must pass a
string.

##### `widget.field.removeValue(value): Promise<void>`
Removes the value for the field and locale. A subsequent call to `getValue()` for the field would yield `undefined`.

##### `widget.field.setInvalid(Boolean): undefined`
Communicates to the Contentful web application if the field is in a valid state or not.
This impacts the styling applied to the field container.

##### `widget.field.onValueChanged(cb): function`
Calls the callback every time the value of the field is changed by some external
event (e.g. when multiple editors are working on the same entry). It will not be
called after `setValue()` is called.

The method returns a function that can be called to stop listening to changes.

##### `widget.field.onIsDisabledChanged(cb): function`
Calls the callback when the disabled status of the field changes.
A boolean indicating whether the field is disabled or not is passed to the callback.

The method returns a function that can be called to stop listerning to changes.

##### `widget.field.id: string`
The ID of a field is defined in an entry’s content type. Yields `"title"` in the
example.

##### `widget.field.locale: string`
The current locale of a field the widget is attached to. Yields `"en_US"` in the
example.

##### `widget.field.type: string`
Holds the type of the field the widget is attached to.
The field type can be one of the many described [here](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/content-types).

## `widget.entry`

This object allows you to read and update the value of any field of the current
entry and to get the entry's metadata.

##### `entry.getSys(): object`
Returns metadata for an entry. The value coincides with the `sys` value of an
entry returned by the [Contentful Management API](https://github.com/contentful/contentful-management.js/tree/legacy)

##### `entry.onSysChanged(cb): function`
Calls the callback with metadata every time that metadata changes. The returned
function can be called to stop listening to changes.

### `entry.fields[id]: Field`

In addition to [`widget.field`](#widgetfield), a widget can also control the
values of all other fields in the current entry. Fields are referenced by their ID.

The `Field` API methods provide a similar interface to `widget.field`. In
addition, the methods accept an optional locale to change the value for a
specific locale. It defaults to the space the space’s default locale (see
[`widget.locales`](#widgetlocales)). Providing an unknown locale throws an
exception.

* `field.id: string`
* `field.locales: Array<string>`
* `field.getValue(locale?): mixed`
* `field.setValue(value, locale?): Promise<void>`
* `field.removeValue(locale?): Promise<void>`
* `field.onValueChanged(locale?, cb): function`
* `field.onIsDisabledChanged(locale?, cb): function`

#### Example
If the entry has a “title” field, we can transform it to upper case with
~~~js
var titleField = widget.entry.fields.title
var oldTitle = titleField.getValue()
titleField.setValue(oldTitle.toUpperCase())
~~~


## `widget.space`

The `space` object exposes methods that allow the widget to read and manipulate a
wide range of objects in the space. Its API mirrors that of the
[`contentful-management` library][cma-js], with a few differences.

[cma-js]: https://github.com/contentful/contentful-management.js/tree/legacy

### Content Types

Allows operating on the current space's content types. Content types
created/updated or deleted this way will immediately be published or unpublished
respectively.

* `space.getContentType(id)`
* `space.getContentTypes()`
* `space.createContentType(data)`
* `space.updateContentType(data)`
* `space.deleteContentType(data)`

### Entries

* `space.getEntry(id)`
* `space.getEntries(query)`
* `space.createEntry(data)` The content type is expected in `data.sys.contentType`
* `space.updateEntry(data)`
* `space.publishEntry(data)`
* `space.unpublishEntry(data)`
* `space.archiveEntry(data)`
* `space.unarchiveEntry(data)`
* `space.deleteEntry(data)`
* `space.getPublishedEntries(query)`

### Assets

Same as the entry's method with “Entry” replaced by “Asset”. In addition there
is `space.processAssetFile(asset, locale)`


## `widget.locales`

A space can have multiple locales and each localized entry field can have
different values for different locales. Locales are identified by their locale
code, e.g. `"en_US"`.

##### `locales.default: string`
The default locale for the current space.

##### `locales.available: Array<string>`
A list of all locales available in the current space.


## `widget.window`

The window object provides methods to update the size of iframe the widget is
contained in. This prevents scrollbars inside the widget.

To prevent a flickering scrollbar during height updates, it is recommended to
set the widget's `body` to `overflow: hidden;`.

##### `window.updateHeight()`
Calculates the body’s `scrollHeight` and sets the containers height to
this value.

##### `window.updateHeight(height)`
Sets the iframe height to the given value in pixels. `height` must be an integer.

##### `window.startAutoResizer()`
Listens for DOM changes and calls `updateHeight()` when the size changes.

##### `window.stopAutoResizer()`
Stops resizing the iframe automatically.
