from database import engine, Base

print("Esto va a BORRAR TODAS LAS TABLAS y datos en la base de datos.")
confirm = input("¿Estás seguro de que deseas continuar? (escribe 'si' para confirmar): ")

if confirm.lower() == 'si':
    print("Borrando todas las tablas...")
    Base.metadata.drop_all(bind=engine)
    print("Tablas borradas.")

    print("Recreando las tablas desde cero...")
    Base.metadata.create_all(bind=engine)
    print("Base de datos limpia y lista para usar.")
else:
    print("Operación cancelada. No se ha borrado nada.")
