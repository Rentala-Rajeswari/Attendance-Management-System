// server.js (Backend)
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Rajeswari@123",
    database: "student_management"
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

// Store last update details in memory
let lastUpdatedDetails = { date: null, branch: null };

// Signup Route
app.post("/signup", (req, res) => {
    const { username, email, password, userType } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.json({ error: err });
        
        const sql = "INSERT INTO users (username, email, password, user_type) VALUES (?, ?, ?, ?)";
        db.query(sql, [username, email, hash, userType], (err, result) => {
            if (err) return res.json({ error: err });
            res.json({ message: "User registered successfully!" });
        });
    });
});

// Login Route
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";
    
    db.query(sql, [username], (err, results) => {
        if (err) return res.json({ error: err });
        if (results.length === 0) return res.json({ message: "User not found" });
        
        bcrypt.compare(password, results[0].password, (err, match) => {
            if (!match) return res.json({ message: "Incorrect password" });
            
            const token = jwt.sign(
                { id: results[0].id, userType: results[0].user_type },
                "secret_key",
                { expiresIn: "1h" }
            );
            res.json({ token, userType: results[0].user_type, message: "Login successful!" });
        });
    });
});

// Get User Dashboard Data with Student Check
app.get("/dashboard", (req, res) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "No token provided" });

    jwt.verify(token, "secret_key", (err, decoded) => {
        if (err) return res.status(401).json({ message: "Unauthorized" });

        const sql = "SELECT id, username, email, user_type FROM users WHERE id = ?";
        db.query(sql, [decoded.id], (err, results) => {
            if (err) return res.json({ error: err });

            if (results.length === 0) return res.status(404).json({ message: "User not found" });

            const user = results[0];
            // Check if student details exist
            // Updated SQL query to fetch student details with branch, semester, and regulation names
            const studentSql = `
                SELECT s.roll_number, s.full_name,  DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth, s.email, 
                       s.mobile_number, b.name AS branch, sem.name AS semester, 
                       r.name AS regulation, s.address
                FROM students s
                JOIN branches b ON s.branch_id = b.id
                JOIN semesters sem ON s.semester_id = sem.id
                JOIN regulations r ON s.regulation_id = r.id
                WHERE s.username = ?
            `;
            db.query(studentSql, [user.username], (err, studentResults) => {
                if (err) return res.json({ error: err });

                res.json({
                    user,
                    student: studentResults.length > 0 ? studentResults[0] : null // Return full details if exists, otherwise null
                });
            });
        });
    });
});




