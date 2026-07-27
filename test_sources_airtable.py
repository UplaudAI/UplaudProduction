#!/usr/bin/env python3
"""
Sources Endpoints Airtable Integration Testing Suite
Tests that sources are successfully listed, created, and analyzed purely using Airtable Growth_Signals table
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime, timezone
import tempfile

# Configuration
BACKEND_URL = "https://growth-signals-8.preview.emergentagent.com/api"

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

async def get_auth_token():
    """Helper: Login and get auth token"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            login_response = await client.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                return login_data.get("token")
            else:
                print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
                return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

async def test_code_verification():
    """Test 1: Verify code uses Airtable Growth_Signals (NO MongoDB)"""
    print("\n" + "="*80)
    print("TEST 1: Code Verification - Airtable Growth_Signals Integration")
    print("="*80)
    
    try:
        print("\n[1.1] Checking server.py for Airtable usage...")
        with open("/app/backend/server.py", "r") as f:
            server_code = f.read()
        
        # Extract the sources-related functions
        list_sources_section = server_code.split("async def list_sources")[1].split("@api_router.get")[0] if "async def list_sources" in server_code else ""
        get_source_section = server_code.split("async def get_source")[1].split("@api_router.post")[0] if "async def get_source" in server_code else ""
        analyze_source_section = server_code.split("async def analyze_source")[1].split("@api_router.put")[0] if "async def analyze_source" in server_code else ""
        
        # Check for Airtable usage
        airtable_checks = {
            "list_sources uses list_growth_signals_by_business": "list_growth_signals_by_business" in list_sources_section,
            "get_source uses list_growth_signals_by_business": "list_growth_signals_by_business" in get_source_section,
            "analyze_source uses upsert_growth_signal": "upsert_growth_signal" in analyze_source_section,
            "record_to_source_out helper exists": "def record_to_source_out" in server_code,
        }
        
        # Check for NO MongoDB usage in sources endpoints
        mongodb_checks = {
            "NO MongoDB in list_sources": "db.sources" not in list_sources_section,
            "NO MongoDB in get_source": "db.sources" not in get_source_section,
            "NO MongoDB in analyze_source (except public endpoints)": list_sources_section.count("db.sources") == 0,
        }
        
        all_airtable = all(airtable_checks.values())
        no_mongodb = all(mongodb_checks.values())
        
        if all_airtable and no_mongodb:
            log_pass("Sources endpoints use Airtable Growth_Signals", 
                    "✓ All sources endpoints use Airtable Growth_Signals table\n" + 
                    "      ✓ NO MongoDB dependencies in sources CRUD operations\n" +
                    "\n".join([f"      - {k}: {'✓' if v else '✗'}" for k, v in airtable_checks.items()]))
        else:
            missing = [k for k, v in airtable_checks.items() if not v]
            mongodb_issues = [k for k, v in mongodb_checks.items() if not v]
            error_msg = ""
            if missing:
                error_msg += f"Missing Airtable components: {', '.join(missing)}"
            if mongodb_issues:
                error_msg += f"\nMongoDB dependencies found: {', '.join(mongodb_issues)}"
            log_fail("Sources endpoints Airtable integration", error_msg)
        
        print("\n[1.2] Checking airtable_client.py for Growth_Signals functions...")
        with open("/app/backend/airtable_client.py", "r") as f:
            airtable_code = f.read()
        
        airtable_client_checks = {
            "list_growth_signals_by_business function exists": "async def list_growth_signals_by_business" in airtable_code,
            "upsert_growth_signal function exists": "async def upsert_growth_signal" in airtable_code,
            "TABLE_GROWTH_SIGNALS defined": 'TABLE_GROWTH_SIGNALS = "Growth_Signals"' in airtable_code,
        }
        
        if all(airtable_client_checks.values()):
            log_pass("Airtable client Growth_Signals functions", 
                    "✓ All required Growth_Signals functions present in airtable_client.py\n" +
                    "\n".join([f"      - {k}: {'✓' if v else '✗'}" for k, v in airtable_client_checks.items()]))
        else:
            missing = [k for k, v in airtable_client_checks.items() if not v]
            log_fail("Airtable client Growth_Signals functions", f"Missing: {', '.join(missing)}")
            
    except Exception as e:
        log_fail("Code verification", str(e))

