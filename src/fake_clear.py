import redis
import json

r = redis.Redis(db=15)

for key in r.keys('*'):
    r.delete(key)