// Get Users (Search)
app.get('/users', (req, res) => {
    const { search } = req.query;
    let sql = `SELECT id, user_type, username, email FROM users`;
    if (search) {
        sql += ` WHERE username LIKE '%${search}%' OR email LIKE '%${search}%'`;
    }
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Add User
app.post('/users', async (req, res) => {
    const { user_type, username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (user_type, username, email, password) VALUES (?, ?, ?, ?)`;
    db.query(sql, [user_type, username, email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User added successfully' });
    });
});

// Edit User (except user_type and password)
app.put('/users/:id', (req, res) => {
    const { username, email } = req.body;
    const sql = `UPDATE users SET username = ?, email = ? WHERE id = ?`;
    db.query(sql, [username, email, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User updated successfully' });
    });
});

// Forget Password (Reset Password)
app.put('/users/reset-password/:id', async (req, res) => {
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    db.query(sql, [hashedPassword, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Password reset successfully' });
    });
});

// Delete User
app.delete('/users/:id', (req, res) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted successfully' });
    });
});



// API to get all regulations
app.get("/api/regulations", (req, res) => {
    db.query("SELECT * FROM regulations", (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// API to add a regulation
app.post("/api/regulations", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Regulation name is required" });

    db.query("INSERT INTO regulations (name) VALUES (?)", [name], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, name });
    });
});

// API to delete a regulation
app.delete("/api/regulations/:id", (req, res) => {
    db.query("DELETE FROM regulations WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Regulation not found" });
        }
        res.sendStatus(200);
    });
});


// API to get all branches
app.get("/api/branches", (req, res) => {
    db.query("SELECT * FROM branches", (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// API to add a branch
app.post("/api/branches", (req, res) => {
    const { name } = req.body;
    db.query("INSERT INTO branches (name) VALUES (?)", [name], (err) => {
        if (err) throw err;
        res.sendStatus(201);
    });
});

// API to delete a branch
app.delete("/api/branches/:id", (req, res) => {
    db.query("DELETE FROM branches WHERE id = ?", [req.params.id], (err) => {
        if (err) throw err;
        res.sendStatus(200);
    });
});

// API to get all subjects with details
app.get("/api/subjects", (req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    let sql = `
        SELECT subjects.id, subjects.subject_name, regulations.name AS regulation, semesters.name AS semester, branches.name AS branch
        FROM subjects
        LEFT JOIN regulations ON subjects.regulation_id = regulations.id
        LEFT JOIN semesters ON subjects.semester_id = semesters.id
        LEFT JOIN branches ON subjects.branch_id = branches.id
        ${search ? "WHERE subjects.subject_name LIKE ?" : ""}
        LIMIT ? OFFSET ?;
    `;

    let countSql = `
        SELECT COUNT(*) AS total FROM subjects
        ${search ? "WHERE subject_name LIKE ?" : ""}
    `;

    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];
    const countParams = search ? [`%${search}%`] : [];

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(countSql, countParams, (err, countResults) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                subjects: results,
                total: countResults[0].total
            });
        });
    });
});


// API to add a subject
app.post('/api/subjects', (req, res) => {
    const { subject_name, regulation_id, semester_id, branch_id } = req.body;

    if (!subject_name || !regulation_id || !semester_id || !branch_id) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // ✅ Convert subject name to lowercase for case-insensitive checking
    const normalizedSubjectName = subject_name.trim().toLowerCase();

    // ✅ Check if the subject already exists in the same regulation, semester, and branch
    const checkSql = `
        SELECT COUNT(*) AS count FROM subjects 
        WHERE LOWER(subject_name) = ? 
        AND regulation_id = ? 
        AND semester_id = ? 
        AND branch_id = ?
    `;

    db.query(checkSql, [normalizedSubjectName, regulation_id, semester_id, branch_id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (result[0].count > 0) {
            return res.status(400).json({ error: 'This subject already exists for the selected regulation, semester, and branch.' });
        }

        // ✅ Insert new subject if it doesn't exist
        const insertSql = `INSERT INTO subjects (subject_name, regulation_id, semester_id, branch_id) VALUES (?, ?, ?, ?)`;
        db.query(insertSql, [normalizedSubjectName, regulation_id, semester_id, branch_id], (err, result) => {
            if (err) {
                console.error('Error adding subject:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            res.json({ success: true, message: 'Subject added successfully', id: result.insertId });
        });
    });
});


// API to delete a subject
app.delete("/api/subjects/:id", (req, res) => {
    db.query("DELETE FROM subjects WHERE id = ?", [req.params.id], (err) => {
        if (err) throw err;
        res.sendStatus(200);
    });
});

// ✅ GET all semesters
app.get('/api/semesters', (req, res) => {
    const sql = 'SELECT * FROM semesters ORDER BY id';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching semesters:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get teachers
app.get("/api/teachers", (req, res) => {
    db.query("SELECT id, username FROM users WHERE user_type = 'teacher'", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get subjects based on regulation, semester, and branch
app.get("/api/all-allocated-subjects", (req, res) => {
    const { regulation, semester, branch } = req.query;

    if (!regulation || !semester || !branch) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const query = `
        SELECT DISTINCT s.id, s.subject_name 
        FROM subjects s
        INNER JOIN teacher_subjects ts ON s.id = ts.subject_id
        WHERE s.regulation_id = ? AND s.semester_id = ? AND s.branch_id = ?
    `;

    db.query(query, [regulation, semester, branch], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get only unallocated subjects
app.get("/api/subjectSelection", (req, res) => {
    const { regulation, semester, branch } = req.query;

    if (!regulation || !semester || !branch) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const query = `
        SELECT s.id, s.subject_name 
        FROM subjects s
        LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
        WHERE s.regulation_id = ? AND s.semester_id = ? AND s.branch_id = ?
        AND ts.subject_id IS NULL
    `;

    db.query(query, [regulation, semester, branch], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Allocate a subject to a teacher
app.post("/api/allocate-subject", (req, res) => {
    const { subject_id, teacher_id } = req.body;
    db.query(
        "INSERT INTO teacher_subjects (subject_id, teacher_id) VALUES (?, ?)",
        [subject_id, teacher_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});



// Get allocated subjects with regulation, semester, and branch details
app.get("/api/allocated-subjects", (req, res) => {
    const query = `
        SELECT ts.id, s.subject_name, 
               r.name AS regulation, sem.name AS semester, b.name AS branch, 
               u.username AS teacher_name 
        FROM teacher_subjects ts
        INNER JOIN subjects s ON ts.subject_id = s.id
        INNER JOIN regulations r ON s.regulation_id = r.id
        INNER JOIN semesters sem ON s.semester_id = sem.id
        INNER JOIN branches b ON s.branch_id = b.id
        INNER JOIN users u ON ts.teacher_id = u.id
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});







// Remove an allocation
app.delete("/api/allocated-subjects/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM teacher_subjects WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.send("Allocation removed");
    });
});


