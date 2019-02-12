function signIn() {
  let id = $('#id').val();
  let passwd = $('#passwd').val();

  if (id == '' || passwd == '') {
    $('span.alert').fadeIn();
    return;
  }

  $('#sign').submit();
}