

document.addEventListener("DOMContentLoaded", async () => {

     // Function to show sections
     window.showSection = function (sectionId) {
        document.querySelectorAll("section").forEach(section => {
            section.style.display = "none";
        });
        document.getElementById(sectionId).style.display = "block";
    };

    const logoutButton = document.querySelector(".logout-btn"); // Update class if needed

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            window.location.href = "../index.html";
        });
    }
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Not authorized! Please log in.");
        window.location.href = "../index.html";
        return;
    }

   try {
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
        if (data.student) {
            // Display student details
            document.querySelector(".student-details-container").innerHTML += `
                <div class="stats-cardd" style="background-color:rgb(233, 212, 255)">
                        <div class="details-container">
                            <p><strong>Full Name:</strong> ${data.student.full_name}</p>
                            <p><strong>Roll Number:</strong> ${data.student.roll_number}</p>
                            <p><strong>Date of Birth:</strong> ${data.student.date_of_birth}</p>
                            <p><strong>Email:</strong> ${data.student.email}</p>
                            <p><strong>Mobile Number:</strong> ${data.student.mobile_number}</p>
                            <p><strong>Branch:</strong> ${data.student.branch}</p> <!-- Correctly displays branch name -->
                            <p><strong>Semester:</strong> ${data.student.semester}</p> <!-- Correctly displays semester name -->
                            <p><strong>Regulation:</strong> ${data.student.regulation}</p> <!-- Correctly displays regulation name -->
                            <p><strong>Address:</strong> ${data.student.address}</p>
                        </div>
                </div>
            `;
            loadStudentSubjects();
            fetchStudentReport();

        } else {
            // Ask user to complete profile
            document.querySelector(".student-container").innerHTML += `
                <div class="stats-card" style="background-color: rgb(174, 236, 199);">
                    <h3>Profile Incomplete</h3>
                    <p>Your student details are missing. Please complete your profile.</p>
                    <button onclick="window.location.href='complete-profile.html'">Complete Profile</button>
                </div>
            `;
        }
    } else {
        alert("Error fetching user details!");
    } }catch (error) {
        console.error("Error:", error);
        alert("Failed to fetch user details.");
    }

});

function loadStudentSubjects() {
    fetch('http://localhost:5000/api/student-subjects', {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!Array.isArray(data)) {
            console.error("Invalid response:", data);
            return;
        }
        const tableBody = document.getElementById("studentSubjectsTableBody");
        tableBody.innerHTML = ""; // Clear previous data

        if (data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='2'>No subjects found.</td></tr>";
            return;
        }

        data.forEach(subject => {
            tableBody.innerHTML += `
                <tr>
                    <td>${subject.subject_name}</td>
                    <td>${subject.teacher_name}</td>
                </tr>
            `;
        });
    })
    .catch(error => console.error("Error loading student subjects:", error));
}

function fetchStudentReport() {
    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;

    let url = "http://localhost:5000/api/student-attendance-report";
    if (from && to) {
        url += `?from=${from}&to=${to}`;
    }

    fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.querySelector("#attendanceTable tbody");
        tbody.innerHTML = ""; // Clear previous data

        if (!data || !Array.isArray(data.subjects) || data.subjects.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4'>No attendance records found.</td></tr>";
            document.getElementById("overallAttendance").innerText = "";
            return;
        }

        data.subjects.forEach(sub => {
            tbody.innerHTML += `
                <tr>
                    <td>${sub.subject_name}</td>
                    <td>${sub.present_days}</td>
                    <td>${sub.total_classes}</td>
                    <td>${sub.percentage}%</td>
                </tr>
            `;
        });

        const overall = data.overall;
        document.getElementById("overallAttendance").innerText = 
            `Present: ${overall.totalPresent} / ${overall.totalClasses} classes — ${overall.overallPercentage}%`;
    })
    .catch(error => {
        console.error("Error loading attendance report:", error);
        alert("Failed to fetch attendance.");
    });
}
