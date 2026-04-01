#!/usr/bin/env python3

"""
Direct API Test to verify backend is working
"""

import requests
import json

def test_api():
    """Test the API directly"""
    print("🔍 Testing API directly...")
    
    # Test health endpoint
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"✅ Health endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
        return False
    
    # Test query endpoint
    try:
        query_data = {"query": "What is Artificial Intelligence?"}
        response = requests.post(
            "http://localhost:8000/query",
            json=query_data,
            timeout=10
        )
        print(f"✅ Query endpoint: {response.status_code}")
        result = response.json()
        print(f"   Status: {result.get('status')}")
        print(f"   Claims: {len(result.get('data', {}).get('claims', []))}")
        print(f"   Overall confidence: {result.get('data', {}).get('overall_confidence', 0):.2f}")
        return True
    except Exception as e:
        print(f"❌ Query endpoint failed: {e}")
        return False

if __name__ == "__main__":
    test_api()
