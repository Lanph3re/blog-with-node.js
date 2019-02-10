jQuery(document).ready(function () {
  $('#tagCloud a').tagcloud(
    {
      size: { start: 15, end: 36, unit: 'px' },
      color: { start: '#3498DB', end: '#46CFB0' }
    }
  );
});
