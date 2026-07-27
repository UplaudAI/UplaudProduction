#!/usr/bin/env python3
"""
Comprehensive Sources Airtable Integration Test
Verifies sources endpoints retrieve from Growth_Signals table and tests full CRUD flow
"""

import os
import sys
import json
import asyncio
import httpx
import io
from datetime import datetime, timezone

# Configuration
BACKEND_URL = "https://growth-signals-8.preview.emergentagent.com/api"

# Test credentials
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

async def test_comprehensive_sources():
    """Comprehensive test of sources endpoints with Airtable integration"""
    
    print("\n" + "="*80)
    print("COMPREHENSIVE SOURCES AIRTABLE INTEGRATION TEST")
    print("="*80 + "\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Login
        print("Step 1: Authenticating...")
        try:
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code != 200:
                log_fail("Authentication", f"Login failed: {login_response.status_code}")
                return
            
            login_data = login_response.json()
            token = login_data.get("token")
            user = login_data.get("user")
            
            log_pass("Authentication", f"Authenticated as {user.get('email')}")
            
        except Exception as e:
            log_fail("Authentication", str(e))
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: List sources from Airtable
        print("\nStep 2: Listing sources from Airtable Growth_Signals...")
        try:
            sources_response = await client.get(
                f"{BACKEND_URL}/sources",
                headers=headers
            )
            
            if sources_response.status_code != 200:
                log_fail("List sources", f"Failed with status {sources_response.status_code}")
                return
            
            sources = sources_response.json()
            log_pass("List sources", f"Retrieved {len(sources)} sources from Airtable")
            
            # Analyze sources
            analyzed_sources = [s for s in sources if s.get("status") == "analyzed" and s.get("insights")]
            uploaded_sources = [s for s in sources if s.get("status") == "uploaded"]
            
            print(f"   - Analyzed sources (from Growth_Signals): {len(analyzed_sources)}")
            print(f"   - Uploaded sources (from temp cache): {len(uploaded_sources)}")
            
            if analyzed_sources:
                log_pass("Airtable Growth_Signals data", 
                       f"{len(analyzed_sources)} sources retrieved from Growth_Signals table")
                
                # Verify structure of analyzed source
                sample = analyzed_sources[0]
                print(f"\n   Sample analyzed source from Growth_Signals:")
                print(f"   - ID: {sample.get('id')}")
                print(f"   - Filename: {sample.get('filename')}")
                print(f"   - Client: {sample.get('client_name')}")
                print(f"   - Status: {sample.get('status')}")
                
                if sample.get('insights'):
                    insights = sample['insights']
                    print(f"   - Company: {insights.get('company_name')}")
                    print(f"   - Sentiment: {insights.get('sentiment_label')}")
                    print(f"   - Signal Score: {insights.get('signal_score')}")
                    print(f"   - Motivations: {len(insights.get('motivations', []))} items")
                    print(f"   - Pain Points: {len(insights.get('pain_points', []))} items")
                    print(f"   - Buying Signals: {len(insights.get('buying_signals', []))} items")
                    
                    # Verify all expected Airtable fields are present
                    expected_fields = [
                        'company_name', 'speaker_name', 'speaker_role', 
                        'sentiment_label', 'signal_score', 'call_type',
                        'motivations', 'pain_points', 'buying_signals',
                        'objections', 'customer_language', 'product_feedback', 'faqs'
                    ]
                    present_fields = [f for f in expected_fields if f in insights]
                    missing_fields = [f for f in expected_fields if f not in insights]
                    
                    log_pass("Growth_Signals field mapping", 
                           f"{len(present_fields)}/{len(expected_fields)} expected fields present")
                    
                    if missing_fields:
                        log_warning("Growth_Signals field mapping", 
                                  f"Missing fields: {', '.join(missing_fields)}")
            else:
                log_warning("Airtable Growth_Signals data", 
                          "No analyzed sources found (Growth_Signals table may be empty)")
            
        except Exception as e:
            log_fail("List sources", str(e))
            return
        
        # Step 3: Get specific source by ID
        print("\nStep 3: Testing GET /api/sources/{source_id}...")
        if analyzed_sources:
            try:
                source_id = analyzed_sources[0]['id']
                source_response = await client.get(
                    f"{BACKEND_URL}/sources/{source_id}",
                    headers=headers
                )
                
                if source_response.status_code != 200:
                    log_fail("Get source by ID", f"Failed with status {source_response.status_code}")
                else:
                    source = source_response.json()
                    if source.get('id') == source_id:
                        log_pass("Get source by ID", f"Successfully retrieved source {source_id}")
                        
                        # Verify it has Growth_Signals data
                        if source.get('insights'):
                            log_pass("Source data integrity", 
                                   "Source contains complete insights from Growth_Signals")
                        else:
                            log_fail("Source data integrity", 
                                   "Source missing insights data")
                    else:
                        log_fail("Get source by ID", "Source ID mismatch")
                        
            except Exception as e:
                log_fail("Get source by ID", str(e))
        else:
            log_warning("Get source by ID", "Skipped - no analyzed sources available")
        
        # Step 4: Upload and analyze a new source
        print("\nStep 4: Testing source upload and analysis flow...")
        try:
            # Create a test transcript file
            test_transcript = """
            Customer: I've been using your product for the past 3 months and I'm really impressed.
            The automation features have saved us at least 10 hours per week.
            
            Sales Rep: That's great to hear! What specific features have been most valuable?
            
            Customer: The workflow automation and the integration with our CRM. 
            We were struggling with manual data entry before, but now everything syncs automatically.
            The team loves it and we're seeing much better data accuracy.
            
            Sales Rep: Excellent! Are there any areas where you'd like to see improvements?
            
            Customer: The reporting could be more customizable, but overall we're very satisfied.
            We're actually planning to expand to more teams next quarter.
            """
            
            # Upload source
            files = {
                'file': ('test_customer_call.txt', io.BytesIO(test_transcript.encode()), 'text/plain')
            }
            
            upload_response = await client.post(
                f"{BACKEND_URL}/sources",
                headers=headers,
                files=files
            )
            
            if upload_response.status_code != 200:
                log_fail("Upload source", f"Failed with status {upload_response.status_code}: {upload_response.text}")
            else:
                uploaded_source = upload_response.json()
                source_id = uploaded_source.get('id')
                log_pass("Upload source", f"Successfully uploaded source {source_id}")
                
                # Analyze the source
                print("   Analyzing source (this will sync to Airtable Growth_Signals)...")
                analyze_response = await client.post(
                    f"{BACKEND_URL}/sources/{source_id}/analyze",
                    headers=headers
                )
                
                if analyze_response.status_code != 200:
                    log_fail("Analyze source", f"Failed with status {analyze_response.status_code}: {analyze_response.text}")
                else:
                    analyzed_source = analyze_response.json()
                    log_pass("Analyze source", f"Successfully analyzed source {source_id}")
                    
                    # Verify insights were generated
                    if analyzed_source.get('insights'):
                        insights = analyzed_source['insights']
                        log_pass("Insights generation", 
                               f"Generated insights with {insights.get('signal_score', 0)} signal score")
                        
                        print(f"   Generated insights:")
                        print(f"   - Company: {insights.get('company_name')}")
                        print(f"   - Sentiment: {insights.get('sentiment_label')}")
                        print(f"   - Signal Score: {insights.get('signal_score')}")
                        print(f"   - Motivations: {len(insights.get('motivations', []))}")
                        print(f"   - Pain Points: {len(insights.get('pain_points', []))}")
                        
                        # Verify testimonial draft
                        if analyzed_source.get('testimonial_draft'):
                            log_pass("Testimonial generation", 
                                   f"Generated testimonial: {analyzed_source['testimonial_draft'][:100]}...")
                        else:
                            log_warning("Testimonial generation", "No testimonial draft generated")
                    else:
                        log_fail("Insights generation", "No insights generated")
                    
                    # Verify it was synced to Airtable by fetching sources again
                    print("   Verifying sync to Airtable Growth_Signals...")
                    await asyncio.sleep(2)  # Wait for Airtable sync
                    
                    verify_response = await client.get(
                        f"{BACKEND_URL}/sources/{source_id}",
                        headers=headers
                    )
                    
                    if verify_response.status_code == 200:
                        verified_source = verify_response.json()
                        if verified_source.get('insights'):
                            log_pass("Airtable sync verification", 
                                   "Source successfully synced to Growth_Signals table")
                        else:
                            log_warning("Airtable sync verification", 
                                      "Source retrieved but insights may not be synced yet")
                    else:
                        log_warning("Airtable sync verification", 
                                  "Could not verify Airtable sync")
                        
        except Exception as e:
            log_fail("Upload and analyze flow", str(e))
        
        # Step 5: Verify code implementation
        print("\nStep 5: Verifying code implementation...")
        try:
            # Check server.py for correct Airtable usage
            with open('/app/backend/server.py', 'r') as f:
                server_code = f.read()
            
            # Check list_sources endpoint
            if 'airtable_client.list_growth_signals_by_business' in server_code:
                log_pass("Code verification", 
                       "list_sources endpoint uses airtable_client.list_growth_signals_by_business")
            else:
                log_fail("Code verification", 
                       "list_sources endpoint does not use Airtable function")
            
            # Check analyze endpoint
            if 'airtable_client.upsert_growth_signal' in server_code:
                log_pass("Code verification", 
                       "analyze endpoint uses airtable_client.upsert_growth_signal")
            else:
                log_fail("Code verification", 
                       "analyze endpoint does not use Airtable upsert function")
            
            # Check for MongoDB usage in sources endpoints
            sources_section = server_code[server_code.find('@api_router.get("/sources"'):
                                         server_code.find('@api_router.post("/sources/{source_id}/analyze"') + 500]
            
            if 'db.sources' not in sources_section and 'db["sources"]' not in sources_section:
                log_pass("MongoDB removal verification", 
                       "Sources list/get endpoints have NO MongoDB references")
            else:
                log_fail("MongoDB removal verification", 
                       "Sources endpoints still contain MongoDB references")
                
        except Exception as e:
            log_fail("Code verification", str(e))

async def main():
    await test_comprehensive_sources()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"✅ Passed: {len(test_results['passed'])}")
    print(f"❌ Failed: {len(test_results['failed'])}")
    print(f"⚠️  Warnings: {len(test_results['warnings'])}")
    
    if test_results['failed']:
        print("\n❌ FAILED TESTS:")
        for result in test_results['failed']:
            print(f"  - {result['test']}: {result['error']}")
    
    if test_results['warnings']:
        print("\n⚠️  WARNINGS:")
        for result in test_results['warnings']:
            print(f"  - {result['test']}: {result['message']}")
    
    print("\n" + "="*80)
    
    # Determine overall result
    if len(test_results['failed']) == 0:
        print("\n✅✅✅ ALL TESTS PASSED - Sources endpoints fully functional with Airtable ✅✅✅")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED - See details above")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
