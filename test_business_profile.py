#!/usr/bin/env python3
"""
Test suite for Business Profile endpoints (POST and GET /api/business/profile)
Verifies that endpoints work correctly without MongoDB references
"""

import json
import os
import sys
import requests

from live_test_guard import backend_source_path, require_live_script_environment

# Configuration (this module is collected only after explicit live-test opt-in)
BACKEND_URL = f"{os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')}/api"
ADMIN_EMAIL = "dcameron@payrewards.com"
ADMIN_PASSWORD = os.environ.get("TEST_PASSWORD", "")

def print_test(name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    return passed

def login():
    """Login and get auth token"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            # Try both 'token' and 'access_token' fields
            token = data.get("token") or data.get("access_token")
            if token:
                print(f"✅ Login successful, got token")
                return token
            else:
                print(f"❌ Login response missing token: {data}")
                return None
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_post_business_profile_without_auth():
    """Test POST /api/business/profile without authentication"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/business/profile",
            json={"website": "https://example.com"},
            timeout=10
        )
        return print_test(
            "POST /business/profile without auth returns 401",
            response.status_code == 401,
            f"Status: {response.status_code}"
        )
    except Exception as e:
        return print_test("POST /business/profile without auth", False, f"Error: {e}")

def test_get_business_profile_without_auth():
    """Test GET /api/business/profile without authentication"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/business/profile",
            timeout=10
        )
        return print_test(
            "GET /business/profile without auth returns 401",
            response.status_code == 401,
            f"Status: {response.status_code}"
        )
    except Exception as e:
        return print_test("GET /business/profile without auth", False, f"Error: {e}")

def test_post_business_profile_with_https(token):
    """Test POST /api/business/profile with https:// prefix"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BACKEND_URL}/business/profile",
            json={"website": "https://acme-corp.com"},
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return print_test(
                "POST /business/profile with https://",
                False,
                f"Status: {response.status_code}, Response: {response.text}"
            )
        
        data = response.json()
        profile = data.get("profile", {})
        
        # Verify response structure
        checks = [
            (data.get("status") == "ok", "status is 'ok'"),
            ("profile" in data, "response contains 'profile'"),
            (profile.get("website") == "acme-corp.com", f"website cleaned to 'acme-corp.com' (got: {profile.get('website')})"),
            (profile.get("company_name") == "Acme Corp", f"company_name is 'Acme Corp' (got: {profile.get('company_name')})"),
            (profile.get("brand_color") == "#6d46c6", f"brand_color is '#6d46c6' (got: {profile.get('brand_color')})"),
        ]
        
        all_passed = all(check[0] for check in checks)
        details = ", ".join([check[1] for check in checks if not check[0]]) if not all_passed else "All fields correct"
        
        return print_test(
            "POST /business/profile with https://",
            all_passed,
            details
        )
    except Exception as e:
        return print_test("POST /business/profile with https://", False, f"Error: {e}")

def test_post_business_profile_without_protocol(token):
    """Test POST /api/business/profile without protocol"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BACKEND_URL}/business/profile",
            json={"website": "tech-startup.io"},
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return print_test(
                "POST /business/profile without protocol",
                False,
                f"Status: {response.status_code}, Response: {response.text}"
            )
        
        data = response.json()
        profile = data.get("profile", {})
        
        # Verify response structure
        checks = [
            (data.get("status") == "ok", "status is 'ok'"),
            (profile.get("website") == "tech-startup.io", f"website is 'tech-startup.io' (got: {profile.get('website')})"),
            (profile.get("company_name") == "Tech Startup", f"company_name is 'Tech Startup' (got: {profile.get('company_name')})"),
        ]
        
        all_passed = all(check[0] for check in checks)
        details = ", ".join([check[1] for check in checks if not check[0]]) if not all_passed else "All fields correct"
        
        return print_test(
            "POST /business/profile without protocol",
            all_passed,
            details
        )
    except Exception as e:
        return print_test("POST /business/profile without protocol", False, f"Error: {e}")

def test_post_business_profile_with_trailing_slash(token):
    """Test POST /api/business/profile with trailing slash"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BACKEND_URL}/business/profile",
            json={"website": "https://payrewards.com/"},
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return print_test(
                "POST /business/profile with trailing slash",
                False,
                f"Status: {response.status_code}, Response: {response.text}"
            )
        
        data = response.json()
        profile = data.get("profile", {})
        
        # Verify trailing slash is removed
        checks = [
            (profile.get("website") == "payrewards.com", f"trailing slash removed (got: {profile.get('website')})"),
            (profile.get("company_name") == "Payrewards", f"company_name is 'Payrewards' (got: {profile.get('company_name')})"),
        ]
        
        all_passed = all(check[0] for check in checks)
        details = ", ".join([check[1] for check in checks if not check[0]]) if not all_passed else "Trailing slash removed correctly"
        
        return print_test(
            "POST /business/profile with trailing slash",
            all_passed,
            details
        )
    except Exception as e:
        return print_test("POST /business/profile with trailing slash", False, f"Error: {e}")