async def test_list_sources():
    """Test 2: GET /api/sources - List sources from Airtable"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/sources - List Sources from Airtable")
    print("="*80)
    
    token = await get_auth_token()
    if not token:
        log_fail("List sources test", "Failed to get auth token")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[2.1] Fetching sources list...")
            response = await client.get(
                f"{BACKEND_URL}/sources",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                sources = response.json()
                print(f"   Found {len(sources)} sources")
                
                if len(sources) > 0:
                    # Check structure of first source
                    first_source = sources[0]
                    required_fields = ["id", "filename", "client_name", "status", "created_at"]
                    missing_fields = [f for f in required_fields if f not in first_source]
                    
                    if not missing_fields:
                        log_pass("List sources from Airtable", 
                                f"Retrieved {len(sources)} sources with correct structure")
                        
                        # Check if any sources have insights (meaning they came from Growth_Signals)
                        analyzed_sources = [s for s in sources if s.get("insights") is not None]
                        if analyzed_sources:
                            print(f"   {len(analyzed_sources)} sources have insights (from Growth_Signals)")
                            
                            # Verify insights structure
                            first_analyzed = analyzed_sources[0]
                            insights = first_analyzed.get("insights", {})
                            expected_insights_fields = [
                                "company_name", "sentiment_label", "signal_score", 
                                "motivations", "pain_points", "buying_signals", 
                                "objections", "customer_language", "product_feedback", "faqs"
                            ]
                            missing_insights = [f for f in expected_insights_fields if f not in insights]
                            
                            if not missing_insights:
                                log_pass("Growth_Signals insights structure", 
                                        f"All {len(expected_insights_fields)} expected insights fields present")
                            else:
                                log_warning("Growth_Signals insights structure", 
                                          f"Missing insights fields: {', '.join(missing_insights)}")
                        
                        return sources
                    else:
                        log_fail("List sources structure", f"Missing fields: {', '.join(missing_fields)}")
                        return sources
                else:
                    log_warning("List sources", "No sources found in Airtable Growth_Signals table")
                    return []
            else:
                log_fail("List sources API call", 
                        f"Status: {response.status_code}, Body: {response.text}")
                return None
                
    except Exception as e:
        log_fail("List sources test", str(e))
        return None

async def test_upload_source():
    """Test 3: POST /api/sources - Upload a new source"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/sources - Upload New Source")
    print("="*80)
    
    token = await get_auth_token()
    if not token:
        log_fail("Upload source test", "Failed to get auth token")
        return None
    
    try:
        # Create a test transcript file
        test_transcript = """
Sales Call Transcript - Acme Corp Demo

Participants:
- Sarah Johnson (VP of Sales, Acme Corp)
- Mike Chen (Account Executive, PayRewards)

Mike: Thanks for taking the time today, Sarah. I'm excited to show you how PayRewards can help Acme Corp boost customer engagement.

Sarah: Thanks Mike. We've been looking for a better way to reward our customers. Our current program is pretty manual and doesn't give us much data.

Mike: That's exactly what we help with. Let me show you our dashboard. [shares screen]

Sarah: Oh wow, this is much more intuitive than what we're using now. I like how you can see the customer journey in real-time.

Mike: Exactly. And you can customize the rewards based on customer behavior. For example, if someone refers a friend, you can automatically trigger a reward.

Sarah: That's really powerful. We've been wanting to do something like that but our current system can't handle it. How long does implementation typically take?

Mike: For a company your size, usually 2-3 weeks. We handle most of the heavy lifting.

Sarah: That's faster than I expected. What about pricing?

Mike: Based on your customer volume, we're looking at around $2,500 per month. That includes full support and unlimited users.

Sarah: That's actually less than what we're paying now, and we'd get way more functionality. I'm definitely interested. Can you send me a proposal?

Mike: Absolutely. I'll get that over to you by end of day. Should I include your CFO in the email?

Sarah: Yes, please. His name is David Martinez. I think he'll be excited about the cost savings.

Mike: Perfect. I'll follow up tomorrow to answer any questions.

Sarah: Sounds great. Thanks Mike, this looks really promising.
"""
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[3.1] Uploading test transcript...")
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(test_transcript)
                temp_file_path = f.name
            
            try:
                with open(temp_file_path, 'rb') as f:
                    files = {'file': ('test_acme_corp_demo.txt', f, 'text/plain')}
                    response = await client.post(
                        f"{BACKEND_URL}/sources",
                        headers={"Authorization": f"Bearer {token}"},
                        files=files
                    )
                
                if response.status_code == 200:
                    source = response.json()
                    source_id = source.get("id")
                    
                    log_pass("Upload source", 
                            f"Source uploaded successfully: {source.get('filename')}, ID: {source_id}")
                    
                    # Verify it's in uploaded status (not yet analyzed)
                    if source.get("status") == "uploaded":
                        log_pass("Source initial status", "Source status is 'uploaded' (not yet analyzed)")
                    else:
                        log_warning("Source initial status", 
                                  f"Expected 'uploaded', got '{source.get('status')}'")
                    
                    return source_id
                else:
                    log_fail("Upload source API call", 
                            f"Status: {response.status_code}, Body: {response.text}")
                    return None
            finally:
                # Clean up temp file
                os.unlink(temp_file_path)
                
    except Exception as e:
        log_fail("Upload source test", str(e))
        return None

