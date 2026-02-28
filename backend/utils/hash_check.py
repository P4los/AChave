import os

def check_hash(hash_value: str) -> str | None:

    if not hash_value:
        return None

    first_char = hash_value[0].lower()
    filename = f"diccionario_{first_char}.txt"
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bd_filtrada_dir = os.path.join(base_dir, "bd_filtrada")
    
    if not os.path.exists(bd_filtrada_dir):
        return None
        
    for root, dirs, files in os.walk(bd_filtrada_dir):
        if filename in files:
            filepath = os.path.join(root, filename)
            
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    search_string = f"{hash_value}:"
                    for line in f:
                        if line.startswith(search_string):
                            return line.strip().split(":", 1)[1]
            except Exception as e:
                print(f"Error procesando {filepath}: {e}")
                
    return None
