/**
 * jq-table-sort 0.0.1
 * 
 * @requires jq-min (i.e. +2k)
 * @returns
 *   window.tableSort.initAll = reinitialize all, i.e. tables that have attributes "table-sort")
 *     (I use it after recreating all items, so it does not prevent initialization of element that was initialized before)
 *     (also, it runs on DOMContentLoaded so you do not need to call it if you are not changing elements)
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
    let trs = $('[table-sort] thead tr');
    if (!trs[0]) trs = $('[table-sort] tr');
    if (trs[0]) {
      for (let i=0; i<trs[0].children.length; i++) {
        init(trs[0].children[i], i);
      }
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

          //get table data fi needed
          let trs = $('tbody tr', tbl);
          if (!tbl.status.data) {
            tbl.status.data = [];
            for (let i=0; i<trs.length; i++) {
              trs[i].tableSortId = i;
              let line = {id:i}
              let tds = $('td', trs[i]);
              for (let j=0; j<tds.length; j++) {
                line[j] = tds[j].innerText;
              }
              tbl.status.data.push(line);
            }
          }

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
          for (let i=0; i<tbl.status.data.length-1; i++) {
            let id = tbl.status.data[i].id;
            let el; for (let i=0; i<trs.length; i++) {
              if (trs[i].tableSortId === id) el=trs[i];
            }
            if (prev) {
              prev.after(el)
            } else {
              $('tbody', tbl)[0].prepend(el);
            }
            prev = el;
          }

          return false;
        });
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
  }
})();