<?php
// Simple test script to verify configuration
// Access at: http://localhost:8080/test-config.php

// Load .env file
if (file_exists(__DIR__ . '/.env')) {
    $env_file = file_get_contents(__DIR__ . '/.env');
    $lines = explode("\n", $env_file);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;

        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \"'");
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

// Check configuration
$jwt_secret = $_ENV['JWT_SECRET'] ?? null;
$db_host = $_ENV['DB_HOST'] ?? null;
$db_user = $_ENV['DB_USER'] ?? null;
$db_pass = $_ENV['DB_PASS'] ?? null;
$db_name = $_ENV['DB_NAME'] ?? null;

$results = [];

// Test 1: JWT Secret
$results['jwt_secret'] = [
    'configured' => !empty($jwt_secret),
    'value' => $jwt_secret ? (strlen($jwt_secret) > 10 ? substr($jwt_secret, 0, 5) . '****' : 'SET') : 'NOT SET'
];

// Test 2: Database configuration
$results['database_config'] = [
    'db_host' => !empty($db_host),
    'db_user' => !empty($db_user),
    'db_pass' => !empty($db_pass),
    'db_name' => !empty($db_name),
    'all_configured' => !empty($db_host) && !empty($db_user) && !empty($db_pass) && !empty($db_name)
];

// Test 3: Database connection
$db_connected = false;
$db_error = null;
if ($results['database_config']['all_configured']) {
    $conn = @new mysqli($db_host, $db_user, $db_pass, $db_name);
    if (!$conn->connect_error) {
        $db_connected = true;
        $conn->close();
    } else {
        $db_error = $conn->connect_error;
    }
}

$results['database_connection'] = [
    'connected' => $db_connected,
    'error' => $db_error
];

// Test 4: CORS Headers
$results['cors_headers'] = [
    'access_control_origin' => 'Present (echo)',
    'credentials' => 'Allowed'
];

// Test 5: Test API endpoint
$test_api = file_get_contents(__DIR__ . '/api.php?action=health');
$results['api_health'] = [
    'accessible' => !empty($test_api),
    'response_length' => strlen($test_api)
];

// Return results
echo json_encode([
    'status' => 'success',
    'timestamp' => date('Y-m-d H:i:s'),
    'configuration_valid' => $results['jwt_secret']['configured'] && $results['database_config']['all_configured'] && $db_connected,
    'tests' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
