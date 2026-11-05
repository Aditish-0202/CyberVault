# src/risk_engine.py

ATTACK_RISK = {
    "DDoS": 90,
    "DoS Hulk": 85,
    "DoS GoldenEye": 80,
    "DoS slowloris": 75,
    "DoS Slowhttptest": 75,
    "PortScan": 65,
    "Bot": 80,
    "FTP-Patator": 75,
    "SSH-Patator": 75,
    "Heartbleed": 95,
    "Infiltration": 95,
    "Web Attack Brute Force": 70,
    "Web Attack Sql Injection": 90,
    "Web Attack XSS": 80,
}


def calculate_risk(
    threat,
    attack_type=None,
    confidence=0.0,
    flow_duration=None,
    flow_packets=None
):
    """
    Calculate a transparent cybersecurity risk score.

    Returns:
        risk_score: 0-100
        severity: LOW / MEDIUM / HIGH / CRITICAL
    """

    # BENIGN traffic
    if threat == "BENIGN":
        return {
            "risk_score": 0,
            "severity": "LOW"
        }

    # Base score from attack category
    base_score = ATTACK_RISK.get(attack_type, 60)

    # Confidence adjustment
    confidence_factor = confidence * 10

    risk_score = base_score + confidence_factor

    # Optional traffic-intensity adjustment
    if flow_packets is not None:
        if flow_packets > 1000:
            risk_score += 5
        elif flow_packets > 500:
            risk_score += 2

    # Keep score within 0-100
    risk_score = min(100, max(0, round(risk_score)))

    # Severity mapping
    if risk_score >= 90:
        severity = "CRITICAL"
    elif risk_score >= 75:
        severity = "HIGH"
    elif risk_score >= 50:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    return {
        "risk_score": risk_score,
        "severity": severity
    }


def get_recommended_actions(attack_type, severity):
    """
    Generate transparent response recommendations.
    """

    actions = []

    if attack_type in ["DDoS", "DoS Hulk", "DoS GoldenEye",
                       "DoS slowloris", "DoS Slowhttptest"]:
        actions.extend([
            "Monitor traffic volume and affected services",
            "Apply rate limiting or traffic filtering",
            "Investigate source IP concentration"
        ])

    elif attack_type == "PortScan":
        actions.extend([
            "Identify scanning source",
            "Review targeted ports and hosts",
            "Check for follow-up exploitation attempts"
        ])

    elif attack_type in ["FTP-Patator", "SSH-Patator",
                         "Web Attack Brute Force"]:
        actions.extend([
            "Review authentication failures",
            "Check affected accounts",
            "Consider temporary rate limiting or account protection"
        ])

    elif attack_type in ["Web Attack Sql Injection", "Web Attack XSS"]:
        actions.extend([
            "Inspect affected web requests",
            "Review application logs",
            "Validate input sanitization and web application controls"
        ])

    elif attack_type in ["Heartbleed", "Infiltration"]:
        actions.extend([
            "Isolate affected system if necessary",
            "Preserve relevant security evidence",
            "Investigate affected hosts and services"
        ])

    elif attack_type == "Bot":
        actions.extend([
            "Identify potentially compromised host",
            "Review outbound connections",
            "Investigate related malicious activity"
        ])

    else:
        actions.append("Investigate the detected security event")

    if severity == "CRITICAL":
        actions.insert(0, "Escalate incident for immediate investigation")

    return actions


def generate_security_alert(
    threat,
    attack_type=None,
    confidence=0.0,
    flow_duration=None,
    flow_packets=None
):
    """
    Generate the complete CyberVault SOC alert.
    """

    risk = calculate_risk(
        threat=threat,
        attack_type=attack_type,
        confidence=confidence,
        flow_duration=flow_duration,
        flow_packets=flow_packets
    )

    if threat == "BENIGN":
        actions = ["No immediate action required"]
    else:
        actions = get_recommended_actions(
            attack_type,
            risk["severity"]
        )

    return {
        "threat": threat,
        "attack_type": attack_type,
        "confidence": round(confidence, 4),
        "risk_score": risk["risk_score"],
        "severity": risk["severity"],
        "recommended_actions": actions
    }


if __name__ == "__main__":

    alert = generate_security_alert(
        threat="ATTACK",
        attack_type="DDoS",
        confidence=0.97,
        flow_packets=1500
    )

    print("\nCyberVault Security Alert")
    print("-" * 30)

    for key, value in alert.items():
        print(f"{key}: {value}")