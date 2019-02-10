jQuery(document).ready(function () {
  $('#dialog').dialog(
    {
      autoOpen: false,
      modal: true,
      resizable: false,
      width: 400,
      height: 170,
      closeOnEscape: false,
      buttons: {
        '삭제': function () {
          $(this).dialog('close');
          let qs = getQueryStringObject();
          location.href = '/posts/delete?id=' + qs.id;
        },
        '취소': function () {
          $(this).dialog('close');
        }
      }
    }
  );
});

// function that parses query string in URL
function getQueryStringObject() {
  var a = window
    .location
    .search
    .substr(1)
    .split('&');
  if (a == '')
    return {};
  var b = {};
  for (var i = 0; i < a.length; ++i) {
    var p = a[i].split('=', 2);
    if (p.length == 1)
      b[p[0]] = '';
    else
      b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
  }
  return b;
}

function deletePost() {
  
  // show dialog box
  $('#dialog').dialog('open');
}