import redis

from constants import REDIS_DB_NUM

def subscribe(chan):
    r = redis.Redis(db=REDIS_DB_NUM)
    return r.subscribe(chan)

def publish(chan, message):
    r = redis.Redis(db=REDIS_DB_NUM)
    return r.publish(chan, message)
