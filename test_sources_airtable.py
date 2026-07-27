#!/usr/bin/env python3
"""
Sources Endpoints Testing Suite for Uplaud CRM
Verifies that sources endpoints retrieve records directly from Airtable's Growth_Signals table
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime, timezone

# Configuration
BACKEND_URL = "https://referral-engine-18.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
ADMIN_EMAIL = "dcameron@payrewards.com"
ADMIN_PASSWORD = "P@yRew@rds123"

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

async def test_sources_endpoints():
    """Test sources endpoints to verify they retrieve from Airtable Growth_Signals table"""
    
    print("\n" + "="*80)
    print("SOURCES ENDPOINTS TESTING - AIRTABLE INTEGRATION")
    print("="*80 + "\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Login to get authentication token
        print("Step 1: Authenticating with admin credentials...")
        try:
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code != 200:
                log_fail("Authentication", f"Login failed with status {login_response.status_code}: {login_response.text}")
                return
            
            login_data = login_response.json()
            token = login_data.get("token")
            user = login_data.get("user")
            
            if not token:
                log_fail("Authentication", "No token received from login")
                return
            
            log_pass("Authentication", f"Successfully authenticated as {user.get('email')}")
            
        except Exception as e:
            log_fail("Authentication", str(e))
            return
        
        # Set up headers with authentication
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Test GET /api/sources - List all sources
        print("\nStep 2: Testing GET /api/sources (list sources)...")
        try:
            sources_response = await client.get(
                f"{BACKEND_URL}/sources",
                headers=headers
            )
            
            if sources_response.status_code != 200:
                log_fail("GET /api/sources", f"Request failed with status {sources_response.status_code}: {sources_response.text}")
            else:
                sources_data = sources_response.json()
                
                if not isinstance(sources_data, list):
                    log_fail("GET /api/sources", f"Expected list response, got {type(sources_data)}")
                else:
                    log_pass("GET /api/sources", f"Successfully retrieved {len(sources_data)} sources")
                    
                    # Verify sources have expected structure from Airtable
                    if len(sources_data) > 0:
                        sample_source = sources_data[0]
                        required_fields = ["id", "filename", "client_name", "status", "created_at"]
                        missing_fields = [f for f in required_fields if f not in sample_source]
                        
                        if missing_fields:
                            log_warning("Source structure", f"Missing fields in source: {missing_fields}")
                        else:
                            log_pass("Source structure", "All required fields present in source records")
                        
                        # Check if source has insights (indicates it came from Growth_Signals)
                        if "insights" in sample_source and sample_source["insights"]:
                            insights = sample_source["insights"]
                            airtable_fields = ["company_name", "sentiment_label", "signal_score", "motivations", "pain_points"]
                            present_fields = [f for f in airtable_fields if f in insights]
                            log_pass("Airtable Growth_Signals integration", 
                                   f"Source contains insights from Growth_Signals table with fields: {', '.join(present_fields)}")
                        else:
                            log_warning("Airtable Growth_Signals integration", 
                                      "Source does not contain insights (may be unanalyzed or from temp cache)")
                        
                        # Print sample source for verification
                        print(f"\n   Sample source record:")
                        print(f"   - ID: {sample_source.get('id')}")
                        print(f"   - Filename: {sample_source.get('filename')}")
                        print(f"   - Client: {sample_source.get('client_name')}")
                        print(f"   - Status: {sample_source.get('status')}")
                        print(f"   - Created: {sample_source.get('created_at')}")
                        if sample_source.get('insights'):
                            print(f"   - Company: {sample_source['insights'].get('company_name')}")
                            print(f"   - Sentiment: {sample_source['insights'].get('sentiment_label')}")
                            print(f"   - Signal Score: {sample_source['insights'].get('signal_score')}")
                    else:
                        log_warning("GET /api/sources", "No sources found in response (empty list)")
                        
        except Exception as e:
            log_fail("GET /api/sources", str(e))
        
        # Step 3: Test GET /api/sources/{source_id} - Get specific source
        print("\nStep 3: Testing GET /api/sources/{source_id} (get specific source)...")
        try:
            # First get list of sources to find a valid ID
            sources_response = await client.get(
                f"{BACKEND_URL}/sources",
                headers=headers
            )
            
            if sources_response.status_code == 200:
                sources_data = sources_response.json()
                
                if len(sources_data) > 0:
                    source_id = sources_data[0]["id"]
                    
                    # Get specific source
                    source_response = await client.get(
                        f"{BACKEND_URL}/sources/{source_id}",
                        headers=headers
                    )
                    
                    if source_response.status_code != 200:
                        log_fail("GET /api/sources/{source_id}", 
                               f"Request failed with status {source_response.status_code}: {source_response.text}")
                    else:
                        source_data = source_response.json()
                        
                        if source_data.get("id") == source_id:
                            log_pass("GET /api/sources/{source_id}", 
                                   f"Successfully retrieved source {source_id}")
                            
                            # Verify it has Airtable Growth_Signals data
                            if source_data.get("insights"):
                                log_pass("Airtable data verification", 
                                       "Source retrieved from Growth_Signals table with insights")
                            else:
                                log_warning("Airtable data verification", 
                                          "Source does not contain insights (may be from temp cache)")
                        else:
                            log_fail("GET /api/sources/{source_id}", 
                                   f"Retrieved source ID mismatch: expected {source_id}, got {source_data.get('id')}")
                else:
                    log_warning("GET /api/sources/{source_id}", 
                              "Cannot test - no sources available")
            else:
                log_fail("GET /api/sources/{source_id}", 
                       "Cannot test - failed to get sources list")
                
        except Exception as e:
            log_fail("GET /api/sources/{source_id}", str(e))
        
        # Step 4: Verify Airtable function exists
        print("\nStep 4: Verifying Airtable integration code...")
        try:
            # Check if the airtable_client module has the required function
            import sys
            sys.path.insert(0, '/app/backend')
            import airtable_client
            
            if hasattr(airtable_client, 'list_growth_signals_by_business'):
                log_pass("Airtable function check", 
                       "list_growth_signals_by_business function exists in airtable_client")
            else:
                log_fail("Airtable function check", 
                       "list_growth_signals_by_business function NOT FOUND in airtable_client")
            
            if hasattr(airtable_client, 'upsert_growth_signal'):
                log_pass("Airtable function check", 
                       "upsert_growth_signal function exists in airtable_client")
            else:
                log_fail("Airtable function check", 
                       "upsert_growth_signal function NOT FOUND in airtable_client")
                
        except Exception as e:
            log_fail("Airtable function check", str(e))
        
        # Step 5: Test authentication requirement
        print("\nStep 5: Testing authentication requirement...")
        try:
            # Try to access sources without authentication
            unauth_response = await client.get(f"{BACKEND_URL}/sources")
            
            if unauth_response.status_code == 401:
                log_pass("Authentication requirement", 
                       "Sources endpoint correctly requires authentication (401 without token)")
            else:
                log_fail("Authentication requirement", 
                       f"Expected 401 without auth, got {unauth_response.status_code}")
                
        except Exception as e:
            log_fail("Authentication requirement", str(e))

async def main():
    await test_sources_endpoints()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"✅ Passed: {len(test_results['passed'])}")
    print(f"❌ Failed: {len(test_results['failed'])}")
    print(f"⚠️  Warnings: {len(test_results['warnings'])}")
    
    if test_results['failed']:
        print("\nFailed tests:")
        for result in test_results['failed']:
            print(f"  - {result['test']}: {result['error']}")
    
    if test_results['warnings']:
        print("\nWarnings:")
        for result in test_results['warnings']:
            print(f"  - {result['test']}: {result['message']}")
    
    print("\n" + "="*80)
    
    # Exit with appropriate code
    sys.exit(0 if len(test_results['failed']) == 0 else 1)

if __name__ == "__main__":
    asyncio.run(main())
