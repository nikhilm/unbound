(function() {

var highlighted_para = null;

function addComments(response) {
    console.log(response.responseJSON);
    var ul = document.createElement('ul');
    $('comment_form_form').insert({ before: ul });
    response.responseJSON.comments.each(function(el) {
        ul.insert("<li>"+el.text + " by " + el.author + " on " + new Date(el.created) +"</li>");
    });
}

function commentPosted(response) {
    $$('#comment_form textarea')[0].clear();
}

function setupCommentArea(para) {
    $('comment_form').style.display = 'block';
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
        e.preventDefault();
        return false;
    });
    $A($('comment_form_form').childElements()).last().observe('click', function(e) {
        $('comment_form_form').request({
            onSuccess: commentPosted.bind(id),
            parameters: { id: id },
            method: 'post'
        });
        Event.stop(e);
        e.preventDefault();
        return false;
    });
}

function hideComments() {
    $('comment_form').style.display = 'none';
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
    var mediaLink = '<a href="#" class="media_link"><img src="/static/images/movie.png" width="30" border="0"></a>';
    var elt = '<div class="p_controls">' + mediaLink + '</div>';

    return elt;
}

function initialize() {
    hideComments();
    $$("#book_pane p").each(function(p) {
        var control = pControls();
        $(p).observe('click', function(e) {
            setupCommentArea(p);
            Event.stop(e);
            return false;
        });
        $(p).observe('mouseover', function(e) {
            var children = $(p).childElements();
            $(p).addClassName('current_para');
            $A(children)[children.length-1].style.display = 'block';

            var mlink = $A(children[children.length-1].childElements())[0];
            $(mlink).observe('mouseover', function() {
                $('videolayer').style.display = 'block';
            });
        });
        $(p).observe('mouseout', function(e) {
            var children = $(p).childElements();
            $A(children)[children.length-1].style.display = 'none';
            $(p).removeClassName('current_para');
        });
        $(p).insert("  (3 comments)");
        $(p).insert(control);
    });
    Event.observe(window, 'keydown', function(e) {
        if( e.keyCode == Event.KEY_ESC )
            hideComments();
    });
    //Event.observe(window, 'click', hideComments);
    new UserBookUpdater();
    new BookUpdater();
}

Event.observe(window, 'load', initialize);
})();
