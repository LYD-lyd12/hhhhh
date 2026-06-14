import json
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64

class EncryptionService:
    def __init__(self, key: str):
        self.key = self._derive_key(key)
        self.fernet = Fernet(self.key)
    
    def _derive_key(self, password: str) -> bytes:
        salt = b'mcp-salt-fixed-16b'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        return base64.urlsafe_b64encode(kdf.derive(password.encode()))
    
    def encrypt(self, data: dict) -> str:
        json_str = json.dumps(data)
        return self.fernet.encrypt(json_str.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> dict:
        decrypted_bytes = self.fernet.decrypt(encrypted_data.encode())
        return json.loads(decrypted_bytes.decode())

encryption_service = EncryptionService("mcp-default-encryption-key-2024")
