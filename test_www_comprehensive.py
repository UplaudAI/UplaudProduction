#!/usr/bin/env python3
"""
Comprehensive test suite for www. prefix handling in business name derivation.
Tests both the derive_business_name() function and the POST /api/business/profile endpoint.
"""

import requests
import sys
import os

# Add backend to path for unit tests
sys.path.insert(0, '/app/backend')
from server import derive_business_name

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
        return None
    
    data = response.json()
    token = data.get("access_token") or data.get("token")
    return token

def test_unit_derive_business_name():
    """Unit tests for derive_business_name() function"""
    print("\n" + "=" * 80)
    print("UNIT TESTS: derive_business_name() function")
    print("=" * 80)
    
    test_cases = [
        # www. prefix in email domain
        ("user@www.scalis.ai", "Scalis"),
        ("admin@www.acme-corp.com", "Acme Corp"),
        ("test@www.payrewards.com", "Payrewards"),
        ("contact@www.multi-word-company.io", "Multi Word Company"),
        ("info@www.tech-startup.ai", "Tech Startup"),
        ("hello@www.single.com", "Single"),
        ("test@www.two-words.io", "Two Words"),
        
        # Without www. prefix (for comparison)
        ("user@scalis.ai", "Scalis"),
        ("admin@acme-corp.com", "Acme Corp"),
        ("test@payrewards.com", "Payrewards"),
        
        # Edge cases
        ("user@www.a.com", "A"),
        ("user@www.test-test-test.com", "Test Test Test"),
    ]
    
    passed = 0
    failed = 0
    
    for email, expected in test_cases:
        result = derive_business_name(email)
        if result == expected:
            print(f"✅ {email:40s} → {result}")
            passed += 1
        else:
            print(f"❌ {email:40s} → Expected: {expected}, Got: {result}")
            failed += 1
    
    return passed, failed

def test_api_business_profile():
    """API tests for POST /api/business/profile endpoint"""
    print("\n" + "=" * 80)
    print("API TESTS: POST /api/business/profile endpoint")
    print("=" * 80)
    
    token = login()
    if not token:
        print("❌ Login failed - cannot test API")
        return 0, 1
    
    headers = {"Authorization": f"Bearer {token}"}
    
    test_cases = [
        # Various www. prefix formats
        ("www.scalis.ai", "scalis.ai", "Scalis"),
        ("https://www.scalis.ai", "scalis.ai", "Scalis"),
        ("http://www.scalis.ai", "scalis.ai", "Scalis"),
        ("https://www.scalis.ai/", "scalis.ai", "Scalis"),
        
        # Multi-word domains with www.
        ("www.acme-corp.com", "acme-corp.com", "Acme Corp"),
        ("https://www.multi-word-company.io", "multi-word-company.io", "Multi Word Company"),
        ("www.tech-startup.ai", "tech-startup.ai", "Tech Startup"),
        
        # Without www. (for comparison)
        ("scalis.ai", "scalis.ai", "Scalis"),
        ("https://acme-corp.com", "acme-corp.com", "Acme Corp"),
        
        # Edge cases
        ("https://www.a.com/", "a.com", "A"),
        ("www.test-test-test.com", "test-test-test.com", "Test Test Test"),
    ]
    
    passed = 0
    failed = 0
    
    for website_input, expected_website, expected_company in test_cases:
        response = requests.post(
            f"{API_BASE}/business/profile",
            headers=headers,
            json={"website": website_input}
        )
        
        if response.status_code != 200:
            print(f"❌ {website_input:40s} → HTTP {response.status_code}")
            failed += 1
            continue
        
        data = response.json()
        profile = data.get("profile", {})
        actual_website = profile.get("website")
        actual_company = profile.get("company_name")
        
        if actual_website == expected_website and actual_company == expected_company:
            print(f"✅ {website_input:40s} → {actual_website} / {actual_company}")
            passed += 1
        else:
            print(f"❌ {website_input:40s}")
            print(f"   Expected: {expected_website} / {expected_company}")
            print(f"   Got: {actual_website} / {actual_company}")
            failed += 1
    
    return passed, failed

def main():
    print("=" * 80)
    print("COMPREHENSIVE TEST SUITE: www. prefix handling")
    print("=" * 80)
    print("\nTesting that www. prefixed domains work correctly:")
    print("1. derive_business_name() function removes www. from email domains")
    print("2. POST /api/business/profile removes www. from website input")
    print("3. www.scalis.ai correctly derives to 'Scalis'")
    
    # Run unit tests
    unit_passed, unit_failed = test_unit_derive_business_name()
    
    # Run API tests
    api_passed, api_failed = test_api_business_profile()
    
    # Summary
    total_passed = unit_passed + api_passed
    total_failed = unit_failed + api_failed
    total_tests = total_passed + total_failed
    
    print("\n" + "=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    print(f"Unit Tests: {unit_passed}/{unit_passed + unit_failed} passed")
    print(f"API Tests:  {api_passed}/{api_passed + api_failed} passed")
    print(f"TOTAL:      {total_passed}/{total_tests} passed")
    print("=" * 80)
    
    if total_failed > 0:
        print(f"\n❌ {total_failed} test(s) failed")
        sys.exit(1)
    else:
        print(f"\n✅✅✅ ALL TESTS PASSED ✅✅✅")
        print("\nVERIFIED:")
        print("✓ derive_business_name() correctly handles www. prefix in email domains")
        print("✓ POST /api/business/profile correctly handles www. prefix in website input")
        print("✓ www.scalis.ai correctly derives to 'Scalis'")
        print("✓ All variations (http://, https://, trailing slash) work correctly")
        print("✓ Multi-word domains with www. prefix work correctly")
        sys.exit(0)

if __name__ == "__main__":
    main()
