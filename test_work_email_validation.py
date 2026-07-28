#!/usr/bin/env python3
"""
Work Email Validation and Business Name Derivation Testing Suite
Tests that:
1. Valid work emails are accepted
2. Personal email domains (gmail.com, yahoo.com, etc.) are rejected with 400 Bad Request
3. Business/company name is derived correctly from work email domain
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime, timezone, timedelta
import jwt

# Configuration (this module is collected only after explicit live-test opt-in)
BACKEND_URL = f"{os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')}/api"
JWT_SECRET = os.environ.get("TEST_JWT_SECRET", "")
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

async def test_personal_email_rejection_login():
    """Test 1: Personal email domains should be rejected with 400 at login"""
    print("\n" + "="*80)
    print("TEST 1: Personal Email Rejection at Login")
    print("="*80)
    
    personal_domains = [
        "test@gmail.com",
        "user@yahoo.com",
        "person@hotmail.com",
        "someone@outlook.com",
        "user@aol.com",
        "test@icloud.com",
        "user@protonmail.com"
    ]
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for email in personal_domains:
                print(f"\n[1.{personal_domains.index(email)+1}] Testing login with {email}...")
                login_response = await client.post(
                    f"{BACKEND_URL}/auth/login",
                    json={"email": email, "password": "TestPassword123"}
                )
                
                if login_response.status_code == 400:
                    response_data = login_response.json()
                    detail = response_data.get("detail", "")
                    if "personal email" in detail.lower() or "work email" in detail.lower():
                        log_pass(f"Personal email rejection: {email}", 
                                f"Correctly returned 400 with message: {detail}")
                    else:
                        log_fail(f"Personal email rejection: {email}", 
                                f"Got 400 but wrong message: {detail}")
                else:
                    log_fail(f"Personal email rejection: {email}", 
                            f"Expected 400, got {login_response.status_code}. Body: {login_response.text}")
                    
    except Exception as e:
        log_fail("Personal email rejection at login test", str(e))

async def test_work_email_acceptance():
    """Test 2: Valid work emails should be accepted (even if user doesn't exist in Supabase)"""
    print("\n" + "="*80)
    print("TEST 2: Work Email Acceptance")
    print("="*80)
    
    work_emails = [
        "john@acme-corp.com",
        "sarah@tech-startup.io",
        "admin@my-company.net",
        "user@business-name.co",
        "test@example-business.org"
    ]
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for email in work_emails:
                print(f"\n[2.{work_emails.index(email)+1}] Testing login with {email}...")
                login_response = await client.post(
                    f"{BACKEND_URL}/auth/login",
                    json={"email": email, "password": "TestPassword123"}
                )
                
                # Work email should NOT return 400 for personal email
                # It may return 401 (invalid credentials) or 502 (Supabase error) but NOT 400 for personal email
                if login_response.status_code == 400:
                    response_data = login_response.json()
                    detail = response_data.get("detail", "")
                    if "personal email" in detail.lower() or "work email" in detail.lower():
                        log_fail(f"Work email acceptance: {email}", 
                                f"Work email incorrectly rejected as personal: {detail}")
                    else:
                        # 400 for other reasons is acceptable
                        log_pass(f"Work email not rejected as personal: {email}", 
                                f"Got 400 but not for personal email reason: {detail}")
                elif login_response.status_code in [401, 502]:
                    # Expected - user doesn't exist in Supabase or auth failed
                    log_pass(f"Work email accepted (not rejected as personal): {email}", 
                            f"Got {login_response.status_code} (expected - user doesn't exist)")
                else:
                    log_warning(f"Work email test: {email}", 
                              f"Unexpected status code: {login_response.status_code}")
                    
    except Exception as e:
        log_fail("Work email acceptance test", str(e))

async def test_business_name_derivation():
    """Test 3: Business name should be derived correctly from email domain"""
    print("\n" + "="*80)
    print("TEST 3: Business Name Derivation")
    print("="*80)
    
    test_cases = [
        ("user@acme-corp.com", "Acme Corp"),
        ("admin@tech-startup.io", "Tech Startup"),
        ("john@my-company.net", "My Company"),
        ("sarah@example-business.org", "Example Business"),
        ("test@single.com", "Single"),
        ("user@multi-word-company.com", "Multi Word Company"),
        ("admin@payrewards.com", "Payrewards")
    ]
    
    print("\n[3.1] Testing business name derivation logic...")
    
    # Import the function directly from server.py
    try:
        sys.path.insert(0, '/app/backend')
        from server import derive_business_name
        
        for email, expected_name in test_cases:
            derived_name = derive_business_name(email)
            if derived_name == expected_name:
                log_pass(f"Business name derivation: {email}", 
                        f"Correctly derived '{derived_name}'")
            else:
                log_fail(f"Business name derivation: {email}", 
                        f"Expected '{expected_name}', got '{derived_name}'")
                
    except Exception as e:
        log_fail("Business name derivation test", str(e))

async def test_work_email_validation_with_local_jwt():
    """Test 4: Work email validation in get_current_user with local JWT tokens"""
    print("\n" + "="*80)
    print("TEST 4: Work Email Validation with Local JWT Tokens")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test 4.1: Create a local JWT with personal email
            print("\n[4.1] Testing get_current_user with personal email in JWT...")
            personal_payload = {
                "sub": "test-user-id",
                "email": "test@gmail.com",
                "type": "access",
                "exp": datetime.now(timezone.utc) + timedelta(hours=1)
            }
            personal_token = jwt.encode(personal_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            me_response = await client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": f"Bearer {personal_token}"}
            )
            
            if me_response.status_code == 400:
                response_data = me_response.json()
                detail = response_data.get("detail", "")
                if "personal email" in detail.lower() or "work email" in detail.lower():
                    log_pass("Personal email rejection in get_current_user", 
                            f"Correctly returned 400 with message: {detail}")
                else:
                    log_fail("Personal email rejection in get_current_user", 
                            f"Got 400 but wrong message: {detail}")
            else:
                log_fail("Personal email rejection in get_current_user", 
                        f"Expected 400, got {me_response.status_code}. Body: {me_response.text}")
            
            # Test 4.2: Create a local JWT with work email
            print("\n[4.2] Testing get_current_user with work email in JWT...")
            work_payload = {
                "sub": "test-user-id",
                "email": "john@acme-corp.com",
                "type": "access",
                "exp": datetime.now(timezone.utc) + timedelta(hours=1)
            }
            work_token = jwt.encode(work_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            me_response = await client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": f"Bearer {work_token}"}
            )
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                email = user_data.get("email")
                company = user_data.get("company")
                
                if email == "john@acme-corp.com":
                    log_pass("Work email acceptance in get_current_user", 
                            f"Work email accepted: {email}")
                    
                    if company == "Acme Corp":
                        log_pass("Business name derivation in get_current_user", 
                                f"Correctly derived company name: {company}")
                    else:
                        log_fail("Business name derivation in get_current_user", 
                                f"Expected 'Acme Corp', got '{company}'")
                else:
                    log_fail("Work email in get_current_user", 
                            f"Expected email 'john@acme-corp.com', got '{email}'")
            elif me_response.status_code == 400:
                response_data = me_response.json()
                detail = response_data.get("detail", "")
                if "personal email" in detail.lower() or "work email" in detail.lower():
                    log_fail("Work email acceptance in get_current_user", 
                            f"Work email incorrectly rejected: {detail}")
                else:
                    log_warning("Work email test in get_current_user", 
                              f"Got 400 but not for personal email: {detail}")
            else:
                log_warning("Work email test in get_current_user", 
                          f"Unexpected status code: {me_response.status_code}")
                    
    except Exception as e:
        log_fail("Work email validation with local JWT test", str(e))

async def test_is_work_email_function():
    """Test 5: Test is_work_email function directly"""
    print("\n" + "="*80)
    print("TEST 5: is_work_email Function Unit Test")
    print("="*80)
    
    try:
        sys.path.insert(0, '/app/backend')
        from server import is_work_email
        
        # Personal emails (should return False)
        personal_emails = [
            "test@gmail.com",
            "user@yahoo.com",
            "person@hotmail.com",
            "someone@outlook.com",
            "user@aol.com",
            "test@icloud.com",
            "user@protonmail.com",
            "test@proton.me",
            "user@gmx.com",
            "test@live.com",
            "user@msn.com",
            "test@me.com",
            "user@ymail.com"
        ]
        
        print("\n[5.1] Testing personal email detection...")
        for email in personal_emails:
            result = is_work_email(email)
            if result == False:
                log_pass(f"is_work_email({email})", "Correctly identified as personal email")
            else:
                log_fail(f"is_work_email({email})", f"Should return False, got {result}")
        
        # Work emails (should return True)
        work_emails = [
            "john@acme-corp.com",
            "sarah@tech-startup.io",
            "admin@my-company.net",
            "user@business-name.co",
            "test@example-business.org",
            "admin@payrewards.com"
        ]
        
        print("\n[5.2] Testing work email detection...")
        for email in work_emails:
            result = is_work_email(email)
            if result == True:
                log_pass(f"is_work_email({email})", "Correctly identified as work email")
            else:
                log_fail(f"is_work_email({email})", f"Should return True, got {result}")
                
    except Exception as e:
        log_fail("is_work_email function test", str(e))

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
    print("WORK EMAIL VALIDATION TESTING COMPLETE")
    print("="*80)
    
    # Return exit code
    return 0 if len(test_results["failed"]) == 0 else 1

async def main():
    """Run all work email validation tests"""
    print("="*80)
    print("UPLAUD CRM - WORK EMAIL VALIDATION TEST SUITE")
    print("="*80)
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now(timezone.utc).isoformat()}")
    print(f"Testing: Work email validation and business name derivation")
    
    # Run all tests
    await test_is_work_email_function()
    await test_business_name_derivation()
    await test_personal_email_rejection_login()
    await test_work_email_acceptance()
    await test_work_email_validation_with_local_jwt()
    
    # Print summary
    exit_code = print_summary()
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())
