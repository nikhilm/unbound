
import redis
import json

r = redis.Redis(db=15)

events = [
    {'type':'activity', 'text':'Nikhil added you as a friend' }
,   {'type':'activity', 'text':'Mr. Ritchie has added new references to Dive into Python' }
,   {'type':'activity', 'text':'Stephanie asked a doubt on The Time Machine' }
,   {'type':'activity', 'text':'New problem sets in courseware for Programming' }
,   {'type':'activity', 'text':'PyCon 2011 is coming up in March' }
,   {'type':'activity', 'text':'You have pending assignments in Calculus' }
,   {'type':'activity', 'text':'45 other people joined the course English' }
,   {'type':'activity', 'text':'Clive created a copy of your courseware "A Dummies Guide to Engineering"' }
,   {'type':'activity', 'text':'Winston started reading Macbeth' }
]

r.delete('user:stream')
for event in events:
    r.sadd('user:stream', json.dumps(event))
