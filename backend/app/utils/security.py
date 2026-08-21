from passlib.context import CryptContext

# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# Hash a password
def hash_password(password: str):
    return pwd_context.hash(password)

# Verify a password
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)