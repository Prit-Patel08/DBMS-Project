const app = require('../src/app');
const pool = require('../src/config/db');

let server;
let baseUrl;

const startServer = async () => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Server] Started test server on ${baseUrl}`);
      resolve();
    });
  });
};

const stopServer = async () => {
  if (server) {
    server.close();
  }
  await pool.end();
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('  STARTING AUTOMATED HACKARENA INTEGRATION TESTS');
  console.log('======================================================\n');

  await startServer();
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Healthcheck
    // -------------------------------------------------------------
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'Healthcheck endpoint responds 200 OK');

    // -------------------------------------------------------------
    // Test 2: Admin Login
    // -------------------------------------------------------------
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hackarena.com', password: 'Admin@123' })
    });
    const adminCookie = adminLoginRes.headers.get('set-cookie');
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user.role === 'admin', 'Admin login authenticates with valid credentials');
    assert(adminCookie && adminCookie.includes('token='), 'Admin receives secure HTTP-only session cookie');

    // -------------------------------------------------------------
    // Test 3: Unauthorized Access Prevention
    // -------------------------------------------------------------
    const unauthRes = await fetch(`${baseUrl}/api/participants`);
    assert(unauthRes.status === 401, 'Unauthenticated request to Admin /api/participants is rejected with 401');

    // -------------------------------------------------------------
    // Test 4: Admin Access to Participants List
    // -------------------------------------------------------------
    const adminPartsRes = await fetch(`${baseUrl}/api/participants`, {
      headers: { Cookie: adminCookie }
    });
    const adminPartsData = await adminPartsRes.json();
    assert(adminPartsRes.status === 200 && Array.isArray(adminPartsData.data), 'Admin can list registered participants');
    assert(adminPartsData.data.every(p => p.password_hash === undefined), 'Participant password hashes are strictly withheld from output');

    // -------------------------------------------------------------
    // Test 5: Participant Registration
    // -------------------------------------------------------------
    const testEmail = `test.student.${Date.now()}@university.edu`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Test Student',
        email: testEmail,
        password: 'Password@123',
        college: 'Test Tech University',
        phone: '+1-555-0199'
      })
    });
    const regData = await regRes.json();
    const studentCookie = regRes.headers.get('set-cookie');
    assert(regRes.status === 201 && regData.user.email === testEmail, 'Participant registration succeeds with 201 Created');

    // -------------------------------------------------------------
    // Test 6: Duplicate Email Registration Rejection
    // -------------------------------------------------------------
    const dupRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: testEmail,
        password: 'Password@123'
      })
    });
    assert(dupRegRes.status === 409, 'Duplicate participant email registration is rejected with 409 Conflict');

    // -------------------------------------------------------------
    // Test 7: Participant Login
    // -------------------------------------------------------------
    const partLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Password@123' })
    });
    assert(partLoginRes.status === 200, 'Participant logs in successfully with valid credentials');

    // -------------------------------------------------------------
    // Test 8: Participant Blocked from Admin Routes
    // -------------------------------------------------------------
    const partAdminRes = await fetch(`${baseUrl}/api/participants`, {
      headers: { Cookie: studentCookie }
    });
    assert(partAdminRes.status === 403, 'Participant role is forbidden (403) from accessing admin endpoints');

    // -------------------------------------------------------------
    // Test 9: Public Hackathons and Leaderboard
    // -------------------------------------------------------------
    const hackathonsRes = await fetch(`${baseUrl}/api/hackathons`);
    const hackathonsData = await hackathonsRes.json();
    assert(hackathonsRes.status === 200 && hackathonsData.data.length >= 6, 'Public can view all hackathon listings');

    const leaderboardRes = await fetch(`${baseUrl}/api/hackathons/1/leaderboard`);
    const leaderboardData = await leaderboardRes.json();
    assert(leaderboardRes.status === 200 && Array.isArray(leaderboardData.leaderboard), 'Leaderboard retrieves sorted ranking for Hackathon 1');
    assert(
      leaderboardData.leaderboard.length >= 2 &&
      Number(leaderboardData.leaderboard[0].score) >= Number(leaderboardData.leaderboard[1].score),
      'Leaderboard ordering ranks highest score first'
    );

    // -------------------------------------------------------------
    // Test 10: Team Creation in Atomic Transaction (Hackathon 4 - Open Registration)
    // -------------------------------------------------------------
    const teamName = `AutomatedTeam_${Date.now()}`;
    const createTeamRes = await fetch(`${baseUrl}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({ team_name: teamName, hackathon_id: 4 })
    });
    const createTeamData = await createTeamRes.json();
    assert(createTeamRes.status === 201 && createTeamData.team?.role === 'Leader', 'Team creation succeeds and designates creator as Leader');

    const createdTeamId = createTeamData.team?.team_id;

    // -------------------------------------------------------------
    // Test 11: Duplicate Team Registration in Same Hackathon Rejection
    // -------------------------------------------------------------
    const secondTeamRes = await fetch(`${baseUrl}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({ team_name: `SecondTeam_${Date.now()}`, hackathon_id: 4 })
    });
    assert(secondTeamRes.status === 409, 'Participant attempting to join multiple teams in same hackathon is rejected (409)');

    // -------------------------------------------------------------
    // Test 12: Project Submission by Leader
    // -------------------------------------------------------------
    const subRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        team_id: createdTeamId,
        project_title: 'Automated CI/CD Verification Engine',
        description: 'End-to-end testing pipeline integration with real MySQL backend.',
        github_link: 'https://github.com/hackarena/automated-test'
      })
    });
    const subData = await subRes.json();
    assert(subRes.status === 201 && subData.submission_id, 'Team leader submits project successfully with Pending status');

    const createdSubId = subData.submission_id;

    // -------------------------------------------------------------
    // Test 13: Duplicate Submission Rejection
    // -------------------------------------------------------------
    const dupSubRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        team_id: createdTeamId,
        project_title: 'Duplicate Attempt',
        description: 'Should fail'
      })
    });
    assert(dupSubRes.status === 409, 'Duplicate project submission by the same team is rejected (409)');

    // -------------------------------------------------------------
    // Test 14: Admin Project Evaluation via Stored Procedure
    // -------------------------------------------------------------
    const evalRes = await fetch(`${baseUrl}/api/submissions/admin/${createdSubId}/evaluate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        score: 96.50,
        feedback: 'Superb architecture, flawless transactional integrity and schema test coverage.'
      })
    });
    const evalData = await evalRes.json();
    assert(evalRes.status === 200 && evalData.evaluation.status === 'Evaluated', 'Admin evaluates submission with valid score and feedback');

    // -------------------------------------------------------------
    // Test 15: Modification of Evaluated Submission Rejection (Trigger / API)
    // -------------------------------------------------------------
    const editEvalRes = await fetch(`${baseUrl}/api/submissions/${createdSubId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        project_title: 'Attempted Modification After Finalized Evaluation'
      })
    });
    assert(editEvalRes.status === 400, 'Student editing project details after evaluation is rejected');

    // -------------------------------------------------------------
    // Test 16: Admin Dashboard Aggregated Statistics
    // -------------------------------------------------------------
    const dashboardRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Cookie: adminCookie }
    });
    const dashboardData = await dashboardRes.json();
    assert(
      dashboardRes.status === 200 &&
      dashboardData.data.summary.total_hackathons >= 6 &&
      dashboardData.data.summary.total_participants >= 40,
      'Admin dashboard returns verified real-time aggregate statistics from MySQL'
    );

    // -------------------------------------------------------------
    // Clean up created test data so tests leave clean state
    // -------------------------------------------------------------
    await pool.query('DELETE FROM submissions WHERE submission_id = ?', [createdSubId]);
    await pool.query('DELETE FROM teams WHERE team_id = ?', [createdTeamId]);
    await pool.query('DELETE FROM participants WHERE email = ?', [testEmail]);
    console.log('  ✓ Cleaned up automated test entities.');

  } catch (err) {
    console.error('Unhandled test failure:', err);
    failed++;
  } finally {
    await stopServer();
    console.log('\n======================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
    if (failed > 0) {
      process.exit(1);
    }
  }
};

runTests();
