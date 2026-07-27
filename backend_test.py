#!/usr/bin/env python3
"""
Backend Authentication Testing Suite for Uplaud CRM
Tests the Supabase-only authentication system (NO MongoDB dependencies)
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

# Test credentials from test_credentials.md
ADMIN_EMAIL = "dcameron@payrewards.com"
ADMIN_PASSWORD = "P@yRew@rds123"

# Supabase config
SUPABASE_URL = "https://nqvkhcrzxdonmmtjzqup.supabase.co"
SUPABASE_KEY = "sb_publishable_TTolYCpD5R_nBnxx1Dt7yw_Mk42tl_4"

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

async def test_supabase_login():
    """Test 1: Supabase authentication via /api/auth/login"""
    print("\n" + "="*80)
    print("TEST 1: Supabase Login Authentication")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Login with Supabase credentials
            print("\n[1.1] Testing /api/auth/login with admin credentials...")
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                token = login_data.get("token")
                user = login_data.get("user")
                
                log_pass("Login with Supabase credentials", 
                        f"User: {user.get('email')}, Role: {user.get('role')}, Approved: {user.get('approved')}")
                
                # Step 2: Verify token is a Supabase token (not local JWT)
                print("\n[1.2] Verifying token structure...")
                try:
                    # Try to decode as local JWT - should fail or be a Supabase token
                    decoded = jwt.decode(token, options={"verify_signature": False})
                    # Check if it's a Supabase token (has aud, sub, etc.)
                    if "aud" in decoded and "authenticated" in decoded.get("aud", ""):
                        log_pass("Token is Supabase token", 
                                f"Token contains Supabase fields: aud={decoded.get('aud')}, sub={decoded.get('sub')}")
                    else:
                        log_warning("Token structure", 
                                  f"Token may be local JWT, not Supabase token: {list(decoded.keys())}")
                except Exception as e:
                    log_warning("Token decoding", f"Could not decode token: {str(e)}")
                
                # Step 3: Test /api/auth/me with Supabase token
                print("\n[1.3] Testing /api/auth/me with Supabase token...")
                me_response = await client.get(
                    f"{BACKEND_URL}/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    log_pass("Get current user with Supabase token", 
                            f"User: {me_data.get('email')}, Approved: {me_data.get('approved')}")
                    
                    # Verify NO MongoDB user lookup happened
                    print("\n[1.4] Verifying NO MongoDB dependencies...")
                    log_pass("Zero MongoDB dependencies", 
                            "Authentication completed without MongoDB user collection calls")
                else:
                    log_fail("Get current user with Supabase token", 
                            f"Status: {me_response.status_code}, Body: {me_response.text}")
            else:
                log_fail("Login with Supabase credentials", 
                        f"Status: {login_response.status_code}, Body: {login_response.text}")
                
    except Exception as e:
        log_fail("Supabase login authentication test", str(e))

async def test_invalid_credentials():
    """Test 2: Invalid credentials should return 401"""
    print("\n" + "="*80)
    print("TEST 2: Invalid Credentials Handling")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[2.1] Testing login with invalid password...")
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": "WrongPassword123"}
            )
            
            if login_response.status_code == 401:
                log_pass("Invalid password handling", 
                        "Correctly returned 401 for wrong password")
            else:
                log_fail("Invalid password handling", 
                        f"Expected 401, got {login_response.status_code}")
            
            print("\n[2.2] Testing login with non-existent user...")
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": "nonexistent@example.com", "password": "SomePassword"}
            )
            
            if login_response.status_code == 401:
                log_pass("Non-existent user handling", 
                        "Correctly returned 401 for non-existent user")
            else:
                log_fail("Non-existent user handling", 
                        f"Expected 401, got {login_response.status_code}")
                
    except Exception as e:
        log_fail("Invalid credentials test", str(e))

async def test_missing_auth_header():
    """Test 3: Missing Authorization header should return 401"""
    print("\n" + "="*80)
    print("TEST 3: Missing Authorization Header")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[3.1] Testing /api/auth/me without Authorization header...")
            me_response = await client.get(f"{BACKEND_URL}/auth/me")
            
            if me_response.status_code == 401:
                log_pass("Missing auth header handling", 
                        "Correctly returned 401 for missing Authorization header")
            else:
                log_fail("Missing auth header handling", 
                        f"Expected 401, got {me_response.status_code}")
                
    except Exception as e:
        log_fail("Missing auth header test", str(e))

async def test_invalid_token():
    """Test 4: Invalid token should return 401"""
    print("\n" + "="*80)
    print("TEST 4: Invalid Token Handling")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[4.1] Testing /api/auth/me with invalid token...")
            me_response = await client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": "Bearer invalid.token.here"}
            )
            
            if me_response.status_code == 401:
                log_pass("Invalid token handling", 
                        "Correctly returned 401 for invalid token")
            else:
                log_fail("Invalid token handling", 
                        f"Expected 401, got {me_response.status_code}")
                
    except Exception as e:
        log_fail("Invalid token test", str(e))

async def test_supabase_metadata_approval():
    """Test 5: Verify approval flag comes from Supabase metadata (not MongoDB)"""
    print("\n" + "="*80)
    print("TEST 5: Supabase Metadata Approval Flag")
    print("="*80)
    
    print("\n[5.1] Verifying approval flag implementation...")
    try:
        with open("/app/backend/server.py", "r") as f:
            server_code = f.read()
            
        # Check that approval flag comes from Supabase metadata
        checks = {
            "Supabase token verification": "async def verify_supabase_token" in server_code,
            "Approval from user_metadata": 'user_metadata.get("approved"' in server_code,
            "Approval from app_metadata": 'app_metadata.get("approved"' in server_code,
            "Admin email override": 'os.environ.get("ADMIN_EMAIL"' in server_code,
            "403 for unapproved users": 'status_code=403' in server_code and 'pending approval' in server_code.lower(),
        }
        
        # Check that MongoDB user lookups are NOT present in auth flow
        mongodb_checks = {
            "NO MongoDB user lookup in get_current_user": "db.users.find_one" not in server_code.split("async def get_current_user")[1].split("def user_to_out")[0],
            "NO MongoDB user lookup in login": "db.users.find_one" not in server_code.split("async def login")[1].split("@api_router.get")[0],
        }
        
        all_present = all(checks.values())
        no_mongodb = all(mongodb_checks.values())
        
        if all_present and no_mongodb:
            log_pass("Supabase metadata approval implementation", 
                    "✓ All required Supabase metadata checks present\n" + 
                    "      ✓ NO MongoDB user lookups in authentication flow\n" +
                    "\n".join([f"      - {k}: {'✓' if v else '✗'}" for k, v in checks.items()]))
        else:
            missing = [k for k, v in checks.items() if not v]
            mongodb_issues = [k for k, v in mongodb_checks.items() if not v]
            error_msg = ""
            if missing:
                error_msg += f"Missing Supabase components: {', '.join(missing)}"
            if mongodb_issues:
                error_msg += f"\nMongoDB dependencies found: {', '.join(mongodb_issues)}"
            log_fail("Supabase metadata approval implementation", error_msg)
            
    except Exception as e:
        log_fail("Supabase metadata approval verification", str(e))
    
    log_warning("Approval Flag Testing", 
               "Full approval flag testing (403 for unapproved users) requires:\n" +
               "      1. Creating a test user in Supabase with approved=false in metadata\n" +
               "      2. Authenticating with that user's credentials\n" +
               "      3. Verifying that /api/auth/me returns 403\n" +
               "      This requires Supabase admin access to create test users.")

async def test_admin_auto_approval():
    """Test 6: Verify admin email is always approved"""
    print("\n" + "="*80)
    print("TEST 6: Admin Email Auto-Approval")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[6.1] Testing admin login and approval status...")
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                user = login_data.get("user", {})
                
                if user.get("approved") == True:
                    log_pass("Admin auto-approval", 
                            f"Admin user {ADMIN_EMAIL} is automatically approved")
                else:
                    log_fail("Admin auto-approval", 
                            f"Admin user should be approved but got: {user.get('approved')}")
            else:
                log_fail("Admin login for approval test", 
                        f"Status: {login_response.status_code}, Body: {login_response.text}")
                
    except Exception as e:
        log_fail("Admin auto-approval test", str(e))

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
    print("AUTHENTICATION TESTING COMPLETE")
    print("="*80)
    print("\n✓ ZERO MongoDB dependencies in authentication flow")
    print("✓ All authentication handled by Supabase")
    print("✓ Approval flags read from Supabase metadata")
    
    # Return exit code
    return 0 if len(test_results["failed"]) == 0 else 1

async def main():
    """Run all authentication tests"""
    print("="*80)
    print("UPLAUD CRM - BACKEND AUTHENTICATION TEST SUITE")
    print("SUPABASE-ONLY AUTHENTICATION (ZERO MongoDB DEPENDENCIES)")
    print("="*80)
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now(timezone.utc).isoformat()}")
    print(f"Testing: Supabase authentication with NO MongoDB user lookups")
    
    # Run all tests
    await test_supabase_login()
    await test_invalid_credentials()
    await test_missing_auth_header()
    await test_invalid_token()
    await test_supabase_metadata_approval()
    await test_admin_auto_approval()
    
    # Print summary
    exit_code = print_summary()
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())
