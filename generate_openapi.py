import json
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from main import app
from fastapi.openapi.utils import get_openapi

def generate_spec():
    # Force loading of all routes
    openapi_schema = get_openapi(
        title="TEAM Initiative API",
        version="1.0.0",
        description="AI-Driven MSE Agent Mapping Platform",
        routes=app.routes,
    )
    
    with open("docs/openapi_spec.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)
    print("OpenAPI spec generated at docs/openapi_spec.json")

if __name__ == "__main__":
    generate_spec()
