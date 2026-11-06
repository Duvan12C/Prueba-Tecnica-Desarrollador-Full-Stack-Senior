from sqlalchemy import text
from app.core.database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT @@VERSION"))

        print("CONEXIÓN EXITOSA")
        print(result.scalar())

except Exception as error:
    print("ERROR DE CONEXIÓN:")
    print(error)