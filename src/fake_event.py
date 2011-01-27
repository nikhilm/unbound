import redis
import json

r = redis.Redis(db=15)

events = [ {'type':'event', 'name':'PyCon 2011', 'date': 'March 9th, 2011', 'location': 'Atlanta, USA'}, {'type':'event', 'name':'PyCon India 2010', 'date': 'September 25th, 2010', 'location': 'Bangalore, India', 'extra': '<a href="http://in.pycon.org/2010/talks">Talks</a>'} ] 

for event in events:
    r.rpush('book:stream:1', json.dumps(event))
