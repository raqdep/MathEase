# MathEase - Interactive Pre-Calculus Learning Platform

## Overview

MathEase is a comprehensive web-based interactive learning platform designed specifically for Grade 11 STEM students to master Pre-Calculus concepts. The platform integrates gamified quizzes, interactive tutorials, detailed step-by-step problem explanations, and real-time progress tracking to create an engaging and personalized learning experience.

## Features

### 🎯 Core Learning Features
- **Interactive Lessons**: Comprehensive coverage of Pre-Calculus topics
- **Gamified Quizzes**: Multiple difficulty levels with instant feedback
- **Step-by-Step Solutions**: Detailed explanations with visual aids
- **Progress Tracking**: Real-time monitoring of learning achievements
- **Badge System**: Gamification elements to motivate students

### 📚 Pre-Calculus Topics Covered
- **Functions**: Linear, quadratic, polynomial, rational, and exponential functions
- **Polynomial Equations**: Solving, factoring, and the Remainder Theorem
- **Trigonometry**: Trigonometric functions, identities, and equations
- **Rational Expressions**: Simplifying and operations
- **Complex Numbers**: Operations and solving complex equations
- **Conic Sections**: Circles, ellipses, hyperbolas, and parabolas

### 🎨 User Experience Features
- **Responsive Design**: Works seamlessly on all devices
- **Modern UI/UX**: Clean, intuitive interface with smooth animations
- **Personalized Dashboard**: Custom learning paths and recommendations
- **Social Learning**: Study groups and peer interaction features
- **Accessibility**: Designed for diverse learning needs

## Technology Stack

### Frontend
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with Flexbox, Grid, and animations
- **JavaScript (ES6+)**: Modern JavaScript with classes and async/await
- **Font Awesome**: Comprehensive icon library
- **Google Fonts**: Typography optimization

### Backend
- **PHP 7.4+**: Server-side logic and API endpoints
- **MySQL 8.0+**: Relational database management
- **PDO**: Secure database connections with prepared statements
- **Session Management**: Secure user authentication

### Database
- **MySQL Workbench**: Database design and management
- **Normalized Schema**: Optimized for performance and scalability
- **Indexing**: Strategic database indexing for fast queries
- **Views**: Predefined queries for common operations

## Installation & Setup

