import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
import schemas
print(schemas.LoginRequest.model_fields.keys())
