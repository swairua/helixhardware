<?php
$db_host = 'localhost';
$db_user = 'layonsc1_med';
$db_pass = 'Sirgeorge.12';
$db_name = 'layonsc1_med';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Receipts table structure:\n";
$res = $conn->query("DESCRIBE receipts");
while ($row = $res->fetch_assoc()) {
    print_r($row);
}

echo "\nLast 5 receipts:\n";
$res = $conn->query("SELECT id, receipt_number, company_id FROM receipts ORDER BY id DESC LIMIT 5");
while ($row = $res->fetch_assoc()) {
    print_r($row);
}

$conn->close();
?>
