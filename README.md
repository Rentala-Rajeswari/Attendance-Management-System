

# 🎓 Student Management System

A comprehensive web-based Student Management System designed to streamline and automate student-related administrative tasks within educational institutions.

---

## 🚀 Project Goal

To replace traditional manual processes with a digital solution that enhances efficiency, accuracy, and communication in managing student data.

---

## 🧩 Key Features

### 📚 Student Management
- **Registration**: Add new students with full personal, academic, and contact details.
- **Profile Management**: View, update, and filter student information.
- **Roll Number & Username Validation**: Prevent duplicate entries.

### 📘 Course & Subject Management
- **Subject Creation**: Add/edit/delete subjects with branch, semester, and regulation mappings.
- **Course Catalog**: Maintain a complete subject list by regulation & semester.

### 👨‍🏫 Instructor Management
- **Profile Management**: Manage teacher details.
- **Subject Assignment**: Assign subjects to specific teachers.

### 🕒 Attendance Management
- **Record Attendance**: Mark Present/Absent by subject and date.
- **Attendance Reports**: Track attendance percentage and generate summaries.

### 📊 Marks Management (Planned Feature)
- **Mark Entry**: Record marks for various assessments.
- **Grade Calculation & Reports**: Auto-generate results and grades.

### 🛡️ User Roles & Access
- **Admin**: Full access to manage students, subjects, branches, and semesters.
- **Teacher**: View assigned subjects, mark attendance.
- **Student**: View personal data and attendance.

---

## ⚙️ Technical Stack

| Layer       | Technology                  |
|------------|-----------------------------|
| Frontend   | HTML, CSS, JavaScript       |
| Styling    | Bootstrap, Font Awesome     |
| Backend    | Node.js, Express.js         |
| Database   | MySQL                       |
| External   | Google Fonts, xlsx.js       |

---

## 🗃️ Database Design

The system uses **MySQL** with properly structured relational tables and foreign key constraints to ensure referential integrity.  
Tables:
- `users`
- `students`
- `teachers`
- `subjects`
- `branches`
- `semesters`
- `regulations`
- `attendance`
- `teacher_subjects`
- `semester_updates`

---

## ✅ Benefits

- 🔁 Automates repetitive administrative tasks.
- 📌 Ensures centralized, accurate, and up-to-date student records.
- 📊 Offers data insights for performance tracking and decision-making.
- 🔒 Role-based access ensures secure and personalized access to features.

---

## 📈 Future Enhancements

- Fee Management Module  
- Library Management System  
- Marks and Grade Reports  
- Student Timetable View  
- Parent Login Portal  
- Biometric Attendance Integration

---

## 🧠 Developed With

- 👩‍💻 Passion for clean and functional UI
- 📐 Proper database normalization and design
- 📊 Real-world use cases in education management

---
```sql
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_type` enum('admin','teacher','student') NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `regulations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `semesters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roll_number` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `aadhar_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `address` text NOT NULL,
  `regulation_id` int NOT NULL,
  `semester_id` int NOT NULL,
  `branch_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roll_number` (`roll_number`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `mobile_number` (`mobile_number`),
  UNIQUE KEY `aadhar_number` (`aadhar_number`),
  KEY `regulation_id` (`regulation_id`),
  KEY `semester_id` (`semester_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`username`)     REFERENCES `users` (`username`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`email`)        REFERENCES `users` (`email`)    ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`regulation_id`)REFERENCES `regulations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_4` FOREIGN KEY (`semester_id`)  REFERENCES `semesters` (`id`)   ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_5` FOREIGN KEY (`branch_id`)    REFERENCES `branches` (`id`)    ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(100) NOT NULL,
  `regulation_id` int DEFAULT NULL,
  `semester_id` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subject` (`subject_name`,`regulation_id`,`semester_id`,`branch_id`),
  KEY `regulation_id` (`regulation_id`),
  KEY `semester_id` (`semester_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`regulation_id`) REFERENCES `regulations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subjects_ibfk_2` FOREIGN KEY (`semester_id`)   REFERENCES `semesters` (`id`)   ON DELETE CASCADE,
  CONSTRAINT `subjects_ibfk_3` FOREIGN KEY (`branch_id`)     REFERENCES `branches` (`id`)    ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `semester_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `subject_id` (`subject_id`),
  KEY `semester_id` (`semester_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`)  REFERENCES `students` (`id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`subject_id`)  REFERENCES `subjects` (`id`),
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `semester_updates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `branch_name` varchar(100) NOT NULL,
  `excluded_roll_numbers` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `semester_updates_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `teacher_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `teacher_subjects_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_subjects_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

```
