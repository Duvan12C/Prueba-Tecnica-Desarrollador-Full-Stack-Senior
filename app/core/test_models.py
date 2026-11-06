from app.core.database import Base

import app.modules.audit.models
import app.modules.documents.model
import app.modules.invitations.models
import app.modules.permissions.models
import app.modules.users.models
import app.modules.versions.models
import app.modules.spaceswork.models


print("TABLAS REGISTRADAS:")

for table_name in Base.metadata.tables:
    print(f"- {table_name}")

print(f"\nTOTAL: {len(Base.metadata.tables)} tablas")
