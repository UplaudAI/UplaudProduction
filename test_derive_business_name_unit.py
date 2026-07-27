#!/usr/bin/env python3
"""
Unit tests for derive_business_name() function to verify it handles
www. prefix in email domains correctly.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, '/app/backend')

from server import derive_business_name

def test_derive_business_name_with_www():
    """Test derive_business_name() with www. prefix in email domains"""
    
    test_cases = [
        {
            "input": "user@www.scalis.ai",
            "expected": "Scalis",
            "description": "Email with www.scalis.ai domain"
        },
        {
            "input": "admin@www.acme-corp.com",
            "expected": "Acme Corp",
            "description": "Email with www.acme-corp.com domain"
        },
        {
            "input": "test@www.payrewards.com",
            "expected": "Payrewards",
            "description": "Email with www.payrewards.com domain"
        },
        {
            "input": "contact@www.multi-word-company.io",
            "expected": "Multi Word Company",
            "description": "Email with www.multi-word-company.io domain"
        },
        {
            "input": "info@www.tech-startup.ai",
            "expected": "Tech Startup",
            "description": "Email with www.tech-startup.ai domain"
        },
        # Test without www. prefix for comparison
        {
            "input": "user@scalis.ai",
            "expected": "Scalis",
            "description": "Email without www. prefix (scalis.ai)"
        },
        {
            "input": "admin@acme-corp.com",
            "expected": "Acme Corp",
            "description": "Email without www. prefix (acme-corp.com)"
        },
    ]
    
    passed = 0
    failed = 0
    
    print("=" * 80)
    print("Unit tests for derive_business_name() with www. prefix")
    print("=" * 80)
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['description']}")
        print(f"   Input: {test_case['input']}")
        
        result = derive_business_name(test_case["input"])
        
        if result != test_case["expected"]:
            print(f"   ❌ FAILED")
            print(f"      Expected: {test_case['expected']}")
            print(f"      Got: {result}")
            failed += 1
        else:
            print(f"   ✅ PASSED")
            print(f"      Result: {result}")
            passed += 1
    
    # Summary
    total_tests = passed + failed
    print("\n" + "=" * 80)
    print(f"SUMMARY: {passed}/{total_tests} tests passed")
    print("=" * 80)
    
    if failed > 0:
        print(f"❌ {failed} test(s) failed")
        return False
    else:
        print(f"✅ All tests passed!")
        return True

if __name__ == "__main__":
    success = test_derive_business_name_with_www()
    sys.exit(0 if success else 1)
