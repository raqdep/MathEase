<?php
require_once 'config.php';

// Handle email verification status check
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    ob_start();
    $response = array();
    
    try {
        $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
        
        if ($userId <= 0) {
            throw new Exception('User ID is required');
        }
        
        // Check if user exists and get verification status
        $stmt = $pdo->prepare("SELECT id, first_name, email, email_verified FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('User not found');
        }
        
        $user = $stmt->fetch();
        
        if ($user['email_verified']) {
            $response = array(
                'success' => true,
                'verified' => true,
                'message' => 'Email verified successfully'
            );
        } else {
            $response = array(
                'success' => false,
                'verified' => false,
                'message' => 'Email not yet verified. Please check your email and click the verification link.'
            );
        }
        
    } catch (Exception $e) {
        $response = array(
            'success' => false,
            'message' => $e->getMessage()
        );
    }
    
    // Return JSON response
    header('Content-Type: application/json');
    if (ob_get_length() !== false) {
        ob_clean();
    }
    echo json_encode($response);
    exit;
}

// If not POST request, return error
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
exit;
?>
