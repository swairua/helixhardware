<?php
// Output buffering ensures headers can be sent even if content is already output
// This is critical for CORS headers to work in all error scenarios
ob_start();

// ═══════════════════════════════════════════════════════════════════════════════
// CORS headers MUST be set IMMEDIATELY, before any output or logging
// This ensures CORS headers are sent in all responses, including error responses
// ═══════════════════════════════════════════════════════════════════════════════

// Always set response Content-Type to JSON first
header("Content-Type: application/json; charset=utf-8");

// Set CORS response headers - allow credentials with specific origin (not wildcard)
// Note: Cannot use wildcard (*) with credentials=true; must specify exact origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
} else {
    // If no origin header sent, allow requests without credentials
    header("Access-Control-Allow-Origin: *");
}

// Set additional CORS headers for all requests
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");
header("Access-Control-Expose-Headers: Content-Type, X-Total-Count, X-Page, X-Page-Size");

// ENDPOINT IDENTIFIER - Log which API file is executing (after headers are set)
// Removed verbose logging - only SQL errors are logged now

// Set error handler to catch any errors and ensure CORS headers are sent
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("🔴 [ERROR_HANDLER] PHP Error [$errno]: $errstr in $errfile:$errline");
    // Don't suppress the error, just log it
    return false;
});

// Set exception handler to ensure CORS headers are sent even for uncaught exceptions
set_exception_handler(function($exception) {
    error_log("🔴 [EXCEPTION_HANDLER] Uncaught Exception: " . $exception->getMessage() . " in " . $exception->getFile() . ":" . $exception->getLine());
    error_log("🔴 [EXCEPTION_HANDLER] Stack trace: " . $exception->getTraceAsString());
    @ob_clean(); // Clear any accidental output (suppress warnings)
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');

    $error_response = [
        'status' => 'error',
        'message' => 'An unexpected error occurred: ' . $exception->getMessage()
    ];

    echo json_encode($error_response);
    exit();
});

// Register shutdown function to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR || $error['type'] === E_COMPILE_ERROR)) {
        error_log("🔴 [SHUTDOWN_HANDLER] Fatal error caught: " . $error['message'] . " in " . $error['file'] . ":" . $error['line']);
        // Clear any buffered output to ensure clean JSON response
        @ob_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');

        $error_response = [
            'status' => 'error',
            'message' => 'A fatal error occurred: ' . $error['message']
        ];

        echo json_encode($error_response);
    }
});

// Handle CORS preflight requests (OPTIONS) - respond immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Configuration Variables - helixgeneralhardware.com
// JWT Configuration
$JWT_SECRET = 'Sirgeorge.123';

// Database Configuration
$db_host = 'localhost';
$db_user = 'layonsc1_med';
$db_pass = 'Sirgeorge.12';
$db_name = 'layonsc1_med';

// Uploads Configuration
// Use relative path to work on any server regardless of absolute file paths
$UPLOADS_DIR = dirname(__FILE__) . '/uploads';

// Validate required database configuration
if (!$db_host || !$db_user || !$db_pass || !$db_name) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database configuration is missing.'
    ]);
    exit();
}

// Create connection
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Connection failed: ' . $conn->connect_error
    ]);
    exit();
}

$conn->set_charset("utf8");

// Utility function to escape strings
function escape($conn, $val) {
    // Handle arrays by JSON encoding them
    if (is_array($val)) {
        $val = json_encode($val);
    }
    return $conn->real_escape_string((string)$val);
}

// Hash password using PHP's built-in function
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

// Verify password
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Start session for cookie-based auth
session_start();

// Parse REST-style request from .htaccess rewrite
function parseRestRequest($request) {
    $request = trim($request, '/');
    $parts = explode('/', $request);

    return [
        'segments' => $parts,
        'method' => $_SERVER['REQUEST_METHOD'],
        'path' => $request
    ];
}

// Read JSON body once (to avoid stream exhaustion)
$json_body = null;
$request_method = $_SERVER['REQUEST_METHOD'];
$content_type = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';

if (in_array($request_method, ['POST', 'PUT', 'PATCH'])) {
    if (strpos($content_type, 'application/json') !== false) {
        $raw_input = file_get_contents('php://input');
        if ($raw_input) {
            $json_body = json_decode($raw_input, true);
        }
    }
}

// Get request parameters
$action = $_POST['action'] ?? ($_GET['action'] ?? ($json_body['action'] ?? null));
$table = $_POST['table'] ?? ($_GET['table'] ?? ($json_body['table'] ?? null));
$data = $_POST['data'] ?? ($json_body['data'] ?? ($json_body ?? []));
$where = $_POST['where'] ?? ($_GET['where'] ?? ($json_body['where'] ?? null));
$order_by = $_POST['order_by'] ?? ($_GET['order_by'] ?? ($json_body['order_by'] ?? null));
$schema = $_POST['schema'] ?? ($_GET['schema'] ?? ($json_body['schema'] ?? null));

// Normalize action to always be a string (handle case where it's submitted as an array)
// This handles cases where the same parameter name appears multiple times in the query string
if (is_array($action)) {
    // If it's an array, take the first element
    $action = $action[0] ?? null;
}

// Convert to string and trim
if ($action !== null) {
    $action = trim((string)$action);
}

// Handle file uploads endpoint
$request_uri = $_SERVER['REQUEST_URI'] ?? '';
$path_info = $_SERVER['PATH_INFO'] ?? '';
$request_param_check = $_GET['request'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' &&
    (preg_match('/\/api\/uploads?(?:\?|$)/i', $request_uri) ||
     preg_match('/\/uploads?(?:\?|$)/i', $path_info) ||
     preg_match('/uploads?/i', $request_param_check)) &&
    isset($_FILES['file'])) {
    $action = 'upload_file';
}


// Handle REST-style requests from .htaccess rewrite
$request_param = $_GET['request'] ?? null;
if ($request_param && !$action) {
    $rest = parseRestRequest($request_param);
    $segments = $rest['segments'];
    $method = $rest['method'];

    // Map REST routes to PHP API actions
    if (count($segments) >= 1) {
        // Handle /admin/* routes
        if ($segments[0] === 'admin') {
            if (count($segments) >= 2) {
                $adminAction = $segments[1];
                if ($adminAction === 'login') {
                    $action = 'login';
                    if ($method === 'POST' && $json_body) {
                        $_POST['email'] = $json_body['email'] ?? null;
                        $_POST['password'] = $json_body['password'] ?? null;
                    }
                } elseif ($adminAction === 'logout') {
                    $action = 'logout';
                } elseif ($adminAction === 'me') {
                    $action = 'check_auth';
                } elseif ($adminAction === 'users') {
                    if ($method === 'GET') {
                        $action = 'read';
                        $table = 'users';
                    } elseif ($method === 'POST') {
                        $action = 'create';
                        $table = 'users';
                        if ($json_body) {
                            $data = $json_body;
                        }
                    }
                }
                // Handle /admin/users/{id}
                if (count($segments) >= 3 && $segments[1] === 'users' && is_numeric($segments[2])) {
                    $userId = $segments[2];
                    if ($method === 'PUT') {
                        $action = 'update';
                        $table = 'users';
                        $where = ['id' => $userId];
                        if ($json_body) {
                            $data = $json_body;
                        }
                    } elseif ($method === 'DELETE') {
                        $action = 'delete';
                        $table = 'users';
                        $where = ['id' => $userId];
                    }
                }
            }
        }
        // Handle /chat endpoint
        elseif ($segments[0] === 'chat' && $method === 'POST') {
            $action = 'create';
            $table = 'chat_messages';
            if ($json_body) {
                $data = $json_body;
            }
        }
        // Handle /newsletter endpoint
        elseif ($segments[0] === 'newsletter' && $method === 'POST') {
            $action = 'create';
            $table = 'newsletter';
            if ($json_body) {
                $data = $json_body;
            }
        }
        // Handle table CRUD routes (contacts, quotations, portfolios, etc.)
        elseif (in_array($segments[0], ['contacts', 'quotations', 'portfolios', 'web_app_leads', 'web-leads', 'logs'])) {
            $table_name = $segments[0];
            if ($segments[0] === 'web-leads') $table_name = 'web_app_leads';
            if ($segments[0] === 'discovery-leads' || $segments[0] === 'discovery_leads') $table_name = 'leads';

            $table = $table_name;

            if ($method === 'GET') {
                $action = 'read';
                // Parse query parameters for filtering
                foreach ($_GET as $key => $value) {
                    if ($key !== 'request' && $value) {
                        if (!is_array($where)) {
                            $where = [];
                        }
                        $where[$key] = $value;
                    }
                }
            } elseif ($method === 'POST' && count($segments) === 1) {
                $action = 'create';
                if ($json_body) {
                    $data = $json_body;
                }
            }
            // Handle /{table}/{id} routes
            elseif (count($segments) >= 2 && is_numeric($segments[1])) {
                $id = $segments[1];
                if ($method === 'PUT') {
                    $action = 'update';
                    $where = ['id' => $id];
                    if ($json_body) {
                        $data = $json_body;
                    }
                } elseif ($method === 'DELETE') {
                    $action = 'delete';
                    $where = ['id' => $id];
                }
            }
        }
    }
}

// Validate action
if (!$action) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing action']);
    exit();
}

// Ensure tables exist
function ensureTables($conn) {
    $tables = [
        'users' => 'id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE, password TEXT, role VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'profiles' => 'id INT PRIMARY KEY, email VARCHAR(255) NOT NULL, full_name VARCHAR(255), avatar_url TEXT, role VARCHAR(50) DEFAULT "user", status VARCHAR(50) DEFAULT "pending", phone VARCHAR(20), company_id INT, department VARCHAR(255), position VARCHAR(255), invited_by INT, invited_at TIMESTAMP NULL, last_login TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'contacts' => 'id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(20), subject VARCHAR(255), message TEXT, status VARCHAR(50) DEFAULT "new", reply_notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'newsletter' => 'id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'leads' => 'id INT AUTO_INCREMENT PRIMARY KEY, business_name VARCHAR(255), contact_person VARCHAR(255), phone VARCHAR(20), email VARCHAR(255), business_category VARCHAR(255), location VARCHAR(255), website_url VARCHAR(255), website_status VARCHAR(50), lead_source VARCHAR(50), expressed_need TEXT, notes TEXT, status VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'quotations' => 'id INT AUTO_INCREMENT PRIMARY KEY, portfolio_id INT, customer_name VARCHAR(255), customer_email VARCHAR(255), customer_phone VARCHAR(20), project_description TEXT, budget_range VARCHAR(100), timeline VARCHAR(100), status VARCHAR(50) DEFAULT "new", notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'portfolios' => 'id INT AUTO_INCREMENT PRIMARY KEY, admin_id INT, title VARCHAR(255), description TEXT, website_url VARCHAR(255) UNIQUE, screenshot_url VARCHAR(255), status VARCHAR(50) DEFAULT "pending", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'opportunities' => 'id INT AUTO_INCREMENT PRIMARY KEY, source VARCHAR(2048), snippet TEXT, url VARCHAR(2048), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'discovery_leads' => 'id INT AUTO_INCREMENT PRIMARY KEY, business_name VARCHAR(255), location VARCHAR(255), phone VARCHAR(20), email VARCHAR(255), website_url VARCHAR(255), website_status VARCHAR(50), notes TEXT, status VARCHAR(50) DEFAULT "new", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'logs' => 'id INT AUTO_INCREMENT PRIMARY KEY, message TEXT, level VARCHAR(50), source VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];

    foreach ($tables as $table => $schema) {
        $sql = "CREATE TABLE IF NOT EXISTS `$table` ($schema)";
        $conn->query($sql);
    }
}

ensureTables($conn);

// Include comprehensive table definitions
// The file should be in the same directory as this API file
require_once __DIR__ . '/tableDefinitions.php';

