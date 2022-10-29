/**
 * @requires jq-min (https://github.com/artemdudkin/jq-min)
 *
 * @returns
 *
 *   window.tableSort.initAll = reinitialize all, i.e. tables that have attributes "table-sort")
 *     (I use it after recreating all items, so it does not prevent initialization of element that was initialized before)
 *     (also, it runs on DOMContentLoaded so you do not need to call it if you are not changing elements)
 *
 *   window.tableSort.setReadDataFunc = <function(cell, table)> if you need preprocess data at table cells before comparing
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


  function initAll() {
    let tables = $('[table-sort]');
    for (let i=0; i<tables.length; i++) {
      if (!tables[i].status) tables[i].status = {}
      if (!tables[i].status.initialized) {
        let trs = $('thead tr', tables[i]);
        if (!trs[0]) {
          trs = $('tr', tables[i]);
          tables[i].status.exclude_first_row = true;
        }
        if (trs[0]) {
          for (let j=0; j<trs[0].children.length; j++) {
            init(trs[0].children[j], j);
          }
        }
        tables[i].status.initialized = true;
      }
    }
  }

  function initTableData(tbl, forceReinit) {
      if (!tbl.status) tbl.status = {}

      if (!tbl.status.data || forceReinit) {
        tbl.status.data = [];

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
        tbl.status.data.push(line);
        }
        if (tbl.status.exclude_first_row) tbl.status.data.shift();
      }
  }

  function init(itm, index) {
      $(itm).css('cursor:pointer');

      let tbl = findParentTag(itm, 'table');
      let tr = findParentTag(itm, 'tr');

      itm.addEventListener('selectstart', function(e){ e.preventDefault(); }); //prevents text selection

      $(itm)
        .mousedown( event => {
          event.stopPropagation();

          //update sort marker
          if (!tbl.status) tbl.status = {}
          if (tbl.status.el) $('.table-sort-marker', tbl.status.el)[0].remove();
          if (itm !== tbl.status.el) tbl.status.srt = 0;
          tbl.status.srt = !tbl.status.srt ? 1 : tbl.status.srt === 1 ? 2 : 0; // undefined or 0 -> 1 -> 2 -> 0 -> ... (cycle)
          tbl.status.el = tbl.status.srt ? itm : undefined;
          itm.innerHTML = itm.innerHTML + (tbl.status.srt ? '<span class="table-sort-marker">&nbsp;'+(tbl.status.srt===1?'&#x25BE;':'&#x25B4;')+'</span>' : '');

          //get table data
          initTableData(tbl);

          //sort table data
          if (tbl.status.srt) {
            tbl.status.data.sort((a, b) => {
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
              if (tbl.status.srt === 2) ret = -ret;
              return ret;
            })
          } else {
            tbl.status.data.sort((a, b) => a.id - b.id)
          }

          //place table rows in accordance with order of table data rows
          let prev;
          let trs = $('tbody tr', tbl);
          for (let i=0; i<tbl.status.data.length-1; i++) {
            let id = tbl.status.data[i].id;
            let el; for (let i=0; i<trs.length; i++) if (trs[i].tableSortId === id) el=trs[i];
            if (prev) {
              prev.after(el)
            } else {
              if (tbl.status.exclude_first_row) {
                let header; for (let i=0; i<trs.length; i++) if (trs[i].tableSortId === 0) header=trs[i];
                header.after(el);
              } else {
                $('tbody', tbl)[0].prepend(el);
              }
            }
            prev = el;
          }

          return false;
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

  window.tableSort = {
    initAll,
    setReadDataFunc,
  }
})();