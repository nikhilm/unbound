import sqlite3
import json
import time
import redis
from urllib import unquote
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

from constants import *
import util

app = Flask(__name__)
app.debug = True
app.secret_key = 'whathappens/when?something'

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/login", methods=['POST'])
def login():
    session['username'] = request.form['username']
    return redirect(url_for('list_of_books'))

@app.route("/books")
def list_of_books():
    conn = util.db_connection()
    c = conn.cursor()
    books = [book for book in c.execute("SELECT * FROM %s;"%TBL_BOOKS)];
    print type(books[0])
    print dir(books[0])

    return render_template('book-list.html', books=books, username=session['username'])

@app.route("/book/<int:book_id>")
def serve_book(book_id):
    conn = util.db_connection()
    c = conn.cursor()
    row = c.execute("SELECT * FROM %s WHERE id=?;"%TBL_BOOKS, (book_id,)).fetchone()

    if 'library' not in session:
    	session['library'] = []

    session['library'].append(book_id)

    r = redis.Redis(db=REDIS_DB_NUM)
    r.sadd('book:readers:%d'%book_id, session['username'])

    for user in r.smembers('book:readers:%d'%book_id):
        if user != session['username']:
            r.rpush('user:book:stream:%s:%d'%(user, book_id)
                , json.dumps({"type":"reading", "user":session['username']}))

    for user in r.smembers('book:readers:%d'%book_id):
        r.rpush('user:book:stream:%s:%d'%(session['username'], book_id)
                , json.dumps({"type":"reading", "user":user}))

    content = open(BOOKS_BASE_PATH + row['path'], 'r').read()
    return render_template('book-view.html', book_content=content.decode('utf-8'), info=row, username=session['username'])

@app.route("/api/book/comments", methods=['GET'])
def serve_comments():
    slug = unquote(request.args.get('id').replace('/book/', ''));
    book_id = int(slug[:slug.index('#')])
    location = slug[slug.index('#'):]
    r = redis.Redis(db=REDIS_DB_NUM)
    comments = []
    for comment in r.lrange("book:comments:%d:%s"%(book_id, location), 0, 10):
    	print comment
    	comments.append(json.loads(comment))
    return jsonify(comments=comments)

@app.route("/api/book/comments", methods=['POST'])
def post_comment():
    slug = unquote(request.form['id'])
    book_id = int(slug[:slug.index('#')].replace('/book/', ''))
    location = slug[slug.index('#'):]

    comment = { "type": "comment", "location": location, "author": session['username'] , "created": int(time.time()), "text": request.form['comment_text']}
    r = redis.Redis(db=REDIS_DB_NUM)
    for user in r.smembers('book:readers:%d'%book_id):
        rkey = 'user:book:stream:%s:%d'%(user, book_id)
        r.rpush(rkey, json.dumps(comment));

    r.rpush("book:comments:%d:%s"%(book_id, location), json.dumps(comment))

    return ""

@app.route("/api/updates/user")
def user_updates():
    pass
    
@app.route("/api/updates/book/<int:book_id>")
def book_updates(book_id):
    r = redis.Redis(db=REDIS_DB_NUM)
    rkey = 'book:stream:%d'%book_id

    print rkey

    events = []
    while True:
    	ret = r.lpop(rkey)
        if not ret:
        	break
    	events.append(json.loads(ret))
    print events

    return jsonify(stream=events)

@app.route("/api/updates/user/book/<int:id>")
def user_book_updates(id):
    user = session['username']
    rkey = 'user:book:stream:%s:%d'%(user, id)

    r = redis.Redis(db=REDIS_DB_NUM)
    data = []
    while True:
    	ret = r.lpop(rkey)
        if not ret:
        	break
    	data.append(json.loads(ret))
    print data
    return jsonify(stream=data)

if __name__ == '__main__':
    app.run()
