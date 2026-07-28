#!/usr/bin/env python3
"""
Unit tests for derive_business_name() function to verify it handles
www. prefix in email domains correctly.
"""

from backend.server import derive_business_name

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
    
    print("=" * 80)
    print("Unit tests for derive_business_name() with www. prefix")
    print("=" * 80)
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['description']}")
        print(f"   Input: {test_case['input']}")
        
        result = derive_business_name(test_case["input"])
        
        assert result == test_case["expected"], test_case["description"]
