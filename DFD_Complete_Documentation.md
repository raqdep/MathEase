# MathEase System - Complete Data Flow Diagram (DFD) Documentation

## Overview
This document describes the complete Data Flow Diagrams (DFD) for the MathEase Learning Platform across all levels (0-3). DFDs visualize how data flows through the system, showing processes, data stores, external entities, and data flows.

## DFD Files

1. **MathEase_DFD_Level0.xml** - Context Diagram
2. **MathEase_DFD_Level1.xml** - System Decomposition
3. **MathEase_DFD_Level2.xml** - Process 3.0 (Class Management) Decomposition
4. **MathEase_DFD_Level3.xml** - Process 3.2 (Join Class Request) Decomposition

---

## Level 0: Context Diagram

**File:** `MathEase_DFD_Level0.xml`

The context diagram shows the entire system as a single process (numbered "0") with all external entities and their interactions.

### External Entities:
1. **Student** - Grade 11 STEM students using the platform
2. **Teacher** - Educators managing classes and monitoring progress
3. **Admin** - System administrators managing teacher approvals
4. **Email System (SMTP)** - External email service for verification and notifications

### Central Process:
- **0: MathEase Learning Platform** - The entire system as one process

### Main Data Flows:

**Student ↔ System:**
- **To System:** Registration Data, Login Credentials, Class Join Request, Lesson Completion, Quiz Answers
- **From System:** Lessons, Quizzes, Progress Reports, Notifications

**Teacher ↔ System:**
- **To System:** Class Creation, Enrollment Approval, Topic Lock Settings, Performance Reports Request
- **From System:** Class Lists, Student Progress, Enrollment Requests, Performance Analytics

**Admin ↔ System:**
- **To System:** Teacher Approval, System Configuration, User Management
- **From System:** System Statistics, User Reports, Teacher Requests

**System ↔ Email System:**
- **To Email:** Verification Email, OTP Code, Password Reset Link
- **From Email:** Email Delivery Status

---

## Level 1: System Decomposition

**File:** `MathEase_DFD_Level1.xml`

The Level 1 DFD breaks down the system into 9 major processes and shows all data stores.

### Processes (9 Major Processes):

1. **1.0 User Authentication**
   - Handles login for students, teachers, and admins
   - Validates credentials
   - Manages sessions

2. **2.0 Registration & Email Verification**
   - Processes new user registrations
   - Generates verification tokens
   - Sends verification emails

3. **3.0 Class Management**
   - Creates classes (teachers)
   - Manages class enrollments
   - Handles join requests and approvals

4. **4.0 Lesson Management**
   - Provides lesson content
   - Tracks lesson access
   - Records lesson completion

5. **5.0 Quiz Management**
   - Serves quiz questions
   - Processes quiz submissions
   - Calculates scores

6. **6.0 Progress Tracking**
   - Tracks user progress
   - Calculates completion percentages
   - Generates progress reports

7. **7.0 Notification Management**
   - Creates notifications
   - Sends notifications to users
   - Tracks notification status

8. **8.0 Admin Management**
   - Manages teacher approvals
   - Generates system statistics
   - Handles admin operations

9. **9.0 Badge & Achievement System**
   - Evaluates achievement criteria
   - Awards badges
   - Tracks user achievements

### Data Stores (16 Data Stores):

- **D1: Users** - Student user accounts
- **D2: Teachers** - Teacher accounts and profiles
- **D3: Classes** - Class information and settings
- **D4: Class Enrollments** - Student-class relationships
- **D5: Topics** - Learning topic definitions
- **D6: Lessons** - Lesson content and materials
- **D7: Lesson Completion** - Records of completed lessons
- **D8: Quizzes** - Quiz definitions and questions
- **D9: Quiz Attempts** - Student quiz attempt records
- **D10: Quiz Answers** - Individual question answers
- **D11: User Progress** - Overall user progress tracking
- **D12: Topic Progress** - Per-topic progress tracking
- **D13: Notifications** - User notification records
- **D14: Badges** - Badge definitions and criteria
- **D15: User Badges** - User-badge relationships
- **D16: Admins** - Admin user accounts

---

## Level 2: Process 3.0 Decomposition (Class Management)

**File:** `MathEase_DFD_Level2.xml`

This level decomposes Process 3.0 (Class Management) into 5 sub-processes.

### Sub-Processes:

1. **3.1 Create Class**
   - Teacher creates a new class
   - Generates unique class code
   - Sets class settings and capacity

2. **3.2 Join Class Request**
   - Student submits class join request
   - Validates class code
   - Creates enrollment request

3. **3.3 Approve/Reject Enrollment**
   - Teacher reviews enrollment requests
   - Approves or rejects student enrollment
   - Updates enrollment status

4. **3.4 Manage Class Settings**
   - Teacher updates class settings
   - Manages topic locks
   - Configures class parameters

5. **3.5 View Class Members**
   - Teacher views enrolled students
   - Displays student information
   - Shows enrollment status

### Data Stores Used:
- **D1: Users** - Student information
- **D2: Teachers** - Teacher information
- **D3: Classes** - Class data
- **D4: Class Enrollments** - Enrollment records

### Key Data Flows:
- Class Code flows from 3.1 to 3.2
- Enrollment Request flows from 3.2 to 3.3
- Approval Status flows from 3.3 back to 3.2

---

## Level 3: Process 3.2 Decomposition (Join Class Request)

**File:** `MathEase_DFD_Level3.xml`

This level further decomposes Process 3.2 (Join Class Request) into 5 detailed sub-processes.

### Sub-Processes:

1. **3.2.1 Validate Class Code**
   - Validates class code format
   - Checks if class code exists
   - Verifies class is active

