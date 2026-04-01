#!/usr/bin/env python3

"""
Complete System Test - Backend and Frontend Validation
"""

import requests
import json
import time
import sys
from urllib.parse import urljoin

def test_backend_health():
    """Test backend health endpoint"""
    print("🔍 Testing Backend Health...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:8000")
        print("   Make sure the backend is running with: python -m api.app")
        return False
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_backend_query():
    """Test backend query endpoint"""
    print("\n🧠 Testing Backend Query Processing...")
    
    test_query = "What is Artificial Intelligence?"
    
    try:
        response = requests.post(
            "http://localhost:8000/query",
            json={"query": test_query},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Backend query processed successfully!")
            print(f"   Status: {result.get('status', 'unknown')}")
            
            if 'data' in result:
                data = result['data']
                print(f"   Claims generated: {len(data.get('claims', []))}")
                print(f"   Overall confidence: {data.get('overall_confidence', 0):.2f}")
                print(f"   Risk level: {data.get('risk_level', 'unknown')}")
                
                # Check for required fields
                if 'claims' in data and data['claims']:
                    claim = data['claims'][0]
                    required_fields = ['text', 'confidence', 'uncertainty', 'trust_level']
                    missing_fields = [field for field in required_fields if field not in claim]
                    
                    if missing_fields:
                        print(f"⚠️  Claim missing fields: {missing_fields}")
                    else:
                        print("✅ Claim structure is valid!")
                
                return True
            else:
                print("❌ No data in response")
                return False
                
        else:
            print(f"❌ Backend query failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Backend query timed out (30s)")
        return False
    except Exception as e:
        print(f"❌ Backend query failed: {e}")
        return False

def test_frontend_access():
    """Test if frontend is accessible"""
    print("\n🌐 Testing Frontend Access...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible!")
            print("   Open http://localhost:3000 in your browser")
            return True
        else:
            print(f"❌ Frontend returned status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend at http://localhost:3000")
        print("   Make sure the frontend is running with: npm run dev")
        return False
    except Exception as e:
        print(f"❌ Frontend access failed: {e}")
        return False

def main():
    """Run complete system test"""
    print("🚀 VARA Complete System Test")
    print("=" * 50)
    
    # Test backend
    backend_healthy = test_backend_health()
    
    if backend_healthy:
        # Test backend query
        query_success = test_backend_query()
    else:
        query_success = False
    
    # Test frontend
    frontend_accessible = test_frontend_access()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Backend Health:    {'✅ PASS' if backend_healthy else '❌ FAIL'}")
    print(f"Backend Query:     {'✅ PASS' if query_success else '❌ FAIL'}")
    print(f"Frontend Access:   {'✅ PASS' if frontend_accessible else '❌ FAIL'}")
    
    if backend_healthy and query_success and frontend_accessible:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n📋 NEXT STEPS:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Try this test query: 'What is Artificial Intelligence?'")
        print("3. Explore the interactive reasoning interface")
        print("4. Check the knowledge graph visualization")
        print("5. Examine claim confidence and uncertainty levels")
        return True
    else:
        print("\n❌ SOME TESTS FAILED")
        print("\n🔧 TROUBLESHOOTING:")
        if not backend_healthy:
            print("- Start backend: python -m api.app")
        if not query_success:
            print("- Check backend logs for errors")
        if not frontend_accessible:
            print("- Start frontend: cd frontend && npm run dev")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
