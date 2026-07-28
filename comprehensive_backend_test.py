#!/usr/bin/env python3
"""
Comprehensive Backend Testing Suite for Uplaud CRM
Tests all backend endpoints including new business profile routes
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime, timezone

from live_test_guard import require_live_script_environment

# Configuration (this module is collected only after explicit live-test opt-in)
BACKEND_URL = f"{os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')}/api"

# Test credentials from test_credentials.md
ADMIN_EMAIL = "dcameron@payrewards.com"
ADMIN_PASSWORD = os.environ.get("TEST_PASSWORD", "")

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

async def test_authentication():
    """Test 1: Authentication and get token"""
    print("\n" + "="*80)
    print("TEST 1: Authentication")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[1.1] Testing /api/auth/login...")
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                token = login_data.get("token")
                user = login_data.get("user")
                
                if token and user:
                    log_pass("Authentication successful", 
                            f"User: {user.get('email')}, Role: {user.get('role')}")
                    return token
                else:
                    log_fail("Authentication response", "Missing token or user in response")
                    return None
            else:
                log_fail("Authentication", 
                        f"Status: {login_response.status_code}, Body: {login_response.text}")
                return None
                
    except Exception as e:
        log_fail("Authentication test", str(e))
        return None

async def test_auth_me(token):
    """Test 2: Get current user"""
    print("\n" + "="*80)
    print("TEST 2: Get Current User (/api/auth/me)")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[2.1] Testing /api/auth/me...")
            me_response = await client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if me_response.status_code == 200:
                me_data = me_response.json()
                log_pass("Get current user", 
                        f"User: {me_data.get('email')}, Company: {me_data.get('company')}")
                return True
            else:
                log_fail("Get current user", 
                        f"Status: {me_response.status_code}, Body: {me_response.text}")
                return False
                
    except Exception as e:
        log_fail("Get current user test", str(e))
        return False

async def test_business_profile_post(token):
    """Test 3: POST /api/business/profile - Save business profile"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/business/profile - Save Business Profile")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test with a realistic website
            test_website = "https://payrewards.com"
            
            print(f"\n[3.1] Testing POST /api/business/profile with website: {test_website}...")
            profile_response = await client.post(
                f"{BACKEND_URL}/business/profile",
                headers={"Authorization": f"Bearer {token}"},
                json={"website": test_website}
            )
            
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                status = profile_data.get("status")
                profile = profile_data.get("profile")
                
                if status == "ok" and profile:
                    company_name = profile.get("company_name")
                    website = profile.get("website")
                    brand_color = profile.get("brand_color")
                    
                    log_pass("Save business profile", 
                            f"Status: {status}, Company: {company_name}, Website: {website}, Brand Color: {brand_color}")
                    return True
                else:
                    log_fail("Save business profile response", 
                            f"Missing expected fields. Response: {profile_data}")
                    return False
            else:
                log_fail("Save business profile", 
                        f"Status: {profile_response.status_code}, Body: {profile_response.text}")
                return False
                
    except Exception as e:
        log_fail("Save business profile test", str(e))
        return False