2. **3.2.2 Check Class Availability**
   - Checks if class has available slots
   - Verifies maximum capacity
   - Determines if class is full

3. **3.2.3 Check Existing Enrollment**
   - Checks if student is already enrolled
   - Verifies enrollment status
   - Prevents duplicate enrollments

4. **3.2.4 Create Enrollment Request**
   - Creates new enrollment record
   - Sets status to "pending"
   - Records enrollment timestamp

5. **3.2.5 Notify Teacher**
   - Creates notification for teacher
   - Sends enrollment request alert
   - Updates notification system

### Data Stores Used:
- **D3: Classes** - For class validation and capacity checks
- **D4: Class Enrollments** - For enrollment records
- **D13: Notifications** - For teacher notifications

### Key Data Flows:
- Valid Class Code flows from 3.2.1 to 3.2.2
- Class Available flows from 3.2.2 to 3.2.3
- Not Enrolled flows from 3.2.3 to 3.2.4
- Enrollment Created flows from 3.2.4 to 3.2.5

---

## DFD Hierarchy

```
Level 0: MathEase Learning Platform (Context)
    └── Level 1: System Decomposition (9 processes)
        └── Level 2: Process 3.0 Class Management (5 sub-processes)
            └── Level 3: Process 3.2 Join Class Request (5 detailed sub-processes)
```

---

## How to View the DFDs

### Using Draw.io (diagrams.net)

1. **Online Method:**
   - Go to [https://app.diagrams.net/](https://app.diagrams.net/)
   - Click "Open Existing Diagram"
   - Upload any XML file (Level 0, 1, 2, or 3)
   - The diagram will load and be fully editable

2. **Desktop Method:**
   - Download Draw.io desktop app
   - Open Draw.io
   - File → Open → Select the XML file
   - Edit and export as needed

### Export Options
- **PNG/JPEG**: For presentations and documents
- **PDF**: For documentation
- **SVG**: For web display
- **XML**: For editing (already in this format)

---

## DFD Symbols and Conventions

### External Entities (Rectangles)
- Represent sources or destinations of data outside the system
- Examples: Student, Teacher, Admin, Email System

### Processes (Rounded rectangles)
- Represent transformations of data
- Numbered hierarchically (e.g., 1.0, 3.1, 3.2.1)
- Named with verb phrases

### Data Stores (Open rectangles/Parallelograms)
- Represent data at rest
- Labeled with "D" prefix (e.g., D1, D2)
- Can be read from or written to

### Data Flows (Arrows)
- Show direction of data movement
- Labeled with data names
- Can be bidirectional

---

## System Architecture Summary

### User Types:
1. **Students** - Primary users learning Pre-Calculus
2. **Teachers** - Manage classes and monitor student progress
3. **Admins** - System administrators approving teachers

### Core Features:
1. **Authentication** - Secure login for all user types
2. **Registration** - Email-verified account creation
3. **Class Management** - Teacher-student class organization
4. **Learning Content** - Topics and lessons
5. **Assessment** - Quizzes with scoring
6. **Progress Tracking** - Comprehensive progress monitoring
7. **Notifications** - Real-time alerts and updates
8. **Gamification** - Badge and achievement system

### Database Structure:
- 16 major data stores
- Normalized relational database
- Foreign key relationships
- Indexed for performance

---

## Data Flow Patterns

### Registration Flow (Level 1):
1. Student submits registration → 2.0
2. 2.0 writes to D1 (Users)
3. 2.0 sends verification email → Email System
4. Student verifies email → 2.0
5. 2.0 updates D1 (email_verified)

### Class Join Flow (Level 2 & 3):
1. Student submits class code → 3.2
2. 3.2.1 validates code → D3 (Classes)
3. 3.2.2 checks availability → D3
4. 3.2.3 checks existing enrollment → D4 (Class Enrollments)
5. 3.2.4 creates enrollment request → D4
6. 3.2.5 creates notification → D13 (Notifications)
7. Teacher reviews → 3.3
8. 3.3 approves/rejects → D4

### Learning Flow (Level 1):
1. Student requests lesson → 4.0
2. 4.0 reads from D5 (Topics), D6 (Lessons)
3. Student completes lesson → 4.0
4. 4.0 writes to D7 (Lesson Completion)
5. 4.0 sends completion status → 6.0
6. 6.0 updates D11 (User Progress), D12 (Topic Progress)
7. 6.0 sends progress update → 9.0
8. 9.0 checks badge criteria → D14 (Badges)
9. 9.0 awards badge → D15 (User Badges)

### Quiz Flow (Level 1):
1. Student requests quiz → 5.0
2. 5.0 reads from D8 (Quizzes)
3. Student submits answers → 5.0
4. 5.0 writes to D9 (Quiz Attempts), D10 (Quiz Answers)
5. 5.0 calculates score → 6.0
6. 5.0 sends completion event → 7.0
7. 7.0 creates notification → D13

---

## Notes for Developers

### When Modifying the System:
1. **Adding New Features**: Update the DFD to reflect new processes and data flows
2. **Database Changes**: Update data store labels and connections
3. **New User Types**: Add external entities and their flows
4. **API Changes**: Update process-to-process flows

### Best Practices:
- Keep DFDs updated with code changes
- Document new data flows
- Maintain consistency across DFD levels
- Use clear, descriptive labels
- Follow standard DFD conventions

---

## Version History

- **Version 1.0** (2025-01-27)
  - Initial DFD creation
  - Level 0 Context Diagram
  - Level 1 System Decomposition
  - Level 2 Process 3.0 Decomposition
  - Level 3 Process 3.2 Decomposition
  - Complete documentation

---

## Contact

For questions or updates to the DFDs, please refer to the main project documentation or contact the development team.
