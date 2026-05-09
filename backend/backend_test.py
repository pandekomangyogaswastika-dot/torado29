"""
Backend API Test for Cashier Loyalty Points Entry - Sprint Loyalty-Cashier
Tests cashier loyalty endpoints: phone lookup, add points, phone login
"""
import requests
import sys
from datetime import datetime
import random

class CashierLoyaltyTester:
    def __init__(self, base_url="https://finance-phase2-test.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_phone = f"0812345678{random.randint(10, 99)}"  # Random test phone

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_json = response.json()
                    if 'data' in resp_json:
                        print(f"   Response data keys: {list(resp_json['data'].keys()) if isinstance(resp_json['data'], dict) else type(resp_json['data'])}")
                    return True, resp_json
                except:
                    return True, {}
            else:
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "got": response.status_code,
                    "response": response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        print("\n" + "="*60)
        print("AUTHENTICATION TEST")
        print("="*60)
        success, response = self.run_test(
            "Login as Outlet Staff",
            "POST",
            "/api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success:
            # Try different response structures
            token = None
            if response.get('data', {}).get('access_token'):
                token = response['data']['access_token']
            elif response.get('data', {}).get('token'):
                token = response['data']['token']
            elif response.get('access_token'):
                token = response['access_token']
            
            if token:
                self.token = token
                print(f"   ✓ Token obtained: {self.token[:20]}...")
                return True
        return False

    def test_cashier_lookup_existing(self):
        """Test cashier lookup for existing customer"""
        print("\n" + "="*60)
        print("CASHIER LOOKUP - EXISTING CUSTOMER")
        print("="*60)
        
        # Try to find any existing customer first
        success, response = self.run_test(
            "Search for existing customer",
            "GET",
            "/api/outlet/loyalty/lookup",
            200,
            params={"query": "Member", "limit": 1}
        )
        
        if success:
            data = response.get('data', [])
            if len(data) > 0:
                phone = data[0].get('phone')
                print(f"   Found customer: {data[0].get('full_name')} - {phone}")
                
                # Now test cashier lookup endpoint
                success2, response2 = self.run_test(
                    f"Cashier lookup by phone '{phone}'",
                    "GET",
                    "/api/outlet/loyalty/cashier/lookup",
                    200,
                    params={"phone": phone}
                )
                
                if success2:
                    customer = response2.get('data', {})
                    if customer:
                        print(f"   Customer found: {customer.get('full_name')}")
                        print(f"   Tier: {customer.get('loyalty_tier')}")
                        print(f"   Points: {customer.get('total_points')}")
                        print(f"   Multiplier: {customer.get('multiplier')}")
                        return customer
        
        return None

    def test_cashier_lookup_new(self):
        """Test cashier lookup for non-existent customer (should return null)"""
        print("\n" + "="*60)
        print("CASHIER LOOKUP - NEW CUSTOMER")
        print("="*60)
        
        success, response = self.run_test(
            f"Cashier lookup for new phone '{self.test_phone}'",
            "GET",
            "/api/outlet/loyalty/cashier/lookup",
            200,
            params={"phone": self.test_phone}
        )
        
        if success:
            data = response.get('data')
            if data is None:
                print(f"   ✓ Correctly returned null for non-existent customer")
                return True
            else:
                print(f"   ⚠ Expected null but got: {data}")
        
        return success

    def test_add_points_new_customer(self):
        """Test adding points for new customer (auto-create flow)"""
        print("\n" + "="*60)
        print("ADD POINTS - NEW CUSTOMER (AUTO-CREATE)")
        print("="*60)
        
        amount = 50000  # Rp 50,000 = 5 points for bronze
        
        success, response = self.run_test(
            f"Add points for new customer {self.test_phone}",
            "POST",
            "/api/outlet/loyalty/cashier/add-points",
            200,
            data={
                "phone": self.test_phone,
                "amount_idr": amount,
                "note": "Test transaction - auto-create"
            }
        )
        
        if success:
            data = response.get('data', {})
            customer = data.get('customer', {})
            print(f"   Customer created: {customer.get('full_name')}")
            print(f"   Phone: {customer.get('phone')}")
            print(f"   Tier: {customer.get('loyalty_tier')}")
            print(f"   Points awarded: {data.get('points_awarded')}")
            print(f"   Total points: {customer.get('total_points')}")
            print(f"   Was created: {data.get('was_created')}")
            print(f"   Multiplier: {data.get('multiplier')}")
            
            # Verify points calculation: 50000 / 10000 * 1.0 = 5 points
            expected_points = 5
            actual_points = data.get('points_awarded', 0)
            if actual_points == expected_points:
                print(f"   ✓ Points calculation correct: {actual_points} points")
            else:
                print(f"   ⚠ Points mismatch: expected {expected_points}, got {actual_points}")
            
            return data
        
        return None

    def test_add_points_existing_customer(self):
        """Test adding points for existing customer"""
        print("\n" + "="*60)
        print("ADD POINTS - EXISTING CUSTOMER")
        print("="*60)
        
        amount = 100000  # Rp 100,000 = 10 points for bronze
        
        success, response = self.run_test(
            f"Add points for existing customer {self.test_phone}",
            "POST",
            "/api/outlet/loyalty/cashier/add-points",
            200,
            data={
                "phone": self.test_phone,
                "amount_idr": amount,
                "note": "Test transaction - existing customer"
            }
        )
        
        if success:
            data = response.get('data', {})
            customer = data.get('customer', {})
            print(f"   Customer: {customer.get('full_name')}")
            print(f"   Points awarded: {data.get('points_awarded')}")
            print(f"   Total points: {customer.get('total_points')}")
            print(f"   Was created: {data.get('was_created')}")
            
            # Should be 15 points total now (5 + 10)
            expected_total = 15
            actual_total = customer.get('total_points', 0)
            if actual_total == expected_total:
                print(f"   ✓ Total points correct: {actual_total} points")
            else:
                print(f"   ⚠ Total points: expected {expected_total}, got {actual_total}")
            
            return data
        
        return None

    def test_phone_login(self):
        """Test phone-based login for auto-created customer"""
        print("\n" + "="*60)
        print("PHONE LOGIN TEST")
        print("="*60)
        
        # Auto-created customers use phone as password
        success, response = self.run_test(
            f"Login with phone {self.test_phone}",
            "POST",
            "/api/loyalty/login-phone",
            200,
            data={
                "phone": self.test_phone,
                "password": self.test_phone
            }
        )
        
        if success:
            access_token = response.get('access_token')
            customer = response.get('customer', {})
            
            if access_token:
                print(f"   ✓ Login successful")
                print(f"   Token: {access_token[:20]}...")
                print(f"   Customer: {customer.get('full_name')}")
                print(f"   Phone: {customer.get('phone')}")
                print(f"   Tier: {customer.get('loyalty_tier')}")
                print(f"   Total points: {customer.get('total_points')}")
                return True
            else:
                print(f"   ⚠ No access token in response")
        
        return success

    def test_phone_login_wrong_password(self):
        """Test phone login with wrong password"""
        print("\n" + "="*60)
        print("PHONE LOGIN - WRONG PASSWORD")
        print("="*60)
        
        success, response = self.run_test(
            f"Login with wrong password",
            "POST",
            "/api/loyalty/login-phone",
            401,  # Expect 401 Unauthorized
            data={
                "phone": self.test_phone,
                "password": "wrongpassword123"
            }
        )
        
        if success:
            print(f"   ✓ Correctly rejected wrong password")
        
        return success

def main():
    print("\n" + "="*70)
    print("CASHIER LOYALTY POINTS ENTRY - BACKEND API TEST")
    print("Sprint Loyalty-Cashier - Comprehensive API Testing")
    print("="*70)
    
    tester = CashierLoyaltyTester()
    
    # 1. Login as outlet staff
    if not tester.test_login("admin@torado.id", "Torado@2026"):
        print("\n❌ Login failed, cannot proceed with tests")
        return 1
    
    # 2. Test cashier lookup for existing customer
    existing_customer = tester.test_cashier_lookup_existing()
    
    # 3. Test cashier lookup for new customer (should return null)
    tester.test_cashier_lookup_new()
    
    # 4. Test add points for new customer (auto-create flow)
    new_customer_result = tester.test_add_points_new_customer()
    
    # 5. Test add points for existing customer (the one we just created)
    if new_customer_result:
        tester.test_add_points_existing_customer()
    
    # 6. Test phone login with auto-created account
    tester.test_phone_login()
    
    # 7. Test phone login with wrong password
    tester.test_phone_login_wrong_password()
    
    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"Total tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {len(tester.failed_tests)}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for fail in tester.failed_tests:
            print(f"\n  Test: {fail['test']}")
            print(f"  Endpoint: {fail.get('endpoint', 'N/A')}")
            if 'error' in fail:
                print(f"  Error: {fail['error']}")
            else:
                print(f"  Expected: {fail.get('expected')}, Got: {fail.get('got')}")
                print(f"  Response: {fail.get('response', '')[:150]}")
    
    print("\n" + "="*70)
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
