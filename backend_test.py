"""Backend API Testing for Smart Procurement System
Tests Market List, FDO, Vendor Catalog, and Price Intelligence features.
"""
import requests
import sys
from datetime import datetime

class SmartProcurementTester:
    def __init__(self, base_url="https://repo-review-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, passed, message=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED - {message}")
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        
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
                self.log_result(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Response: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_result(name, False, str(e))
            return False, {}

    def test_login(self):
        """Test login and get token"""
        print("\n" + "="*60)
        print("AUTHENTICATION")
        print("="*60)
        success, response = self.run_test(
            "Login with admin credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@torado.id", "password": "Torado@2026"}
        )
        if success and 'data' in response:
            # Try both 'token' and 'access_token' keys
            token = response['data'].get('token') or response['data'].get('access_token')
            if token:
                self.token = token
                print(f"   Token obtained: {self.token[:20]}...")
                return True
        return False

    def test_market_list_quarters(self):
        """Test Market List quarters endpoints"""
        print("\n" + "="*60)
        print("MARKET LIST - QUARTERS")
        print("="*60)
        
        # List quarters
        success, response = self.run_test(
            "GET /market-list/quarters",
            "GET",
            "market-list/quarters",
            200
        )
        
        quarters = []
        if success and 'data' in response:
            quarters = response['data']
            print(f"   Found {len(quarters)} quarters")
            for q in quarters:
                print(f"   - {q.get('label', 'N/A')} (status: {q.get('status', 'N/A')})")
        
        # Get active quarter
        success, response = self.run_test(
            "GET /market-list/quarters/active",
            "GET",
            "market-list/quarters/active",
            200
        )
        
        if success and 'data' in response and response['data']:
            print(f"   Active quarter: {response['data'].get('label', 'N/A')}")
        
        return quarters

    def test_market_list_items(self, quarter_id=None):
        """Test Market List items endpoint"""
        print("\n" + "="*60)
        print("MARKET LIST - ITEMS")
        print("="*60)
        
        params = {"page": 1, "per_page": 10}
        if quarter_id:
            params["quarter_id"] = quarter_id
        
        success, response = self.run_test(
            "GET /market-list/items",
            "GET",
            "market-list/items",
            200,
            params=params
        )
        
        items = []
        if success and 'data' in response:
            items = response['data']
            print(f"   Found {len(items)} items")
            if items:
                item = items[0]
                print(f"   Sample item: {item.get('name', 'N/A')}")
                print(f"   - Ref price: {item.get('ref_price', 'N/A')}")
                print(f"   - Variance: {item.get('ref_variance_pct', 'N/A')}%")
                print(f"   - Status: {item.get('ml_status', 'N/A')}")
        
        return items

    def test_fdo_endpoints(self):
        """Test FDO endpoints"""
        print("\n" + "="*60)
        print("FDO (FLOOR DAILY ORDER)")
        print("="*60)
        
        # Get outlets first
        success, response = self.run_test(
            "GET /master/outlets",
            "GET",
            "master/outlets",
            200,
            params={"per_page": 10}
        )
        
        outlet_id = None
        if success and 'data' in response and response['data']:
            outlet_id = response['data'][0].get('id')
            print(f"   Using outlet: {response['data'][0].get('name', 'N/A')}")
        
        if not outlet_id:
            print("   ⚠️  No outlets found, skipping FDO tests")
            return
        
        # List FDO
        success, response = self.run_test(
            "GET /outlet/fdo",
            "GET",
            "outlet/fdo",
            200,
            params={"outlet_id": outlet_id, "page": 1, "per_page": 10}
        )
        
        if success and 'data' in response:
            fdos = response['data']
            print(f"   Found {len(fdos)} FDO records")
        
        # Get favorites
        success, response = self.run_test(
            "GET /outlet/fdo/favorites",
            "GET",
            "outlet/fdo/favorites",
            200,
            params={"outlet_id": outlet_id, "limit": 8}
        )
        
        if success and 'data' in response:
            favorites = response['data']
            print(f"   Found {len(favorites)} favorite items")

    def test_vendor_catalog(self):
        """Test Vendor Catalog endpoints"""
        print("\n" + "="*60)
        print("VENDOR CATALOG")
        print("="*60)
        
        # Get vendors first
        success, response = self.run_test(
            "GET /master/vendors",
            "GET",
            "master/vendors",
            200,
            params={"per_page": 10}
        )
        
        vendor_id = None
        if success and 'data' in response and response['data']:
            vendor_id = response['data'][0].get('id')
            print(f"   Using vendor: {response['data'][0].get('name', 'N/A')}")
        
        if not vendor_id:
            print("   ⚠️  No vendors found, skipping vendor catalog tests")
            return
        
        # Get vendor catalog
        success, response = self.run_test(
            "GET /vendor-items/vendor/{vendor_id}",
            "GET",
            f"vendor-items/vendor/{vendor_id}",
            200,
            params={"page": 1, "per_page": 10}
        )
        
        if success and 'data' in response:
            items = response['data']
            print(f"   Found {len(items)} items in vendor catalog")
            if items:
                item = items[0]
                print(f"   Sample item: {item.get('item_name', 'N/A')}")
                print(f"   - Current price: {item.get('current_price', 'N/A')}")
                print(f"   - Ref price: {item.get('ref_price', 'N/A')}")
                print(f"   - Deviation: {item.get('deviation_pct', 'N/A')}%")

    def test_price_intelligence(self):
        """Test Price Intelligence endpoint"""
        print("\n" + "="*60)
        print("PRICE INTELLIGENCE")
        print("="*60)
        
        success, response = self.run_test(
            "GET /market-list/intelligence",
            "GET",
            "market-list/intelligence",
            200,
            params={"top_n": 20}
        )
        
        if success and 'data' in response:
            data = response['data']
            print(f"   Total items tracked: {data.get('total_items_tracked', 0)}")
            print(f"   Price above reference: {data.get('price_above_reference', 0)}")
            print(f"   Price below reference: {data.get('price_below_reference', 0)}")
            print(f"   Single source risk: {len(data.get('single_source_risk', []))}")
            print(f"   Top deviations: {len(data.get('top_deviations', []))}")

    def test_search_with_ref_price(self):
        """Test search endpoint with market list ref price"""
        print("\n" + "="*60)
        print("SEARCH WITH REF PRICE")
        print("="*60)
        
        # Search for items
        success, response = self.run_test(
            "GET /search?q=item",
            "GET",
            "search",
            200,
            params={"q": "item", "per_page": 5}
        )
        
        item_ids = []
        if success and 'data' in response:
            items = response['data'].get('items', response['data'])
            print(f"   Found {len(items)} items")
            item_ids = [item.get('id') for item in items if item.get('id')]
        
        # Get bulk ref prices
        if item_ids:
            success, response = self.run_test(
                "GET /market-list/ref-prices/bulk",
                "GET",
                "market-list/ref-prices/bulk",
                200,
                params={"item_ids": ",".join(item_ids[:3])}
            )
            
            if success and 'data' in response:
                ref_prices = response['data']
                print(f"   Got ref prices for {len(ref_prices)} items")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ Failed tests:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"   - {result['test']}: {result['message']}")

def main():
    print("="*60)
    print("SMART PROCUREMENT SYSTEM - BACKEND API TESTS")
    print("="*60)
    
    tester = SmartProcurementTester()
    
    # Login first
    if not tester.test_login():
        print("\n❌ Login failed, stopping tests")
        return 1
    
    # Test Market List
    quarters = tester.test_market_list_quarters()
    quarter_id = quarters[0].get('id') if quarters else None
    items = tester.test_market_list_items(quarter_id)
    
    # Test FDO
    tester.test_fdo_endpoints()
    
    # Test Vendor Catalog
    tester.test_vendor_catalog()
    
    # Test Price Intelligence
    tester.test_price_intelligence()
    
    # Test Search with ref price
    tester.test_search_with_ref_price()
    
    # Print summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