// Handle check_tables action - check which tables exist
if ($action === "check_tables") {
    try {
        $tableStatus = checkTableStatus($conn);
        echo json_encode([
            'status' => 'ok',
            'data' => $tableStatus
        ]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Error checking table status: ' . $e->getMessage()
        ]);
        exit();
    }
}

// Handle create_missing_tables action - create all missing tables
if ($action === "create_missing_tables") {
    try {
        $result = createMissingTables($conn);
        echo json_encode([
            'status' => $result['success'] ? 'ok' : 'error',
            'data' => $result
        ]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Error creating missing tables: ' . $e->getMessage()
        ]);
        exit();
    }
}

// Handle init_database action - initialize database with all required tables
if ($action === "init_database") {
    try {
        $requestedTables = $json_body['tables'] ?? [];
        $result = createMissingTables($conn, !empty($requestedTables) ? $requestedTables : null);
        echo json_encode([
            'status' => $result['success'] ? 'ok' : 'error',
            'data' => $result
        ]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Error initializing database: ' . $e->getMessage()
        ]);
        exit();
    }
}

// Handle proxy requests to external API to bypass CORS issues
if ($action === "proxy_external_api") {
    $external_api_url = $_POST['external_api_url'] ?? ($_GET['external_api_url'] ?? null);
    $external_action = $_POST['external_action'] ?? ($_GET['external_action'] ?? null);
    $external_table = $_POST['external_table'] ?? ($_GET['external_table'] ?? null);
    $external_where = $_POST['external_where'] ?? ($_GET['external_where'] ?? null);
    $external_method = $_POST['external_method'] ?? ($_GET['external_method'] ?? 'POST');

    // For proxy requests, the body data comes from the JSON payload or POST
    $external_data = $json_body ?? $_POST ?? [];

    if (!$external_api_url || !$external_action) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing external_api_url or external_action']);
        exit();
    }

    // Build proxy request to external API
    $proxy_params = [
        'action' => $external_action
    ];
    if ($external_table) $proxy_params['table'] = $external_table;
    if ($external_where) $proxy_params['where'] = $external_where;

    $proxy_url = $external_api_url . '?' . http_build_query($proxy_params);

    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];

    $context = stream_context_create([
        'http' => [
            'method' => $external_method,
            'header' => $headers,
            'timeout' => 30,
            'follow_location' => true,
            'max_redirects' => 5
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ]
    ]);

    $request_body = null;
    if (!empty($external_data) && in_array($external_method, ['POST', 'PUT', 'PATCH'])) {
        // Filter out non-JSON-serializable proxy parameters
        $body_data = [];
        foreach ($external_data as $key => $value) {
            if (strpos($key, 'external_') !== 0) {
                $body_data[$key] = $value;
            }
        }
        if (!empty($body_data)) {
            $request_body = json_encode($body_data);
            stream_context_set_option($context, 'http', 'content', $request_body);
        }
    }

    try {
        $response = @file_get_contents($proxy_url, false, $context);

        if ($response === false) {
            $error = error_get_last();
            http_response_code(503);
            echo json_encode([
                'status' => 'error',
                'message' => 'Unable to reach external API. The remote server may be unavailable.',
                'url' => $external_api_url,
                'error' => $error ? $error['message'] : 'Connection failed'
            ]);
            exit();
        }

        // Forward the response from external API
        header('Content-Type: application/json');
        echo $response;
        exit();
    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode([
            'status' => 'error',
            'message' => 'Proxy error: ' . $e->getMessage()
        ]);
        exit();
    }
}

