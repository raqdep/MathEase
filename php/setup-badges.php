<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    // Check if Real-Life Problems badges exist
    $stmt = $pdo->prepare("SELECT * FROM badges WHERE name LIKE '%Real-Life%'");
    $stmt->execute();
    $existingBadges = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($existingBadges) === 0) {
        // Align with achievements.html + badge-management.php (MCQ quiz only; no legacy Solver/Master tiers).
        $badges = [
            [
                'name' => 'Real-Life Problems Expert',
                'description' => 'Score 60% or higher on the Solving Real-Life Problems quiz',
                'icon_url' => 'fas fa-globe',
                'criteria_type' => 'score',
                'criteria_value' => 60,
                'is_active' => 1
            ],
            [
                'name' => 'Real-Life Problems Champion',
                'description' => 'Perfect score on the Solving Real-Life Problems quiz',
                'icon_url' => 'fas fa-trophy',
                'criteria_type' => 'score',
                'criteria_value' => 100,
                'is_active' => 1
            ]
        ];
        
        $insertStmt = $pdo->prepare("
            INSERT INTO badges (name, description, icon_url, criteria_type, criteria_value, is_active) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $createdBadges = [];
        foreach ($badges as $badge) {
            $insertStmt->execute([
                $badge['name'],
                $badge['description'],
                $badge['icon_url'],
                $badge['criteria_type'],
                $badge['criteria_value'],
                $badge['is_active']
            ]);
            $createdBadges[] = $badge['name'];
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Real-Life Problems badges created successfully',
            'created_badges' => $createdBadges
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Real-Life Problems badges already exist',
            'existing_badges' => $existingBadges
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
