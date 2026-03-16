# MathEase System - Data Flow Diagram (DFD) Documentation

## Overview
This document describes the complete Data Flow Diagrams (DFD) for the MathEase Learning Platform. DFDs are used to visualize how data flows through the system, showing processes, data stores, external entities, and data flows.

## DFD Levels

### Level 0: Context Diagram
**File:** `MathEase_DFD_Level0.xml`

The context diagram shows the system as a single process with all external entities and their interactions.

#### External Entities:
1. **Student** - Grade 11 STEM students using the platform
2. **Teacher** - Educators managing classes and monitoring progress
3. **Admin** - System administrators managing teacher approvals
4. **Email System (SMTP)** - External email service for verification and notifications

#### Main Data Flows:
- **Student ↔ System**: Registration, login, lessons, quizzes, progress, notifications
- **Teacher ↔ System**: Class management, enrollment approval, progress monitoring
- **Admin ↔ System**: Teacher approval/rejection, system statistics
- **System ↔ Email**: Verification emails, OTP codes, password reset links

---

### Level 1: System Decomposition
**File:** `MathEase_DFD_Level1.xml`

The Level 1 DFD breaks down the system into major processes and shows data stores.

#### Processes (9 Major Processes):

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

#### Data Stores (16 Data Stores):

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

#### Key Data Flows:

**From Student:**
- Login Request → 1.0
- Registration Data → 2.0
- Class Join Request → 3.0
- Lesson Access/Completion → 4.0
- Quiz Answers → 5.0

**From Teacher:**
- Login Request → 1.0
- Class Creation → 3.0
- Enrollment Approval → 3.0
- Topic Lock Settings → 4.0
- Progress Request → 6.0

**From Admin:**
- Login Request → 1.0
- Teacher Approval → 8.0

**To Email System:**
- Verification Email → Email System
- OTP Code → Email System

**Cross-Process Flows:**
- User ID flows from 1.0 to 3.0, 4.0
- Completion Status flows from 4.0 to 6.0
- Quiz Score flows from 5.0 to 6.0
- Progress Update flows from 6.0 to 9.0
- Enrollment Event flows from 3.0 to 7.0
- Quiz Completion Event flows from 5.0 to 7.0

---

## How to View the DFDs

### Using Draw.io (diagrams.net)

1. **Online Method:**
   - Go to [https://app.diagrams.net/](https://app.diagrams.net/)
   - Click "Open Existing Diagram"
   - Upload `MathEase_DFD_Level0.xml` or `MathEase_DFD_Level1.xml`
   - The diagram will load and be fully editable

2. **Desktop Method:**
   - Download Draw.io desktop app from [https://github.com/jgraph/drawio-desktop/releases](https://github.com/jgraph/drawio-desktop/releases)
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

### External Entities (Rectangles with double border)
- Represent sources or destinations of data outside the system
- Examples: Student, Teacher, Admin, Email System

### Processes (Rounded rectangles)
- Represent transformations of data
- Numbered (e.g., 1.0, 2.0)
- Named with verb phrases

### Data Stores (Open-ended rectangles/cylinders)
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

### Registration Flow:
1. Student submits registration → 2.0
2. 2.0 writes to D1 (Users)
3. 2.0 sends verification email → Email System
4. Student verifies email → 2.0
5. 2.0 updates D1 (email_verified)

### Learning Flow:
1. Student requests lesson → 4.0
2. 4.0 reads from D5 (Topics), D6 (Lessons)
3. Student completes lesson → 4.0
4. 4.0 writes to D7 (Lesson Completion)
5. 4.0 sends completion status → 6.0
6. 6.0 updates D11 (User Progress), D12 (Topic Progress)
7. 6.0 sends progress update → 9.0
8. 9.0 checks badge criteria → D14 (Badges)
9. 9.0 awards badge → D15 (User Badges)

### Quiz Flow:
1. Student requests quiz → 5.0
2. 5.0 reads from D8 (Quizzes)
3. Student submits answers → 5.0
4. 5.0 writes to D9 (Quiz Attempts), D10 (Quiz Answers)
5. 5.0 calculates score → 6.0
6. 5.0 sends completion event → 7.0
7. 7.0 creates notification → D13 (Notifications)

### Class Management Flow:
1. Teacher creates class → 3.0
2. 3.0 writes to D3 (Classes)
3. Student joins class → 3.0
4. 3.0 writes to D4 (Class Enrollments)
5. 3.0 sends enrollment event → 7.0
6. Teacher approves → 3.0
7. 3.0 updates D4 (enrollment_status)
8. 7.0 creates notification → D13

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

---

## Version History

- **Version 1.0** (2025-01-27)
  - Initial DFD creation
  - Level 0 Context Diagram
  - Level 1 System Decomposition
  - Complete documentation

---

## Contact

For questions or updates to the DFDs, please refer to the main project documentation or contact the development team.
