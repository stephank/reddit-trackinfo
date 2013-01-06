(function preload() {
    function img(url) {
        var el = new Image();
        el.src = url;
    }

    img('/spinner.gif');
})();

$('.post').click(function(e) {
    e.preventDefault();
    var el = $(e.currentTarget);
    var url = el.attr('href');
    post(url);
});

$('form').submit(function(e) {
    e.preventDefault();
    var el = $(e.currentTarget);
    var url = el.attr('action');
    var data = el.serialize();
    post(url, data);
});

function post(url, data) {
    var spinner = $('<img/>', { src: '/spinner.gif' });
    $('.progress').html(spinner);

    $.post(url, data)
    .done(function() {
        location.reload();
    })
    .fail(function() {
        $('.progress').text("Request failed");
    });
}