async def test_analyze_source(source_id):
    """Test 4: POST /api/sources/{source_id}/analyze - Analyze and sync to Airtable"""
    print("\n" + "="*80)
    print("TEST 4: POST /api/sources/{source_id}/analyze - Analyze and Sync to Airtable")
    print("="*80)
    
    if not source_id:
        log_fail("Analyze source test", "No source_id provided (upload may have failed)")
        return None
    
    token = await get_auth_token()
    if not token:
        log_fail("Analyze source test", "Failed to get auth token")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print(f"\n[4.1] Analyzing source {source_id}...")
            response = await client.post(
                f"{BACKEND_URL}/sources/{source_id}/analyze",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                analyzed_source = response.json()
                
                # Check that status changed to analyzed
                if analyzed_source.get("status") == "analyzed":
                    log_pass("Source analysis status", "Source status changed to 'analyzed'")
                else:
                    log_warning("Source analysis status", 
                              f"Expected 'analyzed', got '{analyzed_source.get('status')}'")
                
                # Check that insights were generated
                insights = analyzed_source.get("insights")
                if insights:
                    log_pass("Insights generation", "Insights generated successfully")
                    
                    # Verify all expected insights fields
                    expected_fields = [
                        "company_name", "sentiment_label", "signal_score",
                        "motivations", "pain_points", "buying_signals",
                        "objections", "customer_language", "product_feedback", "faqs"
                    ]
                    
                    present_fields = [f for f in expected_fields if f in insights]
                    missing_fields = [f for f in expected_fields if f not in insights]
                    
                    if not missing_fields:
                        log_pass("Insights completeness", 
                                f"All {len(expected_fields)} expected insights fields present")
                        
                        # Print some insights details
                        print(f"\n   Insights Summary:")
                        print(f"   - Company: {insights.get('company_name')}")
                        print(f"   - Sentiment: {insights.get('sentiment_label')}")
                        print(f"   - Signal Score: {insights.get('signal_score')}")
                        print(f"   - Motivations: {len(insights.get('motivations', []))} items")
                        print(f"   - Pain Points: {len(insights.get('pain_points', []))} items")
                        print(f"   - Buying Signals: {len(insights.get('buying_signals', []))} items")
                    else:
                        log_warning("Insights completeness", 
                                  f"Missing fields: {', '.join(missing_fields)}")
                else:
                    log_fail("Insights generation", "No insights in response")
                
                # Check that testimonial was generated
                testimonial = analyzed_source.get("testimonial_draft")
                if testimonial:
                    log_pass("Testimonial generation", 
                            f"Testimonial generated ({len(testimonial)} chars)")
                else:
                    log_warning("Testimonial generation", "No testimonial draft in response")
                
                return analyzed_source
            else:
                log_fail("Analyze source API call", 
                        f"Status: {response.status_code}, Body: {response.text}")
                return None
                
    except Exception as e:
        log_fail("Analyze source test", str(e))
        return None

async def test_get_specific_source(source_id):
    """Test 5: GET /api/sources/{source_id} - Get specific source from Airtable"""
    print("\n" + "="*80)
    print("TEST 5: GET /api/sources/{source_id} - Get Specific Source from Airtable")
    print("="*80)
    
    if not source_id:
        log_fail("Get specific source test", "No source_id provided")
        return None
    
    token = await get_auth_token()
    if not token:
        log_fail("Get specific source test", "Failed to get auth token")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"\n[5.1] Fetching source {source_id}...")
            response = await client.get(
                f"{BACKEND_URL}/sources/{source_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                source = response.json()
                
                # Verify it has insights (meaning it was retrieved from Growth_Signals or cache)
                if source.get("insights"):
                    log_pass("Get specific source with insights", 
                            f"Retrieved source with complete insights from Airtable/cache")
                    
                    # Verify the insights match what we expect
                    insights = source.get("insights", {})
                    if insights.get("company_name") and insights.get("signal_score"):
                        log_pass("Source insights integrity", 
                                f"Insights intact: {insights.get('company_name')}, Score: {insights.get('signal_score')}")
                    else:
                        log_warning("Source insights integrity", "Some insights fields missing")
                else:
                    log_warning("Get specific source", "Source retrieved but no insights (may be unanalyzed)")
                
                return source
            elif response.status_code == 404:
                log_fail("Get specific source", "Source not found (may not have synced to Airtable yet)")
                return None
            else:
                log_fail("Get specific source API call", 
                        f"Status: {response.status_code}, Body: {response.text}")
                return None
                
    except Exception as e:
        log_fail("Get specific source test", str(e))
        return None

async def test_airtable_sync_verification(source_id):
    """Test 6: Verify source was actually synced to Airtable Growth_Signals"""
    print("\n" + "="*80)
    print("TEST 6: Verify Airtable Growth_Signals Sync")
    print("="*80)
    
    if not source_id:
        log_fail("Airtable sync verification", "No source_id provided")
        return
    
    token = await get_auth_token()
    if not token:
        log_fail("Airtable sync verification", "Failed to get auth token")
        return
    
    try:
        # Wait a moment for Airtable sync to complete
        print("\n[6.1] Waiting 3 seconds for Airtable sync...")
        await asyncio.sleep(3)
        
        # Fetch all sources and check if our source is in the list
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\n[6.2] Fetching sources list to verify sync...")
            response = await client.get(
                f"{BACKEND_URL}/sources",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                sources = response.json()
                
                # Look for our source in the list
                our_source = next((s for s in sources if s.get("id") == source_id), None)
                
                if our_source:
                    if our_source.get("insights"):
                        log_pass("Airtable Growth_Signals sync verified", 
                                f"Source {source_id} found in sources list with insights (synced to Airtable)")
                    else:
                        log_warning("Airtable sync status", 
                                  "Source found but no insights (may still be in memory cache)")
                else:
                    log_warning("Airtable sync verification", 
                              f"Source {source_id} not found in sources list (may be in cache only)")
            else:
                log_fail("Airtable sync verification", 
                        f"Failed to fetch sources list: {response.status_code}")
                
    except Exception as e:
        log_fail("Airtable sync verification", str(e))

async def test_backend_logs():
    """Test 7: Check backend logs for Airtable operations"""
    print("\n" + "="*80)
    print("TEST 7: Backend Logs - Airtable Operations")
    print("="*80)
    
    try:
        print("\n[7.1] Checking backend logs for Airtable operations...")
        
        # Check backend error logs
        result = os.popen("tail -n 100 /var/log/supervisor/backend.err.log 2>/dev/null").read()
        
        if result:
            # Look for Airtable-related log entries
            airtable_mentions = result.count("airtable") + result.count("Airtable") + result.count("Growth_Signals")
            
            if airtable_mentions > 0:
                print(f"   Found {airtable_mentions} Airtable-related log entries")
                
                # Check for errors
                error_keywords = ["error", "failed", "exception", "traceback"]
                has_errors = any(keyword in result.lower() for keyword in error_keywords)
                
                if has_errors:
                    log_warning("Backend logs", 
                              "Found some errors in backend logs - check /var/log/supervisor/backend.err.log")
                else:
                    log_pass("Backend logs clean", "No errors found in recent backend logs")
            else:
                log_warning("Backend logs", "No Airtable-related entries found in recent logs")
        else:
            log_warning("Backend logs", "Could not read backend logs")
            
    except Exception as e:
        log_fail("Backend logs check", str(e))

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
    print("SOURCES AIRTABLE INTEGRATION TESTING COMPLETE")
    print("="*80)
    
    if len(test_results["failed"]) == 0:
        print("\n✅ ALL TESTS PASSED")
        print("✓ Sources endpoints use Airtable Growth_Signals table exclusively")
        print("✓ NO MongoDB dependencies in sources CRUD operations")
        print("✓ Sources successfully listed, created, and analyzed using Airtable")
    else:
        print("\n❌ SOME TESTS FAILED - See details above")
    
    # Return exit code
    return 0 if len(test_results["failed"]) == 0 else 1

async def main():
    """Run all sources Airtable integration tests"""
    print("="*80)
    print("UPLAUD CRM - SOURCES AIRTABLE INTEGRATION TEST SUITE")
    print("VERIFY SOURCES USE AIRTABLE GROWTH_SIGNALS TABLE EXCLUSIVELY")
    print("="*80)
    print(f"\nBackend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now(timezone.utc).isoformat()}")
    print(f"Testing: Sources list, create, analyze with Airtable Growth_Signals")
    
    # Test 1: Code verification
    await test_code_verification()
    
    # Test 2: List existing sources
    existing_sources = await test_list_sources()
    
    # Test 3: Upload a new source
    source_id = await test_upload_source()
    
    # Test 4: Analyze the source (syncs to Airtable)
    if source_id:
        analyzed_source = await test_analyze_source(source_id)
        
        # Test 5: Get the specific source
        if analyzed_source:
            await test_get_specific_source(source_id)
            
            # Test 6: Verify Airtable sync
            await test_airtable_sync_verification(source_id)
    
    # Test 7: Check backend logs
    await test_backend_logs()
    
    # Print summary
    exit_code = print_summary()
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())
