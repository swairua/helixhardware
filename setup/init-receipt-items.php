<?php
/**
 * Initialize Receipt Items Table
 * Endpoint to create the receipt_items table if it doesn't exist
 * 
 * Usage:
 * POST /setup/init-receipt-items.php
 * OR from the browser:
 * GET /setup/init-receipt-items.php
 * 
 * Response: JSON with success status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Security: Check if running from localhost or with authorization header
$isLocalhost = in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', 'localhost', '::1']);
$hasAuth = isset($_GET['token']) || isset($_POST['token']) || isset($_SERVER['HTTP_AUTHORIZATION']);

if (!$isLocalhost && !$hasAuth) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Access denied. This endpoint can only be accessed from localhost or with proper authorization.'
    ]);
    exit;
}

// Get database connection
require_once __DIR__ . '/../config/db.php';

if (!isset($conn) || !$conn) {
    // Try to create connection if not already set
    $servername = getenv('DB_SERVER') ?: 'localhost';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASSWORD') ?: '';
    $database = getenv('DB_NAME') ?: 'wayrusc1_med';

    $conn = new mysqli($servername, $username, $password, $database);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]);
        exit;
    }
}

try {
    // SQL to create receipt_items table
    $sql = "CREATE TABLE IF NOT EXISTS `receipt_items` (
        `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID identifier',
        `receipt_id` CHAR(36) NOT NULL COMMENT 'Foreign key to receipts',
        `product_id` CHAR(36) COMMENT 'Foreign key to products (optional)',
        `description` TEXT NOT NULL COMMENT 'Item description',
        `quantity` DECIMAL(10, 3) NOT NULL COMMENT 'Item quantity',
        `unit_price` DECIMAL(15, 2) NOT NULL COMMENT 'Price per unit',
        `tax_percentage` DECIMAL(5, 2) DEFAULT 0 COMMENT 'Tax percentage',
        `tax_amount` DECIMAL(15, 2) DEFAULT 0 COMMENT 'Calculated tax amount',
        `tax_inclusive` TINYINT(1) DEFAULT 0 COMMENT 'Whether tax is included in unit price',
        `discount_before_vat` DECIMAL(15, 2) DEFAULT 0 COMMENT 'Discount applied before tax',
        `tax_setting_id` CHAR(36) COMMENT 'Reference to tax_settings for audit',
        `line_total` DECIMAL(15, 2) NOT NULL COMMENT 'Total for this line item',
        `notes` TEXT COMMENT 'Additional notes for this item',
        `sort_order` INT DEFAULT 0 COMMENT 'Display order',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When item was created',
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last updated',
        CONSTRAINT `fk_receipt_items_receipt_id` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_receipt_items_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
        KEY `idx_receipt_items_receipt_id` (`receipt_id`),
        KEY `idx_receipt_items_product_id` (`product_id`),
        KEY `idx_receipt_items_created_at` (`created_at` DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conn->query($sql)) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'receipt_items table initialized successfully',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to create receipt_items table: ' . $conn->error
        ]);
    }

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