async def test_business_profile_get(token):
    """Test 4: GET /api/business/profile - Retrieve business profile"""
    print("\n" + "="*80)
    print("TEST 4: GET /api/business/profile - Retrieve Business Profile")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[4.1] Testing GET /api/business/profile...")
            profile_response = await client.get(
                f"{BACKEND_URL}/business/profile",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if profile_response.status_code == 200:
                profile = profile_response.json()
                
                # Check required fields
                required_fields = ["user_id", "website", "company_name", "brand_color"]
                missing_fields = [field for field in required_fields if field not in profile]
                
                if not missing_fields:
                    log_pass("Retrieve business profile", 
                            f"Company: {profile.get('company_name')}, Website: {profile.get('website')}, Brand Color: {profile.get('brand_color')}")
                    return True
                else:
                    log_fail("Retrieve business profile", 
                            f"Missing required fields: {missing_fields}. Profile: {profile}")
                    return False
            else:
                log_fail("Retrieve business profile", 
                        f"Status: {profile_response.status_code}, Body: {profile_response.text}")
                return False
                
    except Exception as e:
        log_fail("Retrieve business profile test", str(e))
        return False

async def test_business_profile_update(token):
    """Test 5: POST /api/business/profile - Update business profile with different website"""
    print("\n" + "="*80)
    print("TEST 5: POST /api/business/profile - Update Business Profile")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test with a different website
            test_website = "acme-corp.com"
            
            print(f"\n[5.1] Testing POST /api/business/profile with updated website: {test_website}...")
            profile_response = await client.post(
                f"{BACKEND_URL}/business/profile",
                headers={"Authorization": f"Bearer {token}"},
                json={"website": test_website}
            )
            
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                profile = profile_data.get("profile")
                
                if profile:
                    company_name = profile.get("company_name")
                    website = profile.get("website")
                    
                    # Verify business name derivation
                    expected_name = "Acme Corp"
                    if company_name == expected_name and website == test_website:
                        log_pass("Update business profile", 
                                f"Company name correctly derived: {company_name}, Website: {website}")
                        return True
                    else:
                        log_warning("Update business profile", 
                                  f"Company name: {company_name} (expected: {expected_name}), Website: {website}")
                        return True
                else:
                    log_fail("Update business profile response", 
                            f"Missing profile in response. Response: {profile_data}")
                    return False
            else:
                log_fail("Update business profile", 
                        f"Status: {profile_response.status_code}, Body: {profile_response.text}")
                return False
                
    except Exception as e:
        log_fail("Update business profile test", str(e))
        return False

async def test_sources_endpoint(token):
    """Test 6: GET /api/sources - List sources"""
    print("\n" + "="*80)
    print("TEST 6: GET /api/sources - List Sources")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[6.1] Testing GET /api/sources...")
            sources_response = await client.get(
                f"{BACKEND_URL}/sources",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if sources_response.status_code == 200:
                sources = sources_response.json()
                log_pass("List sources", 
                        f"Retrieved {len(sources)} sources")
                return True
            else:
                log_fail("List sources", 
                        f"Status: {sources_response.status_code}, Body: {sources_response.text}")
                return False
                
    except Exception as e:
        log_fail("List sources test", str(e))
        return False

async def test_testimonials_endpoint(token):
    """Test 7: GET /api/testimonials - List testimonials"""
    print("\n" + "="*80)
    print("TEST 7: GET /api/testimonials - List Testimonials")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[7.1] Testing GET /api/testimonials...")
            testimonials_response = await client.get(
                f"{BACKEND_URL}/testimonials",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if testimonials_response.status_code == 200:
                testimonials = testimonials_response.json()
                log_pass("List testimonials", 
                        f"Retrieved {len(testimonials)} testimonials")
                return True
            else:
                log_fail("List testimonials", 
                        f"Status: {testimonials_response.status_code}, Body: {testimonials_response.text}")
                return False
                
    except Exception as e:
        log_fail("List testimonials test", str(e))
        return False

async def test_warm_leads_endpoint(token):
    """Test 8: GET /api/warm-leads - List warm leads"""
    print("\n" + "="*80)
    print("TEST 8: GET /api/warm-leads - List Warm Leads")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[8.1] Testing GET /api/warm-leads...")
            leads_response = await client.get(
                f"{BACKEND_URL}/warm-leads",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if leads_response.status_code == 200:
                leads = leads_response.json()
                log_pass("List warm leads", 
                        f"Retrieved {len(leads)} warm leads")
                return True
            else:
                log_fail("List warm leads", 
                        f"Status: {leads_response.status_code}, Body: {leads_response.text}")
                return False
                
    except Exception as e:
        log_fail("List warm leads test", str(e))
        return False

async def test_root_endpoint():
    """Test 9: GET / - Root endpoint (no auth required)"""
    print("\n" + "="*80)
    print("TEST 9: GET /api/ - Root Endpoint")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[9.1] Testing GET /api/...")
            root_response = await client.get(f"{BACKEND_URL}/")
            
            if root_response.status_code == 200:
                root_data = root_response.json()
                log_pass("Root endpoint", 
                        f"Response: {root_data}")
                return True
            else:
                log_fail("Root endpoint", 
                        f"Status: {root_response.status_code}, Body: {root_response.text}")
                return False
                
    except Exception as e:
        log_fail("Root endpoint test", str(e))
        return False

async def test_invalid_auth():
    """Test 10: Test invalid authentication"""
    print("\n" + "="*80)
    print("TEST 10: Invalid Authentication Handling")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[10.1] Testing /api/auth/me with invalid token...")
            me_response = await client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": "Bearer invalid.token.here"}
            )
            
            if me_response.status_code == 401:
                log_pass("Invalid token handling", 
                        "Correctly returned 401 for invalid token")
                return True
            else:
                log_fail("Invalid token handling", 
                        f"Expected 401, got {me_response.status_code}")
                return False
                
    except Exception as e:
        log_fail("Invalid authentication test", str(e))
        return False

async def test_missing_auth():
    """Test 11: Test missing authentication"""
    print("\n" + "="*80)
    print("TEST 11: Missing Authentication Handling")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[11.1] Testing /api/auth/me without Authorization header...")
            me_response = await client.get(f"{BACKEND_URL}/auth/me")
            
            if me_response.status_code == 401:
                log_pass("Missing auth header handling", 
                        "Correctly returned 401 for missing Authorization header")
                return True
            else:
                log_fail("Missing auth header handling", 
                        f"Expected 401, got {me_response.status_code}")
                return False
                
    except Exception as e:
        log_fail("Missing authentication test", str(e))
        return False

async def test_business_profile_without_auth():
    """Test 12: Test business profile endpoints without authentication"""
    print("\n" + "="*80)
    print("TEST 12: Business Profile Endpoints Without Authentication")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[12.1] Testing GET /api/business/profile without auth...")
            get_response = await client.get(f"{BACKEND_URL}/business/profile")
            
            if get_response.status_code == 401:
                log_pass("Business profile GET without auth", 
                        "Correctly returned 401 for missing authentication")
            else:
                log_fail("Business profile GET without auth", 
                        f"Expected 401, got {get_response.status_code}")
            
            print("\n[12.2] Testing POST /api/business/profile without auth...")
            post_response = await client.post(
                f"{BACKEND_URL}/business/profile",
                json={"website": "test.com"}
            )
            
            if post_response.status_code == 401:
                log_pass("Business profile POST without auth", 
                        "Correctly returned 401 for missing authentication")
                return True
            else:
                log_fail("Business profile POST without auth", 
                        f"Expected 401, got {post_response.status_code}")
                return False
                
    except Exception as e:
        log_fail("Business profile without auth test", str(e))
        return False

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
    """Run all backend tests"""
    require_live_script_environment()
    print("="*80)
    print("UPLAUD CRM - COMPREHENSIVE BACKEND TEST SUITE")
    print("="*80)
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now(timezone.utc).isoformat()}")
    print(f"Testing: All backend endpoints including new business profile routes")
    
    # Test 1: Authentication (get token)
    token = await test_authentication()
    
    if not token:
        print("\n❌ CRITICAL: Authentication failed. Cannot proceed with authenticated tests.")
        print_summary()
        sys.exit(1)
    
    # Test 2-8: Authenticated endpoints
    await test_auth_me(token)
    await test_business_profile_post(token)
    await test_business_profile_get(token)
    await test_business_profile_update(token)
    await test_sources_endpoint(token)
    await test_testimonials_endpoint(token)
    await test_warm_leads_endpoint(token)
    
    # Test 9: Root endpoint (no auth)
    await test_root_endpoint()
    
    # Test 10-12: Error handling
    await test_invalid_auth()
    await test_missing_auth()
    await test_business_profile_without_auth()
    
    # Print summary
    exit_code = print_summary()
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())
