<?php
echo "error_log destination: " . ini_get('error_log') . "\n";
error_log("FUSION_TEST_LOG");
echo "Logged FUSION_TEST_LOG\n";
?>
