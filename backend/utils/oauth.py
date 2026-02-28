from google.oauth2 import id_token
from google.auth.transport import requests
from config import config 

def verify_google_token(token: str) -> dict | None:
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            config.googleClientId
        )
        return idinfo 
    except ValueError:
        return None