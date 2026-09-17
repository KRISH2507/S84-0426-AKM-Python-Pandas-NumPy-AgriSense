import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

def run_test(name, fn):
    print(f"\n==================================================")
    print(f"TEST: {name}")
    print(f"==================================================")
    try:
        fn()
        print(f"[PASSED] {name}")
        return True
    except AssertionError as ae:
        print(f"[FAILED] Assertion Error in {name}: {ae}")
        return False
    except Exception as e:
        print(f"[FAILED] Unexpected Error in {name}: {e}")
        return False

def test_backend_health():
    res = requests.get(f"{BASE_URL}/health", timeout=5)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data.get("status") == "online", f"Status is not online: {data}"
    print(f"Health check status: {data.get('status')} - service: {data.get('service')}")

def test_subsidies_marginal_farmer():
    # Punjab, Wheat, 1.5 acres -> Marginal Farmer
    res = requests.get(f"{BASE_URL}/api/subsidies/recommended", params={
        "state": "Punjab",
        "crop": "Wheat",
        "acres": 1.5,
        "season": "Rabi"
    }, timeout=5)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "Marginal" in data["farmer_category"], f"Expected Marginal category, got {data['farmer_category']}"
    assert data["total_eligible_schemes"] > 0, "No eligible schemes found"
    assert data["total_estimated_benefit_inr"] > 0, "Benefit is 0"
    print(f"Category: {data['farmer_category']}")
    print(f"Eligible schemes count: {data['total_eligible_schemes']}")
    print(f"Total estimated benefit: ₹{data['total_estimated_benefit_inr']:,.2f}")
    for s in data["schemes"][:3]:
        print(f" - [{s['category']}] {s['title']} -> Rate: {s['subsidy_rate']}")

def test_subsidies_state_specific_haryana():
    # Haryana, Maize, 4.0 acres -> Should include 'Haryana - Mera Pani Meri Virasat'
    res = requests.get(f"{BASE_URL}/api/subsidies/recommended", params={
        "state": "Haryana",
        "crop": "Maize",
        "acres": 4.0,
        "season": "Kharif"
    }, timeout=5)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    scheme_titles = [s["title"] for s in data["schemes"]]
    has_haryana_scheme = any("Mera Pani Meri Virasat" in t for t in scheme_titles)
    assert has_haryana_scheme, f"Mera Pani Meri Virasat not found in {scheme_titles}"
    print(f"Haryana State Specific Scheme verified successfully: Mera Pani Meri Virasat is present!")

def test_subsidies_state_specific_maharashtra():
    # Maharashtra, Tomato, 2.0 acres -> Should include 'Maharashtra - Dr. Babasaheb Ambedkar Krishi Swavalamban'
    res = requests.get(f"{BASE_URL}/api/subsidies/recommended", params={
        "state": "Maharashtra",
        "crop": "Tomato",
        "acres": 2.0
    }, timeout=5)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    scheme_titles = [s["title"] for s in data["schemes"]]
    has_mh_scheme = any("Ambedkar Krishi Swavalamban" in t for t in scheme_titles)
    assert has_mh_scheme, f"Maharashtra scheme not found in {scheme_titles}"
    print(f"Maharashtra State Specific Scheme verified successfully!")

def test_insurance_rabi_rate_cap():
    # Wheat in Rabi -> Farmer rate should be capped at 1.5%
    res = requests.get(f"{BASE_URL}/api/insurance/quote", params={
        "crop": "Wheat",
        "state": "Punjab",
        "acres": 5.0,
        "season": "Rabi"
    }, timeout=5)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["farmer_rate_pct"] == 1.5, f"Expected 1.5%, got {data['farmer_rate_pct']}%"
    assert data["current_mandi_price_per_quintal"] > 0, "Mandi price is zero"
    assert data["total_sum_insured"] > 0, "Sum insured is zero"
    assert data["government_subsidy_amount"] > data["farmer_premium_payable"], "Govt subsidy should exceed farmer share"
    print(f"Wheat (Rabi): Mandi Rate = ₹{data['current_mandi_price_per_quintal']}/Qtl")
    print(f"Total Sum Insured = ₹{data['total_sum_insured']:,.2f}")
    print(f"Farmer Premium (1.5% Capped) = ₹{data['farmer_premium_payable']:,.2f}")
    print(f"Government Co-Subsidy ({data['subsidy_percentage']}%) = ₹{data['government_subsidy_amount']:,.2f}")

