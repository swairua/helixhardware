<?php
/**
 * Table Definitions Library
 * Defines all database table schemas and provides utilities for table management
 */

/**
 * Get all table definitions
 */
function getTableDefinitions() {
    return [
        'users' => 'id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE, password TEXT, role VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'profiles' => 'id INT PRIMARY KEY, email VARCHAR(255) NOT NULL, full_name VARCHAR(255), avatar_url TEXT, role VARCHAR(50) DEFAULT "user", status VARCHAR(50) DEFAULT "pending", phone VARCHAR(20), company_id INT, department VARCHAR(255), position VARCHAR(255), invited_by INT, invited_at TIMESTAMP NULL, last_login TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'contacts' => 'id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(20), subject VARCHAR(255), message TEXT, status VARCHAR(50) DEFAULT "new", reply_notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'newsletter' => 'id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'leads' => 'id INT AUTO_INCREMENT PRIMARY KEY, business_name VARCHAR(255), contact_person VARCHAR(255), phone VARCHAR(20), email VARCHAR(255), business_category VARCHAR(255), location VARCHAR(255), website_url VARCHAR(255), website_status VARCHAR(50), lead_source VARCHAR(50), expressed_need TEXT, notes TEXT, status VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'quotations' => 'id INT AUTO_INCREMENT PRIMARY KEY, portfolio_id INT, customer_name VARCHAR(255), customer_email VARCHAR(255), customer_phone VARCHAR(20), project_description TEXT, budget_range VARCHAR(100), timeline VARCHAR(100), status VARCHAR(50) DEFAULT "new", notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'portfolios' => 'id INT AUTO_INCREMENT PRIMARY KEY, admin_id INT, title VARCHAR(255), description TEXT, website_url VARCHAR(255) UNIQUE, screenshot_url VARCHAR(255), status VARCHAR(50) DEFAULT "pending", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'opportunities' => 'id INT AUTO_INCREMENT PRIMARY KEY, source VARCHAR(2048), snippet TEXT, url VARCHAR(2048), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'discovery_leads' => 'id INT AUTO_INCREMENT PRIMARY KEY, business_name VARCHAR(255), location VARCHAR(255), phone VARCHAR(20), email VARCHAR(255), website_url VARCHAR(255), website_status VARCHAR(50), notes TEXT, status VARCHAR(50) DEFAULT "new", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'logs' => 'id INT AUTO_INCREMENT PRIMARY KEY, message TEXT, level VARCHAR(50), source VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'chat_messages' => 'id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'web_app_leads' => 'id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(20), message TEXT, source VARCHAR(255), status VARCHAR(50) DEFAULT "new", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    ];
}

/**
 * Check the status of all tables in the database
 */
function checkTableStatus($conn) {
    $tables = getTableDefinitions();
    $tableStatus = [];
    
    foreach (array_keys($tables) as $tableName) {
        // Check if table exists
        $result = $conn->query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$tableName'");
        $exists = $result && $result->num_rows > 0;
        
        $tableStatus[$tableName] = [
            'exists' => $exists,
            'name' => $tableName
        ];
    }
    
    return $tableStatus;
}

/**
 * Create all missing tables in the database
 */
function createMissingTables($conn, $requestedTables = null) {
    $allTables = getTableDefinitions();
    $tablesToCreate = $requestedTables ? array_intersect_key($allTables, array_flip($requestedTables)) : $allTables;
    
    $created = [];
    $failed = [];
    $skipped = [];
    
    foreach ($tablesToCreate as $tableName => $schema) {
        // Check if table already exists
        $result = $conn->query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$tableName'");
        
        if ($result && $result->num_rows > 0) {
            $skipped[] = $tableName;
            continue;
        }
        
        // Create table
        $sql = "CREATE TABLE IF NOT EXISTS `$tableName` ($schema)";
        if ($conn->query($sql)) {
            $created[] = $tableName;
        } else {
            $failed[] = [
                'table' => $tableName,
                'error' => $conn->error
            ];
        }
    }
    
    return [
        'success' => count($failed) === 0,
        'created' => $created,
        'skipped' => $skipped,
        'failed' => $failed,
        'total_created' => count($created),
        'total_skipped' => count($skipped),
        'total_failed' => count($failed)
    ];
}

/**
 * Drop all tables from the database
 */
function dropAllTables($conn) {
    $tables = getTableDefinitions();
    $dropped = [];
    $failed = [];
    
    foreach (array_keys($tables) as $tableName) {
        $sql = "DROP TABLE IF EXISTS `$tableName`";
        if ($conn->query($sql)) {
            $dropped[] = $tableName;
        } else {
            $failed[] = [
                'table' => $tableName,
                'error' => $conn->error
            ];
        }
    }
    
    return [
        'success' => count($failed) === 0,
        'dropped' => $dropped,
        'failed' => $failed
    ];
}

/**
 * Reset the database - drop all tables and recreate them
 */
function resetDatabase($conn) {
    $dropResult = dropAllTables($conn);
    if (!$dropResult['success']) {
        return [
            'success' => false,
            'message' => 'Failed to drop tables',
            'details' => $dropResult
        ];
    }
    
    $createResult = createMissingTables($conn);
    return [
        'success' => $createResult['success'],
        'message' => 'Database reset successful',
        'dropped' => $dropResult['dropped'],
        'created' => $createResult['created'],
        'failed' => $createResult['failed']
    ];
}

?>
