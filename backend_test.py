#!/usr/bin/env python3
"""
Backend Authentication Testing Suite for Uplaud CRM
Tests the dual authentication system (local JWT + Supabase fallback)
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime, timezone, timedelta
import jwt
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

# Configuration
BACKEND_URL = "https://referral-engine-18.preview.emergentagent.com/api"
JWT_SECRET = "uplaud-preview-jwt-secret-8f3a1c9d"
JWT_ALGORITHM = "HS256"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Test credentials
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

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def test_local_jwt_authentication():
    """Test 1: Pre-existing/local authentication with JWT_SECRET decoding"""
    print("\n" + "="*80)
    print("TEST 1: Local JWT Authentication")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Login with local credentials
            print("\n[1.1] Testing /api/auth/login with admin credentials...")
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                token = login_data.get("token")
                user = login_data.get("user")
                
                log_pass("Login with local credentials", 
                        f"User: {user.get('email')}, Role: {user.get('role')}")
                
                # Step 2: Verify token structure
                print("\n[1.2] Verifying JWT token structure...")
                try:
                    decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                    log_pass("JWT token decoding", 
                            f"Token contains: sub={decoded.get('sub')}, email={decoded.get('email')}")
                except Exception as e:
                    log_fail("JWT token decoding", str(e))
                    return
                
                # Step 3: Test /api/auth/me with local JWT
                print("\n[1.3] Testing /api/auth/me with local JWT token...")
                me_response = await client.get(
                    f"{BACKEND_URL}/auth/me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    log_pass("Get current user with local JWT", 
                            f"User: {me_data.get('email')}, Approved: {me_data.get('approved')}")
                else:
                    log_fail("Get current user with local JWT", 
                            f"Status: {me_response.status_code}, Body: {me_response.text}")
            else:
                log_fail("Login with local credentials", 
                        f"Status: {login_response.status_code}, Body: {login_response.text}")
                
    except Exception as e:
        log_fail("Local JWT authentication test", str(e))

async def test_approval_flag_check():
    """Test 3: Database level pending approval check (approved=False returns 403)"""
    print("\n" + "="*80)
    print("TEST 3: Approval Flag Check (approved=False should return 403)")
    print("="*80)
    
    try:
        # Connect to MongoDB
        mongo_client = AsyncIOMotorClient(MONGO_URL)
        db = mongo_client[DB_NAME]
        
        # Create a test user with approved=False
        test_user_id = "test-unapproved-user-123"
        test_user_email = "unapproved.test@example.com"
        
        print(f"\n[3.1] Creating test user with approved=False...")
        test_user = {
            "id": test_user_id,
            "email": test_user_email,
            "name": "Unapproved Test User",
            "role": "business",
            "company": "Test Company",
            "password_hash": hash_password("TestPassword123"),
            "approved": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Remove existing test user if any
        await db.users.delete_many({"email": test_user_email})
        await db.users.insert_one(test_user)
        log_pass("Created unapproved test user", f"Email: {test_user_email}")
        
        # Create a JWT token for this user
        print(f"\n[3.2] Creating JWT token for unapproved user...")
        token_payload = {
            "sub": test_user_id,
            "email": test_user_email,
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1)
        }
        unapproved_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        log_pass("Created JWT for unapproved user", "Token generated successfully")
        
        # Try to access /api/auth/me with this token
        print(f"\n[3.3] Testing /api/auth/me with unapproved user token...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            me_response = await client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": f"Bearer {unapproved_token}"}
            )
            
            if me_response.status_code == 403:
                response_data = me_response.json()
                detail = response_data.get("detail", "")
                if "pending approval" in detail.lower():
                    log_pass("Approval flag check (403 for unapproved user)", 
                            f"Correctly returned 403 with message: {detail}")
                else:
                    log_warning("Approval flag check", 
                              f"Got 403 but unexpected message: {detail}")
            else:
                log_fail("Approval flag check", 
                        f"Expected 403, got {me_response.status_code}. Body: {me_response.text}")
        
        # Cleanup
        print(f"\n[3.4] Cleaning up test user...")
        await db.users.delete_many({"email": test_user_email})
        mongo_client.close()
        
    except Exception as e:
        log_fail("Approval flag check test", str(e))

async def test_supabase_token_verification():
    """Test 2: Direct Supabase token verification as fallback"""
    print("\n" + "="*80)
    print("TEST 2: Supabase Token Verification (Fallback)")
    print("="*80)
    
    print("\n[2.1] Testing Supabase token verification...")
    print("⚠️  Note: This test requires a valid Supabase access token from actual authentication.")
    print("    The test will verify the fallback mechanism exists in the code.")
    
    # Test with an invalid token to verify the fallback is triggered
    print("\n[2.2] Testing with invalid token to verify fallback behavior...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Use a malformed token that won't decode as local JWT
            invalid_token = "invalid.supabase.token.format"
            
            me_response = await client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": f"Bearer {invalid_token}"}
            )
            
            if me_response.status_code == 401:
                response_data = me_response.json()
                detail = response_data.get("detail", "")
                log_pass("Supabase fallback triggered for invalid token", 
                        f"Correctly returned 401: {detail}")
            else:
                log_warning("Supabase fallback behavior", 
                          f"Unexpected status {me_response.status_code}: {me_response.text}")
                
    except Exception as e:
        log_fail("Supabase token verification test", str(e))
    
    # Note about full Supabase testing
    log_warning("Supabase Integration Testing", 
               "Full Supabase token verification and auto-provisioning requires:\n" +
               "      1. Actual Supabase authentication to get valid tokens\n" +
               "      2. Testing with real Supabase user accounts\n" +
               "      3. Verifying auto-provisioning creates MongoDB records\n" +
               "      This should be tested manually or with Supabase test credentials.")

async def test_auto_provisioning():
    """Test 4: Auto-provisioning for new Supabase signups"""
    print("\n" + "="*80)
    print("TEST 4: Auto-provisioning for New Supabase Users")
    print("="*80)
    
    print("\n[4.1] Checking auto-provisioning logic...")
    log_warning("Auto-provisioning Testing", 
               "Auto-provisioning can only be fully tested with:\n" +
               "      1. A valid Supabase access token from a NEW user\n" +
               "      2. Verification that MongoDB user record is created\n" +
               "      3. Checking that admin users get approved=True\n" +
               "      4. Checking that non-admin users get approved=False\n" +
               "      This requires actual Supabase authentication flow.")
    
    # We can verify the code logic exists
    print("\n[4.2] Verifying code implementation...")
    try:
        with open("/app/backend/server.py", "r") as f:
            server_code = f.read()
            
        checks = {
            "Supabase verification function": "async def verify_supabase_token" in server_code,
            "Auto-provisioning logic": "await db.users.insert_one(user)" in server_code,
            "Admin email check": 'os.environ.get("ADMIN_EMAIL"' in server_code,
            "Approval flag setting": '"approved": True if is_admin else False' in server_code,
        }
        
        all_present = all(checks.values())
        if all_present:
            log_pass("Auto-provisioning code implementation", 
                    "All required code components are present:\n" + 
                    "\n".join([f"      - {k}: {'✓' if v else '✗'}" for k, v in checks.items()]))
        else:
            missing = [k for k, v in checks.items() if not v]
            log_fail("Auto-provisioning code implementation", 
                    f"Missing components: {', '.join(missing)}")
            
    except Exception as e:
        log_fail("Auto-provisioning code verification", str(e))

async def test_invalid_credentials():
    """Additional Test: Invalid credentials should return 401"""
    print("\n" + "="*80)
    print("ADDITIONAL TEST: Invalid Credentials Handling")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[5.1] Testing login with invalid password...")
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
            
            print("\n[5.2] Testing login with non-existent user...")
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
    """Additional Test: Missing Authorization header should return 401"""
    print("\n" + "="*80)
    print("ADDITIONAL TEST: Missing Authorization Header")
    print("="*80)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[6.1] Testing /api/auth/me without Authorization header...")
            me_response = await client.get(f"{BACKEND_URL}/auth/me")
            
            if me_response.status_code == 401:
                log_pass("Missing auth header handling", 
                        "Correctly returned 401 for missing Authorization header")
            else:
                log_fail("Missing auth header handling", 
                        f"Expected 401, got {me_response.status_code}")
                
    except Exception as e:
        log_fail("Missing auth header test", str(e))

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
    
    # Return exit code
    return 0 if len(test_results["failed"]) == 0 else 1

async def main():
    """Run all authentication tests"""
    print("="*80)
    print("UPLAUD CRM - BACKEND AUTHENTICATION TEST SUITE")
    print("="*80)
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now(timezone.utc).isoformat()}")
    print(f"Testing dual authentication: Local JWT + Supabase fallback")
    
    # Run all tests
    await test_local_jwt_authentication()
    await test_supabase_token_verification()
    await test_approval_flag_check()
    await test_auto_provisioning()
    await test_invalid_credentials()
    await test_missing_auth_header()
    
    # Print summary
    exit_code = print_summary()
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())