def test_get_business_profile(token):
    """Test GET /api/business/profile"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BACKEND_URL}/business/profile",
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return print_test(
                "GET /business/profile",
                False,
                f"Status: {response.status_code}, Response: {response.text}"
            )
        
        data = response.json()
        
        # Verify response structure
        checks = [
            ("website" in data, "response contains 'website'"),
            ("company_name" in data, "response contains 'company_name'"),
            ("brand_color" in data, "response contains 'brand_color'"),
            (data.get("brand_color") == "#6d46c6", f"brand_color is '#6d46c6' (got: {data.get('brand_color')})"),
        ]
        
        all_passed = all(check[0] for check in checks)
        details = ", ".join([check[1] for check in checks if not check[0]]) if not all_passed else f"Profile retrieved: {data.get('company_name')} - {data.get('website')}"
        
        return print_test(
            "GET /business/profile",
            all_passed,
            details
        )
    except Exception as e:
        return print_test("GET /business/profile", False, f"Error: {e}")

def test_business_name_derivation(token):
    """Test business name derivation from various domain formats"""
    test_cases = [
        ("multi-word-company.com", "Multi Word Company"),
        ("single.com", "Single"),
        ("two-words.io", "Two Words"),
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    all_passed = True
    
    for website, expected_name in test_cases:
        try:
            response = requests.post(
                f"{BACKEND_URL}/business/profile",
                json={"website": website},
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                profile = data.get("profile", {})
                actual_name = profile.get("company_name")
                
                if actual_name == expected_name:
                    print(f"   ✅ {website} -> {actual_name}")
                else:
                    print(f"   ❌ {website} -> Expected: {expected_name}, Got: {actual_name}")
                    all_passed = False
            else:
                print(f"   ❌ {website} -> Request failed: {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"   ❌ {website} -> Error: {e}")
            all_passed = False
    
    return print_test(
        "Business name derivation from domains",
        all_passed,
        "All domain formats converted correctly" if all_passed else "Some conversions failed"
    )

def verify_no_mongodb_in_code():
    """Verify that business profile endpoints don't use MongoDB"""
    print("\n🔍 Code Analysis: Checking for MongoDB references in business profile endpoints")
    
    try:
        content = backend_source_path("server.py").read_text()
            
        # Find the business profile endpoints
        post_start = content.find('@api_router.post("/business/profile")')
        get_start = content.find('@api_router.get("/business/profile")')
        
        if post_start == -1 or get_start == -1:
            print("   ❌ Could not find business profile endpoints in code")
            return False
        
        # Extract the endpoint code (approximate - get next 500 chars for each)
        post_code = content[post_start:post_start + 800]
        get_code = content[get_start:get_start + 600]
        
        # Check for MongoDB references (excluding comments)
        # Remove comments first
        post_code_no_comments = '\n'.join([line.split('#')[0] for line in post_code.split('\n')])
        get_code_no_comments = '\n'.join([line.split('#')[0] for line in get_code.split('\n')])
        
        mongodb_keywords = ["db.business", "db.users", "db.sources", "mongodb://", "mongo_client", "collection."]
        
        post_has_mongo = any(keyword in post_code_no_comments.lower() for keyword in mongodb_keywords)
        get_has_mongo = any(keyword in get_code_no_comments.lower() for keyword in mongodb_keywords)
        
        # Check for Airtable references (should be present)
        post_has_airtable = "airtable" in post_code.lower()
        get_has_airtable = "airtable" in get_code.lower()
        
        # Check for explicit "No MongoDB" comments
        post_has_comment = "No MongoDB" in post_code
        get_has_comment = "No MongoDB" in get_code
        
        print(f"   POST /business/profile:")
        print(f"      - MongoDB references: {'❌ FOUND' if post_has_mongo else '✅ NONE'}")
        print(f"      - Airtable usage: {'✅ YES' if post_has_airtable else '❌ NO'}")
        print(f"      - 'No MongoDB' comment: {'✅ YES' if post_has_comment else '⚠️  NO'}")
        
        print(f"   GET /business/profile:")
        print(f"      - MongoDB references: {'❌ FOUND' if get_has_mongo else '✅ NONE'}")
        print(f"      - Airtable usage: {'✅ YES' if get_has_airtable else '❌ NO'}")
        print(f"      - 'No MongoDB' comment: {'✅ YES' if get_has_comment else '⚠️  NO'}")
        
        all_good = (not post_has_mongo and not get_has_mongo and 
                   post_has_airtable and get_has_airtable)
        
        return print_test(
            "No MongoDB references in business profile endpoints",
            all_good,
            "Endpoints use Airtable only" if all_good else "MongoDB references found or Airtable missing"
        )
        
    except Exception as e:
        return print_test("Code analysis", False, f"Error: {e}")

def main():
    require_live_script_environment()
    print("=" * 80)
    print("BUSINESS PROFILE ENDPOINTS TEST SUITE")
    print("Testing POST and GET /api/business/profile")
    print("=" * 80)
    print()
    
    results = []
    
    # Code analysis first
    print("PHASE 1: CODE ANALYSIS")
    print("-" * 80)
    results.append(verify_no_mongodb_in_code())
    print()
    
    # Authentication tests
    print("PHASE 2: AUTHENTICATION TESTS")
    print("-" * 80)
    results.append(test_post_business_profile_without_auth())
    results.append(test_get_business_profile_without_auth())
    print()
    
    # Login
    print("PHASE 3: LOGIN")
    print("-" * 80)
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        sys.exit(1)
    print()
    
    # Functional tests
    print("PHASE 4: FUNCTIONAL TESTS")
    print("-" * 80)
    results.append(test_post_business_profile_with_https(token))
    results.append(test_post_business_profile_without_protocol(token))
    results.append(test_post_business_profile_with_trailing_slash(token))
    results.append(test_get_business_profile(token))
    results.append(test_business_name_derivation(token))
    print()
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {percentage:.1f}%")
    print()
    
    if passed == total:
        print("✅✅✅ ALL TESTS PASSED ✅✅✅")
        print("Business profile endpoints are fully functional without MongoDB references")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        print("Please review the failures above")
        sys.exit(1)

if __name__ == "__main__":
    main()