app.get("/dashboard-stats", (req, res) => {
    const sqlTeachers = "SELECT COUNT(*) AS teacher_count FROM users WHERE user_type = 'teacher'";
    const sqlStudents = "SELECT COUNT(*) AS student_count FROM users WHERE user_type = 'student'";

    db.query(sqlTeachers, (err, teacherResult) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(sqlStudents, (err, studentResult) => {
            if (err) return res.status(500).json({ error: err.message });

                res.json({
                    teachersCount: teacherResult[0].teacher_count,
                    studentsCount: studentResult[0].student_count
                });
        });
    });
});




// API to get subjects allocated to a specific teacher
app.get("/api/teacher-subjects", (req, res) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ error: "No token provided" });
    }

    jwt.verify(token.replace("Bearer ", ""), "secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Fetch subjects allocated to this teacher, including regulation, branch, and semester
        const sql = `
            SELECT s.subject_name, r.name AS regulation, b.name AS branch, sem.name AS semester
            FROM teacher_subjects ts
            INNER JOIN subjects s ON ts.subject_id = s.id
            INNER JOIN regulations r ON s.regulation_id = r.id
            INNER JOIN branches b ON s.branch_id = b.id
            INNER JOIN semesters sem ON s.semester_id = sem.id
            WHERE ts.teacher_id = ?
        `;

        db.query(sql, [decoded.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});


app.get("/api/teacher-dashboard", (req, res) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ error: "No token provided" });
    }

    jwt.verify(token.replace("Bearer ", ""), "secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Query to count unique (branch, semester) pairs (class count)
        const classCountQuery = `
            SELECT COUNT(DISTINCT s.branch_id, s.semester_id) AS classCount
            FROM teacher_subjects ts
            INNER JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.teacher_id = ?
        `;

        // Query to count distinct subjects taught by the teacher
        const subjectCountQuery = `
            SELECT COUNT(DISTINCT ts.subject_id) AS subjectCount
            FROM teacher_subjects ts
            WHERE ts.teacher_id = ?
        `;

        db.query(classCountQuery, [decoded.id], (err, classResult) => {
            
            if (err) return res.status(500).json({ error: err.message });

            db.query(subjectCountQuery, [decoded.id], (err, subjectResult) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    classCount: classResult[0].classCount || 0,
                    subjectCount: subjectResult[0].subjectCount || 0
                });
            });
        });
    });
});