### Prerequisites
- **XAMPP** (or similar local development environment)
- **PHP 7.4** or higher
- **MySQL 8.0** or higher
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Step 1: Environment Setup
1. **Install XAMPP**
   - Download from [https://www.apachefriends.org/](https://www.apachefriends.org/)
   - Install with default settings
   - Start Apache and MySQL services

2. **Clone/Download Project**
   ```bash
   # Navigate to XAMPP htdocs directory
   cd C:\xampp\htdocs
   
   # Clone the repository or extract downloaded files
   # Ensure the project folder is named 'MathEase'
   ```

### Step 2: Database Setup
1. **Open MySQL Workbench**
   - Connect to local MySQL server (localhost:3306)
   - Default credentials: root (no password)

2. **Create Database**
   ```sql
   -- Open the SQL file in MySQL Workbench
   -- File: database/mathease_schema.sql
   
   -- Execute the entire script to create:
   -- - Database: mathease_db
   -- - All required tables
   -- - Sample data
   -- - Indexes and views
   ```

3. **Verify Database Creation**
   ```sql
   SHOW DATABASES;
   USE mathease_db;
   SHOW TABLES;
   ```

### Step 3: Configuration
1. **Database Connection**
   - Edit `php/config.php`
   - Verify database credentials match your setup
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // Your MySQL password if set
   define('DB_NAME', 'mathease_db');
   ```

2. **File Permissions**
   - Ensure web server has read access to all files
   - PHP files should be executable by the web server

### Step 4: Access the Application
1. **Start Services**
   - Ensure Apache and MySQL are running in XAMPP Control Panel

2. **Open Browser**
   - Navigate to: `http://localhost/MathEase/`
   - The homepage should load with full functionality

## Project Structure

```
MathEase/
├── index.html              # Main homepage
├── login.html              # User authentication
├── register.html           # User registration
├── dashboard.html          # User dashboard
├── css/                    # Stylesheets
│   ├── style.css          # Main styles
│   ├── auth.css           # Authentication styles
│   └── dashboard.css      # Dashboard styles
├── js/                     # JavaScript files
│   ├── main.js            # Core functionality
│   ├── auth.js            # Authentication logic
│   └── dashboard.js       # Dashboard functionality
├── php/                    # Backend PHP files
│   ├── config.php         # Database configuration
│   ├── register.php       # User registration handler
│   ├── login.php          # User authentication handler
│   └── logout.php         # Session termination
├── database/               # Database files
│   └── mathease_schema.sql # Complete database schema
├── topics/                 # Learning topic pages (to be created)
├── quizzes/                # Quiz pages (to be created)
└── README.md               # This file
```

## Database Schema

### Core Tables
- **users**: Student information and authentication
- **topics**: Pre-Calculus learning topics
- **lessons**: Individual lesson content
- **quizzes**: Assessment materials
- **user_progress**: Learning progress tracking
- **badges**: Achievement system

### Key Features
- **Foreign Key Constraints**: Data integrity and referential integrity
- **Indexing**: Optimized query performance
- **Views**: Predefined queries for common operations
- **Sample Data**: Ready-to-use content for testing

## Usage Guide

### For Students
1. **Registration**: Create account with student details
2. **Login**: Access personalized learning dashboard
3. **Topic Selection**: Choose from available Pre-Calculus topics
4. **Learning**: Complete interactive lessons and practice problems
5. **Assessment**: Take quizzes to test understanding
6. **Progress Tracking**: Monitor learning achievements and badges

### For Educators
1. **Student Monitoring**: Track individual and class progress
2. **Content Management**: Add/modify lessons and quizzes
3. **Performance Analytics**: Analyze learning patterns and outcomes
4. **Customization**: Adapt content for specific learning objectives

## Development & Customization

### Adding New Topics
1. **Database**: Insert new topic in `topics` table
2. **Content**: Create lesson content in `lessons` table
3. **Assessment**: Add quiz questions in `quizzes` table
4. **Frontend**: Create topic-specific HTML pages

### Customizing Styles
- **Color Scheme**: Modify CSS variables in `css/style.css`
- **Layout**: Adjust grid systems and responsive breakpoints
- **Animations**: Customize CSS transitions and keyframes

### Extending Functionality
- **New Features**: Add JavaScript modules in `js/` directory
- **API Endpoints**: Create new PHP handlers in `php/` directory
- **Database**: Extend schema with new tables as needed

## Security Features

### Authentication & Authorization
- **Password Hashing**: Secure password storage with bcrypt
- **Session Management**: Secure session handling
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Validation**: Comprehensive input sanitization

### Database Security
- **Prepared Statements**: SQL injection prevention
- **Parameter Binding**: Secure query execution
- **Access Control**: Database user permissions

## Performance Optimization

### Frontend
- **CSS Optimization**: Efficient selectors and minimal reflows
- **JavaScript**: Lazy loading and event delegation
- **Images**: Optimized formats and responsive sizing

### Backend
- **Database Indexing**: Strategic index placement
- **Query Optimization**: Efficient SQL queries
- **Caching**: Session and data caching strategies

## Browser Compatibility

### Supported Browsers
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### Mobile Support
- **iOS Safari**: 13+
- **Android Chrome**: 80+
- **Responsive Design**: Optimized for all screen sizes

## Troubleshooting

### Common Issues

#### Database Connection Error
```php
// Check config.php settings
// Verify MySQL service is running
// Confirm database exists
```

#### Page Not Loading
- Check Apache service status
- Verify file permissions
- Check browser console for JavaScript errors

#### Registration/Login Issues
- Verify database tables exist
- Check PHP error logs
- Confirm form validation is working

### Debug Mode
```php
// Enable error reporting in config.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes with testing
4. **Submit** pull request with description

### Code Standards
- **HTML**: Semantic markup and accessibility
- **CSS**: BEM methodology and responsive design
- **JavaScript**: ES6+ features and error handling
- **PHP**: PSR-12 coding standards

## Contributing

We use the **`main`** branch as the default branch. To work on MathEase locally:

1. Clone the repository: `git clone https://github.com/raqdep/MathEase.git`
2. Install PHP dependencies: `composer install`
3. Copy `deploy/.env.example` to `.env` in the project root and set `DB_*` and other variables (never commit real credentials).
4. Follow the database and XAMPP steps in this README.

Open pull requests against **`main`**. For bugs or feature ideas, open a GitHub issue with steps to reproduce when possible.

## License

This project is developed for educational purposes at Minuyan National High School. All rights reserved.

## Support & Contact

### Technical Support
- **Email**: mathease@school.edu.ph
- **Documentation**: This README and inline code comments
- **Issues**: Report bugs and feature requests

### Educational Support
- **Minuyan National High School**
- **Mathematics Department**
- **STEM Program**

## Future Enhancements

### Planned Features
- **Mobile App**: Native iOS and Android applications
- **AI Tutoring**: Intelligent learning path recommendations
- **Video Integration**: Embedded video lessons
- **Collaborative Learning**: Real-time study groups
- **Advanced Analytics**: Detailed learning insights

### Technology Upgrades
- **Modern Framework**: Migration to React/Vue.js
- **API Architecture**: RESTful API development
- **Cloud Deployment**: Scalable cloud infrastructure
- **Real-time Features**: WebSocket integration

---

**MathEase** - Empowering Grade 11 STEM students to master Pre-Calculus through interactive learning.

*Developed with ❤️ for educational excellence*
