function signIn() {
  let id = $('#id').val();
  let passwd = $('#passwd').val();

  if (id == '' || passwd == '') {
    $('#box.alert').fadeIn();
    return;
  }

  $('#Sign').submit();
}