import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
from services.mandi_pipeline import mandi_pipeline

def test_mandi_pipeline():
    print("==================================================")
    print("TEST: Mandi Live Pipeline & Arbitrage Engine")
    print("==================================================")

    # 1. Test fetching all rates
    all_rates = mandi_pipeline.get_mandi_rates()
    assert all_rates["total_mandis"] > 0, "No mandi records loaded!"
    print(f"[OK] Loaded {all_rates['total_mandis']} APMC Mandi records across states: {all_rates['active_states']}")
    print(f"     Commodities monitored: {all_rates['commodities']}")

    # 2. Test filtering by state (Punjab) and commodity (Wheat)
    punjab_wheat = mandi_pipeline.get_mandi_rates(state="Punjab", commodity="Wheat")
    assert punjab_wheat["total_mandis"] >= 2, f"Expected at least 2 Punjab Wheat mandis, got {punjab_wheat['total_mandis']}"
    print(f"[OK] Filtered Punjab Wheat: {punjab_wheat['total_mandis']} mandis found:")
    for r in punjab_wheat["records"]:
        print(f"     - {r['market']}: ₹{r['modal_price']}/Qtl (Range: ₹{r['min_price']} - ₹{r['max_price']}, Arrivals: {r['arrivals_tonnes']}T)")

    # 3. Test Arbitrage Engine
    arbitrage = mandi_pipeline.get_arbitrage_opportunity(commodity="Wheat", state="Punjab")
    assert arbitrage["price_spread_inr"] > 0, "Expected positive price spread between mandis"
    print(f"[OK] Arbitrage Opportunity Calculated:")
    print(f"     Top Market: {arbitrage['highest_paying_mandi']} @ ₹{arbitrage['highest_modal_price']}/Qtl")
    print(f"     Lowest Market: {arbitrage['lowest_paying_mandi']} @ ₹{arbitrage['lowest_modal_price']}/Qtl")
    print(f"     Net Spread: +₹{arbitrage['price_spread_inr']}/Qtl ({arbitrage['spread_percentage']}%)")
    print(f"     Recommendation: {arbitrage['recommendation']}")

    # 4. Test Maharashtra Onion (Lasalgaon)
    lasalgaon = mandi_pipeline.get_mandi_rates(state="Maharashtra", commodity="Onion")
    assert lasalgaon["total_mandis"] >= 1, "Lasalgaon onion record not found"
    print(f"[OK] Maharashtra Onion Market Verified: {lasalgaon['records'][0]['market']} -> Modal: ₹{lasalgaon['records'][0]['modal_price']}/Qtl")

    # 5. Test Daily Sync trigger
    sync_res = mandi_pipeline.sync_daily_rates()
    assert sync_res["success"] is True, "Sync failed"
    print(f"[OK] Daily Agmarknet Sync simulated: {sync_res['message']}")

    print("\nAll Phase 2 Mandi Pipeline checks passed successfully!")

if __name__ == "__main__":
    test_mandi_pipeline()
