import sqlite3
import json
import time
from flask import Flask, render_template, request, jsonify

from constants import *
import util

app = Flask(__name__)
app.debug = True

@app.route("/")
def list_of_books():
    conn = util.db_connection()
    c = conn.cursor()
    books = [book for book in c.execute("SELECT * FROM %s;"%TBL_BOOKS)];
    print type(books[0])
    print dir(books[0])

    return render_template('book-list.html', books=books)

@app.route("/book/<int:book_id>")
def serve_book(book_id):
    conn = util.db_connection()
    c = conn.cursor()
    row = c.execute("SELECT * FROM %s WHERE id=?;"%TBL_BOOKS, (book_id,)).fetchone()

    content = open(BOOKS_BASE_PATH + row['path'], 'r').read()
    return render_template('book-view.html', book_content=content.decode('utf-8'), info=row)

@app.route("/api/book/comments", methods=['GET'])
def serve_comments():
    id = request.args.get('id');
    comments = [{"author": "GuestNo1", "text": "Comment %s"%i, "created": int(time.time())} for i in range(10)]
    return jsonify(comments = comments)

@app.route("/api/book/comments", methods=['POST'])
def post_comment():
    comment = {"author": "GuestNo5", "text": request.form['comment_text'] , "created": int(time.time())}
    return jsonify(comment = comment)

if __name__ == '__main__':
    app.run()
