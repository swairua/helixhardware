<?php
/**
 * Simple test script to verify the API is accepting unauthenticated requests
 * Place this in your backend directory and access via: https://yourserver.com/api-test.php?action=test
 */

// Load environment
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

header("Content-Type: application/json");

$action = $_GET['action'] ?? $_POST['action'] ?? null;

if ($action === 'test') {
    // Test 1: Check if API is responding
    echo json_encode([
        'status' => 'success',
        'test' => 'API is responding',
        'message' => 'If you see this, the API file is correctly deployed',
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => $_SERVER['SERVER_NAME'] ?? 'unknown',
        'method' => $_SERVER['REQUEST_METHOD'],
        'php_version' => phpversion()
    ]);
} elseif ($action === 'test_db') {
    // Test 2: Check database connection
    $db_host = $_ENV['DB_HOST'] ?? 'localhost';
    $db_user = $_ENV['DB_USER'] ?? 'wayrusc1_med';
    $db_pass = $_ENV['DB_PASS'] ?? 'Sirgeorge.12';
    $db_name = $_ENV['DB_NAME'] ?? 'wayrusc1_med';

    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'test' => 'Database connection',
            'error' => 'Connection failed: ' . $conn->connect_error
        ]);
    } else {
        echo json_encode([
            'status' => 'success',
            'test' => 'Database connection',
            'message' => 'Connected successfully',
            'host' => $db_host,
            'database' => $db_name
        ]);
        $conn->close();
    }
} elseif ($action === 'test_update') {
    // Test 3: Try an actual update without auth
    $table = $_GET['table'] ?? $_POST['table'] ?? 'companies';
    $id = $_GET['id'] ?? $_POST['id'] ?? '1';
    $name = $_GET['name'] ?? $_POST['name'] ?? 'Test Company';

    echo json_encode([
        'status' => 'info',
        'test' => 'Update test (unauthenticated)',
        'message' => 'This would update a record without authentication',
        'table' => $table,
        'id' => $id,
        'new_name' => $name,
        'instructions' => 'Call with: ?action=test_update&table=companies&id=1&name=YourName'
    ]);
} else {
    echo json_encode([
        'status' => 'info',
        'message' => 'API Test Script',
        'available_tests' => [
            'test' => 'Check if API is responding',
            'test_db' => 'Check database connection',
            'test_update' => 'Show update test example'
        ],
        'example_calls' => [
            'api-test.php?action=test',
            'api-test.php?action=test_db',
            'api-test.php?action=test_update&table=companies&id=1&name=MyCompany'
        ]
    ]);
}
?>
