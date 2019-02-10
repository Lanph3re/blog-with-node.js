jQuery(document).ready(function () {

  // toastr setting
  toastr.options = {
    'positionClass': 'toast-bottom-right'
  };

  // dialog setting
  $('#dialog').dialog(
    {
      autoOpen: false,
      modal: true,
      resizable: false,
      width: 400,
      height: 170,
      closeOnEscape: false,
      buttons: {
        '나가기': function () {
          $(this).dialog('close');
          history.back();
        },
        '취소': function () {
          $(this).dialog('close');
        }
      }
    }
  );

  // tagging setting
  let custom_options = {
    'tags-limit': 7,
    'forbidden-chars-callback': toastr.error,
    'no-duplicate-callback': toastr.error
  };

  $('#post_tags').tagging(custom_options);
});

function submitContents() {
  let category = $('#post_category').val();
  let title = $('#post_title').val();
  let contents = $('#post_contents').summernote('code');
  let contents_check = (contents == '<p><br></p>')
    || (contents == '');


  if (title == '' && contents_check) {
    toastr.error('제목과 본문을 입력해주세요.');
    return;
  }
  if (title == '') {
    toastr.error('제목을 입력해주세요.');
    return;
  }
  if (contents_check) {
    toastr.error('본문 내용을 입력해주세요.');
    return;
  }
  if (category == 'no_category') {
    toastr.error('게시판 종류를 선택해주세요.');
    return;
  }

  $('#writeAction').submit();
}

function cancelWriteForm() {

  // show dialog box
  $('#dialog').dialog('open');
}