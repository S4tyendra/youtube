import motor.motor_asyncio
from bson import ObjectId

# Database connection
client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client["testdb"]
users_collection = db["users"]

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