app.post("/complete-profile", (req, res) => {
    const { roll_number, username, full_name, date_of_birth, aadhar_number, email, mobile_number, address, regulation_id, semester_id, branch_id } = req.body;

    const sql = `INSERT INTO students (roll_number, username, full_name, date_of_birth, aadhar_number, email, mobile_number, address, regulation_id, semester_id, branch_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [roll_number, username, full_name, date_of_birth, aadhar_number, email, mobile_number, address, regulation_id, semester_id, branch_id], 
        (err, results) => {
            if (err) {
                console.error("SQL Error:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        success: false,
                        message: `Duplicate entry: ${err.sqlMessage}`
                    });
                }
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true });
        }
    );
});

app.get("/api/student-subjects", (req, res) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ error: "No token provided" });
    }

    jwt.verify(token.replace("Bearer ", ""), "secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sql = `SELECT email FROM users WHERE id = ?`;

        db.query(sql, [decoded.id], (err, studentResults) => {
            if (err) return res.status(500).json({ error: err.message });

            if (studentResults.length === 0) {
                return res.json([]); // No student found
            }

            const studentEmail = studentResults[0].email;
            const studentQuery = `SELECT branch_id, semester_id, regulation_id FROM students WHERE email = ?`;
            db.query(studentQuery, [studentEmail], (err, newResults) => {
                if (err) return res.status(500).json({ error: err.message });

                if (newResults.length === 0) {
                    return res.json([]);
                }
                const { branch_id, semester_id, regulation_id } = newResults[0];
                // Fetch subjects and their allocated teachers
                const subjectsQuery = `
                    SELECT s.subject_name, u.username AS teacher_name 
                    FROM subjects s
                    INNER JOIN teacher_subjects t ON s.id = t.subject_id
                    INNER JOIN users u ON t.teacher_id = u.id
                    WHERE s.branch_id = ? AND s.semester_id = ? And regulation_id = ?`;
                db.query(subjectsQuery, [branch_id, semester_id, regulation_id ], (err, results) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.json(results.length ? results : []);
                });
            });
        });
    });
});



// Upgrade students' semester
// Endpoint to get all students for the selected regulation, branch, and semester
app.get("/api/get-students", (req, res) => {
    const { regulation_id, branch_id, semester_id } = req.query;

    if (!regulation_id || !branch_id || !semester_id) {
        return res.status(400).json({ error: "Regulation, Branch, and Semester are required" });
    }

    const sql = `
        SELECT roll_number, full_name
        FROM students
        WHERE regulation_id = ? AND branch_id = ? AND semester_id = ?
    `;
    
    db.query(sql, [regulation_id, branch_id, semester_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ students: result });
    });
});

// Endpoint to upgrade students' semester based on regulation, branch, semester, and excluded roll numbers
app.post("/api/upgrade-semester", (req, res) => {
    const { regulation_id, branch_id, semester_id, excludedRollNumbers } = req.body;

    if (!regulation_id || !branch_id || !semester_id) {
        return res.status(400).json({ error: "Regulation, Branch, and Semester are required" });
    }

    const branchQuery = `SELECT name FROM branches WHERE id = ?`;

    db.query(branchQuery, [branch_id], (err, branchResult) => {
        if (err) return res.status(500).json({ error: err.message });

        if (branchResult.length === 0) {
            return res.status(404).json({ error: "Branch not found" });
        }

        const branchName = branchResult[0].name;
        const excludedList = excludedRollNumbers.length
            ? `AND roll_number NOT IN (${excludedRollNumbers.map(() => "?").join(",")})`
            : "";

        const sql = `
            UPDATE students 
            SET semester_id = CASE 
                WHEN semester_id = 8 THEN 'Completed' 
                ELSE semester_id + 1 
            END
            WHERE branch_id = ? 
            AND semester_id = ? 
            AND regulation_id = ?
            ${excludedList}
        `;

        const params = [branch_id, semester_id, regulation_id, ...excludedRollNumbers];

        db.query(sql, params, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const updateSql = `
                INSERT INTO semester_updates 
                (branch_id, branch_name, excluded_roll_numbers, previous_semester_id, upgraded_to)
                VALUES (?, ?, ?, ?, ?)
            `;
            const upgradedTo = parseInt(semester_id) === 8 ? 'Completed' : (parseInt(semester_id) + 1).toString();
            const excludedStr = excludedRollNumbers.length ? excludedRollNumbers.join(", ") : "None";

            db.query(updateSql, [branch_id, branchName, excludedStr, semester_id, upgradedTo], (err) => {
                if (err) return res.status(500).json({ error: err.message });

                res.json({
                    message: "Semester upgraded successfully",
                    updatedRows: result.affectedRows
                });
            });
        });
    });
});


// Get all semester upgrade updates, filtered by branch if provided
app.get("/api/get-last-updated", (req, res) => {
    const { branch_id } = req.query;

    let sql = `
        SELECT su.branch_name, su.excluded_roll_numbers, 
               DATE_FORMAT(su.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at, 
               su.previous_semester_id, su.upgraded_to,
               ps.name AS previous_semester_name, us.name AS upgraded_to_name
        FROM semester_updates su
        LEFT JOIN semesters ps ON su.previous_semester_id = ps.id
        LEFT JOIN semesters us ON su.upgraded_to = us.id
    `;
    const params = [];

    if (branch_id) {
        sql += " WHERE su.branch_id = ?";
        params.push(branch_id);
    }

    sql += " ORDER BY su.updated_at DESC"; // Removed LIMIT 4

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.json({ message: ["No updates yet."] });
        }

        const messages = result.map(row => {
            const excludedList = row.excluded_roll_numbers !== "None"
                ? row.excluded_roll_numbers
                : "None";

            return `Last Updated On: ${row.updated_at}
Branch: ${row.branch_name}
Upgraded: ${row.previous_semester_name} ➜ ${row.upgraded_to_name}
Excluded Roll Numbers: ${excludedList}`;
        });

        res.json({ message: messages });
    });
});




app.get("/api/teacher-subjects-filttered", (req, res) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ error: "No token provided" });
    }

    jwt.verify(token.replace("Bearer ", ""), "secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { regulation, semester, branch } = req.query;

        let sql = `
            SELECT s.id AS subject_id, s.subject_name, r.name AS regulation, b.name AS branch, sem.name AS semester
            FROM teacher_subjects ts
            INNER JOIN subjects s ON ts.subject_id = s.id
            INNER JOIN regulations r ON s.regulation_id = r.id
            INNER JOIN branches b ON s.branch_id = b.id
            INNER JOIN semesters sem ON s.semester_id = sem.id
            WHERE ts.teacher_id = ?
            AND s.regulation_id = ?
            AND s.semester_id = ?
            AND s.branch_id = ?

        `;

        const params = [decoded.id,regulation,semester,branch];
        db.query(sql, params, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});



// ✅ student data fetching (generate report)
app.get("/api/students", (req, res) => {
    const { regulation_id, semester_id, branch_id } = req.query;

    if (!regulation_id || !semester_id || !branch_id) {
        return res.status(400).json({ error: "All filters (regulation, semester, branch) are required" });
    }

    const query = `
        SELECT roll_number, full_name FROM students 
        WHERE regulation_id = ? AND semester_id = ? AND branch_id = ?
    `;

    db.query(query, [regulation_id, semester_id, branch_id], (err, results) => {
        if (err) {
            console.error("Error fetching students:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.json(results);
        }
    });
});


// ✅ Store Attendance Data in MySQL
app.post("/api/submit-attendance", (req, res) => {
    const { attendance } = req.body;

    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
        return res.status(400).json({ error: "No attendance data provided" });
    }

    let errorOccurred = false;
    let completedRequests = 0;

    attendance.forEach((a) => {
        const query = `
            INSERT INTO attendance (student_id, subject_id, semester_id, date, status)
            SELECT id, ?, ?, ?, ? FROM students WHERE roll_number = ?;
        `;

        const values = [a.subject_id, a.semester_id, a.date, a.status, a.roll_no];

        db.query(query, values, (err, result) => {
            completedRequests++;
            if (err) {
                console.error("Database Error:", err);
                errorOccurred = true;
            }

            if (completedRequests === attendance.length) {
                if (errorOccurred) {
                    return res.status(500).json({ error: "Database error occurred" });
                }
                res.json({ message: "Attendance saved successfully!" });
            }
        });
    });
});






// Attendance report route with filters and percentage range
app.get("/api/attendance-report", (req, res) => {
    const {
        semester, branch, regulation, subject, fromDate, toDate,
        minPercent = 0, maxPercent = 100
    } = req.query;

    let baseQuery = `
        SELECT 
            s.roll_number, 
            s.full_name,
            COUNT(a.id) AS total_days,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_days,
            ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) AS percentage
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        WHERE s.semester_id = ? AND s.branch_id = ? AND s.regulation_id = ?
    `;

    const params = [semester, branch, regulation];

    if (subject) {
        baseQuery += " AND a.subject_id = ?";
        params.push(subject);
    }

    if (fromDate && toDate) {
        baseQuery += " AND a.date BETWEEN ? AND ?";
        params.push(fromDate, toDate);
    }

    baseQuery += `
        GROUP BY s.id
        HAVING percentage BETWEEN ? AND ?
    `;
    params.push(parseFloat(minPercent), parseFloat(maxPercent));

    db.query(baseQuery, params, (err, results) => {
        if (err) {
            console.error("Error generating report:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(results);
    });
});



// Get attendance report for logged-in student
app.get('/api/student-attendance-report', (req, res) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ error: "No token provided" });
    }

    jwt.verify(token.replace("Bearer ", ""), "secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = decoded.id;

        // Step 1: Get student email from users table
        const userQuery = `SELECT email FROM users WHERE id = ?`;
        db.query(userQuery, [userId], (err, userResults) => {
            if (err || userResults.length === 0) {
                return res.status(500).json({ error: 'User not found' });
            }

            const email = userResults[0].email;

            // Step 2: Get student info including ID
            const studentQuery = `SELECT id AS student_id, semester_id FROM students WHERE email = ?`;
            db.query(studentQuery, [email], (err, studentResult) => {
                if (err || studentResult.length === 0) {
                    return res.status(500).json({ error: 'Student not found' });
                }

                const { student_id, semester_id } = studentResult[0];
                const { from, to } = req.query;

                // Step 3: Build date condition if needed
                let dateCondition = '';
                let params = [student_id, semester_id];

                if (from && to) {
                    dateCondition = 'AND a.date BETWEEN ? AND ?';
                    params.push(from, to);
                } else if (from) {
                    dateCondition = 'AND a.date >= ?';
                    params.push(from);
                } else if (to) {
                    dateCondition = 'AND a.date <= ?';
                    params.push(to);
                }

                // Step 4: Attendance Report Query
                const reportQuery = `
                    SELECT 
                        sub.subject_name,
                        COUNT(a.id) AS total_classes,
                        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_days,
                        ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) AS percentage
                    FROM attendance a
                    JOIN subjects sub ON sub.id = a.subject_id
                    WHERE a.student_id = ? AND a.semester_id = ?
                    ${dateCondition}
                    GROUP BY a.subject_id
                `;


                db.query(reportQuery, params, (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Failed to fetch attendance' });
                    }

                    // Step 5: Overall summary
                    const totalClasses = result.reduce((sum, s) => sum + s.total_classes, 0);
                    const totalPresent = result.reduce((sum, s) => sum + Number(s.present_days), 0);
                    const overallPercentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(2) : 0;

                    res.json({
                        subjects: result,
                        overall: {
                            totalClasses,
                            totalPresent,
                            overallPercentage
                        }
                    });
                });
            });
        });
    });
});

app.get('/api/students-profile', (req, res) => {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseSql = `
        SELECT 
            s.id, 
            s.username, 
            s.full_name, 
            s.roll_number, 
            r.name as regulation_name, 
            b.name as branch_name, 
            sm.name as semester_name
        FROM students s
        LEFT JOIN regulations r ON s.regulation_id = r.id
        LEFT JOIN branches b ON s.branch_id = b.id
        LEFT JOIN semesters sm ON s.semester_id = sm.id
    `;

    let whereClause = "";
    if (search) {
        whereClause = ` WHERE s.roll_number LIKE ? OR s.email LIKE ? `;
    }

    const finalSql = `${baseSql} ${whereClause} LIMIT ? OFFSET ?`;

    const params = search ? [`%${search}%`, `%${search}%`, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)];

    // Get total count for pagination
    let countSql = `
        SELECT COUNT(*) AS total 
        FROM students s
        LEFT JOIN regulations r ON s.regulation_id = r.id
        LEFT JOIN branches b ON s.branch_id = b.id
        LEFT JOIN semesters sm ON s.semester_id = sm.id
        ${whereClause}
    `;

    const countParams = search ? [`%${search}%`, `%${search}%`] : [];

    db.query(countSql, countParams, (countErr, countResult) => {
        if (countErr) {
            console.error("Error fetching student count:", countErr);
            return res.status(500).json({ error: "Failed to fetch student count." });
        }

        const total = countResult[0].total;

        db.query(finalSql, params, (err, results) => {
            if (err) {
                console.error("Error fetching students:", err);
                return res.status(500).json({ error: "Failed to fetch students." });
            }

            res.json({ students: results, total });
        });
    });
});





app.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
});