def test_insurance_kharif_rate_cap():
    # Rice in Kharif -> Farmer rate should be capped at 2.0%
    res = requests.get(f"{BASE_URL}/api/insurance/quote", params={
        "crop": "Rice",
        "state": "Punjab",
        "acres": 4.0,
        "season": "Kharif"
    }, timeout=5)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["farmer_rate_pct"] == 2.0, f"Expected 2.0%, got {data['farmer_rate_pct']}%"
    print(f"Rice (Kharif): Farmer Rate = {data['farmer_rate_pct']}% -> Farmer Premium: ₹{data['farmer_premium_payable']:,.2f}")

def test_insurance_horticulture_rate_cap():
    # Tomato -> Annual Horticulture -> Farmer rate should be 5.0%
    res = requests.get(f"{BASE_URL}/api/insurance/quote", params={
        "crop": "Tomato",
        "state": "Maharashtra",
        "acres": 2.0
    }, timeout=5)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["farmer_rate_pct"] == 5.0, f"Expected 5.0%, got {data['farmer_rate_pct']}%"
    print(f"Tomato (Horticulture): Farmer Rate = {data['farmer_rate_pct']}% -> Total Coverage: ₹{data['total_sum_insured']:,.2f}")

def test_dynamic_scheme_ingestion_and_reflection():
    # Ingest a new custom scheme notification for Rajasthan Mustard farmers
    unique_title = "Rajasthan Desert Mustard Soil Revitalization Grant 2026"
    circular_text = f"""
    RAJASTHAN KRISHI VIBHAG CIRCULAR
    {unique_title}:
    Financial subsidy of Rs 5,500 per hectare is hereby sanctioned for all Mustard growers in Rajasthan.
    Applies to small, marginal, and large farmers.
    Deadline: December 20, 2026.
    Required: Jan Aadhaar and Jamabandi.
    """
    res = requests.post(f"{BASE_URL}/api/subsidies/ingest", json={
        "text_announcement": circular_text,
        "source_url": "https://krishi.rajasthan.gov.in/mustard-2026"
    }, timeout=10)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    res_data = res.json()
    assert res_data["success"] is True, f"Ingestion failed: {res_data}"
    print(f"Ingested successfully with action: {res_data['action']}")

    # Immediately query recommended subsidies for a Mustard farmer in Rajasthan
    rec_res = requests.get(f"{BASE_URL}/api/subsidies/recommended", params={
        "state": "Rajasthan",
        "crop": "Mustard",
        "acres": 3.0
    }, timeout=5)
    rec_data = rec_res.json()
    found = any("Mustard" in s["title"] or "Mustard" in s.get("description", "") for s in rec_data["schemes"])
    assert found, "Newly ingested scheme did not immediately reflect in recommended API feed!"
    print(f"[VERIFIED] Newly ingested scheme immediately populated in farmer feed!")

def test_frontend_routes():
    routes = [
        ("/", "Landing Page"),
        ("/dashboard", "Dashboard Page"),
        ("/market", "Market Page"),
        ("/mandi", "Mandi Page"),
        ("/climate", "Climate Page"),
        ("/yield", "Yield Predictor Page"),
        ("/subsidies", "Subsidies & Insurance Page"),
        ("/profile", "Farmer Profile Page")
    ]
    for r, name in routes:
        res = requests.get(f"{FRONTEND_URL}{r}", timeout=10)
        assert res.status_code == 200, f"Route {r} ({name}) failed with code {res.status_code}"
        print(f" - Route {r.ljust(12)} ({name}): HTTP {res.status_code} OK")

def main():
    print("================================================================")
    print("   AGRISENSE END-TO-END AUTOMATED VERIFICATION SUITE")
    print("================================================================")

    tests = [
        ("Backend Health Check", test_backend_health),
        ("Subsidies: Marginal Farmer Land Bracket Filtering", test_subsidies_marginal_farmer),
        ("Subsidies: Haryana State-Specific Policy (Mera Pani)", test_subsidies_state_specific_haryana),
        ("Subsidies: Maharashtra State-Specific Policy (Well/Irrigation)", test_subsidies_state_specific_maharashtra),
        ("Insurance: PMFBY Rabi 1.5% Capped Rate with Live Mandi Prices", test_insurance_rabi_rate_cap),
        ("Insurance: PMFBY Kharif 2.0% Capped Rate", test_insurance_kharif_rate_cap),
        ("Insurance: PMFBY Horticulture 5.0% Capped Rate", test_insurance_horticulture_rate_cap),
        ("Dynamic Ingestion Engine & Instant Reflection", test_dynamic_scheme_ingestion_and_reflection),
        ("Frontend: All Next.js Routes Compilation & Response", test_frontend_routes),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        ok = run_test(name, fn)
        if ok:
            passed += 1
        else:
            failed += 1

    print("\n" + "="*60)
    print(f"SUITE COMPLETE: {passed}/{len(tests)} PASSED, {failed} FAILED")
    print("="*60)
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
