document.addEventListener("DOMContentLoaded", async function () {
    const logoutButton = document.querySelector(".logout-btn"); // Update class if needed
    showSection('dashboard'); // Show the dashboard by default
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            window.location.href = "../index.html"; // Navigate to index.html
        });
    }

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Not authorized! Please log in.");
        window.location.href = "index.html";
        return;
    }

    const response = await fetch("http://localhost:5000/dashboard", {
        method: "GET",
        headers: {
            "Authorization": token
        }
    });

    const data = await response.json();
    if (data.user) {
        document.getElementById("username").textContent = data.user.username;
        document.getElementById("email").textContent = data.user.email;
    } else {
        alert("Error fetching user details!");
    }


    try {
        const response = await fetch("http://localhost:5000/api/teacher-dashboard", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data) {
            // Update subject count and class count in the dashboard
            document.getElementById("subjectCount").textContent = data.subjectCount;
            document.getElementById("classCount").textContent = data.classCount;
        } else {
            alert("Error fetching data");
        }
    } catch (error) {
        console.error("Error loading teacher dashboard data:", error);
    }


    // Load teacher subjects on page load
    loadTeacherSubjects();
    loadRegulations();
    loadSemesters();
    loadBranches();

    const dateInput = document.getElementById("date");
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    dateInput.value = today;
    dateInput.setAttribute("min", today);
    dateInput.setAttribute("max", today);

});

function showSection(sectionId) {
    document.querySelectorAll("section").forEach(section => {
        section.style.display = "none";
    });
    document.getElementById(sectionId).style.display = "block";
}

function loadTeacherSubjects() {
    fetch('http://localhost:5000/api/teacher-subjects', {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}` // Assuming JWT authentication
        }
    })
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById("teacherSubjectsTableBody");
        tableBody.innerHTML = "";

        if (data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='4'>No subjects allocated.</td></tr>";
            return;
        }

        data.forEach(subject => {
            tableBody.innerHTML += `
                <tr>
                    <td>${subject.subject_name}</td>
                    <td>${subject.regulation}</td>
                    <td>${subject.branch}</td>
                    <td>${subject.semester}</td>
                </tr>
            `;
        });
    })
    .catch(error => console.error("Error loading teacher subjects:", error));
}

// Function to populate the Regulations dropdown
function loadRegulations() {
    fetch('http://localhost:5000/api/regulations')
        .then(response => response.json())
        .then(data => {
            const regulationSelect = document.getElementById("Regulation");
            regulationSelect.innerHTML = '<option value="">Select Regulation</option>';

            data.forEach(regulation => {
                regulationSelect.innerHTML += `<option value="${regulation.id}">${regulation.name}</option>`;
            });

            const regulationSelect1 = document.getElementById("reportRegulation");
            regulationSelect1.innerHTML = '<option value="">Select Regulation</option>';

            data.forEach(regulation => {
                regulationSelect1.innerHTML += `<option value="${regulation.id}">${regulation.name}</option>`;
            });

        })

        .catch(error => console.error("Error loading regulations:", error));
}

// Function to populate the Semesters dropdown
function loadSemesters() {
    fetch('http://localhost:5000/api/semesters')
        .then(response => response.json())
        .then(data => {
            const semesterSelect = document.getElementById("semester");
            semesterSelect.innerHTML = '<option value="">Select Semester</option>';

            data.forEach(semester => {
                semesterSelect.innerHTML += `<option value="${semester.id}">${semester.name}</option>`;
            });

            const semesterSelect2 = document.getElementById("reportSemester");
            semesterSelect2.innerHTML = '<option value="">Select Semester</option>';

            data.forEach(semester => {
                semesterSelect2.innerHTML += `<option value="${semester.id}">${semester.name}</option>`;
            });
        })
        .catch(error => console.error("Error loading semesters:", error));
}

// Function to populate the Branches dropdown
function loadBranches() {
    fetch('http://localhost:5000/api/branches')
        .then(response => response.json())
        .then(data => {
            const branchSelect = document.getElementById("branch");
            branchSelect.innerHTML = '<option value="">Select Branch</option>';

            data.forEach(branch => {
                branchSelect.innerHTML += `<option value="${branch.id}">${branch.name}</option>`;
            });

            const branchSelect2 = document.getElementById("reportBranch");
            branchSelect2.innerHTML = '<option value="">Select Branch</option>';

            data.forEach(branch => {
                branchSelect2.innerHTML += `<option value="${branch.id}">${branch.name}</option>`;
            });
        })
        .catch(error => console.error("Error loading branches:", error));
}
function loadSubjects({ regulationId, semesterId, branchId, targetDropdownId }) {
    const regulation = document.getElementById(regulationId).value;
    const semester = document.getElementById(semesterId).value;
    const branch = document.getElementById(branchId).value;

    let query = [];
    if (regulation) query.push(`regulation=${encodeURIComponent(regulation)}`);
    if (semester) query.push(`semester=${encodeURIComponent(semester)}`);
    if (branch) query.push(`branch=${encodeURIComponent(branch)}`);
    const queryString = query.length ? `?${query.join("&")}` : "";

    fetch(`http://localhost:5000/api/teacher-subjects-filttered${queryString}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const subjectDropdown = document.getElementById(targetDropdownId);
        if(targetDropdownId == "reportSubject"){
            subjectDropdown.innerHTML = "<option value=''>All Subjects</option>";
        }else{
            subjectDropdown.innerHTML = "<option value=''>Select Subject</option>";
        }

        data.forEach(subject => {
            const option = document.createElement("option");
            option.value = subject.subject_id || subject.id; // fallback in case
            option.textContent = subject.subject_name;
            subjectDropdown.appendChild(option);
        });
    })
    .catch(error => console.error("Error fetching filtered subjects:", error));
}


