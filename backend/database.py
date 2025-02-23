import motor.motor_asyncio
from bson import ObjectId
import redis

# Database connections
client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client["testdb"]
users_collection = db["users"]

# Redis connection
redis_client = redis.Redis(host='localhost', port=6379, db=0)
CACHE_EXPIRATION = 600  # 10 minutes in seconds

async def get_user_by_id(user_id: str):
    """Get user by ID from database"""
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        return user
    except Exception:
        return None

async def insert_user(cookies: str):
    """Insert a new user with their YouTube cookies"""
    user_data = {"cookies": cookies}
    result = await users_collection.insert_one(user_data)
    return str(result.inserted_id)

async def update_user_cookies(user_id: str, cookies: str):
    """Update user cookies in database"""
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"cookies": cookies}}
    )