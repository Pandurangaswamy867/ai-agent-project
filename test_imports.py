import sys
import os

# Add backend to sys.path
backend_path = os.path.abspath("backend")
if backend_path not in sys.path:
    sys.path.append(backend_path)

try:
    from backend.routers import matching, claims, analytics, products, snps, transaction_ledger, mse_onboarding, partnerships, conflicts, documents, system_logs
    print("All routers imported successfully.")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
