import os
import sys

# Ensure scam_road root is on pythonpath
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app
from backend.app.models import Base

def audit_routes():
    schema = app.openapi()
    paths = schema.get("paths", {})
    endpoint_count = 0
    print(f"Total OpenAPI Paths: {len(paths)}")
    for path, methods in sorted(paths.items()):
        for method, details in methods.items():
            endpoint_count += 1
            summary = details.get("summary", "")
            tags = ",".join(details.get("tags", []))
            print(f"  {method.upper():<7} {path:<45} [{tags}] - {summary}")
    print(f"Total Individual Endpoints: {endpoint_count}")
    return paths

def audit_models():
    tables = Base.metadata.tables
    print(f"\nTotal Database Tables in Base.metadata: {len(tables)}")
    for t_name, table in sorted(tables.items()):
        cols = [c.name for c in table.columns]
        pk = [c.name for c in table.primary_key.columns]
        fks = [f"{fk.parent.name}->{fk.target_fullname}" for fk in table.foreign_keys]
        print(f"  Table: {t_name} ({len(cols)} cols, PK: {pk}, FKs: {len(fks)})")
    return tables

def main():
    audit_routes()
    print("\n--- DATABASE TABLES ---")
    audit_models()

if __name__ == "__main__":
    main()
