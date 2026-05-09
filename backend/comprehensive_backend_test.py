"""
Comprehensive Backend API Test for Aurora F&B ERP v0.3.0
Tests all major portals and endpoints across the system
"""
import requests
import sys
from datetime import datetime
import json

class ComprehensiveERPTester:
    def __init__(self, base_url="https://finance-phase2-test.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = {
            "auth": [],
            "owner": [],
            "executive": [],
            "outlet": [],
            "procurement": [],
            "inventory": [],
            "finance": [],
            "hr": [],
            "admin": [],
            "public": [],
            "loyalty": []
        }

    def run_test(self, category, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 [{category.upper()}] {name}")
        print(f"   {method} {endpoint}")
        
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
            result = {
                "test": name,
                "endpoint": endpoint,
                "status": "PASS" if success else "FAIL",
                "expected": expected_status,
                "got": response.status_code
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASS - Status: {response.status_code}")
                try:
                    resp_json = response.json()
                    result["response_keys"] = list(resp_json.keys()) if isinstance(resp_json, dict) else None
                except:
                    pass
            else:
                self.failed_tests.append({
                    "category": category,
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "got": response.status_code,
                    "response": response.text[:300]
                })
                print(f"❌ FAIL - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                result["error"] = response.text[:200]
            
            self.test_results[category].append(result)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.failed_tests.append({
                "category": category,
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            print(f"❌ FAIL - Error: {str(e)}")
            self.test_results[category].append({
                "test": name,
                "endpoint": endpoint,
                "status": "ERROR",
                "error": str(e)
            })
            return False, {}

    # ========================================================================
    # AUTH TESTS
    # ========================================================================
    def test_auth(self):
        print("\n" + "="*70)
        print("AUTHENTICATION TESTS")
        print("="*70)
        
        # Test valid login
        success, response = self.run_test(
            "auth",
            "Login with valid credentials (admin@torado.id)",
            "POST",
            "/api/auth/login",
            200,
            data={"email": "admin@torado.id", "password": "Torado@2026"}
        )
        
        if success:
            # Extract token from various possible response structures
            token = None
            if response.get('data', {}).get('access_token'):
                token = response['data']['access_token']
            elif response.get('data', {}).get('token'):
                token = response['data']['token']
            elif response.get('access_token'):
                token = response['access_token']
            
            if token:
                self.token = token
                print(f"   ✓ Token obtained: {self.token[:30]}...")
            else:
                print(f"   ⚠ No token found in response")
                return False
        else:
            print("   ❌ Login failed - cannot proceed with authenticated tests")
            return False
        
        # Test invalid login
        self.run_test(
            "auth",
            "Login with wrong password",
            "POST",
            "/api/auth/login",
            401,
            data={"email": "admin@torado.id", "password": "WrongPassword"}
        )
        
        return True

    # ========================================================================
    # OWNER PORTAL TESTS
    # ========================================================================
    def test_owner_portal(self):
        print("\n" + "="*70)
        print("OWNER PORTAL TESTS")
        print("="*70)
        
        # Owner cockpit/dashboard
        self.run_test("owner", "Owner cockpit dashboard", "GET", "/api/owner/cockpit", 200)
        
        # Cash position
        self.run_test("owner", "Cash position", "GET", "/api/owner/cash-position", 200)
        
        # Approvals
        self.run_test("owner", "My approvals", "GET", "/api/approvals", 200)

    # ========================================================================
    # EXECUTIVE PORTAL TESTS
    # ========================================================================
    def test_executive_portal(self):
        print("\n" + "="*70)
        print("EXECUTIVE PORTAL TESTS")
        print("="*70)
        
        # Executive dashboard
        self.run_test("executive", "Executive dashboard", "GET", "/api/executive/dashboard", 200)
        
        # Profit walk
        self.run_test("executive", "Profit walk", "GET", "/api/executive/profit-walk", 200)
        
        # Period compare
        self.run_test("executive", "Period compare", "GET", "/api/executive/period-compare", 200)

    # ========================================================================
    # OUTLET PORTAL TESTS
    # ========================================================================
    def test_outlet_portal(self):
        print("\n" + "="*70)
        print("OUTLET PORTAL TESTS")
        print("="*70)
        
        # Daily sales list
        self.run_test("outlet", "Daily sales list", "GET", "/api/outlet/daily-sales", 200)
        
        # Petty cash
        self.run_test("outlet", "Petty cash", "GET", "/api/outlet/petty-cash", 200)
        
        # Cashier loyalty lookup (existing customer)
        self.run_test(
            "outlet",
            "Cashier loyalty lookup",
            "GET",
            "/api/outlet/loyalty/cashier/lookup",
            200,
            params={"phone": "08111222333"}
        )
        
        # Create daily sales
        today = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "outlet",
            "Create daily sales",
            "POST",
            "/api/outlet/daily-sales",
            201,
            data={
                "tanggal": today,
                "outlet_id": "torado-kuta",
                "shift": "Pagi",
                "penjualan_tunai": 500000,
                "penjualan_gopay": 150000,
                "penjualan_ovo": 100000,
                "penjualan_qris": 75000,
                "biaya_operasional": 50000
            }
        )
        
        if success:
            daily_sales_id = response.get('data', {}).get('id')
            if daily_sales_id:
                print(f"   ✓ Daily sales created with ID: {daily_sales_id}")
                # Get the created daily sales
                self.run_test(
                    "outlet",
                    "Get daily sales detail",
                    "GET",
                    f"/api/outlet/daily-sales/{daily_sales_id}",
                    200
                )

    # ========================================================================
    # PROCUREMENT PORTAL TESTS
    # ========================================================================
    def test_procurement_portal(self):
        print("\n" + "="*70)
        print("PROCUREMENT PORTAL TESTS")
        print("="*70)
        
        # PR list
        self.run_test("procurement", "Purchase requests list", "GET", "/api/procurement/pr", 200)
        
        # PO list
        self.run_test("procurement", "Purchase orders list", "GET", "/api/procurement/po", 200)
        
        # GR list
        self.run_test("procurement", "Goods receipts list", "GET", "/api/procurement/gr", 200)
        
        # Vendor scorecard
        self.run_test("procurement", "Vendor scorecard", "GET", "/api/procurement/vendor-scorecard", 200)
        
        # PO Kanban
        self.run_test("procurement", "PO Kanban board", "GET", "/api/procurement/kanban", 200)
        
        # RFQ History
        self.run_test("procurement", "RFQ history", "GET", "/api/rfq", 200)
        
        # Create PR
        success, response = self.run_test(
            "procurement",
            "Create purchase request",
            "POST",
            "/api/procurement/pr",
            201,
            data={
                "nama_pr": "Test PR Komprehensif",
                "outlet_id": "torado-kuta",
                "category": "Food & Beverage",
                "items": [
                    {
                        "item_name": "Chicken",
                        "qty": 10,
                        "unit": "kg",
                        "estimated_price": 25000
                    }
                ]
            }
        )
        
        if success:
            pr_id = response.get('data', {}).get('id')
            if pr_id:
                print(f"   ✓ PR created with ID: {pr_id}")
                # Get the created PR
                self.run_test(
                    "procurement",
                    "Get PR detail",
                    "GET",
                    f"/api/procurement/pr/{pr_id}",
                    200
                )

    # ========================================================================
    # INVENTORY PORTAL TESTS
    # ========================================================================
    def test_inventory_portal(self):
        print("\n" + "="*70)
        print("INVENTORY PORTAL TESTS")
        print("="*70)
        
        # Stock balance
        self.run_test("inventory", "Stock balance", "GET", "/api/inventory/balance", 200)
        
        # Low stock alert
        self.run_test("inventory", "Low stock alert", "GET", "/api/inventory/low-stock", 200)
        
        # Stock valuation
        self.run_test("inventory", "Stock valuation", "GET", "/api/inventory/valuation", 200)
        
        # Movement history
        self.run_test("inventory", "Movement history", "GET", "/api/inventory/movements", 200)
        
        # Transfers
        self.run_test("inventory", "Transfers list", "GET", "/api/inventory/transfers", 200)
        
        # Adjustments
        self.run_test("inventory", "Adjustments list", "GET", "/api/inventory/adjustments", 200)

    # ========================================================================
    # FINANCE PORTAL TESTS
    # ========================================================================
    def test_finance_portal(self):
        print("\n" + "="*70)
        print("FINANCE PORTAL TESTS")
        print("="*70)
        
        # Validation queue
        self.run_test("finance", "Validation queue", "GET", "/api/finance/validation", 200)
        
        # Journals
        self.run_test("finance", "Journal entries", "GET", "/api/finance/journals", 200)
        
        # Trial balance
        self.run_test("finance", "Trial balance", "GET", "/api/finance/trial-balance", 200)
        
        # P&L
        self.run_test("finance", "Profit & Loss", "GET", "/api/finance/profit-loss", 200)
        
        # Balance sheet
        self.run_test("finance", "Balance sheet", "GET", "/api/finance/balance-sheet", 200)
        
        # Cashflow
        self.run_test("finance", "Cashflow", "GET", "/api/finance/cashflow", 200)
        
        # Budget
        self.run_test("finance", "Budget vs Actual", "GET", "/api/budget", 200)
        
        # Fixed assets
        self.run_test("finance", "Fixed assets", "GET", "/api/fixed-assets", 200)
        
        # Tax center
        self.run_test("finance", "Tax center", "GET", "/api/tax", 200)
        
        # COA
        self.run_test("finance", "Chart of accounts", "GET", "/api/finance/coa", 200)
        
        # Periods
        self.run_test("finance", "Period management", "GET", "/api/finance/periods", 200)
        
        # Bank reconciliation
        self.run_test("finance", "Bank reconciliation", "GET", "/api/bank-recon", 200)
        
        # AP Aging
        self.run_test("finance", "AP Aging", "GET", "/api/finance/ap-aging", 200)
        
        # Comparatives
        self.run_test("finance", "Comparatives", "GET", "/api/finance/comparatives", 200)
        
        # Forecasting
        self.run_test("finance", "Forecasting", "GET", "/api/forecasting", 200)
        
        # Anomalies
        self.run_test("finance", "Anomaly feed", "GET", "/api/anomalies", 200)

    # ========================================================================
    # HR PORTAL TESTS
    # ========================================================================
    def test_hr_portal(self):
        print("\n" + "="*70)
        print("HR PORTAL TESTS")
        print("="*70)
        
        # Payroll
        self.run_test("hr", "Payroll processing", "GET", "/api/hr/payroll", 200)
        
        # Service charge
        self.run_test("hr", "Service charge", "GET", "/api/hr/service-charge", 200)
        
        # Incentive
        self.run_test("hr", "Incentive programs", "GET", "/api/hr/incentive", 200)
        
        # Voucher
        self.run_test("hr", "Voucher issuance", "GET", "/api/hr/voucher", 200)
        
        # FOC
        self.run_test("hr", "FOC management", "GET", "/api/hr/foc", 200)
        
        # Advances
        self.run_test("hr", "Employee advances", "GET", "/api/hr/advances", 200)
        
        # LB Fund
        self.run_test("hr", "LB Fund ledger", "GET", "/api/hr/lb-fund", 200)

    # ========================================================================
    # ADMIN PORTAL TESTS
    # ========================================================================
    def test_admin_portal(self):
        print("\n" + "="*70)
        print("ADMIN PORTAL TESTS")
        print("="*70)
        
        # Item catalog
        self.run_test("admin", "Item catalog", "GET", "/api/master/items", 200)
        
        # Employees
        self.run_test("admin", "Employee list", "GET", "/api/master/employees", 200)
        
        # Brands
        self.run_test("admin", "Brand master data", "GET", "/api/master/brands", 200)
        
        # Outlets
        self.run_test("admin", "Outlet master data", "GET", "/api/master/outlets", 200)
        
        # Users
        self.run_test("admin", "User management", "GET", "/api/admin/users", 200)
        
        # CMS Brands
        self.run_test("admin", "CMS Brands", "GET", "/api/cms/brands", 200)
        
        # CMS Outlets
        self.run_test("admin", "CMS Outlets", "GET", "/api/cms/outlets", 200)
        
        # CMS News
        self.run_test("admin", "CMS News/Articles", "GET", "/api/cms/news", 200)
        
        # CMS Menu
        self.run_test("admin", "CMS Menu", "GET", "/api/cms/menu", 200)
        
        # CMS Careers
        self.run_test("admin", "CMS Careers", "GET", "/api/cms/careers", 200)

    # ========================================================================
    # PUBLIC WEBSITE TESTS
    # ========================================================================
    def test_public_website(self):
        print("\n" + "="*70)
        print("PUBLIC WEBSITE TESTS (No auth required)")
        print("="*70)
        
        # Temporarily remove token for public endpoints
        temp_token = self.token
        self.token = None
        
        # Public brands/outlets
        self.run_test("public", "Public brands/outlets", "GET", "/api/public/brands", 200)
        
        # Public menu
        self.run_test("public", "Public menu", "GET", "/api/public/menu", 200)
        
        # Public news
        self.run_test("public", "Public news", "GET", "/api/public/news", 200)
        
        # Public careers/jobs
        self.run_test("public", "Public careers/jobs", "GET", "/api/public/careers", 200)
        
        # Restore token
        self.token = temp_token

    # ========================================================================
    # LOYALTY PORTAL TESTS
    # ========================================================================
    def test_loyalty_portal(self):
        print("\n" + "="*70)
        print("LOYALTY PORTAL TESTS")
        print("="*70)
        
        # Test phone login
        success, response = self.run_test(
            "loyalty",
            "Loyalty phone login (08111222333)",
            "POST",
            "/api/loyalty/login-phone",
            200,
            data={"phone": "08111222333", "password": "08111222333"}
        )
        
        if success:
            loyalty_token = response.get('access_token')
            if loyalty_token:
                print(f"   ✓ Loyalty token obtained")
                # Temporarily use loyalty token
                temp_token = self.token
                self.token = loyalty_token
                
                # Get loyalty dashboard/profile
                self.run_test("loyalty", "Loyalty member profile", "GET", "/api/loyalty/me", 200)
                
                # Get rewards catalog
                self.run_test("loyalty", "Rewards catalog", "GET", "/api/rewards", 200)
                
                # Restore admin token
                self.token = temp_token

    # ========================================================================
    # SUMMARY
    # ========================================================================
    def print_summary(self):
        print("\n" + "="*70)
        print("COMPREHENSIVE TEST SUMMARY")
        print("="*70)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print("\n" + "-"*70)
        print("RESULTS BY CATEGORY:")
        print("-"*70)
        for category, results in self.test_results.items():
            if results:
                passed = sum(1 for r in results if r.get('status') == 'PASS')
                total = len(results)
                print(f"{category.upper():15} {passed}/{total} passed ({passed/total*100:.0f}%)")
        
        if self.failed_tests:
            print("\n" + "="*70)
            print("FAILED TESTS DETAILS:")
            print("="*70)
            for fail in self.failed_tests:
                print(f"\n❌ [{fail.get('category', 'N/A').upper()}] {fail['test']}")
                print(f"   Endpoint: {fail.get('endpoint', 'N/A')}")
                if 'error' in fail:
                    print(f"   Error: {fail['error']}")
                else:
                    print(f"   Expected: {fail.get('expected')}, Got: {fail.get('got')}")
                    if 'response' in fail:
                        print(f"   Response: {fail['response'][:150]}")
        
        print("\n" + "="*70)

def main():
    print("\n" + "="*70)
    print("AURORA F&B ERP v0.3.0 - COMPREHENSIVE BACKEND API TEST")
    print("Testing all portals and major endpoints")
    print("="*70)
    
    tester = ComprehensiveERPTester()
    
    # Run all tests
    if not tester.test_auth():
        print("\n❌ Authentication failed - cannot proceed")
        return 1
    
    tester.test_owner_portal()
    tester.test_executive_portal()
    tester.test_outlet_portal()
    tester.test_procurement_portal()
    tester.test_inventory_portal()
    tester.test_finance_portal()
    tester.test_hr_portal()
    tester.test_admin_portal()
    tester.test_public_website()
    tester.test_loyalty_portal()
    
    # Print summary
    tester.print_summary()
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
