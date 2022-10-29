/**
 * @requires jq-min (https://github.com/artemdudkin/jq-min)
 *
 * @returns nothing, but
 *
 *   window.jqsrt.initAll {Function} reinitialize all, i.e. tables that have attributes "table-sort"
 *     (I use it after recreating all items, so it does not prevent initialization of element that was initialized before)
 *     (also, it runs on DOMContentLoaded so you do not need to call it if you are not changing elements)
 *
 *   window.jqsrt.setReadDataFunc {Function(func: function(cell:Element, table:Element))} if you need preprocess data at table cells before comparing
 *
 *   tableElement.jqsrt.sort {Function(index:number)} sort by column, specified by index
 *   tableElement.jqsrt.initialized {Boolean} was table initialized by initAll
 *   tableElement.jqsrt.exclude_first_row {Boolean} table does not have "thead" section and therefor first row used as header row
 *   tableElement.jqsrt.data {Array of {id:number, <number>:any}} table data, parsed by func from setReadDataFunc (or just innerText of table cell)
 *   tableElement.jqsrt.el {Element} cell that have sort marker
 *   tableElement.jqsrt.srt {0, 1, 2} 0=no sort, 1=ascending, 2=descending
 *
 * @license MIT
 */
(function(){

  //
  // Find parent with specified tag name
  //
  function findParentTag( el, tagName) {
    tagName = tagName.toUpperCase();
    while (el.parentNode && el.tagName.toUpperCase() !== tagName) el = el.parentNode;
    return (el.tagName.toUpperCase() === tagName ? el : undefined)
  }

  // Search for all table with "table-sort" attribute and initialize it
  function initAll() {
    let tables = $('[table-sort]');
    for (let i=0; i<tables.length; i++) {
      if (!tables[i].jqsrt) tables[i].jqsrt = {}
      if (!tables[i].jqsrt.initialized) {
        let trs = $('thead tr', tables[i]);
        if (!trs[0]) {
          trs = $('tr', tables[i]);
          tables[i].jqsrt.exclude_first_row = true;
        }
        if (trs[0]) {
          for (let j=0; j<trs[0].children.length; j++) {
            init(trs[0].children[j], j);
          }
        }
        tables[i].jqsrt.initialized = true;
      }
    }
  }

  // Read data from table cells to tableElement.jqsrt.data array 
  // like this [{id:<rowNumber>,0:<firstRowData>,1:<secondRowData>, ...}, ...]
  // (using function from setReadDataFunc to parse data)
  // and set up tableSortId for every tr
  function initTableData(tbl, forceReinit) {
      if (!tbl.jqsrt) tbl.jqsrt = {}

      if (!tbl.jqsrt.data || forceReinit) {
        tbl.jqsrt.data = [];

        let trs = $('tbody tr', tbl);
        for (let i=0; i<trs.length; i++) {
          trs[i].tableSortId = i;
          let line = {id:i}
          let tds = $('td', trs[i]);
          for (let j=0; j<tds.length; j++) {
            let value = rd(tds[j], tbl);
            if (typeof value === 'undefined') value = tds[j].innerText
            line[j] = value;
          }
        tbl.jqsrt.data.push(line);
        }
        if (tbl.jqsrt.exclude_first_row) tbl.jqsrt.data.shift();
      }
  }


  function sortby(index, itm) {
          let tbl = this;

          //get table cell (if "itm" argument was not defined at function call)
          if (!itm) {
            let trs = $('thead tr', tbl);
            if (!trs[0]) trs = $('tr', tbl);
            itm = trs[0].children[index];
          }

          //update sort marker
          if (!tbl.jqsrt) tbl.jqsrt = {}
          if (tbl.jqsrt.el) $('.table-sort-marker', tbl.jqsrt.el)[0].remove();
          if (itm !== tbl.jqsrt.el) tbl.jqsrt.srt = 0;
          tbl.jqsrt.srt = !tbl.jqsrt.srt ? 1 : tbl.jqsrt.srt === 1 ? 2 : 0; // undefined or 0 -> 1 -> 2 -> 0 -> ... (cycle)
          tbl.jqsrt.el = tbl.jqsrt.srt ? itm : undefined;
          itm.innerHTML = itm.innerHTML + (tbl.jqsrt.srt ? '<span class="table-sort-marker">&nbsp;'+(tbl.jqsrt.srt===1?'&#x25BE;':'&#x25B4;')+'</span>' : '');

          //get table data
          initTableData(tbl);

          //sort table data
          if (tbl.jqsrt.srt) {
            tbl.jqsrt.data.sort((a, b) => {
              let ret = 0;
              if (typeof a[index] === 'undefined' && typeof b[index] === 'undefined') {
                ret = 0;
              } else if (typeof a[index] === 'undefined') {
                ret = 1;
              } else if (typeof b[index] === 'undefined') {
                ret = -1;
              } else if (a[index] > b[index]) {
                ret = 1;
              } else if (a[index] < b[index]) {
                ret = -1;
              } 
              if (tbl.jqsrt.srt === 2) ret = -ret;
              return ret;
            })
          } else {
            tbl.jqsrt.data.sort((a, b) => a.id - b.id)
          }

          //place table rows in accordance with order of table data rows
          let prev;
          let trs = $('tbody tr', tbl);
          for (let i=0; i<tbl.jqsrt.data.length-1; i++) {
            let id = tbl.jqsrt.data[i].id;
            let el; for (let i=0; i<trs.length; i++) if (trs[i].tableSortId === id) el=trs[i];
            if (prev) {
              prev.after(el)
            } else {
              if (tbl.jqsrt.exclude_first_row) {
                let header; for (let i=0; i<trs.length; i++) if (trs[i].tableSortId === 0) header=trs[i];
                header.after(el);
              } else {
                $('tbody', tbl)[0].prepend(el);
              }
            }
            prev = el;
          }
  }

  function init(itm, index) {
      $(itm).css('cursor:pointer');

      let tbl = findParentTag(itm, 'table');
      if (!tbl.jqsrt) tbl.jqsrt = {}
      tbl.jqsrt.sort = sortby.bind(tbl);

      //prevents text selection
      itm.addEventListener('selectstart', function(e){ e.preventDefault(); });

      $(itm)
        .mousedown( event => {
          event.stopPropagation();
          tbl.jqsrt.sort(index, itm);
        });
  }


  let rd;
  function setReadDataFunc( fn) { // fn = function(itm, tbl)
    rd = fn;
  }


  if (typeof $ === 'undifined') {
    console.error('jq-min is not defined, cannot find $ function');
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      initAll();
    });
  }

  window.jqsrt = {
    initAll,
    setReadDataFunc,
  }
})();