from risk_engine import generate_security_alert
from database import (
    initialize_database,
    save_alert,
    get_alert,
    update_alert_status
)

# Step 1: Initialize database
initialize_database()

# Step 2: Generate a test security alert
alert = generate_security_alert(
    threat="ATTACK",
    attack_type="DDoS",
    confidence=0.97,
    flow_packets=1500
)

print("\n1. GENERATED SECURITY ALERT")
print(alert)

# Step 3: Save alert in database
alert_id = save_alert(alert)

print("\n2. ALERT SAVED SUCCESSFULLY")
print("Alert ID:", alert_id)

# Step 4: Retrieve saved alert
saved_alert = get_alert(alert_id)

print("\n3. RETRIEVED ALERT")
print(saved_alert)

# Step 5: Update its status
updated = update_alert_status(
    alert_id,
    "INVESTIGATING"
)

print("\n4. STATUS UPDATE")
print("Updated:", updated)

# Step 6: Verify updated status
final_alert = get_alert(alert_id)

print("\n5. FINAL ALERT STATUS")
print("Status:", final_alert["status"])
