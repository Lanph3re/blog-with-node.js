jQuery(document).ready(function(){
  var topBar = $('header').offset();

  $(window).scroll(function(){
    var docScrollY = $(window).scrollTop();
    var barThis = $('header');

    if( docScrollY > topBar.top ) {
      barThis.addClass("fixed");
    } else{
      barThis.removeClass("fixed");
    }
  });
});