document.getElementById("generateBtn").addEventListener("click", generateAttendanceSheet);


function generateAttendanceSheet(event) {
    event.preventDefault(); // prevents page reload
    const regulation = document.getElementById("Regulation").value;
    const semester = document.getElementById("semester").value;
    const branch = document.getElementById("branch").value;

    const date = document.getElementById("date").value;

    if (!regulation || !semester || !branch || !date) {
        alert("Please select all fields before generating the sheet.");
        return;
    }

    fetch(`http://localhost:5000/api/students?regulation_id=${regulation}&semester_id=${semester}&branch_id=${branch}`)
    .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert("No students found for the selected filters.");
                return;
            }
            populateAttendanceTable(data);
        })
        .catch(error => console.error("Error fetching students:", error));
}

function populateAttendanceTable(students) {
    const tbody = document.querySelector("#attendanceTable tbody");
    tbody.innerHTML = ""; // Clear previous data

    students.forEach(student => {
        let row = document.createElement("tr");

        let rollNoCell = document.createElement("td");
        rollNoCell.textContent = student.roll_number;

        let nameCell = document.createElement("td");
        nameCell.textContent = student.full_name;

        let statusCell = document.createElement("td");

        // ✅ Create checkbox (checked = Present)
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = `status_${student.roll_number}`;
        checkbox.checked = true; // Default: Present

        let label = document.createElement("label");
        label.textContent = " Present ";
        label.prepend(checkbox); // checkbox before label text

        statusCell.appendChild(label);

        row.appendChild(rollNoCell);
        row.appendChild(nameCell);
        row.appendChild(statusCell);
        tbody.appendChild(row);
    });

    document.getElementById("submitAttendance").style.display = "block"; // Show submit button
}




function submitAttendance() {
    const rows = document.querySelectorAll("#attendanceTable tbody tr");
    const date = document.getElementById("date").value;
    const semester_id = document.getElementById("semester").value;
    const subject_id = document.getElementById("subject-name").value;

    if (!date || !semester_id || !subject_id) {
        alert("Date, Semester, and Subject are required.");
        return;
    }


    if (rows.length === 0) {
        alert("No attendance data to submit.");
        return;
    }

    const attendanceData = [];

    rows.forEach(row => {
        const rollNo = row.cells[0].textContent;
        const checkbox = row.querySelector(`input[name="status_${rollNo}"]`);
        const status = checkbox.checked ? "Present" : "Absent";

        attendanceData.push({
            roll_no: rollNo,
            date,
            status,
            semester_id,
            subject_id
        });
    });

    fetch("http://localhost:5000/api/submit-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: attendanceData })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error("Error submitting attendance:", error));
}






function generateReport(event) {
    event.preventDefault(); // Stops the page from refreshing

    const semester = document.getElementById("reportSemester").value;
    const branch = document.getElementById("reportBranch").value;
    const regulation = document.getElementById("reportRegulation").value;
    const subject = document.getElementById("reportSubject").value;
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value || new Date().toISOString().split("T")[0];
    const minPercent = document.getElementById("minPercent").value || 0;
    const maxPercent = document.getElementById("maxPercent").value || 100;

    if (!semester || !branch || !regulation || !fromDate) {
        alert("Please fill all filters!");
        return;
    }

    const params = new URLSearchParams({
        semester, branch, regulation, minPercent, maxPercent,
        subject, fromDate, toDate
    });

    fetch(`http://localhost:5000/api/attendance-report?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById("reportTable");
            const tbody = table.querySelector("tbody");
            tbody.innerHTML = "";

            if (data.length === 0) {
                alert("No students found in the selected range.");
                table.style.display = "none";
                return;
            }

            data.forEach(student => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${student.roll_number}</td>
                    <td>${student.full_name}</td>
                    <td>${student.present_days}</td>
                    <td>${student.total_days}</td>
                    <td>${student.percentage}%</td>
                `;
                tbody.appendChild(row);
            });

            table.style.display = "table";
        })
        .catch(err => {
            console.error("Error fetching report:", err);
            alert("Failed to load report");
        });
}



function downloadExcel() {
    const table = document.getElementById("reportTable");

    // Convert the table into a workbook
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Attendance Report", raw: true });
    const worksheet = workbook.Sheets["Attendance Report"];

    const range = XLSX.utils.decode_range(worksheet['!ref']);

    // Loop through rows (starting after the header) and force percentage column as string
    for (let row = range.s.r + 1; row <= range.e.r; ++row) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 4 }); // 5th column = Attendance %
        const cell = worksheet[cellRef];

        if (cell && typeof cell.v === 'number') {
            cell.v = `${cell.v}%`;   // Convert to string with %
            cell.t = 's';            // Set type as string
        }
    }

    XLSX.writeFile(workbook, "attendance_report.xlsx");
}