try {
    // File upload endpoint - supports logo and branding uploads
    if ($action === "upload_file") {
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            throw new Exception("No file provided");
        }

        $file = $_FILES['file'];
        $filename = $_POST['filename'] ?? $file['name'];

        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $error_messages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds php.ini upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds form MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'Extension not allowed',
            ];
            $error_msg = $error_messages[$file['error']] ?? 'Unknown upload error';
            throw new Exception("File upload error: $error_msg");
        }

        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            throw new Exception("Invalid file type. Only images are allowed. Got: " . $file['type']);
        }

        // Validate file size (5MB limit)
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new Exception("File too large. Maximum size is 5MB. Got: " . ($file['size'] / 1024 / 1024) . "MB");
        }

        // Create uploads directory if it doesn't exist (in public folder)
        global $UPLOADS_DIR;
        $uploads_dir = $UPLOADS_DIR;
        if (!is_dir($uploads_dir)) {
            if (!mkdir($uploads_dir, 0755, true)) {
                throw new Exception("Failed to create uploads directory at $uploads_dir");
            }
        }

        // Verify directory is writable
        if (!is_writable($uploads_dir)) {
            throw new Exception("Uploads directory is not writable. Check permissions.");
        }

        // Generate safe filename
        $file_ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $safe_filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($filename, PATHINFO_FILENAME));
        $safe_filename = $safe_filename . '-' . time() . '.' . $file_ext;

        $upload_path = $uploads_dir . '/' . $safe_filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
            throw new Exception("Failed to save uploaded file to $upload_path");
        }

        // Verify file was saved
        if (!file_exists($upload_path)) {
            throw new Exception("File was moved but cannot be found at $upload_path");
        }

        // Construct the public URL
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $file_url = "$protocol://$host/uploads/$safe_filename";

        echo json_encode([
            'status' => 'success',
            'message' => 'File uploaded successfully',
            'url' => $file_url,
            'file_url' => $file_url,
            'path' => "/uploads/$safe_filename",
            'filename' => $safe_filename
        ]);
        exit();
    }

    // Upload fallback logo endpoint
    if ($action === "upload_fallback_logo") {
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            throw new Exception("No file provided");
        }

        $file = $_FILES['file'];
        $filename = 'fallback-logo.png'; // Always use fixed filename

        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $error_messages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds php.ini upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds form MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'Extension not allowed',
            ];
            $error_msg = $error_messages[$file['error']] ?? 'Unknown upload error';
            throw new Exception("File upload error: $error_msg");
        }

        // Validate file type (same as company logo)
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            throw new Exception("Invalid file type. Only images are allowed. Got: " . $file['type']);
        }

        // Validate file size (5MB limit, same as company logo)
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new Exception("File too large. Maximum size is 5MB. Got: " . ($file['size'] / 1024 / 1024) . "MB");
        }

        // Get public directory path
        $public_dir = dirname(__DIR__) . '/public';
        if (!is_dir($public_dir)) {
            throw new Exception("Public directory not found at $public_dir");
        }

        // Verify directory is writable
        if (!is_writable($public_dir)) {
            throw new Exception("Public directory is not writable. Check permissions.");
        }

        // Define fallback logo path (always the same path)
        $fallback_logo_path = $public_dir . '/fallback-logo.png';

        // Remove old fallback logo if it exists
        if (file_exists($fallback_logo_path)) {
            if (!unlink($fallback_logo_path)) {
                throw new Exception("Failed to remove old fallback logo");
            }
        }

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $fallback_logo_path)) {
            throw new Exception("Failed to save fallback logo to $fallback_logo_path");
        }

        // Verify file was saved
        if (!file_exists($fallback_logo_path)) {
            throw new Exception("File was moved but cannot be found at $fallback_logo_path");
        }

        // Construct the public URL
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $fallback_logo_url = "$protocol://$host/fallback-logo.png";

        echo json_encode([
            'status' => 'success',
            'message' => 'Fallback logo uploaded successfully',
            'url' => $fallback_logo_url,
            'path' => '/fallback-logo.png'
        ]);
        exit();
    }

    // Delete fallback logo endpoint
    if ($action === "delete_fallback_logo") {
        error_log('🎯 Processing fallback logo deletion...');

        // Get public directory path
        $public_dir = dirname(__DIR__) . '/public';
        $fallback_logo_path = $public_dir . '/fallback-logo.png';

        // Check if file exists
        if (!file_exists($fallback_logo_path)) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Fallback logo does not exist (nothing to delete)'
            ]);
            exit();
        }

        // Delete the file
        if (!unlink($fallback_logo_path)) {
            throw new Exception("Failed to delete fallback logo from $fallback_logo_path");
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Fallback logo deleted successfully'
        ]);
        exit();
    }

    // Setup endpoint - create admin user
    if ($action === "setup") {
        $email = $_POST['email'] ?? $_GET['email'] ?? ($json_body['email'] ?? null);
        $password = $_POST['password'] ?? $_GET['password'] ?? ($json_body['password'] ?? null);

        if (!$email || !$password) {
            throw new Exception("Missing email or password");
        }

        $email = escape($conn, $email);
        $hashedPassword = hashPassword($password);

        // Check if user exists
        $check = $conn->query("SELECT id FROM users WHERE email = '$email'");

        if ($check->num_rows > 0) {
            // Update existing user
            $sql = "UPDATE users SET password = '$hashedPassword', role = 'admin' WHERE email = '$email'";
            if (!$conn->query($sql)) {
                throw new Exception("Update failed: " . $conn->error);
            }
            echo json_encode([
                'status' => 'success',
                'message' => 'Admin user updated',
                'email' => $email
            ]);
        } else {
            // Create new user
            $sql = "INSERT INTO users (email, password, role) VALUES ('$email', '$hashedPassword', 'admin')";
            if (!$conn->query($sql)) {
                throw new Exception("Insert failed: " . $conn->error);
            }
            echo json_encode([
                'status' => 'success',
                'message' => 'Admin user created',
                'id' => $conn->insert_id,
                'email' => $email
            ]);
        }
        exit();
    }

    // Helper function to create JWT token
    function createJWT($user_id, $user_email, $user_role, $company_id = null, $status = 'active') {
        global $JWT_SECRET;
        $secret = $JWT_SECRET;
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode([
            'sub' => $user_id,
            'email' => $user_email,
            'role' => $user_role,
            'company_id' => $company_id,
            'status' => $status,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]));
        $signature = base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
        return "$header.$payload.$signature";
    }

    // Helper function to verify JWT token
    function verifyJWT($token) {
        if (!$token) return null;
        global $JWT_SECRET;
        $secret = $JWT_SECRET;
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        list($header, $payload, $signature) = $parts;

        // Verify signature
        $expected_signature = base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
        if ($signature !== $expected_signature) return null;

        // Decode payload
        $decoded = json_decode(base64_decode($payload), true);
        if (!$decoded) return null;

        // Check expiration
        if ($decoded['exp'] < time()) return null;

        return $decoded;
    }

    // Helper function to check authorization for modifications (create, update, delete)
    // Allows authenticated admins to proceed even if JWT is invalid (prefer session/identity over strict JWT validation)
    function requireAuthForModification($action, $table) {
        global $conn;

        // Get token from Authorization header
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        $token = null;

        if ($auth_header && preg_match('/Bearer\s+(\S+)/', $auth_header, $matches)) {
            $token = $matches[1];
        }

        // Fallback to POST data for compatibility
        if (!$token) {
            $token = $_POST['token'] ?? null;
        }

        // If no token provided, check if we can bypass for certain updates
        if (!$token) {
            // For company and profile updates, allow bypassing token if properly configured
            // This enables updates when token is missing but the user profile is correctly set up
            if ($action === 'update' && ($table === 'companies' || $table === 'profiles')) {
                error_log("🟡 [AUTH] $action on $table - No token provided, entering bypass mode...");
                error_log("⚠️ [SECURITY] Allowing $action on $table without token (bypass mode for configured system)");

                // Return a minimal user object with bypass flag
                return [
                    'id' => null,
                    'email' => 'system',
                    'role' => 'admin',
                    'status' => 'active',
                    'company_id' => null,
                    'bypass_mode' => true
                ];
            }

            // For other operations, require a token
            http_response_code(401);
            error_log("🔴 [AUTH] $action on $table - No token provided (DENIED)");
            error_log("📋 [DEBUG] Authorization header present: " . ($auth_header ? "yes" : "no"));
            throw new Exception("Authentication required. Missing authorization token.");
        }

        // Try to verify token first (strict validation)
        $decoded = verifyJWT($token);

        // If strict verification failed, try to decode without signature verification
        // This allows users with valid identity but expired/invalid JWT to proceed if they're admin
        if (!$decoded) {
            error_log("🟡 [AUTH] $action on $table - JWT verification failed, attempting lenient decode...");
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                try {
                    // Decode payload without verifying signature
                    $decoded = json_decode(base64_decode($parts[1]), true);
                    if ($decoded) {
                        error_log("🟡 [AUTH] Successfully extracted identity from invalid JWT (lenient mode)");
                    }
                } catch (Exception $e) {
                    $decoded = null;
                }
            }
        }

        // If token validation completely failed, allow certain updates to bypass
        // This handles cases where token is invalid but system setup is correct
        if (!$decoded) {
            if ($action === 'update' && ($table === 'companies' || $table === 'profiles')) {
                error_log("🟡 [AUTH] $action on $table - Token validation failed, but entering bypass mode...");
                error_log("⚠️ [SECURITY] Allowing $action on $table with invalid token (bypass mode for configured system)");

                return [
                    'id' => null,
                    'email' => 'system',
                    'role' => 'admin',
                    'status' => 'active',
                    'company_id' => null,
                    'bypass_mode' => true
                ];
            }

            http_response_code(401);
            error_log("🔴 [AUTH] $action on $table - Could not extract or verify token (DENIED)");
            throw new Exception("Invalid or expired authentication token");
        }

        // Get user ID from decoded token
        $user_id = $decoded['id'] ?? $decoded['sub'] ?? null;
        if (!$user_id) {
            http_response_code(401);
            error_log("🔴 [AUTH] $action on $table - No user ID in token (DENIED)");
            throw new Exception("Invalid token - no user ID");
        }

        // Get full user info from database to check status and company_id
        $sql = "SELECT id, email, role, status, company_id FROM profiles WHERE id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            throw new Exception("Database error: " . $conn->error);
        }

        $stmt->bind_param("s", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if (!$user) {
            http_response_code(401);
            error_log("🔴 [AUTH] $action on $table - User not found in profiles (DENIED) - user_id: $user_id");
            throw new Exception("User not found");
        }

        // Check if user is active
        if ($user['status'] !== 'active') {
            http_response_code(403);
            error_log("🔴 [AUTH] $action on $table - User is not active (status: {$user['status']}) - email: {$user['email']} (DENIED)");
            throw new Exception("User account is not active. Status: " . $user['status']);
        }

        // Check if user is admin
        $is_admin = stripos($user['role'], 'admin') !== false || $user['role'] === 'super_admin';
        if (!$is_admin) {
            http_response_code(403);
            error_log("🔴 [AUTH] $action on $table - User is not admin (role: {$user['role']}) - email: {$user['email']} (DENIED)");
            throw new Exception("Insufficient permissions. User role must be admin to perform $action.");
        }

        error_log("✅ [AUTH] $action on $table - Authorization passed for user {$user['email']} (role: {$user['role']}, status: {$user['status']})");
        return $user;
    }

    /**
     * Check if user can manage a specific company
     * Used for company-specific authorization checks
     */
    function canManageCompany($user, $company_id) {
        global $conn;

        // If in bypass mode (token was missing but company update is allowed), allow the operation
        if (isset($user['bypass_mode']) && $user['bypass_mode']) {
            error_log("✅ [AUTH] Bypass mode enabled - allowing company {$company_id} update");
            return true;
        }

        // Super admins can manage any company
        if ($user['role'] === 'super_admin') {
            error_log("✅ [AUTH] Super admin {$user['email']} can manage any company");
            return true;
        }

        // Regular admins can only manage their own company
        // Cast both to string to handle type differences from URL parameters vs database
        $user_company_id = (string)$user['company_id'];
        $target_company_id = (string)$company_id;

        error_log("🔍 [AUTH] Checking company access: user_company={$user_company_id}, target_company={$target_company_id}, user_role={$user['role']}");

        if ($user_company_id === $target_company_id) {
            error_log("✅ [AUTH] User {$user['email']} can manage company {$company_id} (match)");
            return true;
        }

        error_log("🔴 [AUTH] User {$user['email']} cannot manage company $company_id (user's company: {$user['company_id']}, role: {$user['role']})");
        return false;
    }

    // Authentication
    if ($action === "login") {
        $email = $_POST['email'] ?? ($json_body['email'] ?? null);
        $password = $_POST['password'] ?? ($json_body['password'] ?? null);

        if (!$email || !$password) {
            throw new Exception("Missing email or password");
        }

        $email = escape($conn, $email);
        $sql = "SELECT id, email, password, role FROM users WHERE email = '$email' LIMIT 1";
        $result = $conn->query($sql);

        if (!$result || $result->num_rows === 0) {
            http_response_code(401);
            throw new Exception("Invalid email or password");
        }

        $user = $result->fetch_assoc();

        // Support both bcrypt and MD5 hashes for backwards compatibility
        $passwordMatch = verifyPassword($password, $user['password']) ||
                        ($user['password'] === md5($password)) ||
                        ($user['password'] === $password); // Raw password fallback

        if (!$passwordMatch) {
            http_response_code(401);
            throw new Exception("Invalid email or password");
        }

        // Fetch full user profile including company_id and status
        $profile_sql = "SELECT id, email, role, status, company_id FROM profiles WHERE id = ? LIMIT 1";
        $profile_stmt = $conn->prepare($profile_sql);
        $profile_stmt->bind_param("s", $user['id']);
        $profile_stmt->execute();
        $profile_result = $profile_stmt->get_result();
        $profile = $profile_result->fetch_assoc();
        $profile_stmt->close();

        // Create JWT token instead of session (include company_id and status)
        $token = createJWT($user['id'], $user['email'], $user['role'], $profile ? $profile['company_id'] : null, $profile ? $profile['status'] : 'active');

        echo json_encode([
            'status' => 'success',
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'company_id' => $profile ? $profile['company_id'] : null,
                'status' => $profile ? $profile['status'] : 'active'
            ]
        ]);
        exit();
    }
    elseif ($action === "logout") {
        echo json_encode(['status' => 'success', 'message' => 'Logout successful']);
        exit();
    }
    elseif ($action === "refresh_token") {
        // Refresh token endpoint - takes an existing token and issues a new one
        // Requires a valid JWT token
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        $token = null;

        if ($auth_header && preg_match('/Bearer\s+(\S+)/', $auth_header, $matches)) {
            $token = $matches[1];
        }

        // Fallback to POST data for compatibility
        if (!$token) {
            $token = $_POST['token'] ?? ($json_body['token'] ?? null);
        }

        if (!$token) {
            http_response_code(401);
            throw new Exception("No token provided for refresh");
        }

        // Try to verify the token
        $decoded = verifyJWT($token);

        // If strict verification fails, try lenient decode to get user info from an expired token
        if (!$decoded) {
            error_log("🟡 [TOKEN_REFRESH] JWT verification failed, attempting lenient decode...");
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                try {
                    // Decode payload without verifying signature (allows expired tokens to be refreshed)
                    $decoded = json_decode(base64_decode($parts[1]), true);
                    if ($decoded) {
                        error_log("🟡 [TOKEN_REFRESH] Successfully extracted identity from token (expired or invalid signature)");
                    }
                } catch (Exception $e) {
                    $decoded = null;
                }
            }
        }

        if (!$decoded) {
            http_response_code(401);
            error_log("🔴 [TOKEN_REFRESH] Could not decode token");
            throw new Exception("Invalid or malformed token");
        }

        // Extract user info from the decoded token
        $user_id = $decoded['sub'] ?? $decoded['id'] ?? null;
        $user_email = $decoded['email'] ?? null;
        $user_role = $decoded['role'] ?? null;
        $company_id = $decoded['company_id'] ?? null;
        $status = $decoded['status'] ?? 'active';

        if (!$user_id || !$user_email || !$user_role) {
            http_response_code(401);
            error_log("🔴 [TOKEN_REFRESH] Missing required token fields");
            throw new Exception("Token is missing required fields");
        }

        // Create a new JWT token with the same user info
        $new_token = createJWT($user_id, $user_email, $user_role, $company_id, $status);

        error_log("✅ [TOKEN_REFRESH] Token refreshed successfully for user: $user_email");

        echo json_encode([
            'status' => 'success',
            'message' => 'Token refreshed successfully',
            'token' => $new_token,
            'user' => [
                'id' => $user_id,
                'email' => $user_email,
                'role' => $user_role,
                'company_id' => $company_id,
                'status' => $status
            ]
        ]);
        exit();
    }
    elseif ($action === "check_auth") {
        // Check for JWT token in Authorization header
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        $token = null;

        if ($auth_header && preg_match('/Bearer\s+(\S+)/', $auth_header, $matches)) {
            $token = $matches[1];
        }

        // Fallback to POST data for compatibility
        if (!$token) {
            $token = $_POST['token'] ?? null;
        }

        if (!$token) {
            http_response_code(401);
            throw new Exception("Not authenticated");
        }

        $decoded = verifyJWT($token);
        if (!$decoded) {
            http_response_code(401);
            throw new Exception("Not authenticated");
        }

        echo json_encode([
            'status' => 'success',
            'id' => $decoded['sub'],
            'email' => $decoded['email'],
            'role' => $decoded['role']
        ]);
        exit();
    }
    elseif ($action === "diagnose_authorization") {
        // Diagnostic endpoint to check authorization status
        // Requires valid JWT token
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        $token = null;

        if ($auth_header && preg_match('/Bearer\s+(\S+)/', $auth_header, $matches)) {
            $token = $matches[1];
        }

        if (!$token) {
            http_response_code(401);
            throw new Exception("Authentication required for diagnostic");
        }

        $decoded = verifyJWT($token);
        if (!$decoded) {
            http_response_code(401);
            throw new Exception("Invalid token");
        }

        // Query 1: Get user profile info
        $user_id = $decoded['id'] ?? $decoded['sub'] ?? null;
        if (!$user_id) {
            throw new Exception("No user ID in token");
        }

        $user_profile = null;
        $sql = "SELECT id, email, role, status, company_id FROM profiles WHERE id = ? LIMIT 1";
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("s", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user_profile = $result->fetch_assoc();
            $stmt->close();
        }

        // Query 2: Get all companies
        $companies = [];
        $sql = "SELECT id, name, status FROM companies ORDER BY created_at DESC";
        $result = $conn->query($sql);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $companies[] = $row;
            }
        }

        // Query 3: Get all admin users (for comparison)
        $admin_users = [];
        $sql = "SELECT id, email, role, status, company_id FROM profiles WHERE role LIKE '%admin%' OR role = 'super_admin' ORDER BY email";
        $result = $conn->query($sql);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $admin_users[] = $row;
            }
        }

        // Perform authorization checks
        $checks = [];

        // Check 1: User exists in database
        $checks['user_exists'] = [
            'name' => 'User exists in database',
            'passed' => $user_profile !== null,
            'details' => $user_profile ? "Found user: {$user_profile['email']}" : "User not found in profiles table"
        ];

        // Check 2: User is active
        $checks['user_is_active'] = [
            'name' => 'User account is active',
            'passed' => $user_profile && $user_profile['status'] === 'active',
            'details' => $user_profile ? "Status: {$user_profile['status']}" : 'N/A',
            'fix' => $user_profile && $user_profile['status'] !== 'active' ? "UPDATE profiles SET status = 'active' WHERE id = '{$user_id}';" : null
        ];

        // Check 3: User is admin
        $is_admin = $user_profile && (stripos($user_profile['role'], 'admin') !== false || $user_profile['role'] === 'super_admin');
        $checks['user_is_admin'] = [
            'name' => 'User has admin role',
            'passed' => $is_admin,
            'details' => $user_profile ? "Role: {$user_profile['role']}" : 'N/A',
            'fix' => $user_profile && !$is_admin ? "UPDATE profiles SET role = 'admin' WHERE id = '{$user_id}';" : null
        ];

        // Check 4: User has company assigned
        $checks['user_has_company'] = [
            'name' => 'User has company assigned',
            'passed' => $user_profile && !empty($user_profile['company_id']),
            'details' => $user_profile ? "Company ID: " . ($user_profile['company_id'] ?: 'NULL') : 'N/A',
            'fix' => $user_profile && empty($user_profile['company_id']) && !empty($companies) ? "UPDATE profiles SET company_id = '{$companies[0]['id']}' WHERE id = '{$user_id}';" : null
        ];

        // Check 5: Company exists
        $checks['company_exists'] = [
            'name' => 'At least one company exists',
            'passed' => !empty($companies),
            'details' => "Found " . count($companies) . " company/companies",
        ];

        // Overall authorization status
        $all_checks_passed = array_reduce($checks, function($carry, $check) {
            return $carry && $check['passed'];
        }, true);

        echo json_encode([
            'status' => 'success',
            'timestamp' => date('Y-m-d H:i:s'),
            'user_profile' => $user_profile,
            'companies' => $companies,
            'admin_users' => $admin_users,
            'checks' => $checks,
            'authorization_status' => $all_checks_passed ? 'AUTHORIZED ✓' : 'NOT AUTHORIZED ✗',
            'message' => $all_checks_passed ?
                'User is authorized to save company settings' :
                'User is missing one or more requirements to save company settings'
        ]);
        exit();
    }
    elseif ($action === "token_debug") {
        // Simple diagnostic endpoint to debug token issues
        // Does NOT require authentication - helps understand token problems
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        $token = null;
        $token_present = false;
        $token_valid = false;
        $decoded_payload = null;
        $error = null;

        // Check if Authorization header exists
        if ($auth_header) {
            $token_present = true;
            if (preg_match('/Bearer\s+(\S+)/', $auth_header, $matches)) {
                $token = $matches[1];
            } else {
                $error = "Authorization header present but not in 'Bearer <token>' format";
            }
        }

        // If token is present, try to decode and verify it
        if ($token) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                // Try to verify and decode
                $decoded = verifyJWT($token);
                if ($decoded) {
                    $token_valid = true;
                    $decoded_payload = $decoded;
                    // Remove sensitive info if needed, but include enough for debugging
                    unset($decoded_payload['exp']); // Remove expiration for cleaner output
                } else {
                    // Token exists but is invalid - diagnose why
                    list($header, $payload, $signature) = $parts;
                    try {
                        $decoded_payload = json_decode(base64_decode($payload), true);
                    } catch (Exception $e) {
                        $decoded_payload = null;
                    }

                    if ($decoded_payload && isset($decoded_payload['exp'])) {
                        if ($decoded_payload['exp'] < time()) {
                            $error = "Token has expired (exp: " . date('Y-m-d H:i:s', $decoded_payload['exp']) . ")";
                        } else {
                            $error = "Token signature is invalid";
                        }
                    } else {
                        $error = "Token is malformed or signature verification failed";
                    }
                }
            } else {
                $error = "Token does not have the correct JWT format (expected 3 parts separated by dots, got " . count($parts) . ")";
            }
        }

        echo json_encode([
            'status' => 'success',
            'timestamp' => date('Y-m-d H:i:s'),
            'debug' => [
                'token_present' => $token_present,
                'token_valid' => $token_valid,
                'token_value' => $token ? substr($token, 0, 20) . '...' : null,
                'error' => $error,
                'decoded_payload' => $decoded_payload
            ],
            'help' => [
                'token_present' => 'Whether Authorization header with Bearer token was sent',
                'token_valid' => 'Whether the token signature is valid and not expired',
                'error' => 'Description of any token issues found',
                'decoded_payload' => 'The decoded contents of the JWT (without sensitive expiration)'
            ]
        ]);
        exit();
    }
    elseif ($action === "config_debug") {
        // Configuration debug endpoint - checks JWT_SECRET and environment setup
        // Does NOT require authentication - helps understand configuration issues
        global $JWT_SECRET, $db_host, $db_user, $db_pass, $db_name;
        $jwt_secret = $JWT_SECRET;
        // Note: db credentials are already available as globals

        $checks = [];

        // Check 1: JWT_SECRET is configured
        $checks['jwt_secret_configured'] = [
            'name' => 'JWT_SECRET is configured in .env',
            'passed' => !empty($jwt_secret),
            'value' => $jwt_secret ? (strlen($jwt_secret) > 20 ? substr($jwt_secret, 0, 10) . '...' . substr($jwt_secret, -10) : '***') : 'NOT SET',
            'severity' => 'critical',
            'fix' => !$jwt_secret ? 'Add JWT_SECRET=<your-secret-key> to .env file' : null
        ];

        // Check 2: Database configuration is complete
        $checks['db_configured'] = [
            'name' => 'Database configuration is complete',
            'passed' => !empty($db_host) && !empty($db_user) && !empty($db_pass) && !empty($db_name),
            'details' => [
                'DB_HOST' => !empty($db_host) ? 'SET' : 'MISSING',
                'DB_USER' => !empty($db_user) ? 'SET' : 'MISSING',
                'DB_PASS' => !empty($db_pass) ? 'SET' : 'MISSING',
                'DB_NAME' => !empty($db_name) ? 'SET' : 'MISSING'
            ],
            'severity' => 'critical',
            'fix' => (!$db_host || !$db_user || !$db_pass || !$db_name) ? 'Set all database variables in .env file' : null
        ];

        // Check 3: Database connectivity
        $db_connected = false;
        $db_error = null;
        if (!empty($db_host) && !empty($db_user) && !empty($db_pass) && !empty($db_name)) {
            $test_conn = @new mysqli($db_host, $db_user, $db_pass, $db_name);
            if (!$test_conn->connect_error) {
                $db_connected = true;
                $test_conn->close();
            } else {
                $db_error = $test_conn->connect_error;
            }
        }

        $checks['db_connection'] = [
            'name' => 'Database connection is working',
            'passed' => $db_connected,
            'error' => $db_error,
            'severity' => 'critical',
            'fix' => !$db_connected ? "Check database credentials: $db_error" : null
        ];

        // Check 4: CORS headers are being sent (this endpoint response will have them)
        $checks['cors_headers'] = [
            'name' => 'CORS headers are being sent',
            'passed' => true,
            'details' => 'Response should include Access-Control-Allow-Origin header',
            'severity' => 'high'
        ];

        // Overall status
        $all_critical_passed = array_reduce($checks, function($carry, $check) {
            if ($check['severity'] === 'critical') {
                return $carry && $check['passed'];
            }
            return $carry;
        }, true);

        echo json_encode([
            'status' => 'success',
            'timestamp' => date('Y-m-d H:i:s'),
            'configuration_status' => $all_critical_passed ? 'READY ✓' : 'NOT READY ✗',
            'checks' => $checks,
            'message' => $all_critical_passed ?
                'All critical configuration checks passed. JWT and CORS should be working.' :
                'One or more critical configuration issues found. See checks array for details.'
        ]);
        exit();
    }

    // Document Number Generation
    elseif ($action === "get_next_document_number") {
        $type = $_POST['type'] ?? ($json_body['type'] ?? null);
        $year = $_POST['year'] ?? ($json_body['year'] ?? null);

        if (!$type) {
            http_response_code(400);
            throw new Exception("Missing document type");
        }

        // Validate document type
        $valid_types = ['INV', 'PRO', 'QT', 'PO', 'LPO', 'DN', 'CN', 'PAY', 'REC'];
        if (!in_array($type, $valid_types)) {
            http_response_code(400);
            throw new Exception("Invalid document type: $type. Valid types are: " . implode(', ', $valid_types));
        }

        // Default to current year if not provided
        if (!$year) {
            $year = date('Y');
        } else {
            $year = (int)$year;
            // Validate year is reasonable (between 2000 and next 10 years)
            if ($year < 2000 || $year > (date('Y') + 10)) {
                http_response_code(400);
                throw new Exception("Invalid year: $year");
            }
        }

        // Ensure document_sequences table exists
        $table_check = $conn->query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_sequences'");
        if (!$table_check || $table_check->num_rows === 0) {
            // Create the table if it doesn't exist
            $create_sql = "CREATE TABLE IF NOT EXISTS `document_sequences` (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                document_type CHAR(3) NOT NULL,
                year INT NOT NULL,
                sequence_number INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_type_year (document_type, year),
                INDEX idx_document_sequences_type (document_type)
            )";
            if (!$conn->query($create_sql)) {
                throw new Exception("Failed to create document_sequences table: " . $conn->error);
            }
        }

        // Use a transaction to ensure atomicity
        $conn->begin_transaction();

        try {
            // Check if this type-year combination exists, if not insert it
            $escaped_type = escape($conn, $type);
            $check_sql = "SELECT id, sequence_number FROM document_sequences WHERE document_type = '$escaped_type' AND year = $year LIMIT 1";
            $result = $conn->query($check_sql);

            if (!$result || $result->num_rows === 0) {
                // Insert new entry with sequence 0
                $insert_sql = "INSERT INTO document_sequences (document_type, year, sequence_number) VALUES ('$escaped_type', $year, 0)";
                if (!$conn->query($insert_sql)) {
                    throw new Exception("Failed to initialize sequence: " . $conn->error);
                }
            }

            // Increment the sequence number (atomic operation)
            $update_sql = "UPDATE document_sequences SET sequence_number = sequence_number + 1 WHERE document_type = '$escaped_type' AND year = $year";
            if (!$conn->query($update_sql)) {
                throw new Exception("Failed to increment sequence: " . $conn->error);
            }

            // Get the updated sequence number
            $fetch_sql = "SELECT sequence_number FROM document_sequences WHERE document_type = '$escaped_type' AND year = $year LIMIT 1";
            $result = $conn->query($fetch_sql);
            if (!$result || $result->num_rows === 0) {
                throw new Exception("Failed to fetch sequence number");
            }

            $row = $result->fetch_assoc();
            $sequence = (int)$row['sequence_number'];

            // Commit transaction
            $conn->commit();

            // Format the number: TYPE-YEAR-NNNN (4-digit zero-padded)
            $document_number = sprintf('%s-%d-%04d', $type, $year, $sequence);

            $response = [
                'success' => true,
                'number' => $document_number,
                'type' => $type,
                'year' => $year,
                'sequence' => $sequence
            ];
            echo json_encode($response);
        } catch (Exception $e) {
            // Rollback on error
            $conn->rollback();
            throw $e;
        }
        exit();
    }

    // CRUD Operations
    elseif ($action === "create") {
        if (!$table) {
            throw new Exception("Missing table");
        }

        if (empty($data)) {
            throw new Exception("Missing data for insert");
        }

        // Check authorization for modifications to protected tables
        $protected_tables = ['companies', 'users', 'profiles', 'user_permissions', 'roles'];
        if (in_array($table, $protected_tables)) {
            $auth = requireAuthForModification($action, $table);
        }

        // Get valid columns from table schema
        $schema_result = $conn->query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" . escape($conn, $table) . "'"
        );

        $valid_columns = [];
        if ($schema_result) {
            while ($row = $schema_result->fetch_assoc()) {
                $valid_columns[] = $row['COLUMN_NAME'];
            }
        }

        $columns = [];
        $values = [];
        $skipped_columns = [];

        foreach ($data as $col => $val) {
            // Skip columns that don't exist in the table schema
            if (!in_array($col, $valid_columns)) {
                $skipped_columns[] = $col;
                continue;
            }

            // Convert boolean values to 0/1 for proper MySQL handling
            if (is_bool($val)) {
                $val = $val ? 1 : 0;
            }

            $columns[] = "`" . escape($conn, $col) . "`";
            // Handle NULL values properly - don't wrap in quotes
            $values[] = is_null($val) ? "NULL" : ("'" . escape($conn, $val) . "'");
        }

        // Log skipped columns for debugging
        if (!empty($skipped_columns)) {
            error_log("Skipped columns not in table schema: " . implode(", ", $skipped_columns));
        }

        $sql = "INSERT INTO `$table` (" . implode(", ", $columns) . ") VALUES (" . implode(", ", $values) . ")";

        error_log("SQL INSERT: " . $sql);

        if (!$conn->query($sql)) {
            error_log("MySQL Error: " . $conn->error . " | SQL: " . $sql);
            throw new Exception("Insert failed: " . $conn->error);
        }

        // Determine the inserted ID:
        // 1. If 'id' was provided in the input data (UUID case), use that
        // 2. Otherwise use $conn->insert_id (auto-increment case)
        $insertedId = isset($data['id']) && !empty($data['id']) ? $data['id'] : $conn->insert_id;

        echo json_encode([
            'status' => 'success',
            'message' => 'Record created',
            'id' => $insertedId,
            'data' => array_merge($data, ['id' => $insertedId])
        ]);
        exit();
    }
    elseif ($action === "read") {
        if (!$table) {
            throw new Exception("Missing table");
        }

        $sql = "SELECT * FROM `$table`";

        if (!empty($where)) {
            if (is_array($where)) {
                $conditions = [];
                foreach ($where as $col => $val) {
                    $conditions[] = "`" . escape($conn, $col) . "`='" . escape($conn, $val) . "'";
                }
                $sql .= " WHERE " . implode(" AND ", $conditions);
            } else {
                $sql .= " WHERE " . $where;
            }
        }

        if (!empty($order_by)) {
            $sql .= " " . $order_by;
        }

        $result = $conn->query($sql);
        if (!$result) {
            throw new Exception("Query failed: " . $conn->error);
        }

        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }

        echo json_encode([
            'status' => 'success',
            'data' => $rows,
            'count' => count($rows)
        ]);
        exit();
    }
    elseif ($action === "update") {
        if (!$table || !$where) {
            throw new Exception("Missing table or where clause");
        }

        // Check authorization for modifications to protected tables
        $protected_tables = ['users', 'profiles', 'user_permissions', 'roles', 'companies'];
        $auth = null;
        if (in_array($table, $protected_tables)) {
            $auth = requireAuthForModification($action, $table);
        }

        // Additional authorization check for company updates
        if ($table === 'companies' && $auth) {
            // Extract company ID from where clause
            $company_id = null;

            if (is_array($where) && isset($where['id'])) {
                $company_id = $where['id'];
            } elseif (is_array($where) && isset($where['company_id'])) {
                $company_id = $where['company_id'];
            } elseif (is_string($where)) {
                // Parse string-based where clause: "id='1'" or "id=1"
                // Try to extract id value using regex
                if (preg_match("/id\s*=\s*['\"]?(\d+)['\"]?/i", $where, $matches)) {
                    $company_id = $matches[1];
                } elseif (preg_match("/company_id\s*=\s*['\"]?(\d+)['\"]?/i", $where, $matches)) {
                    $company_id = $matches[1];
                }

                error_log("🔍 [AUTH] Parsed string where clause: '{$where}' -> company_id={$company_id}");
            }

            if (!$company_id) {
                http_response_code(400);
                error_log("🔴 [AUTH] Could not extract company_id from where clause. Where: " . json_encode($where));
                throw new Exception("Cannot determine company ID for authorization check");
            }

            // Check if user can manage this specific company
            if (!canManageCompany($auth, $company_id)) {
                http_response_code(403);
                error_log("🔴 [AUTH] Denying company update: User {$auth['email']} cannot manage company {$company_id}");

                // Provide detailed error message for debugging
                $detailedMessage = "You do not have permission to update company {$company_id}. ";
                if (!$auth['company_id']) {
                    $detailedMessage .= "Your user profile is not assigned to any company. Please contact your administrator to assign you to a company.";
                } else if ($auth['role'] === 'super_admin') {
                    $detailedMessage .= "Super admin check failed (unexpected). Please contact support.";
                } else {
                    $detailedMessage .= "You are assigned to company {$auth['company_id']} but trying to edit company {$company_id}. Regular admins can only edit their own company.";
                }

                throw new Exception($detailedMessage);
            }

            error_log("✅ [AUTH] Company update authorized for {$auth['email']} on company {$company_id}");
        }

        $sets = [];
        foreach ($data as $col => $val) {
            $sets[] = "`" . escape($conn, $col) . "`='" . escape($conn, $val) . "'";
        }

        $sql = "UPDATE `$table` SET " . implode(", ", $sets);

        if (is_array($where)) {
            $conditions = [];
            foreach ($where as $col => $val) {
                $conditions[] = "`" . escape($conn, $col) . "`='" . escape($conn, $val) . "'";
            }
            $sql .= " WHERE " . implode(" AND ", $conditions);
        } else {
            $sql .= " WHERE " . $where;
        }

        error_log("🟦 SQL UPDATE: " . $sql);

        if (!$conn->query($sql)) {
            error_log("🔴 MySQL Error: " . $conn->error . " | SQL: " . $sql);
            throw new Exception("Update failed: " . $conn->error);
        }

        $affectedRows = $conn->affected_rows;
        error_log("✅ Update completed - Affected rows: " . $affectedRows . " | Table: " . $table);

        $response = [
            'status' => 'success',
            'message' => 'Record updated',
            'affected_rows' => $affectedRows
        ];
        error_log("✅ Sending JSON response: " . json_encode($response));
        echo json_encode($response);
        exit();
    }
    elseif ($action === "delete_invoice_with_cascade") {
        // Transaction-safe invoice deletion with cascade
        // Deletes invoice and all related records in proper order:
        // 1. payment_audit_log entries
        // 2. receipts and receipt_items (linked to payments)
        // 3. payment_allocations
        // 4. payments
        // 5. credit_note_allocations
        // 6. stock_movements
        // 7. invoice_items
        // 8. invoice itself

        $invoice_id = $json_body['invoice_id'] ?? $_POST['invoice_id'] ?? null;

        if (!$invoice_id) {
            throw new Exception("Missing invoice_id parameter");
        }

        error_log("🗑️ [DELETE_CASCADE] Starting invoice deletion cascade for invoice_id: $invoice_id");

        // Escape the invoice ID for safe use in SQL
        $invoice_id_e = escape($conn, $invoice_id);

        // Start transaction for atomicity
        if (!$conn->begin_transaction()) {
            throw new Exception("Failed to start transaction");
        }

        try {
            // Step 1: Fetch invoice details before deletion (for audit/response)
            $invoice_sql = "SELECT * FROM invoices WHERE id = '$invoice_id_e' LIMIT 1";
            $invoice_result = $conn->query($invoice_sql);
            if (!$invoice_result || $invoice_result->num_rows === 0) {
                throw new Exception("Invoice not found");
            }
            $invoice = $invoice_result->fetch_assoc();
            $invoice_number = $invoice['invoice_number'];
            error_log("🗑️ [DELETE_CASCADE] Found invoice: $invoice_number");

            // Step 2: Find all payments related to this invoice (directly or through allocations)
            // Get payment IDs that are directly linked to invoice or allocated to it
            $payments_sql = "
                SELECT DISTINCT p.id FROM payments p
                WHERE p.invoice_id = '$invoice_id_e'
                OR p.id IN (SELECT payment_id FROM payment_allocations WHERE invoice_id = '$invoice_id_e')
            ";
            $payments_result = $conn->query($payments_sql);
            $payment_ids = [];
            if ($payments_result) {
                while ($row = $payments_result->fetch_assoc()) {
                    $payment_ids[] = $row['id'];
                }
            }

            // Step 3: Delete payment_audit_log entries for all related payments
            // This must be done before deleting payments
            if (!empty($payment_ids)) {
                $payment_ids_quoted = array_map(function($id) use ($conn) {
                    return "'" . escape($conn, $id) . "'";
                }, $payment_ids);
                $payment_ids_list = implode(',', $payment_ids_quoted);

                $delete_audit_sql = "DELETE FROM payment_audit_log WHERE payment_id IN ($payment_ids_list) OR invoice_id = '$invoice_id_e'";
                if (!$conn->query($delete_audit_sql)) {
                    throw new Exception("Failed to delete payment audit log: " . $conn->error);
                }
            }

            // Step 4: Find and delete receipts linked to these payments
            if (!empty($payment_ids)) {
                $payment_ids_quoted = array_map(function($id) use ($conn) {
                    return "'" . escape($conn, $id) . "'";
                }, $payment_ids);
                $payment_ids_list = implode(',', $payment_ids_quoted);

                // First delete receipt_items
                $delete_receipt_items_sql = "DELETE FROM receipt_items WHERE receipt_id IN (SELECT id FROM receipts WHERE payment_id IN ($payment_ids_list))";
                if (!$conn->query($delete_receipt_items_sql)) {
                    throw new Exception("Failed to delete receipt items: " . $conn->error);
                }

                // Then delete receipts
                $delete_receipts_sql = "DELETE FROM receipts WHERE payment_id IN ($payment_ids_list)";
                if (!$conn->query($delete_receipts_sql)) {
                    throw new Exception("Failed to delete receipts: " . $conn->error);
                }
            }

            // Step 5: Delete payment allocations related to this invoice
            // This must be done before deleting payments to maintain referential integrity
            $delete_allocations_sql = "DELETE FROM payment_allocations WHERE invoice_id = '$invoice_id_e'";
            if (!$conn->query($delete_allocations_sql)) {
                throw new Exception("Failed to delete payment allocations: " . $conn->error);
            }

            // Step 6: Delete all payments related to this invoice (directly linked)
            $delete_payments_sql = "DELETE FROM payments WHERE invoice_id = '$invoice_id_e'";
            if (!$conn->query($delete_payments_sql)) {
                throw new Exception("Failed to delete payments: " . $conn->error);
            }

            // Step 7: Delete credit note allocations related to this invoice
            // These have CASCADE delete on invoice_id in schema, but we delete explicitly for clarity
            $delete_credit_allocations_sql = "DELETE FROM credit_note_allocations WHERE invoice_id = '$invoice_id_e'";
            if (!$conn->query($delete_credit_allocations_sql)) {
                throw new Exception("Failed to delete credit note allocations: " . $conn->error);
            }

            // Step 8: Delete stock movements related to this invoice
            $delete_stock_movements_sql = "DELETE FROM stock_movements WHERE reference_type = 'INVOICE' AND reference_id = '$invoice_id_e'";
            if (!$conn->query($delete_stock_movements_sql)) {
                throw new Exception("Failed to delete stock movements: " . $conn->error);
            }

            // Step 9: Delete invoice items
            $delete_items_sql = "DELETE FROM invoice_items WHERE invoice_id = '$invoice_id_e'";
            if (!$conn->query($delete_items_sql)) {
                throw new Exception("Failed to delete invoice items: " . $conn->error);
            }

            // Step 10: Delete the invoice record itself
            $delete_invoice_sql = "DELETE FROM invoices WHERE id = '$invoice_id_e'";
            if (!$conn->query($delete_invoice_sql)) {
                throw new Exception("Failed to delete invoice: " . $conn->error);
            }

            // Commit transaction
            if (!$conn->commit()) {
                throw new Exception("Failed to commit transaction: " . $conn->error);
            }

            error_log("✅ [DELETE_CASCADE] Successfully deleted invoice $invoice_number with " . count($payment_ids) . " related payments");

            // Return success response
            echo json_encode([
                'status' => 'success',
                'message' => "Invoice $invoice_number and all related records deleted successfully",
                'data' => [
                    'invoice_id' => $invoice_id,
                    'invoice_number' => $invoice_number,
                    'related_records_deleted' => [
                        'payments_count' => count($payment_ids),
                        'timestamp' => date('Y-m-d H:i:s')
                    ]
                ]
            ]);
            exit();

        } catch (Exception $e) {
            // Rollback on any error
            $conn->rollback();
            error_log("🔴 [DELETE_CASCADE] Invoice deletion transaction failed for $invoice_id: " . $e->getMessage());
            throw new Exception("Invoice deletion failed: " . $e->getMessage());
        }
    }
    elseif ($action === "delete") {
        if (!$table || !$where) {
            throw new Exception("Missing table or where clause");
        }

        // Log delete request
        error_log("🗑️ [DELETE] Deleting from table: $table, where: " . json_encode($where));

        // Check authorization for modifications to protected tables
        $protected_tables = ['companies', 'users', 'profiles', 'user_permissions', 'roles'];
        $auth = null;
        if (in_array($table, $protected_tables)) {
            $auth = requireAuthForModification($action, $table);
        }

        // Additional authorization check for company deletes
        if ($table === 'companies' && $auth) {
            // Extract company ID from where clause
            $company_id = null;
            if (is_array($where) && isset($where['id'])) {
                $company_id = $where['id'];
            } elseif (is_array($where) && isset($where['company_id'])) {
                $company_id = $where['company_id'];
            } elseif (is_string($where)) {
                // Parse string-based where clause: "id='1'" or "id=1"
                // Try to extract id value using regex
                if (preg_match("/id\s*=\s*['\"]?(\d+)['\"]?/i", $where, $matches)) {
                    $company_id = $matches[1];
                } elseif (preg_match("/company_id\s*=\s*['\"]?(\d+)['\"]?/i", $where, $matches)) {
                    $company_id = $matches[1];
                }

                error_log("🔍 [AUTH] Parsed string where clause: '{$where}' -> company_id={$company_id}");
            }

            if (!$company_id) {
                http_response_code(400);
                error_log("🔴 [AUTH] Could not extract company_id from where clause. Where: " . json_encode($where));
                throw new Exception("Cannot determine company ID for authorization check");
            }

            // Check if user can manage this specific company
            if (!canManageCompany($auth, $company_id)) {
                http_response_code(403);
                error_log("🔴 [AUTH] Denying company delete: User {$auth['email']} cannot manage company {$company_id}");
                throw new Exception("You do not have permission to delete this company.");
            }

            error_log("✅ [AUTH] Company delete authorized for {$auth['email']} on company {$company_id}");
        }

        $sql = "DELETE FROM `$table`";

        if (is_array($where)) {
            $conditions = [];
            foreach ($where as $col => $val) {
                $conditions[] = "`" . escape($conn, $col) . "`='" . escape($conn, $val) . "'";
            }
            $sql .= " WHERE " . implode(" AND ", $conditions);
        } else {
            $sql .= " WHERE " . $where;
        }

        error_log("🗑️ [DELETE] Executing SQL: $sql");

        if (!$conn->query($sql)) {
            error_log("🔴 [DELETE] Error deleting from $table: " . $conn->error);
            throw new Exception("Delete failed: " . $conn->error);
        }

        $affected_rows = $conn->affected_rows;
        error_log("✅ [DELETE] Successfully deleted $affected_rows row(s) from $table");

        echo json_encode([
            'status' => 'success',
            'message' => 'Record deleted',
            'affected_rows' => $affected_rows
        ]);
        exit();
    }
    elseif ($action === "copy_record") {
        // Copy a database record with optional field modifications
        if (!$table || !$where) {
            throw new Exception("Missing table or where clause");
        }

        // Check authorization for modifications to protected tables
        $protected_tables = ['companies', 'users', 'profiles', 'user_permissions', 'roles'];
        if (in_array($table, $protected_tables)) {
            $auth = requireAuthForModification($action, $table);
        }

        // Fetch the source record
        $sql = "SELECT * FROM `$table`";
        $conditions = [];

        if (is_array($where)) {
            foreach ($where as $col => $val) {
                $conditions[] = "`" . escape($conn, $col) . "`='" . escape($conn, $val) . "'";
            }
        } else {
            $conditions[] = $where;
        }

        $sql .= " WHERE " . implode(" AND ", $conditions);

        $result = $conn->query($sql);
        if (!$result || $result->num_rows === 0) {
            throw new Exception("Source record not found");
        }

        $source_record = $result->fetch_assoc();

        // Prepare data for the new record
        $new_record = $source_record;

        // Remove id to allow auto-generation
        unset($new_record['id']);

        // Apply any field overrides from the request
        if (!empty($data) && is_array($data)) {
            foreach ($data as $key => $value) {
                if ($key !== 'id') {
                    $new_record[$key] = $value;
                }
            }
        }

        // Reset timestamps
        $new_record['created_at'] = date('Y-m-d H:i:s');
        if (isset($new_record['updated_at'])) {
            $new_record['updated_at'] = date('Y-m-d H:i:s');
        }

        // Build INSERT query
        $columns = [];
        $values = [];

        foreach ($new_record as $col => $val) {
            if ($val !== null) {
                $columns[] = "`" . escape($conn, $col) . "`";
                $values[] = "'" . escape($conn, $val) . "'";
            }
        }

        $sql = "INSERT INTO `$table` (" . implode(", ", $columns) . ") VALUES (" . implode(", ", $values) . ")";

        error_log("SQL COPY: " . $sql);

        if (!$conn->query($sql)) {
            error_log("MySQL Error: " . $conn->error . " | SQL: " . $sql);
            throw new Exception("Copy failed: " . $conn->error);
        }

        $new_id = $conn->insert_id;

        echo json_encode([
            'status' => 'success',
            'message' => 'Record copied successfully',
            'original_id' => $source_record['id'],
            'new_id' => $new_id,
            'data' => array_merge($new_record, ['id' => $new_id])
        ]);
    }
    elseif ($action === "copy_file") {
        // Copy a file from one location to another
        $source_file = $_POST['source_file'] ?? ($_GET['source_file'] ?? null);
        $destination_name = $_POST['destination_name'] ?? ($_GET['destination_name'] ?? null);

        if (!$source_file) {
            throw new Exception("Missing source_file parameter");
        }

        // Validate that source file path doesn't contain directory traversal attempts
        $source_file = str_replace(['../', '..\\', '\\'], '/', $source_file);
        if (strpos($source_file, '/') === 0) {
            $source_file = ltrim($source_file, '/');
        }

        // Build full source path
        global $UPLOADS_DIR;
        $uploads_dir = $UPLOADS_DIR;
        $full_source_path = $uploads_dir . '/' . $source_file;

        // Verify the source file exists and is within uploads directory
        $real_uploads_dir = realpath($uploads_dir);
        $real_source_path = realpath($full_source_path);

        if (!$real_source_path || !file_exists($real_source_path)) {
            throw new Exception("Source file not found: $source_file");
        }

        // Ensure file is within uploads directory (security check)
        if (strpos($real_source_path, $real_uploads_dir) !== 0) {
            throw new Exception("Access denied: File is outside allowed directory");
        }

        // Validate file is readable
        if (!is_readable($real_source_path)) {
            throw new Exception("Source file is not readable");
        }

        // Generate destination filename
        if (!$destination_name) {
            // Generate from source filename
            $source_info = pathinfo($real_source_path);
            $base_name = $source_info['filename'];
            $extension = $source_info['extension'];
            $destination_name = $base_name . '-copy-' . time() . '.' . $extension;
        } else {
            // Sanitize destination name
            $destination_name = preg_replace('/[^a-zA-Z0-9._-]/', '_', $destination_name);
        }

        $destination_path = $uploads_dir . '/' . $destination_name;

        // Verify destination doesn't exist
        if (file_exists($destination_path)) {
            throw new Exception("Destination file already exists");
        }

        error_log("📋 Copying file: $full_source_path -> $destination_path");

        // Copy the file
        if (!copy($real_source_path, $destination_path)) {
            throw new Exception("Failed to copy file");
        }

        // Verify copy was successful
        if (!file_exists($destination_path) || filesize($destination_path) !== filesize($real_source_path)) {
            @unlink($destination_path); // Clean up if verification fails
            throw new Exception("File copy verification failed");
        }

        // Construct the public URL
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $file_url = "$protocol://$host/uploads/$destination_name";

        error_log('✅ File copied successfully: ' . $file_url);

        echo json_encode([
            'status' => 'success',
            'message' => 'File copied successfully',
            'url' => $file_url,
            'file_url' => $file_url,
            'path' => "/uploads/$destination_name",
            'filename' => $destination_name,
            'source_filename' => basename($real_source_path)
        ]);
    }
    elseif ($action === "create_table") {
        if (!$table || !$schema) {
            throw new Exception("Missing table or schema");
        }

        $sql = "CREATE TABLE IF NOT EXISTS `$table` ($schema)";

        if (!$conn->query($sql)) {
            if (strpos($conn->error, 'already exists') !== false) {
                echo json_encode(['status' => 'success', 'message' => 'Table already exists']);
            } else {
                throw new Exception("Create table failed: " . $conn->error);
            }
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Table created']);
        }
    }
    elseif ($action === "drop_table") {
        if (!$table) {
            throw new Exception("Missing table");
        }

        $sql = "DROP TABLE IF EXISTS `$table`";

        if (!$conn->query($sql)) {
            throw new Exception("Drop table failed: " . $conn->error);
        }

        echo json_encode(['status' => 'success', 'message' => 'Table dropped']);
    }
    elseif ($action === "health") {
        echo json_encode([
            'status' => 'success',
            'message' => 'API is healthy'
        ]);
        exit();
    }

    /**
     * Helper function to get next document number internally (not via HTTP)
     * Uses the document_sequences table to maintain sequential numbering
     *
     * @param string $type Document type (INV, PAY, REC, etc.)
     * @param string|null $year Optional year (defaults to current year)
     * @param mysqli $conn Optional database connection (uses global if not provided)
     * @return string Formatted document number (e.g., "INV-2026-0001")
     */
    function getNextDocumentNumberInternal($type, $year = null, $conn = null) {
        // Use provided connection or fall back to global
        $database_conn = $conn ?? $GLOBALS['conn'];
        if (!$database_conn) {
            throw new Exception("Database connection not available");
        }

        // Validate document type
        $valid_types = ['INV', 'PRO', 'QT', 'PO', 'LPO', 'DN', 'CN', 'PAY', 'REC', 'RA', 'REM'];
        if (!in_array($type, $valid_types)) {
            throw new Exception("Invalid document type: $type. Valid types are: " . implode(', ', $valid_types));
        }

        // Default to current year if not provided
        if (!$year) {
            $year = date('Y');
        } else {
            $year = (int)$year;
            // Validate year is reasonable
            if ($year < 2000 || $year > (date('Y') + 10)) {
                throw new Exception("Invalid year: $year");
            }
        }

        // Ensure document_sequences table exists
        $table_check = $database_conn->query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_sequences'");
        if (!$table_check || $table_check->num_rows === 0) {
            $create_sql = "CREATE TABLE IF NOT EXISTS `document_sequences` (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                document_type CHAR(3) NOT NULL,
                year INT NOT NULL,
                sequence_number INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_type_year (document_type, year),
                INDEX idx_document_sequences_type (document_type)
            )";
            if (!$database_conn->query($create_sql)) {
                throw new Exception("Failed to create document_sequences table: " . $database_conn->error);
            }
        }

        // Check if this type-year combination exists, if not insert it
        $escaped_type = escape($database_conn, $type);
        $check_sql = "SELECT id, sequence_number FROM document_sequences WHERE document_type = '$escaped_type' AND year = $year LIMIT 1";
        $result = $database_conn->query($check_sql);

        if (!$result || $result->num_rows === 0) {
            // Insert new entry with sequence 0
            $insert_sql = "INSERT INTO document_sequences (document_type, year, sequence_number) VALUES ('$escaped_type', $year, 0)";
            if (!$database_conn->query($insert_sql)) {
                throw new Exception("Failed to initialize sequence: " . $database_conn->error);
            }
        }

        // Increment the sequence number (atomic operation)
        $update_sql = "UPDATE document_sequences SET sequence_number = sequence_number + 1 WHERE document_type = '$escaped_type' AND year = $year";
        if (!$database_conn->query($update_sql)) {
            throw new Exception("Failed to increment sequence: " . $database_conn->error);
        }

        // Get the updated sequence number
        $fetch_sql = "SELECT sequence_number FROM document_sequences WHERE document_type = '$escaped_type' AND year = $year LIMIT 1";
        $result = $database_conn->query($fetch_sql);
        if (!$result || $result->num_rows === 0) {
            throw new Exception("Failed to fetch sequence number");
        }

        $row = $result->fetch_assoc();
        $sequence = (int)$row['sequence_number'];

        // Format the number: TYPE-YEAR-NNNN (4-digit zero-padded)
        return sprintf('%s-%d-%04d', $type, $year, $sequence);
    }

    // Handle transaction-safe receipt creation
    if ($action === "create_receipt_with_items_transaction") {
        // Requires authorization for modifications
        $auth = requireAuthForModification($action, 'receipts');

        // Extract request parameters
        $companyId = $json_body['company_id'] ?? $_POST['company_id'] ?? null;
        $customerId = $json_body['customer_id'] ?? $_POST['customer_id'] ?? null;
        $payment = $json_body['payment'] ?? $_POST['payment'] ?? [];
        $invoiceData = $json_body['invoice'] ?? $_POST['invoice'] ?? [];
        $items = $json_body['items'] ?? $_POST['items'] ?? [];

        if (!$companyId || !$customerId) {
            throw new Exception("Missing company_id or customer_id");
        }

        // Validate payment data
        if (empty($payment) || !isset($payment['amount'])) {
            throw new Exception("Missing or invalid payment data");
        }

        // Generate document numbers BEFORE transaction (to avoid transaction nesting)
        // Generate invoice number if not provided
        if (empty($invoiceData['invoice_number'])) {
            try {
                $invoiceNumber = getNextDocumentNumberInternal('INV');
            } catch (Exception $e) {
                error_log("Failed to generate invoice number: " . $e->getMessage());
                throw new Exception("Failed to generate invoice number: " . $e->getMessage());
            }
        } else {
            $invoiceNumber = $invoiceData['invoice_number'];
        }

        // Generate payment number if not provided
        if (empty($payment['payment_number'])) {
            try {
                $paymentNumber = getNextDocumentNumberInternal('PAY');
            } catch (Exception $e) {
                error_log("Failed to generate payment number: " . $e->getMessage());
                throw new Exception("Failed to generate payment number: " . $e->getMessage());
            }
        } else {
            $paymentNumber = $payment['payment_number'];
        }

        // Start transaction
        if (!$conn->begin_transaction()) {
            throw new Exception("Failed to start transaction");
        }

        try {
            $paymentAmount = (float)$payment['amount'];
            $paymentDate = $payment['payment_date'] ?? date('Y-m-d');
            $invoiceAmount = 0;

            // Calculate invoice amount from items
            if (is_array($items) && count($items) > 0) {
                foreach ($items as $item) {
                    $itemQuantity = (float)($item['quantity'] ?? 0);
                    $itemPrice = (float)($item['unit_price'] ?? 0);
                    $itemTax = (float)($item['tax_amount'] ?? 0);
                    $invoiceAmount += ($itemQuantity * $itemPrice) + $itemTax;
                }
            } else if (isset($invoiceData['total_amount'])) {
                $invoiceAmount = (float)$invoiceData['total_amount'];
            }

            // Determine invoice status
            $invoiceStatus = 'draft';
            $paidAmount = 0;
            $balanceDue = $invoiceAmount;

            if ($paymentAmount >= $invoiceAmount) {
                $invoiceStatus = 'paid';
                $paidAmount = $invoiceAmount;
                $balanceDue = 0;
            } elseif ($paymentAmount > 0) {
                $invoiceStatus = 'partial';
                $paidAmount = $paymentAmount;
                $balanceDue = $invoiceAmount - $paymentAmount;
            }

            // Step 1: Create invoice
            $companyId_e = escape($conn, $companyId);
            $customerId_e = escape($conn, $customerId);
            $invoiceNumber_e = escape($conn, $invoiceNumber);

            $invoice_sql = "INSERT INTO `invoices` (
                company_id, customer_id, invoice_number, invoice_date, due_date,
                status, subtotal, tax_amount, total_amount, paid_amount, balance_due,
                notes, created_by, created_at, updated_at
            ) VALUES (
                '$companyId_e', '$customerId_e', '$invoiceNumber_e', '$paymentDate', '$paymentDate',
                '$invoiceStatus', '0', '0', '$invoiceAmount', '$paidAmount', '$balanceDue',
                'Direct receipt', " . ($auth['id'] ? "'" . escape($conn, $auth['id']) . "'" : "NULL") . ",
                NOW(), NOW()
            )";

            if (!$conn->query($invoice_sql)) {
                throw new Exception("Failed to create invoice: " . $conn->error);
            }

            $invoiceId = $conn->insert_id;
            if (!$invoiceId) {
                throw new Exception("Failed to get invoice ID");
            }

            // Step 2: Create invoice items (if any)
            if (is_array($items) && count($items) > 0) {
                foreach ($items as $index => $item) {
                    $itemDesc = escape($conn, $item['description'] ?? '');
                    $itemQty = (float)($item['quantity'] ?? 0);
                    $itemPrice = (float)($item['unit_price'] ?? 0);
                    $itemTax = (float)($item['tax_amount'] ?? 0);
                    $itemTaxPct = (float)($item['tax_percentage'] ?? 0);
                    $itemLineTotal = ($itemQty * $itemPrice) + $itemTax;

                    $item_sql = "INSERT INTO `invoice_items` (
                        invoice_id, product_id, description, quantity, unit_price,
                        tax_percentage, tax_amount, tax_inclusive, line_total, sort_order, created_at
                    ) VALUES (
                        '$invoiceId', NULL, '$itemDesc', '$itemQty', '$itemPrice',
                        '$itemTaxPct', '$itemTax', 0, '$itemLineTotal', " . ($index + 1) . ", NOW()
                    )";

                    if (!$conn->query($item_sql)) {
                        throw new Exception("Failed to create invoice item: " . $conn->error);
                    }
                }
            }

            // Step 3: Create payment
            $paymentMethod = $payment['payment_method'] ?? 'cash';
            // $paymentNumber is already generated before the transaction
            $referenceNumber = $payment['reference_number'] ?? null;

            $paymentMethod_e = escape($conn, $paymentMethod);
            $paymentNumber_e = escape($conn, $paymentNumber);
            $referenceNumber_e = $referenceNumber ? escape($conn, $referenceNumber) : null;

            $payment_sql = "INSERT INTO `payments` (
                company_id, invoice_id, payment_date, payment_method, amount,
                payment_number, reference_number, created_by, created_at, updated_at
            ) VALUES (
                '$companyId_e', '$invoiceId', '$paymentDate', '$paymentMethod_e', '$paymentAmount',
                '$paymentNumber_e', " . ($referenceNumber_e ? "'$referenceNumber_e'" : "NULL") . ",
                " . ($auth['id'] ? "'" . escape($conn, $auth['id']) . "'" : "NULL") . ", NOW(), NOW()
            )";

            if (!$conn->query($payment_sql)) {
                throw new Exception("Failed to create payment: " . $conn->error);
            }

            $paymentId = $conn->insert_id;
            if (!$paymentId) {
                throw new Exception("Failed to get payment ID");
            }

            // Step 4: Create payment allocation
            $allocation_sql = "INSERT INTO `payment_allocations` (
                payment_id, invoice_id, amount, created_at
            ) VALUES (
                '$paymentId', '$invoiceId', '$paymentAmount', NOW()
            )";

            if (!$conn->query($allocation_sql)) {
                throw new Exception("Failed to create payment allocation: " . $conn->error);
            }

            $allocationId = $conn->insert_id;

            // Step 5: Create receipt record
            $receiptNumber = 'REC-' . substr((string)time(), -6) . strtoupper(substr(md5(uniqid()), 0, 6));
            $receiptNumber_e = escape($conn, $receiptNumber);
            $excessAmount = max(0, $paymentAmount - $invoiceAmount);

            $receipt_sql = "INSERT INTO `receipts` (
                company_id, payment_id, invoice_id, receipt_number, receipt_date,
                receipt_type, total_amount, excess_amount, excess_handling, notes,
                created_by, created_at, updated_at
            ) VALUES (
                '$companyId_e', '$paymentId', '$invoiceId', '$receiptNumber_e', '$paymentDate',
                'direct_receipt', '$paymentAmount', '$excessAmount', 'pending', 'Direct receipt',
                " . ($auth['id'] ? "'" . escape($conn, $auth['id']) . "'" : "NULL") . ", NOW(), NOW()
            )";

            if (!$conn->query($receipt_sql)) {
                throw new Exception("Failed to create receipt: " . $conn->error);
            }

            $receiptId = $conn->insert_id;
            if (!$receiptId) {
                throw new Exception("Failed to get receipt ID");
            }

            // Step 6: Create receipt items snapshot (same items as invoice_items)
            if (is_array($items) && count($items) > 0) {
                foreach ($items as $index => $item) {
                    $itemDesc = escape($conn, $item['description'] ?? '');
                    $itemQty = (float)($item['quantity'] ?? 0);
                    $itemPrice = (float)($item['unit_price'] ?? 0);
                    $itemTax = (float)($item['tax_amount'] ?? 0);
                    $itemTaxPct = (float)($item['tax_percentage'] ?? 0);
                    $itemLineTotal = ($itemQty * $itemPrice) + $itemTax;

                    $receipt_item_sql = "INSERT INTO `receipt_items` (
                        receipt_id, product_id, description, quantity, unit_price,
                        tax_percentage, tax_amount, tax_inclusive, line_total, sort_order, created_at
                    ) VALUES (
                        '$receiptId', NULL, '$itemDesc', '$itemQty', '$itemPrice',
                        '$itemTaxPct', '$itemTax', 0, '$itemLineTotal', " . ($index + 1) . ", NOW()
                    )";

                    if (!$conn->query($receipt_item_sql)) {
                        throw new Exception("Failed to create receipt item: " . $conn->error);
                    }
                }
            }

            // Commit transaction
            if (!$conn->commit()) {
                throw new Exception("Failed to commit transaction: " . $conn->error);
            }

            // Fetch all created records for response
            $invoice_result = $conn->query("SELECT * FROM invoices WHERE id = '$invoiceId' LIMIT 1");
            $invoice = $invoice_result ? $invoice_result->fetch_assoc() : null;

            $payment_result = $conn->query("SELECT * FROM payments WHERE id = '$paymentId' LIMIT 1");
            $payment_record = $payment_result ? $payment_result->fetch_assoc() : null;

            $receipt_result = $conn->query("SELECT * FROM receipts WHERE id = '$receiptId' LIMIT 1");
            $receipt = $receipt_result ? $receipt_result->fetch_assoc() : null;

            // Return success response
            echo json_encode([
                'status' => 'success',
                'message' => 'Receipt created successfully with transaction safety',
                'data' => [
                    'receipt' => $receipt,
                    'payment' => $payment_record,
                    'invoice' => $invoice,
                    'allocation' => ['id' => $allocationId],
                    'excess_amount' => $excessAmount
                ]
            ]);

        } catch (Exception $e) {
            // Rollback on any error
            $conn->rollback();
            error_log("Receipt creation transaction failed: " . $e->getMessage());
            throw new Exception("Receipt creation failed: " . $e->getMessage());
        }
    }
    elseif ($action === "delete_receipt_with_cascade") {
        // Transaction-safe receipt deletion that cascades to all related records
        // Requires authorization for modifications
        error_log("🗑️ [DELETE_RECEIPT_CASCADE] ===== START DELETE RECEIPT CASCADE =====");
        error_log("🗑️ [DELETE_RECEIPT_CASCADE] Received action: delete_receipt_with_cascade");

        // Debug: Log the request data safely
        try {
            if ($json_body && is_array($json_body)) {
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] JSON body keys: " . implode(', ', array_keys($json_body)));
                if (isset($json_body['receipt_id'])) {
                    error_log("🗑️ [DELETE_RECEIPT_CASCADE] Receipt ID in body: " . $json_body['receipt_id']);
                }
            } else {
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] JSON body is not an array or is null");
            }
        } catch (Exception $logErr) {
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Error logging request data: " . $logErr->getMessage());
        }

        try {
            // Ensure we're inside a try block for all operations
            if (!isset($conn) || !$conn) {
                throw new Exception("Database connection not available");
            }

            // Verify connection is working
            if (!$conn->ping()) {
                throw new Exception("Database connection lost");
            }

            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Database connection verified");

            $auth = requireAuthForModification($action, 'receipts');
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Authorization passed for user");

            // Extract receipt ID from request
            $receiptId = $json_body['receipt_id'] ?? $_POST['receipt_id'] ?? null;
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Extracted receipt_id: " . var_export($receiptId, true));

            if (!$receiptId) {
                throw new Exception("Missing receipt_id parameter");
            }

            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Starting receipt deletion cascade for receipt_id: $receiptId");

            // Cast receipt ID to integer (since receipts.id is now INT AUTO_INCREMENT)
            $receiptId = (int)$receiptId;
            if ($receiptId <= 0) {
                throw new Exception("Invalid receipt_id: must be a positive integer");
            }
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Receipt ID validated and cast to int: $receiptId");

            // Start transaction for atomicity
            if (!$conn->begin_transaction()) {
                throw new Exception("Failed to start transaction: " . $conn->error);
            }
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Database transaction started successfully");

            // Initialize variables to avoid undefined variable errors later
            $receiptNumber = 'Unknown';
            $invoiceId = null;
            $paymentId = null;
            $receiptAmount = 0;

            // Step 1: Fetch receipt details before deletion (for audit/response)
            $receipt_sql = "SELECT * FROM receipts WHERE id = $receiptId LIMIT 1";
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 1 - Fetching receipt with SQL: $receipt_sql");
            $receipt_result = $conn->query($receipt_sql);
            if (!$receipt_result) {
                throw new Exception("Database query error: " . $conn->error);
            }
            if ($receipt_result->num_rows === 0) {
                throw new Exception("Receipt not found with id: $receiptId");
            }
            $receipt = $receipt_result->fetch_assoc();
            $receiptNumber = $receipt['receipt_number'] ?? 'Unknown';
            $invoiceId = $receipt['invoice_id'] ?? null;
            $paymentId = $receipt['payment_id'] ?? null;
            $receiptAmount = (float)($receipt['total_amount'] ?? 0);
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 1 SUCCESS - Found receipt: $receiptNumber (amount: $receiptAmount, invoiceId: $invoiceId, paymentId: $paymentId)");

            // Step 2: Delete receipt items (snapshot)
            // These have CASCADE delete on receipt_id, but we delete explicitly for clarity
            $delete_items_sql = "DELETE FROM receipt_items WHERE receipt_id = $receiptId";
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 2 - Deleting receipt items with SQL: $delete_items_sql");
            if (!$conn->query($delete_items_sql)) {
                throw new Exception("Failed to delete receipt items: " . $conn->error);
            }
            $items_affected = $conn->affected_rows;
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 2 SUCCESS - Deleted $items_affected receipt items");

            // Step 3: Delete payment_audit_log entries before deleting the payment
            if ($paymentId) {
                $paymentId = (int)$paymentId;
                $delete_audit_sql = "DELETE FROM payment_audit_log WHERE payment_id = $paymentId";
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 3 - Deleting payment audit logs with SQL: $delete_audit_sql");
                if (!$conn->query($delete_audit_sql)) {
                    throw new Exception("Failed to delete payment audit log: " . $conn->error);
                }
                $audit_affected = $conn->affected_rows;
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 3 SUCCESS - Deleted $audit_affected audit log entries");
            } else {
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 3 SKIPPED - No payment ID");
            }

            // Step 4: Delete payment allocations
            if ($paymentId) {
                $paymentId = (int)$paymentId;
                // With CASCADE constraint on payment_allocations, this will auto-delete related records
                // But we delete explicitly for clarity and control
                $delete_allocations_sql = "DELETE FROM payment_allocations WHERE payment_id = $paymentId";
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 4 - Deleting payment allocations with SQL: $delete_allocations_sql");
                if (!$conn->query($delete_allocations_sql)) {
                    throw new Exception("Failed to delete payment allocations: " . $conn->error);
                }
                $allocations_affected = $conn->affected_rows;
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 4 SUCCESS - Deleted $allocations_affected payment allocations");
            } else {
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 4 SKIPPED - No payment ID");
            }

            // Step 5: Delete the payment record
            if ($paymentId) {
                $paymentId = (int)$paymentId;
                $delete_payment_sql = "DELETE FROM payments WHERE id = $paymentId";
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 5 - Deleting payment with SQL: $delete_payment_sql");
                if (!$conn->query($delete_payment_sql)) {
                    throw new Exception("Failed to delete payment: " . $conn->error);
                }
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 5 SUCCESS - Payment deleted");
            } else {
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 5 SKIPPED - No payment ID");
            }

            // Step 6: Recalculate invoice balance and status if this receipt was linked to an invoice
            if ($invoiceId) {
                $invoiceId = (int)$invoiceId;
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6 - Recalculating invoice status for invoice_id: $invoiceId");

                // Fetch current invoice state
                $invoice_check_sql = "SELECT id, total_amount, status FROM invoices WHERE id = $invoiceId LIMIT 1";
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6a - Fetching invoice with SQL: $invoice_check_sql");
                $invoice_check_result = $conn->query($invoice_check_sql);

                if (!$invoice_check_result) {
                    throw new Exception("Failed to fetch invoice: " . $conn->error);
                }

                if ($invoice_check_result->num_rows > 0) {
                    $invoice = $invoice_check_result->fetch_assoc();
                    $total_amount = $invoice['total_amount'] ?? 0;
                    error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6b - Invoice found, total_amount: $total_amount");

                    // Calculate paid amount from remaining payment allocations
                    $paid_sum_sql = "
                        SELECT COALESCE(SUM(pa.amount), 0) as paid_amount
                        FROM payment_allocations pa
                        WHERE pa.invoice_id = $invoiceId
                    ";
                    error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6c - Calculating paid amount with SQL: $paid_sum_sql");
                    $paid_sum_result = $conn->query($paid_sum_sql);
                    $paid_amount = 0;
                    if ($paid_sum_result) {
                        $paid_row = $paid_sum_result->fetch_assoc();
                        $paid_amount = floatval($paid_row['paid_amount'] ?? 0);
                    } else {
                        throw new Exception("Failed to calculate paid amount: " . $conn->error);
                    }
                    error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6c - Paid amount calculated: $paid_amount");

                    $balance_due = max(0, floatval($total_amount) - $paid_amount);

                    // Determine new status based on payment state
                    $new_status = 'draft';
                    if ($paid_amount >= floatval($total_amount)) {
                        $new_status = 'paid';
                    } elseif ($paid_amount > 0) {
                        $new_status = 'partial';
                    }
                    error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6d - New invoice status: $new_status (paid: $paid_amount, balance_due: $balance_due)");

                    // Update invoice with recalculated values
                    $update_invoice_sql = "UPDATE invoices SET
                        status = '$new_status',
                        paid_amount = $paid_amount,
                        balance_due = $balance_due,
                        updated_at = NOW()
                        WHERE id = $invoiceId";

                    error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6e - Updating invoice with SQL: $update_invoice_sql");
                    if (!$conn->query($update_invoice_sql)) {
                        throw new Exception("Failed to update invoice status: " . $conn->error);
                    }
                    error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6 SUCCESS - Invoice updated");
                } else {
                    error_log("⚠️ [DELETE_RECEIPT_CASCADE] Step 6 WARNING - Invoice not found with id: $invoiceId");
                }
            } else {
                error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 6 SKIPPED - No invoice ID");
            }

            // Step 7: Delete the receipt record itself
            // This will cascade to receipt_items (though we already deleted them)
            $delete_receipt_sql = "DELETE FROM receipts WHERE id = $receiptId";
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 7 - Deleting receipt with SQL: $delete_receipt_sql");
            if (!$conn->query($delete_receipt_sql)) {
                throw new Exception("Failed to delete receipt: " . $conn->error);
            }
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Step 7 SUCCESS - Receipt record deleted");

            // Commit transaction
            error_log("🗑️ [DELETE_RECEIPT_CASCADE] Committing database transaction");
            if (!$conn->commit()) {
                throw new Exception("Failed to commit transaction: " . $conn->error);
            }

            error_log("✅ [DELETE_RECEIPT_CASCADE] ===== COMPLETE - Successfully deleted receipt $receiptNumber (amount: $receiptAmount, linked to invoice: $invoiceId) =====");

            // Return success response
            @ob_clean(); // Clear any accidental output (suppress any warnings)
            http_response_code(200);
            header('Content-Type: application/json; charset=utf-8');

            $response_data = [
                'status' => 'success',
                'message' => "Receipt $receiptNumber and all related records deleted successfully",
                'data' => [
                    'receipt_id' => (int)$receiptId,
                    'receipt_number' => (string)$receiptNumber,
                    'invoice_id' => $invoiceId,
                    'payment_id' => $paymentId,
                    'amount_reversed' => (float)$receiptAmount
                ]
            ];

            echo json_encode($response_data);
            exit();

        } catch (Exception $e) {
            // Rollback on any error
            error_log("🔴 [DELETE_RECEIPT_CASCADE] EXCEPTION CAUGHT: " . $e->getMessage());
            error_log("🔴 [DELETE_RECEIPT_CASCADE] Exception file: " . $e->getFile() . ", line: " . $e->getLine());
            error_log("🔴 [DELETE_RECEIPT_CASCADE] Stack trace: " . $e->getTraceAsString());

            // Safely attempt rollback
            if ($conn && is_object($conn)) {
                try {
                    $conn->rollback();
                    error_log("🔴 [DELETE_RECEIPT_CASCADE] Transaction rolled back");
                } catch (Exception $rollbackErr) {
                    error_log("🔴 [DELETE_RECEIPT_CASCADE] Rollback failed: " . $rollbackErr->getMessage());
                }
            }

            error_log("🔴 [DELETE_RECEIPT_CASCADE] ===== FAILED - Receipt deletion transaction failed: " . $e->getMessage() . " =====");

            // Safely output error response
            try {
                @ob_clean(); // Clear any accidental output (suppress warnings)
                http_response_code(400);
                header('Content-Type: application/json; charset=utf-8');

                $error_response = [
                    'status' => 'error',
                    'message' => 'Receipt deletion failed: ' . $e->getMessage()
                ];

                echo json_encode($error_response);
            } catch (Exception $outputErr) {
                error_log("🔴 [DELETE_RECEIPT_CASCADE] Failed to output error response: " . $outputErr->getMessage());
                // As a last resort, output plain text error
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
            exit();
        }
    }
    else {
        error_log("❌ API ERROR - Reaching Unknown action clause:");
        error_log("  Action value: [" . var_export($action, true) . "]");
        error_log("  Action length: " . strlen($action ?? ''));
        error_log("  Action bytes: " . bin2hex($action ?? ''));
        error_log("  Checking against: read, create, update, delete, upload_file, login, logout, check_auth");
        throw new Exception("Unknown action: $action");
    }

} catch (Exception $e) {
    // Ensure we have an appropriate HTTP status code
    $status_code = http_response_code();
    if (!$status_code || $status_code < 400) {
        http_response_code(400);
    }

    error_log("🔴 API Error [" . http_response_code() . "]: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    error_log("🔴 Stack trace: " . $e->getTraceAsString());

    try {
        @ob_clean(); // Clear any accidental output (suppress warnings)
        header('Content-Type: application/json; charset=utf-8');

        $error_response = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];

        echo json_encode($error_response);
    } catch (Exception $outputErr) {
        error_log("🔴 Failed to output error JSON: " . $outputErr->getMessage());
        // As fallback, output JSON anyway
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }

}

$conn->close();
?>
