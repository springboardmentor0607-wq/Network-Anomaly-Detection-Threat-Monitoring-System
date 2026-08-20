from sqlalchemy import text
from database import engine


columns = {
    "dataset": "VARCHAR",
    "source": "VARCHAR",
    "risk_score": "INTEGER",
    "risk_level": "VARCHAR",
    "detection_details": "VARCHAR",
    "detected_at": "TIMESTAMP",
}


with engine.begin() as connection:

    for column, data_type in columns.items():

        connection.execute(
            text(
                f"""
                ALTER TABLE alerts
                ADD COLUMN IF NOT EXISTS {column} {data_type}
                """
            )
        )

print("Alerts table updated successfully.")