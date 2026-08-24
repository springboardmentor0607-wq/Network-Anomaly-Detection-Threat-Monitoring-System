from database import Base, engine
import models  # noqa: F401 (import needed so SQLAlchemy sees the User model)

Base.metadata.create_all(bind=engine)
print("Tables created successfully.")