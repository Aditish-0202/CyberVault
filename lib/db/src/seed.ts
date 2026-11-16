import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

/**
 * Seeds the demo dataset used by the dashboard.
 *
 * Runs automatically when the embedded PGlite database is empty, and does
 * nothing when data already exists.
 */
export async function seedDatabase(
  db: NodePgDatabase<typeof schema>,
): Promise<void> {
  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(schema.usersTable);

  if (Number(userCount) > 0) {
    return;
  }

  const now = Date.now();
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000);

  const passwordHash = await bcrypt.hash("password", 10);

  const [user] = await db
    .insert(schema.usersTable)
    .values({
      name: "Alex Morgan",
      email: "admin@cybershield.io",
      passwordHash,
      role: "admin",
      department: "Security Operations",
      phone: "+1 (555) 014-2200",
      location: "New York, US",
      bio: "SOC lead focused on threat hunting and incident response.",
      lastLogin: minutesAgo(35),
    })
    .returning();

  await db.insert(schema.settingsTable).values({ userId: user.id });

  await db.insert(schema.notificationsTable).values([
    {
      userId: user.id,
      title: "Critical ransomware signature blocked",
      message: "NYC-DB-02 blocked a ransomware payload before execution.",
      type: "alert",
      severity: "critical",
      linkUrl: "/alerts",
      createdAt: minutesAgo(12),
    },
    {
      userId: user.id,
      title: "Device agent offline",
      message: "LON-IOT-309 has not reported in for 40 minutes.",
      type: "warning",
      severity: "medium",
      linkUrl: "/devices",
      createdAt: minutesAgo(40),
    },
    {
      userId: user.id,
      title: "Weekly security report ready",
      message: "Your security posture summary for this week is available.",
      type: "info",
      severity: "low",
      createdAt: minutesAgo(180),
    },
    {
      userId: user.id,
      title: "ML detection model updated",
      message: "The flow classifier was refreshed with new CIC-IDS signatures.",
      type: "info",
      severity: "low",
      linkUrl: "/detection",
      createdAt: minutesAgo(300),
    },
  ]);

  const deviceRows = await db
    .insert(schema.devicesTable)
    .values([
      {
        name: "NYC-SRV-01",
        ipAddress: "10.0.1.12",
        type: "server",
        os: "Ubuntu 22.04 LTS",
        status: "online",
        cpuUsage: 34.2,
        memoryUsage: 61.8,
        diskUsage: 47.2,
        location: "New York, US",
        assignedUser: "Alex Morgan",
        riskScore: 12,
        openAlerts: 1,
        lastSeen: minutesAgo(1),
      },
      {
        name: "NYC-DB-02",
        ipAddress: "10.0.1.30",
        type: "database",
        os: "Ubuntu 22.04 LTS",
        status: "critical",
        cpuUsage: 91.3,
        memoryUsage: 93.8,
        diskUsage: 88.6,
        location: "New York, US",
        assignedUser: "Alex Morgan",
        riskScore: 87,
        openAlerts: 5,
        lastSeen: minutesAgo(2),
      },
      {
        name: "LON-WKS-114",
        ipAddress: "10.0.2.44",
        type: "workstation",
        os: "Windows 11 Pro",
        status: "online",
        cpuUsage: 22.5,
        memoryUsage: 48.3,
        diskUsage: 62.1,
        location: "London, UK",
        assignedUser: "Priya Shah",
        riskScore: 8,
        openAlerts: 0,
        lastSeen: minutesAgo(1),
      },
      {
        name: "SGP-SRV-07",
        ipAddress: "10.0.3.7",
        type: "server",
        os: "Debian 12",
        status: "warning",
        cpuUsage: 78.4,
        memoryUsage: 84.2,
        diskUsage: 71.5,
        location: "Singapore, SG",
        assignedUser: "Wei Chen",
        riskScore: 46,
        openAlerts: 3,
        lastSeen: minutesAgo(4),
      },
      {
        name: "FRA-WKS-021",
        ipAddress: "10.0.4.21",
        type: "workstation",
        os: "macOS 15",
        status: "online",
        cpuUsage: 18.9,
        memoryUsage: 55.1,
        diskUsage: 38.4,
        location: "Frankfurt, DE",
        assignedUser: "Lukas Meyer",
        riskScore: 5,
        openAlerts: 0,
        lastSeen: minutesAgo(3),
      },
      {
        name: "LON-IOT-309",
        ipAddress: "10.0.2.90",
        type: "iot",
        os: "Embedded Linux",
        status: "offline",
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        location: "London, UK",
        riskScore: 22,
        openAlerts: 1,
        lastSeen: minutesAgo(58),
      },
      {
        name: "TOK-WKS-008",
        ipAddress: "10.0.5.8",
        type: "workstation",
        os: "Windows 11 Pro",
        status: "online",
        cpuUsage: 27.6,
        memoryUsage: 52.4,
        diskUsage: 44.9,
        location: "Tokyo, JP",
        assignedUser: "Haruto Sato",
        riskScore: 9,
        openAlerts: 0,
        lastSeen: minutesAgo(2),
      },
      {
        name: "SYD-SRV-03",
        ipAddress: "10.0.6.3",
        type: "server",
        os: "RHEL 9",
        status: "warning",
        cpuUsage: 66.1,
        memoryUsage: 72.5,
        diskUsage: 58.3,
        location: "Sydney, AU",
        assignedUser: "Mia Wilson",
        riskScore: 38,
        openAlerts: 2,
        lastSeen: minutesAgo(6),
      },
      {
        name: "NYC-WKS-212",
        ipAddress: "10.0.1.77",
        type: "workstation",
        os: "macOS 15",
        status: "online",
        cpuUsage: 31.4,
        memoryUsage: 49.7,
        diskUsage: 51.0,
        location: "New York, US",
        assignedUser: "Alex Morgan",
        riskScore: 14,
        openAlerts: 1,
        lastSeen: minutesAgo(1),
      },
    ])
    .returning({ id: schema.devicesTable.id });

  const deviceId = (index: number) => deviceRows[index]?.id;

  await db.insert(schema.alertsTable).values([
    {
      title: "Ransomware signature detected",
      description:
        "LockBit 3.0 payload quarantined on the primary database host before execution.",
      severity: "critical",
      status: "open",
      source: "Endpoint Protection",
      sourceIp: "185.220.101.42",
      targetIp: "10.0.1.30",
      deviceId: deviceId(1),
      deviceName: "NYC-DB-02",
      attackType: "Ransomware",
      mitreTactic: "Impact",
      createdAt: minutesAgo(12),
    },
    {
      title: "Zero-day exploit attempt",
      description:
        "Memory corruption attempt against the web tier matched a known exploit pattern.",
      severity: "critical",
      status: "open",
      source: "IDS",
      sourceIp: "45.155.205.233",
      targetIp: "10.0.1.12",
      deviceId: deviceId(0),
      deviceName: "NYC-SRV-01",
      attackType: "Zero-Day",
      mitreTactic: "Initial Access",
      createdAt: minutesAgo(28),
    },
    {
      title: "Unusual privilege escalation",
      description:
        "Service account gained administrative rights outside the approved change window.",
      severity: "critical",
      status: "acknowledged",
      source: "SIEM",
      sourceIp: "10.0.3.7",
      targetIp: "10.0.3.1",
      deviceId: deviceId(3),
      deviceName: "SGP-SRV-07",
      attackType: "Privilege Escalation",
      mitreTactic: "Privilege Escalation",
      createdAt: minutesAgo(64),
    },
    {
      title: "Brute force attempt against SSH",
      description:
        "1,284 failed authentication attempts from a single address in 10 minutes.",
      severity: "high",
      status: "open",
      source: "IDS",
      sourceIp: "103.97.3.44",
      targetIp: "10.0.1.12",
      deviceId: deviceId(0),
      deviceName: "NYC-SRV-01",
      attackType: "SSH-Patator",
      mitreTactic: "Credential Access",
      createdAt: minutesAgo(37),
    },
    {
      title: "Malware quarantine failed",
      description:
        "The endpoint agent could not remove a trojan binary and requires manual cleanup.",
      severity: "high",
      status: "acknowledged",
      source: "Endpoint Protection",
      sourceIp: "10.0.2.44",
      targetIp: "10.0.2.1",
      deviceId: deviceId(2),
      deviceName: "LON-WKS-114",
      attackType: "Malware",
      mitreTactic: "Execution",
      createdAt: minutesAgo(95),
    },
    {
      title: "SQL injection attempt blocked",
      description:
        "WAF blocked a UNION-based injection payload against the reporting endpoint.",
      severity: "high",
      status: "open",
      source: "WAF",
      sourceIp: "91.240.118.15",
      targetIp: "10.0.1.12",
      deviceId: deviceId(0),
      deviceName: "NYC-SRV-01",
      attackType: "SQL Injection",
      mitreTactic: "Initial Access",
      createdAt: minutesAgo(132),
    },
    {
      title: "DDoS traffic spike",
      description:
        "Inbound traffic reached 4.2 Gbps, roughly 9x the normal baseline.",
      severity: "high",
      status: "open",
      source: "Network Sensor",
      sourceIp: "198.51.100.23",
      targetIp: "10.0.6.3",
      deviceId: deviceId(7),
      deviceName: "SYD-SRV-03",
      attackType: "DDoS",
      mitreTactic: "Impact",
      createdAt: minutesAgo(160),
    },
    {
      title: "Suspicious outbound traffic",
      description:
        "Periodic beaconing to a newly registered domain observed from a workstation.",
      severity: "medium",
      status: "open",
      source: "Network Sensor",
      sourceIp: "10.0.1.77",
      targetIp: "203.0.113.77",
      deviceId: deviceId(8),
      deviceName: "NYC-WKS-212",
      attackType: "Command and Control",
      mitreTactic: "Command and Control",
      createdAt: minutesAgo(210),
    },
    {
      title: "Phishing link clicked",
      description:
        "User opened a credential-harvesting page; credentials were reset automatically.",
      severity: "medium",
      status: "resolved",
      source: "Email Gateway",
      sourceIp: "192.0.2.55",
      targetIp: "10.0.2.44",
      deviceId: deviceId(2),
      deviceName: "LON-WKS-114",
      attackType: "Phishing",
      mitreTactic: "Initial Access",
      resolvedAt: minutesAgo(240),
      createdAt: minutesAgo(430),
    },
    {
      title: "Policy violation: USB storage",
      description:
        "Unapproved removable storage device connected to a finance workstation.",
      severity: "medium",
      status: "acknowledged",
      source: "DLP",
      sourceIp: "10.0.4.21",
      targetIp: "10.0.4.1",
      deviceId: deviceId(4),
      deviceName: "FRA-WKS-021",
      attackType: "Data Exfiltration",
      mitreTactic: "Exfiltration",
      createdAt: minutesAgo(300),
    },
    {
      title: "Port scan from external host",
      description:
        "Sequential probing across 1,024 ports detected and automatically blocked.",
      severity: "low",
      status: "resolved",
      source: "Firewall",
      sourceIp: "203.0.113.9",
      targetIp: "10.0.5.8",
      deviceId: deviceId(6),
      deviceName: "TOK-WKS-008",
      attackType: "Port Scan",
      mitreTactic: "Discovery",
      resolvedAt: minutesAgo(520),
      createdAt: minutesAgo(720),
    },
    {
      title: "Expired TLS certificate",
      description:
        "The internal API endpoint is serving an expired certificate.",
      severity: "low",
      status: "open",
      source: "Scanner",
      sourceIp: "10.0.1.12",
      targetIp: "10.0.1.12",
      deviceId: deviceId(0),
      deviceName: "NYC-SRV-01",
      attackType: "Misconfiguration",
      mitreTactic: "None",
      createdAt: minutesAgo(880),
    },
  ]);

  await db.insert(schema.logsTable).values([
    { level: "info", message: "Threat intelligence feed synchronised (14,204 indicators)", source: "feed-sync", createdAt: minutesAgo(8) },
    { level: "warn", message: "CPU usage on SGP-SRV-07 exceeded 75% threshold", source: "monitor", sourceIp: "10.0.3.7", createdAt: minutesAgo(14) },
    { level: "error", message: "Endpoint agent on LON-IOT-309 stopped reporting", source: "agent", sourceIp: "10.0.2.90", createdAt: minutesAgo(58) },
    { level: "info", message: "User admin@cybershield.io signed in", source: "auth", userId: user.id, createdAt: minutesAgo(35) },
    { level: "error", message: "Ransomware signature blocked on NYC-DB-02", source: "endpoint", sourceIp: "10.0.1.30", createdAt: minutesAgo(12) },
    { level: "info", message: "Firewall policy 'edge-hardening' applied", source: "firewall", createdAt: minutesAgo(72) },
    { level: "debug", message: "Rule engine evaluated 2,918 events in 41ms", source: "siem", createdAt: minutesAgo(20) },
    { level: "warn", message: "Certificate for internal API expires in 6 days", source: "scanner", sourceIp: "10.0.1.12", createdAt: minutesAgo(140) },
    { level: "info", message: "Backup completed for NYC-DB-02 (48.2 GB)", source: "backup", sourceIp: "10.0.1.30", createdAt: minutesAgo(210) },
    { level: "error", message: "Failed SSH authentication for svc_backup (12 attempts)", source: "auth", sourceIp: "103.97.3.44", createdAt: minutesAgo(37) },
    { level: "info", message: "Vulnerability scan finished: 3 high findings", source: "scanner", createdAt: minutesAgo(260) },
    { level: "warn", message: "Outbound beaconing pattern matched C2 heuristic", source: "ids", sourceIp: "10.0.1.77", createdAt: minutesAgo(210) },
    { level: "debug", message: "Log rotation completed (7 files archived)", source: "system", createdAt: minutesAgo(330) },
    { level: "info", message: "ML detection service reloaded flow classifier", source: "ml-service", createdAt: minutesAgo(360) },
  ]);

  await db.insert(schema.activitiesTable).values([
    { type: "alert_resolved", message: "Phishing alert resolved after credential reset", userId: user.id, userName: "Alex Morgan", resourceType: "alert", resourceId: 9, severity: "medium", createdAt: minutesAgo(240) },
    { type: "device_added", message: "Workstation NYC-WKS-212 enrolled", userId: user.id, userName: "Alex Morgan", resourceType: "device", resourceId: deviceId(8), severity: "low", createdAt: minutesAgo(600) },
    { type: "settings_updated", message: "Notification preferences updated", userId: user.id, userName: "Alex Morgan", resourceType: "settings", severity: "low", createdAt: minutesAgo(480) },
    { type: "alert_resolved", message: "Port scan alert closed as false positive", userId: user.id, userName: "Alex Morgan", resourceType: "alert", resourceId: 11, severity: "low", createdAt: minutesAgo(520) },
    { type: "policy_created", message: "USB storage policy enforced on finance devices", userId: user.id, userName: "Alex Morgan", resourceType: "policy", severity: "medium", createdAt: minutesAgo(720) },
    { type: "user_login", message: "Signed in from 10.0.1.5", userId: user.id, userName: "Alex Morgan", resourceType: "user", resourceId: user.id, severity: "low", createdAt: minutesAgo(35) },
    { type: "scan_completed", message: "Nightly vulnerability scan completed", userId: user.id, userName: "Alex Morgan", resourceType: "scan", severity: "low", createdAt: minutesAgo(260) },
    { type: "alert_created", message: "Critical ransomware alert raised by endpoint agent", userId: user.id, userName: "Alex Morgan", resourceType: "alert", resourceId: 1, severity: "critical", createdAt: minutesAgo(12) },
  ]);
}
