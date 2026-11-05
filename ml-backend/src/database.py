# src/database.py

import os
import sqlite3
import json
from datetime import datetime


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATABASE_DIR = os.path.join(BASE_DIR, "database")
DATABASE_PATH = os.path.join(
    DATABASE_DIR,
    "cybervault.db"
)


def get_connection():
    os.makedirs(DATABASE_DIR, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            timestamp TEXT NOT NULL,

            threat TEXT NOT NULL,

            attack_type TEXT,

            confidence REAL,

            binary_confidence REAL,

            risk_score INTEGER,

            severity TEXT,

            recommended_actions TEXT,

            status TEXT DEFAULT 'NEW'
        )
    """)

    connection.commit()
    connection.close()


def save_alert(alert):

    connection = get_connection()

    cursor = connection.cursor()

    timestamp = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO alerts (
            timestamp,
            threat,
            attack_type,
            confidence,
            binary_confidence,
            risk_score,
            severity,
            recommended_actions,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        timestamp,
        alert.get("threat"),
        alert.get("attack_type"),
        alert.get("confidence"),
        alert.get("binary_confidence"),
        alert.get("risk_score"),
        alert.get("severity"),
        json.dumps(alert.get("recommended_actions", [])),
        "NEW"
    ))

    alert_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return alert_id


def get_alerts():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM alerts
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    alerts = []

    for row in rows:

        alert = dict(row)

        alert["recommended_actions"] = json.loads(
            alert["recommended_actions"]
        )

        alerts.append(alert)

    return alerts


def get_alert(alert_id):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM alerts
        WHERE id = ?
    """, (alert_id,))

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    alert = dict(row)

    alert["recommended_actions"] = json.loads(
        alert["recommended_actions"]
    )

    return alert


def update_alert_status(alert_id, status):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        UPDATE alerts
        SET status = ?
        WHERE id = ?
    """, (status, alert_id))

    connection.commit()

    updated = cursor.rowcount > 0

    connection.close()

    return updated


if __name__ == "__main__":

    initialize_database()

    print("CyberVault database initialized.")
    print(f"Database: {DATABASE_PATH}")