(function() {

var highlighted_para = null;

function commentLink() {
    return '<a href="#" class="comment_link">Comment</a>';
}

function addComments(response) {
    console.log(response.responseJSON);
    var ul = document.createElement('ul');
    $('comment_form_form').insert({ before: ul });
    response.responseJSON.comments.each(function(el) {
        ul.insert("<li>"+el.text + " by " + el.author + " on " + new Date(el.created) +"</li>");
    });
}

function commentPosted(response) {
    var el = response.responseJSON.comment;
    $$('#comment_form ul')[0].insert("<li>"+el.text + " by " + el.author + " on " + new Date(el.created) +"</li>");
}

function setupCommentArea(para) {
    $('comment_form').show();
    $('comment_form').style.display = '';
    $$('#comment_form ul').each(function (el) {
        el.remove();
    });
    var id = escape(window.location.pathname + '#p['+para.getAttribute('data-key')+']');
    new Ajax.Request('/api/book/comments?id=' + id, {
        onSuccess: addComments.bind(id),
        onFailure: function() {console.log("ERRROR");},
        method: 'GET'
    });

    $('comment_form_form').observe('submit', function(e) {
        $('comment_form_form').request({
            onSuccess: commentPosted.bind(id),
            parameters: { id: id },
            method: 'post'
        });
        Event.stop(e);
    });
}

function hideComments() {
    $('comment_form').hide();
}

function initialize() {
    hideComments();
    $$("p").each(function(p) {
        var link = commentLink();
        $(p).observe('click', function(e) {
            setupCommentArea(p);
            if( highlighted_para )
                highlighted_para.removeClassName("highlight");
            p.addClassName("highlight");
            highlighted_para = p;
            e.preventDefault();
        });
        $(p).insert(link);
    });
    Event.observe(window, 'keydown', function(e) {
        if( e.keyCode == Event.KEY_ESC )
            hideComments();
    });
}

Event.observe(window, 'load', initialize);
})();
