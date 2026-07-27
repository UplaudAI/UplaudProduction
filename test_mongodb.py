#!/usr/bin/env python3
"""Test MongoDB connectivity"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongodb():
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        db = client['test_database']
        result = await db.command('ping')
        print(f"✅ MongoDB connection successful: {result}")
        
        # Test collections
        collections = await db.list_collection_names()
        print(f"✅ Available collections: {collections}")
        
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_mongodb())
    exit(0 if success else 1)
