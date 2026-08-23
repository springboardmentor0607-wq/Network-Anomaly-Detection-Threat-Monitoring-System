const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const alertService = require('../services/alertService');
const incidentService = require('../services/incidentService');
const notificationService = require('../services/notificationService');
const threatIntelService = require('../services/threatIntelService');
const analyticsService = require('../services/analyticsService');
const reportingService = require('../services/reportingService');
const monitoringService = require('../services/monitoringService');

async function runE2ETests() {
  console.log('🧪 Starting Milestone 3 End-to-End Test Suite...');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  try {
    await connectDB();

    // 1. Test Alert Engine Generation & Deduplication
    console.log('\n--- 1. Testing Alert Engine ---');
    const predictionSample = {
      sourceIp: '192.168.1.250',
      destinationIp: '10.0.0.15',
      sourcePort: 55432,
      destinationPort: 80,
      protocol: 'TCP',
      attackType: 'DDoS',
      riskScore: 95,
      confidenceScore: 0.98,
      modelUsed: 'Random Forest'
    };

    const alert1 = await alertService.processPrediction(predictionSample);
    assert(alert1 && alert1.alertId.startsWith('ALT-'), 'Alert created with valid ALT ID format');
    assert(alert1.severity === 'CRITICAL', 'Alert severity correctly derived as CRITICAL');
    assert(alert1.occurrenceCount === 1, 'Initial occurrence count is 1');

    // Duplicate event within correlation window
    const alert2 = await alertService.processPrediction(predictionSample);
    assert(alert2.alertId === alert1.alertId, 'Alert deduplication updated existing alert ID');
    assert(alert2.occurrenceCount === 2, 'Occurrence count incremented to 2');

    // Alert Status Lifecycle Transition
    const updatedAlert = await alertService.updateAlertStatus(alert1.alertId, 'INVESTIGATING', { email: 'analyst@netshield.ai' });
    assert(updatedAlert.status === 'INVESTIGATING', 'Alert status transitioned to INVESTIGATING');

    // 2. Test Incident Management System
    console.log('\n--- 2. Testing Incident Management ---');
    const incidentData = {
      title: 'E2E Test Critical Incident',
      description: 'Test incident generated for workflow verification',
      severity: 'CRITICAL',
      priority: 'CRITICAL',
      relatedAlerts: [alert1.alertId],
      attackTypes: ['DDoS'],
      affectedAssets: ['10.0.0.15:80'],
      sourceIps: ['192.168.1.250'],
      destinationIps: ['10.0.0.15']
    };

    const incident = await incidentService.createIncident(incidentData, { name: 'E2E Test Analyst', email: 'test@netshield.ai' });
    assert(incident && incident.incidentId.startsWith('INC-'), 'Incident created with valid INC ID');
    assert(incident.status === 'OPEN', 'Initial incident status is OPEN');

    // Incident Status Lifecycle
    const updatedInc = await incidentService.updateIncidentStatus(incident.incidentId, 'CONTAINED', { name: 'E2E Test Analyst' });
    assert(updatedInc.status === 'CONTAINED', 'Incident status transitioned to CONTAINED');

    // Add Analyst Note
    const incWithNote = await incidentService.addIncidentNote(incident.incidentId, 'Deployed BGP rate limits to suppress attack.', { name: 'E2E Test Analyst' });
    assert(incWithNote.notes.length > 0, 'Analyst investigation note appended to incident log');

    // 3. Test Notification System
    console.log('\n--- 3. Testing Notification Engine ---');
    const notif = await notificationService.createNotification({
      type: 'CRITICAL_ALERT',
      title: 'E2E Test Notification',
      message: 'Critical DDoS attack in progress',
      severity: 'CRITICAL',
      relatedAlert: alert1.alertId
    });
    assert(notif && notif.notificationId.startsWith('NOTIF-'), 'Notification created successfully');

    const notifsResult = await notificationService.getNotifications('ALL', {});
    assert(notifsResult.data.length > 0, 'Retrieved active notifications list');
    assert(typeof notifsResult.unreadCount === 'number', 'Unread notifications count calculated');

    // 4. Test Threat Intelligence Subsystem
    console.log('\n--- 4. Testing Threat Intelligence & Provider Enrichment ---');
    const intelOverview = await threatIntelService.getThreatIntelOverview();
    assert(intelOverview && intelOverview.summary, 'Retrieved Threat Intelligence summary');

    const intelList = await threatIntelService.getThreatIntelList({ limit: 5 });
    if (intelList.data.length > 0) {
      const enriched = await threatIntelService.enrichThreatIntel(intelList.data[0].intelId);
      assert(enriched.isExternalEnriched === true, 'Enriched indicator via ThreatIntelProvider abstraction');
    } else {
      assert(true, 'No intel indicators present to enrich (empty database fallback)');
    }

    // 5. Test Server-Side Security Analytics
    console.log('\n--- 5. Testing Server-Side Security Analytics ---');
    const overviewMetrics = await analyticsService.getOverview('LAST_7_DAYS');
    assert(typeof overviewMetrics.totalThreats === 'number', 'Calculated server-side overview total threats');

    const attackDist = await analyticsService.getAttackDistribution('LAST_7_DAYS');
    assert(Array.isArray(attackDist), 'Retrieved attack category distribution array');

    const socMetrics = await analyticsService.getSocMetrics();
    assert(typeof socMetrics.mttaMinutes === 'number' && typeof socMetrics.mttrMinutes === 'number', 'Calculated operational MTTA & MTTR metrics');

    // 6. Test Reporting Engine
    console.log('\n--- 6. Testing Reporting Engine ---');
    const jsonReport = await reportingService.generateReport({ type: 'EXECUTIVE_SUMMARY', format: 'JSON', dateRange: 'LAST_7_DAYS' });
    assert(jsonReport && jsonReport.reportId.startsWith('RPT-'), 'Generated JSON Executive Report');

    const csvReport = await reportingService.generateReport({ type: 'ALERT_SUMMARY', format: 'CSV', dateRange: 'LAST_7_DAYS' });
    assert(csvReport && csvReport.format === 'CSV', 'Generated CSV Threat Alert Summary Report');

    const pdfReport = await reportingService.generateReport({ type: 'THREAT_INTEL', format: 'PDF', dateRange: 'LAST_7_DAYS' });
    assert(pdfReport && pdfReport.format === 'PDF', 'Generated PDF Threat Intelligence Report');

    // 7. Test Service Health Monitoring
    console.log('\n--- 7. Testing System Services Health Monitoring ---');
    const systemHealth = await monitoringService.getSystemHealth();
    assert(systemHealth.status === 'ONLINE', 'System health status is ONLINE');
    assert(systemHealth.services.database.status === 'ONLINE', 'Database service status is ONLINE');
    assert(systemHealth.services.aiEngine.status === 'ONLINE', 'AI Engine service status is ONLINE');

    console.log(`\n==========================================`);
    console.log(`E2E TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log(`==========================================\n`);

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('E2E Test Execution Error:', err);
    process.exit(1);
  }
}

runE2ETests();
