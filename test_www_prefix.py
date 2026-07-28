#!/usr/bin/env python3
"""
Test suite to verify business name derivation and website profile posting
work correctly with www. prefixed domains.

Specifically testing:
1. derive_business_name() function handles www. prefix in email domains
2. POST /api/business/profile handles www. prefix in website field
3. www.scalis.ai correctly derives to "Scalis"
"""

import requests
import sys
import os

# Backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "https://crm-preview-build-2.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "dcameron@payrewards.com"
ADMIN_PASSWORD = "P@yRew@rds123"

def login():
    """Login and get auth token"""
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None
    
    data = response.json()
    # Try both 'access_token' and 'token' keys
    token = data.get("access_token") or data.get("token")
    if not token:
        print(f"❌ No access token in response: {data}")
        return None
    
    print(f"✅ Login successful")
    return token

def test_business_profile_with_www_prefix(token):
    """Test POST /api/business/profile with www. prefixed domains"""
    headers = {"Authorization": f"Bearer {token}"}
    
    test_cases = [
        {
            "input": "www.scalis.ai",
            "expected_website": "scalis.ai",
            "expected_company": "Scalis",
            "description": "www.scalis.ai should derive to Scalis"
        },
        {
            "input": "https://www.scalis.ai",
            "expected_website": "scalis.ai",
            "expected_company": "Scalis",
            "description": "https://www.scalis.ai should derive to Scalis"
        },
        {
            "input": "https://www.acme-corp.com",
            "expected_website": "acme-corp.com",
            "expected_company": "Acme Corp",
            "description": "https://www.acme-corp.com should derive to Acme Corp"
        },
        {
            "input": "www.payrewards.com",
            "expected_website": "payrewards.com",
            "expected_company": "Payrewards",
            "description": "www.payrewards.com should derive to Payrewards"
        },
        {
            "input": "https://www.multi-word-company.io",
            "expected_website": "multi-word-company.io",
            "expected_company": "Multi Word Company",
            "description": "https://www.multi-word-company.io should derive to Multi Word Company"
        },
        {
            "input": "www.tech-startup.ai/",
            "expected_website": "tech-startup.ai",
            "expected_company": "Tech Startup",
            "description": "www.tech-startup.ai/ (with trailing slash) should derive to Tech Startup"
        },
    ]
    
    passed = 0
    failed = 0
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['description']}")
        print(f"   Input: {test_case['input']}")
        
        response = requests.post(
            f"{API_BASE}/business/profile",
            headers=headers,
            json={"website": test_case["input"]}
        )
        
        if response.status_code != 200:
            print(f"   ❌ FAILED: HTTP {response.status_code} - {response.text}")
            failed += 1
            continue
        
        data = response.json()
        profile = data.get("profile", {})
        
        actual_website = profile.get("website")
        actual_company = profile.get("company_name")
        
        # Check website field
        if actual_website != test_case["expected_website"]:
            print(f"   ❌ FAILED: Website mismatch")
            print(f"      Expected: {test_case['expected_website']}")
            print(f"      Got: {actual_website}")
            failed += 1
            continue
        
        # Check company name
        if actual_company != test_case["expected_company"]:
            print(f"   ❌ FAILED: Company name mismatch")
            print(f"      Expected: {test_case['expected_company']}")
            print(f"      Got: {actual_company}")
            failed += 1
            continue
        
        print(f"   ✅ PASSED")
        print(f"      Website: {actual_website}")
        print(f"      Company: {actual_company}")
        passed += 1
    
    return passed, failed

def test_get_business_profile(token):
    """Test GET /api/business/profile returns the saved profile"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🧪 Testing: GET /api/business/profile")
    
    response = requests.get(
        f"{API_BASE}/business/profile",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"   ❌ FAILED: HTTP {response.status_code} - {response.text}")
        return 0, 1
    
    data = response.json()
    print(f"   ✅ PASSED")
    print(f"      Website: {data.get('website')}")
    print(f"      Company: {data.get('company_name')}")
    print(f"      Brand Color: {data.get('brand_color')}")
    
    return 1, 0

def main():
    print("=" * 80)
    print("Testing www. prefix handling in business name derivation")
    print("=" * 80)
    
    # Login
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        sys.exit(1)
    
    # Test POST /api/business/profile with www. prefixed domains
    passed_post, failed_post = test_business_profile_with_www_prefix(token)
    
    # Test GET /api/business/profile
    passed_get, failed_get = test_get_business_profile(token)
    
    # Summary
    total_passed = passed_post + passed_get
    total_failed = failed_post + failed_get
    total_tests = total_passed + total_failed
    
    print("\n" + "=" * 80)
    print(f"SUMMARY: {total_passed}/{total_tests} tests passed")
    print("=" * 80)
    
    if total_failed > 0:
        print(f"❌ {total_failed} test(s) failed")
        sys.exit(1)
    else:
        print(f"✅ All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
