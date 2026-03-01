import sys
from database import engine, Base
from models.user import User
from models.vault import Vault
from models.password import Password

print("Esto va a BORRAR TODAS LAS TABLAS y datos en la base de datos.")

force_mode = "--force" in sys.argv

if force_mode:
    confirm = "si"
    print("Modo automático detectado. Omitiendo confirmación...")
else:
    try:
        confirm = input("¿Estás seguro de que deseas continuar? (escribe 'si' para confirmar): ")
    except EOFError:
        print("\nError: No se puede leer la entrada (¿estás en un contenedor Docker sin -it?). Usa: python reset_db.py --force")
        sys.exit(1)

if confirm.lower() == 'si':
    print("Borrando todas las tablas...")
    Base.metadata.drop_all(bind=engine)
    print("Tablas borradas.")

    print("Recreando las tablas desde cero...")
    Base.metadata.create_all(bind=engine)
    print("Base de datos limpia y lista para usar.")
else:
    print("Operación cancelada. No se ha borrado nada.")
