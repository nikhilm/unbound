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
    $$('#comment_form textarea')[0].setValue("");
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

    Event.stopObserving('book_feed', 'unbound:comment');
    Event.observe('book_feed', 'unbound:comment', function(e) {
        var ul = $$('#comment_form ul')[0];
        var el = e.memo;
        ul.insert("<li>"+el.text + " by " + el.author + " on " + new Date(el.created) +"</li>");
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

var UserBookUpdater = function() {
    var endpoint = '/api/updates/user'+window.location.pathname;

    function message(response) {
        var json = response.responseJSON;
        $A(json.stream).each(function(activity) {
            if( activity.type == 'reading' ) {
                $('book_feed').insert('<li>'+activity.user+" is reading this book");
            }
            else if( activity.type == 'comment' ) {
                $('book_feed').insert('<li>'+activity.author+' commented on &lt;section&gt; in the book');
                Event.fire($('book_feed'), 'unbound:comment', activity);
            }
        });
    }

    function poll() {
        new Ajax.Request(endpoint, {
            onSuccess: message,
            method: 'get'
        });
    }

    setInterval(poll, 1000);
}

var BookUpdater = function() {
    var endpoint = '/api/updates'+window.location.pathname;

    function message(response) {
        var json = response.responseJSON;
        $A(json.stream).each(function(activity) {
            if( activity.type == 'event' ) {
                var msg = '<li>Event: '+activity.name+", " + activity.location + " on " + activity.date;
                if( activity.extra )
                    msg += " " + activity.extra;
                $('book_feed').insert(msg);
            }
        });
    }

    function poll() {
        new Ajax.Request(endpoint, {
            onSuccess: message,
            method: 'get'
        });
    }

    setInterval(poll, 5000);
}

function pControls() {
    var elt = '<div class="p_controls">' + commentLink();
    return $(elt);
}

function initialize() {
    hideComments();
    $$("#book_pane p").each(function(p) {
        var control = pControls();
        $(p).observe('click', function(e) {
            setupCommentArea(p);
            //if( highlighted_para )
            //    highlighted_para.removeClassName("highlight");
            //p.addClassName("highlight");
            //highlighted_para = p;
            //e.preventDefault();
        });
        $(p).insert(control);
    });
    Event.observe(window, 'keydown', function(e) {
        if( e.keyCode == Event.KEY_ESC )
            hideComments();
    });
    new UserBookUpdater();
    new BookUpdater();
}

Event.observe(window, 'load', initialize);
})();
