# Importamos todos los modelos para asegurarnos de que se puedan inicializar 
# de forma segura cuando los llame Base.metadata.create_all() o Alembic

from .user import User
from .vault import Vault
from .password import Password
