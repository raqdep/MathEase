<?php

declare(strict_types=1);

final class QuizGen_Repository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findForTeacher(int $id, int $teacherId): ?array
    {
        $st = $this->pdo->prepare('SELECT * FROM teacher_generated_quizzes WHERE id = ? AND teacher_id = ?');
        $st->execute([$id, $teacherId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findPublished(int $id): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM teacher_generated_quizzes WHERE id = ? AND status = 'published'");
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function findPublishedVisibleToStudents(int $id): ?array
    {
        $st = $this->pdo->prepare("
            SELECT * FROM teacher_generated_quizzes
            WHERE id = ? AND status = 'published' AND visible_to_students = 1
        ");
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createDraft(int $teacherId, string $title, string $slug, ?string $pdfPath, string $topicsJson, string $extractedText): int
    {
        $st = $this->pdo->prepare('
            INSERT INTO teacher_generated_quizzes (teacher_id, title, public_slug, status, topics_json, extracted_text, pdf_storage_path)
            VALUES (?, ?, ?, \'draft\', ?, ?, ?)
        ');
        $st->execute([$teacherId, $title, $slug, $topicsJson, $extractedText, $pdfPath]);
        return (int) $this->pdo->lastInsertId();
    }

    public function updateQuestions(int $id, int $teacherId, ?string $tosJson, string $questionsJson): void
    {
        $st = $this->pdo->prepare('
            UPDATE teacher_generated_quizzes
            SET questions_json = ?, tos_json = COALESCE(?, tos_json), updated_at = NOW()
            WHERE id = ? AND teacher_id = ?
        ');
        $st->execute([$questionsJson, $tosJson, $id, $teacherId]);
    }

    public function saveTos(int $id, int $teacherId, string $tosJson): void
    {
        $st = $this->pdo->prepare('UPDATE teacher_generated_quizzes SET tos_json = ?, updated_at = NOW() WHERE id = ? AND teacher_id = ?');
        $st->execute([$tosJson, $id, $teacherId]);
    }

    public function publish(int $id, int $teacherId, int $classId, string $title, string $questionsJson): void
    {
        $st = $this->pdo->prepare("
            UPDATE teacher_generated_quizzes
            SET status = 'published', class_id = ?, title = ?, questions_json = ?,
                visible_to_students = 0, published_at = NOW(), updated_at = NOW()
            WHERE id = ? AND teacher_id = ?
        ");
        $st->execute([$classId, $title, $questionsJson, $id, $teacherId]);
    }

    public function setVisibleToStudents(int $id, int $teacherId, bool $visible): bool
    {
        $st = $this->pdo->prepare("
            UPDATE teacher_generated_quizzes
            SET visible_to_students = ?, updated_at = NOW()
            WHERE id = ? AND teacher_id = ? AND status = 'published'
        ");
        $st->execute([$visible ? 1 : 0, $id, $teacherId]);

        return $st->rowCount() > 0;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listForTeacher(int $teacherId): array
    {
        $st = $this->pdo->prepare('
            SELECT id, title, status, class_id, public_slug, created_at, published_at, visible_to_students
            FROM teacher_generated_quizzes
            WHERE teacher_id = ?
            ORDER BY updated_at DESC
        ');
        $st->execute([$teacherId]);
        return $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Published quizzes for classes the student is approved in.
     * @return list<array<string, mixed>>
     */
    public function listPublishedForStudent(int $studentId): array
    {
        $st = $this->pdo->prepare("
            SELECT DISTINCT q.id, q.title, q.class_id, c.class_name, q.published_at
            FROM teacher_generated_quizzes q
            JOIN class_enrollments ce ON ce.class_id = q.class_id AND ce.student_id = ?
            JOIN classes c ON c.id = q.class_id AND c.is_active = TRUE
            WHERE q.status = 'published' AND q.visible_to_students = 1
              AND ce.enrollment_status = 'approved'
            ORDER BY q.published_at DESC
        ");
        $st->execute([$studentId]);
        return $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function validateClassForTeacher(int $classId, int $teacherId): bool
    {
        $st = $this->pdo->prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ? AND is_active = TRUE');
        $st->execute([$classId, $teacherId]);
        return (bool) $st->fetch();
    }

    public function studentCanAccessQuiz(int $quizId, int $studentId): bool
    {
        $st = $this->pdo->prepare("
            SELECT q.id
            FROM teacher_generated_quizzes q
            JOIN class_enrollments ce ON ce.class_id = q.class_id AND ce.student_id = ?
            WHERE q.id = ? AND q.status = 'published' AND q.visible_to_students = 1
              AND ce.enrollment_status = 'approved'
        ");
        $st->execute([$studentId, $quizId]);
        return (bool) $st->fetch();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function analytics(int $quizId, int $teacherId): array
    {
        $q = $this->findForTeacher($quizId, $teacherId);
        if (!$q || ($q['status'] ?? '') !== 'published') {
            return [];
        }
        $st = $this->pdo->prepare("
            SELECT AVG(score) as avg_score, AVG(correct_answers) as avg_correct, COUNT(*) as attempts
            FROM generated_quiz_attempts
            WHERE quiz_id = ?
        ");
        $st->execute([$quizId]);
        return $st->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public function insertAttempt(
        int $quizId,
        int $studentId,
        int $score,
        int $total,
        int $correct,
        string $answersJson,
        string $resultsJson,
        string $orderJson
    ): void {
        $st = $this->pdo->prepare('
            INSERT INTO generated_quiz_attempts (quiz_id, student_id, score, total_questions, correct_answers, answers_json, results_json, questions_order_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $st->execute([$quizId, $studentId, $score, $total, $correct, $answersJson, $resultsJson, $orderJson]);
    }
}
