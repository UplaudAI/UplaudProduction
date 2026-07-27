#!/usr/bin/env python3
"""
Comprehensive Backend API Testing Suite for Uplaud CRM
Tests all major backend endpoints to ensure full functionality
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime, timezone, timedelta
import jwt

# Configuration
BACKEND_URL = "https://referral-engine-18.preview.emergentagent.com/api"
JWT_SECRET = "uplaud-preview-jwt-secret-8f3a1c9d"
JWT_ALGORITHM = "HS256"

# Test results
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name, details=""):
    print(f"✅ PASS: {test_name}")
    if details:
        print(f"   {details}")
    test_results["passed"].append({"test": test_name, "details": details})

def log_fail(test_name, error):
    print(f"❌ FAIL: {test_name}")
    print(f"   Error: {error}")
    test_results["failed"].append({"test": test_name, "error": str(error)})

def log_warning(test_name, message):
    print(f"⚠️  WARNING: {test_name}")
    print(f"   {message}")
    test_results["warnings"].append({"test": test_name, "message": message})

def create_test_token(email="test@acme-corp.com", user_id="test-user-123"):
    """Create a local JWT token for testing"""
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def test_root_endpoint():
    """Test 1: Root endpoint should return API info"""
    print("\n" + "="*80)
    print("TEST 1: Root Endpoint")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[1.1] Testing GET /api/...")
            response = await client.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    log_pass("Root endpoint", f"Message: {data.get('message')}")
                else:
                    log_fail("Root endpoint", f"Response missing 'message' field: {data}")
            else:
                log_fail("Root endpoint", f"Status: {response.status_code}, Body: {response.text}")
                
    except Exception as e:
        log_fail("Root endpoint test", str(e))

async def test_blog_endpoints():
    """Test 2: Blog endpoints (public access)"""
    print("\n" + "="*80)
    print("TEST 2: Blog Endpoints")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test 2.1: List blog posts
            print("\n[2.1] Testing GET /api/blog...")
            response = await client.get(f"{BACKEND_URL}/blog")
            
            if response.status_code == 200:
                data = response.json()
                if "posts" in data:
                    log_pass("List blog posts", f"Returned {len(data.get('posts', []))} posts")
                else:
                    log_fail("List blog posts", f"Response missing 'posts' field: {data}")
            else:
                log_fail("List blog posts", f"Status: {response.status_code}, Body: {response.text}")
            
            # Test 2.2: Get specific blog post (will likely 404 but should not error)
            print("\n[2.2] Testing GET /api/blog/{slug}...")
            response = await client.get(f"{BACKEND_URL}/blog/test-slug")
            
            if response.status_code in [200, 404]:
                log_pass("Get blog post by slug", f"Status: {response.status_code} (expected)")
            else:
                log_fail("Get blog post by slug", f"Unexpected status: {response.status_code}")
                
    except Exception as e:
        log_fail("Blog endpoints test", str(e))

async def test_sources_endpoints():
    """Test 3: Sources endpoints (requires authentication)"""
    print("\n" + "="*80)
    print("TEST 3: Sources Endpoints")
    print("="*80)
    
    try:
        token = create_test_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test 3.1: List sources
            print("\n[3.1] Testing GET /api/sources...")
            response = await client.get(f"{BACKEND_URL}/sources", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    log_pass("List sources", f"Returned {len(data)} sources")
                else:
                    log_fail("List sources", f"Expected list, got: {type(data)}")
            else:
                log_fail("List sources", f"Status: {response.status_code}, Body: {response.text}")
            
            # Test 3.2: Get non-existent source (should 404)
            print("\n[3.2] Testing GET /api/sources/{id} (non-existent)...")
            response = await client.get(f"{BACKEND_URL}/sources/non-existent-id", headers=headers)
            
            if response.status_code == 404:
                log_pass("Get non-existent source", "Correctly returned 404")
            else:
                log_fail("Get non-existent source", f"Expected 404, got {response.status_code}")
                
    except Exception as e:
        log_fail("Sources endpoints test", str(e))

async def test_testimonials_endpoint():
    """Test 4: Testimonials endpoint (requires authentication)"""
    print("\n" + "="*80)
    print("TEST 4: Testimonials Endpoint")
    print("="*80)
    
    try:
        token = create_test_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[4.1] Testing GET /api/testimonials...")
            response = await client.get(f"{BACKEND_URL}/testimonials", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                log_pass("Get testimonials", f"Status: 200, Response type: {type(data)}")
            else:
                log_fail("Get testimonials", f"Status: {response.status_code}, Body: {response.text}")
                
    except Exception as e:
        log_fail("Testimonials endpoint test", str(e))

async def test_warm_leads_endpoint():
    """Test 5: Warm leads endpoint (requires authentication)"""
    print("\n" + "="*80)
    print("TEST 5: Warm Leads Endpoint")
    print("="*80)
    
    try:
        token = create_test_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[5.1] Testing GET /api/warm-leads...")
            response = await client.get(f"{BACKEND_URL}/warm-leads", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "leads" in data and "business_name" in data:
                    log_pass("Get warm leads", f"Business: {data.get('business_name')}, Leads: {len(data.get('leads', []))}")
                else:
                    log_fail("Get warm leads", f"Missing expected fields: {list(data.keys())}")
            else:
                log_fail("Get warm leads", f"Status: {response.status_code}, Body: {response.text}")
                
    except Exception as e:
        log_fail("Warm leads endpoint test", str(e))

async def test_public_testimonial_endpoint():
    """Test 6: Public testimonial endpoint (no auth required)"""
    print("\n" + "="*80)
    print("TEST 6: Public Testimonial Endpoint")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[6.1] Testing GET /api/public/testimonial/{share_id} (non-existent)...")
            response = await client.get(f"{BACKEND_URL}/public/testimonial/test-share-id")
            
            if response.status_code == 404:
                log_pass("Get public testimonial (non-existent)", "Correctly returned 404")
            elif response.status_code == 200:
                log_pass("Get public testimonial", "Endpoint accessible")
            else:
                log_fail("Get public testimonial", f"Unexpected status: {response.status_code}")
                
    except Exception as e:
        log_fail("Public testimonial endpoint test", str(e))

async def test_social_generate_endpoint():
    """Test 7: Social generate endpoint (no auth required)"""
    print("\n" + "="*80)
    print("TEST 7: Social Generate Endpoint")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[7.1] Testing POST /api/social/generate...")
            
            # Test with minimal valid payload
            payload = {
                "testimonial": "This product has been amazing for our team. We've seen great results.",
                "attribution": "John Doe, CEO at Acme Corp",
                "company": "TestCompany",
                "pov": "company",
                "channels": ["linkedin"],
                "tone": "professional"
            }
            
            response = await client.post(f"{BACKEND_URL}/social/generate", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "channels" in data and "pov" in data:
                    log_pass("Social generate", f"Generated content for {len(data.get('channels', {}))} channels")
                else:
                    log_fail("Social generate", f"Missing expected fields: {list(data.keys())}")
            elif response.status_code == 503:
                log_warning("Social generate", "OpenAI API key not configured (expected in test environment)")
            else:
                log_fail("Social generate", f"Status: {response.status_code}, Body: {response.text}")
            
            # Test 7.2: Test with missing testimonial (should fail)
            print("\n[7.2] Testing POST /api/social/generate with missing testimonial...")
            payload_invalid = {
                "attribution": "John Doe",
                "company": "TestCompany"
            }
            
            response = await client.post(f"{BACKEND_URL}/social/generate", json=payload_invalid)
            
            if response.status_code == 400:
                log_pass("Social generate validation", "Correctly rejected missing testimonial")
            else:
                log_fail("Social generate validation", f"Expected 400, got {response.status_code}")
                
    except Exception as e:
        log_fail("Social generate endpoint test", str(e))

async def test_events_log_endpoint():
    """Test 8: Events log endpoint (no auth required)"""
    print("\n" + "="*80)
    print("TEST 8: Events Log Endpoint")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[8.1] Testing POST /api/events/log...")
            
            payload = {
                "event": "test_event",
                "page": "test_page",
                "share_id": "test-share-id",
                "details": "Test event details"
            }
            
            response = await client.post(f"{BACKEND_URL}/events/log", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") == True:
                    log_pass("Events log", "Event logged successfully")
                else:
                    log_fail("Events log", f"Unexpected response: {data}")
            else:
                log_fail("Events log", f"Status: {response.status_code}, Body: {response.text}")
                
    except Exception as e:
        log_fail("Events log endpoint test", str(e))

async def test_cors_headers():
    """Test 9: CORS headers should be present"""
    print("\n" + "="*80)
    print("TEST 9: CORS Headers")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[9.1] Testing CORS headers on root endpoint...")
            response = await client.get(f"{BACKEND_URL}/")
            
            cors_headers = {
                "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
                "access-control-allow-credentials": response.headers.get("access-control-allow-credentials"),
            }
            
            if cors_headers["access-control-allow-origin"]:
                log_pass("CORS headers", f"CORS enabled: {cors_headers['access-control-allow-origin']}")
            else:
                log_warning("CORS headers", "CORS headers not found (may be configured at proxy level)")
                
    except Exception as e:
        log_fail("CORS headers test", str(e))

async def test_error_handling():
    """Test 10: Error handling for invalid requests"""
    print("\n" + "="*80)
    print("TEST 10: Error Handling")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test 10.1: Invalid endpoint
            print("\n[10.1] Testing invalid endpoint...")
            response = await client.get(f"{BACKEND_URL}/invalid-endpoint-xyz")
            
            if response.status_code == 404:
                log_pass("Invalid endpoint handling", "Correctly returned 404")
            else:
                log_fail("Invalid endpoint handling", f"Expected 404, got {response.status_code}")
            
            # Test 10.2: Invalid JSON payload
            print("\n[10.2] Testing invalid JSON payload...")
            response = await client.post(
                f"{BACKEND_URL}/auth/login",
                content="invalid json{{{",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [400, 422]:
                log_pass("Invalid JSON handling", f"Correctly returned {response.status_code}")
            else:
                log_fail("Invalid JSON handling", f"Expected 400/422, got {response.status_code}")
                
    except Exception as e:
        log_fail("Error handling test", str(e))

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    total_tests = len(test_results["passed"]) + len(test_results["failed"])
    print(f"\nTotal Tests: {total_tests}")
    print(f"✅ Passed: {len(test_results['passed'])}")
    print(f"❌ Failed: {len(test_results['failed'])}")
    print(f"⚠️  Warnings: {len(test_results['warnings'])}")
    
    if test_results["failed"]:
        print("\n" + "-"*80)
        print("FAILED TESTS:")
        print("-"*80)
        for failure in test_results["failed"]:
            print(f"\n❌ {failure['test']}")
            print(f"   Error: {failure['error']}")
    
    if test_results["warnings"]:
        print("\n" + "-"*80)
        print("WARNINGS:")
        print("-"*80)
        for warning in test_results["warnings"]:
            print(f"\n⚠️  {warning['test']}")
            print(f"   {warning['message']}")
    
    print("\n" + "="*80)
    print("COMPREHENSIVE BACKEND TESTING COMPLETE")
    print("="*80)
    
    # Return exit code
    return 0 if len(test_results["failed"]) == 0 else 1

async def main():
    """Run all comprehensive backend tests"""
    print("="*80)
    print("UPLAUD CRM - COMPREHENSIVE BACKEND TEST SUITE")
    print("="*80)
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now(timezone.utc).isoformat()}")
    print(f"Testing: All major backend API endpoints")
    
    # Run all tests
    await test_root_endpoint()
    await test_blog_endpoints()
    await test_sources_endpoints()
    await test_testimonials_endpoint()
    await test_warm_leads_endpoint()
    await test_public_testimonial_endpoint()
    await test_social_generate_endpoint()
    await test_events_log_endpoint()
    await test_cors_headers()
    await test_error_handling()
    
    # Print summary
    exit_code = print_summary()
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())
