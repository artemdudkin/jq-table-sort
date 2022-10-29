# jq-table-sort
Adds sorting for html tables (1k minified zipped). Requires jq-min (3k minified zipped).

## Usage

Just add attribute "table-sort" to table tag (look at "test" folder for examples).

## API

### `window.initAll()`
Reinitialize all, i.e. tables that have attributes "table-sort". I use it after recreating all items, so it does not prevent initialization of element that was initialized before.

Also, it runs on DOMContentLoaded so you do not need to call it if you are not changing elements after page load.

## Demo
Try it at test/table-sort.html
