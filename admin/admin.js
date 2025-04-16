// Search and Pagination Variables
const rowsPerPage = 5;
let allAllocations = [];
const API_URL = "http://localhost:5000/users";
let currentPage = 1;
const usersPerPage = 5;
const subjectsPerPage = 5;


document.addEventListener("DOMContentLoaded", async () => {

    fetch("http://localhost:5000/dashboard-stats")
    .then(response => response.json())
    .then(data => {
        document.getElementById('teachers-count').textContent = data.teachersCount;
        document.getElementById('students-count').textContent = data.studentsCount;
    })
    .catch(error => console.error("Error fetching dashboard stats:", error));

    const logoutButton = document.querySelector(".logout-btn"); // Update class if needed

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            window.location.href = "../index.html"; // Navigate to index.html
        });
    }

    fetchRegulations();
    fetchBranches();
    fetchSubjects();
    loadRegulations();
    loadSemesters();
    loadBranches();
    loadTeachers();
    fetchAllocations();
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
});

// Call searchUsers when the page loads
searchUsers();



function toggleSubMenu(event, submenuId) {
    event.preventDefault(); // Prevent default anchor behavior
    const submenu = document.getElementById(submenuId);

    // Toggle the submenu display
    if (submenu.style.display === 'none' || submenu.style.display === '') {
        submenu.style.display = 'block';
    } else {
        submenu.style.display = 'none';
    }
}


// Manage Sections Visibility
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content section');
    sections.forEach(section => section.style.display = 'none');
    
    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';
}



// Function to fetch and display regulations
function fetchRegulations() {
    fetch('http://localhost:5000/api/regulations')
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch regulations");
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById("regulationTable");
            tableBody.innerHTML = "";
            if (!Array.isArray(data)) {
                console.error("Expected an array but got:", data);
                return;
            }
            data.forEach(regulation => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${regulation.id}</td>
                        <td>${regulation.name}</td>
                        <td>
                            <button onclick="deleteRegulation(${regulation.id})" style="background-color:rgb(220,0,26);"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => console.error("Error fetching regulations:", error));
}

// Function to add a regulation
function addRegulation() {
    const nameInput = document.getElementById("regulationName");
    const name = nameInput.value.trim().toUpperCase(); // Convert to uppercase for consistency

    // Validate format (R followed by a space and two digits)
    const regex = /^R \d{2}$/;
    if (!regex.test(name)) {
        alert("Invalid format! Regulation must be in the format 'R XX' (e.g., R 20, R 21).");
        return;
    }

    // Fetch existing regulations to check uniqueness
    fetch('http://localhost:5000/api/regulations')
        .then(response => response.json())
        .then(regulations => {
            const existingNames = regulations.map(reg => reg.name.toUpperCase());
            if (existingNames.includes(name)) {
                alert("Regulation already exists!");
                return;
            }

            // Proceed with adding the regulation
            fetch('http://localhost:5000/api/regulations', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            })
            .then(response => response.json())
            .then(data => {
                alert("Regulation added successfully!");
                nameInput.value = ""; // Clear input after success
                fetchRegulations(); // Refresh table
            })
            .catch(error => console.error("Error adding regulation:", error));
        })
        .catch(error => console.error("Error fetching regulations:", error));
}



// Function to delete a regulation
function deleteRegulation(id) {
    if (confirm("Are you sure you want to delete this regulation?")) {
        fetch(`http://localhost:5000/api/regulations/${id}`, { method: "DELETE" })
            .then(response => response.text()) // Expect text response instead of JSON
            .then(data => {
                alert("Regulation removed successfully!");
                fetchRegulations(); // Refresh the list after deletion
            })
            .catch(error => console.error("Error deleting regulation:", error));
    }
}

// Function to fetch and display branches
function fetchBranches() {
    fetch('http://localhost:5000/api/branches')
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch branches");
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById("branchTable");
            tableBody.innerHTML = "";
            if (!Array.isArray(data)) {
                console.error("Expected an array but got:", data);
                return;
            }
            data.forEach(branch => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${branch.id}</td>
                        <td>${branch.name}</td>
                        <td>
                            <button onclick="deleteBranch(${branch.id})" style="background-color:rgb(220,0,26);"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => console.error("Error fetching branches:", error));
}

// Function to add a branch
function addBranch() {
    const nameInput = document.getElementById("branchName");
    let name = nameInput.value.trim();

    if (!name) {
        alert("Please enter a valid branch name.");
        return;
    }

    // Convert to Proper Case (first letter uppercase)
    name = name.replace(/\b\w/g, char => char.toUpperCase());

    // Fetch existing branches to check uniqueness
    fetch("http://localhost:5000/api/branches")
        .then(response => response.json())
        .then(branches => {
            const existingBranches = branches.map(branch => branch.name.toLowerCase());
            if (existingBranches.includes(name.toLowerCase())) {
                alert("Branch already exists!");
                return;
            }

            // Proceed with adding the branch
            return fetch("http://localhost:5000/api/branches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });
        })
        .then(response => response.text()) // Handle both JSON and text responses
        .then(text => {
            try {
                return JSON.parse(text); // Try parsing JSON
            } catch {
                return { success: true, message: text }; // Handle plain text response
            }
        })
        .then(data => {
            alert(data.message || "Branch added successfully!");
            nameInput.value = ""; // Clear input field
            fetchBranches(); // Refresh branch list
        })
        .catch(error => console.error("Error adding branch:", error));
}


// Function to delete a branch
function deleteBranch(id) {
    if (confirm("Are you sure you want to delete this branch?")) {
        fetch(`http://localhost:5000/api/branches/${id}`, { method: "DELETE" })
            .then(response => response.text()) // Expect text response instead of JSON
            .then(data => {
                alert("Branch removed successfully!");
                fetchBranches(); // Refresh the list after deletion
            })
            .catch(error => console.error("Error deleting branch:", error));
    }
}

// Function to populate the Regulations dropdown
function loadRegulations() {
    fetch('http://localhost:5000/api/regulations')
        .then(response => response.json())
        .then(data => {
            const regulationSelect = document.getElementById("regulationSelect");
            regulationSelect.innerHTML = '<option value="">Select Regulation</option>';

            data.forEach(regulation => {
                regulationSelect.innerHTML += `<option value="${regulation.id}">${regulation.name}</option>`;
            });

            // for allocations
            const regulationSelect1 = document.getElementById("regulationSelect1");
            regulationSelect1.innerHTML = '<option value="">Select Regulation</option>';

            data.forEach(regulation => {
                regulationSelect1.innerHTML += `<option value="${regulation.id}">${regulation.name}</option>`;
            });

            const regulationSelect2 = document.getElementById("reportRegulation");
            regulationSelect2.innerHTML = '<option value="">Select Regulation</option>';

            data.forEach(regulation => {
                regulationSelect2.innerHTML += `<option value="${regulation.id}">${regulation.name}</option>`;
            });
        })

        .catch(error => console.error("Error loading regulations:", error));
}

// Function to populate the Semesters dropdown
function loadSemesters() {
    fetch('http://localhost:5000/api/semesters')
        .then(response => response.json())
        .then(data => {
            const semesterSelect = document.getElementById("semesterSelect");
            semesterSelect.innerHTML = '<option value="">Select Semester</option>';

            data.forEach(semester => {
                semesterSelect.innerHTML += `<option value="${semester.id}">${semester.name}</option>`;
            });

            const semesterSelect1 = document.getElementById("semesterSelect1");
            semesterSelect1.innerHTML = '<option value="">Select Semester</option>';

            data.forEach(semester => {
                semesterSelect1.innerHTML += `<option value="${semester.id}">${semester.name}</option>`;
            });

            const semesterSelect2 = document.getElementById("reportSemester");
            semesterSelect2.innerHTML = '<option value="">Select Semester</option>';

            data.forEach(semester => {
                semesterSelect2.innerHTML += `<option value="${semester.id}">${semester.name}</option>`;
            });

            const semesterSelect3 = document.getElementById("semesterSelect3");
            semesterSelect3.innerHTML = '<option value="">Select Semester</option>';

            data.forEach(semester => {
                semesterSelect3.innerHTML += `<option value="${semester.id}">${semester.name}</option>`;
            });
        })
        .catch(error => console.error("Error loading semesters:", error));
}

// Function to populate the Branches dropdown
function loadBranches() {
    fetch('http://localhost:5000/api/branches')
        .then(response => response.json())
        .then(data => {
            const branchSelect = document.getElementById("branchSelect");
            branchSelect.innerHTML = '<option value="">Select Branch</option>';

            data.forEach(branch => {
                branchSelect.innerHTML += `<option value="${branch.id}">${branch.name}</option>`;
            });


            const branchSelect1 = document.getElementById("branchSelect1");
            branchSelect1.innerHTML = '<option value="">Select Branch</option>';

            data.forEach(branch => {
                branchSelect1.innerHTML += `<option value="${branch.id}">${branch.name}</option>`;
            });

            const branchSelect3 = document.getElementById("branchSelect3");
            branchSelect3.innerHTML = '<option value="">Select Branch</option>';

            data.forEach(branch => {
                branchSelect3.innerHTML += `<option value="${branch.id}">${branch.name}</option>`;
            });

            const branchSelect2 = document.getElementById("reportBranch");
            branchSelect2.innerHTML = '<option value="">Select Branch</option>';

            data.forEach(branch => {
                branchSelect2.innerHTML += `<option value="${branch.id}">${branch.name}</option>`;
            });
        })
        .catch(error => console.error("Error loading branches:", error));
}

// Function to load teachers from users table
function loadTeachers() {
    fetch('http://localhost:5000/api/teachers')
        .then(response => response.json())
        .then(data => {
            const teacherSelect = document.getElementById("teacherSelect");
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
            
            data.forEach(teacher => {
                teacherSelect.innerHTML += `<option value="${teacher.id}">${teacher.username}</option>`;
            });
        })
        .catch(error => console.error("Error loading teachers:", error));
}

// Function to load subjects based on selected regulation, semester, and branch
function loadSubjects({ regulationId, semesterId, branchId, targetDropdownId }) {
    const regulation = document.getElementById(regulationId).value;
    const semester = document.getElementById(semesterId).value;
    const branch = document.getElementById(branchId).value;

    if (!regulation || !semester || !branch) return;

    // Choose the appropriate endpoint
    const endpoint = (targetDropdownId === "reportSubject")
        ? "all-allocated-subjects"
        : "subjectSelection";

    fetch(`http://localhost:5000/api/${endpoint}?regulation=${regulation}&semester=${semester}&branch=${branch}`)
        .then(response => response.json())
        .then(data => {
            const subjectSelect = document.getElementById(targetDropdownId);
            
            // First option depends on the target
            if (targetDropdownId === "reportSubject") {
                subjectSelect.innerHTML = '<option value="">All Subjects</option>';
            } else {
                subjectSelect.innerHTML = '<option value="">Select Subject</option>';
            }

            data.forEach(subject => {
                const option = document.createElement("option");
                option.value = subject.id;
                option.textContent = subject.subject_name;
                subjectSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading subjects:", error));
}


// Function to allocate subject to a teacher
function allocateSubject(event) {
    event.preventDefault(); // Prevent form from submitting and reloading the page

    const subjectId = document.getElementById("subjectSelect").value;
    const teacherId = document.getElementById("teacherSelect").value;

    if (!subjectId || !teacherId) {
        alert("Please select both subject and teacher.");
        return;
    }

    fetch('http://localhost:5000/api/allocate-subject', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: subjectId, teacher_id: teacherId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Subject allocated successfully!");
            fetchAllocations();
        } else {
            alert("Failed to allocate subject.");
        }
    })
    .catch(error => console.error("Error allocating subject:", error));
}

// Function to fetch and display allocated subjects
function fetchAllocations() {
    fetch('http://localhost:5000/api/allocated-subjects')
        .then(response => response.json())
        .then(data => {
            allAllocations = data;
            displayAllocations();
        })
        .catch(error => console.error("Error fetching allocations:", error));
}

// Function to display allocated subjects with search and pagination
function displayAllocations() {
    const searchQuery = document.getElementById("searchInputt").value.toLowerCase();
    let filteredAllocations = allAllocations.filter(allocation =>
        allocation.subject_name.toLowerCase().includes(searchQuery) ||
        allocation.teacher_name.toLowerCase().includes(searchQuery) ||
        allocation.regulation.toLowerCase().includes(searchQuery) ||
        allocation.semester.toLowerCase().includes(searchQuery) ||
        allocation.branch.toLowerCase().includes(searchQuery)
    );

    const allocationTable = document.getElementById("allocationTable");
    allocationTable.innerHTML = "";

    const totalPages = Math.ceil(filteredAllocations.length / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages) || 1;

    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let paginatedAllocations = filteredAllocations.slice(start, end);

    if (paginatedAllocations.length === 0) {
        allocationTable.innerHTML = "<tr><td colspan='6'>No allocations found</td></tr>";
        return;
    }

    paginatedAllocations.forEach(allocation => {
        allocationTable.innerHTML += `
            <tr>
                <td>${allocation.subject_name}</td>
                <td>${allocation.regulation}</td>
                <td>${allocation.semester}</td>
                <td>${allocation.branch}</td>
                <td>${allocation.teacher_name}</td>
                <td><button onclick="removeAllocation(${allocation.id})" style="background-color:rgb(220,0,26);"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });

    document.getElementById("pagination1").innerHTML = `
        <button onclick="changePage1(-1)" ${currentPage === 1 ? "disabled" : ""} style="background-color:#c38ffb">
            <i class="fas fa-arrow-left"></i> 
        </button>
        Page ${currentPage} of ${totalPages || 1}
        <button onclick="changePage1(1)" ${currentPage >= totalPages ? "disabled" : ""} style="background-color:#c38ffb">
            <i class="fas fa-arrow-right"></i>
        </button>
    `;
}

// Function to change pages
function changePage1(direction) {
    currentPage += direction;
    displayAllocations();
}


// Function to remove a subject allocation
function removeAllocation(id) {
    if (confirm("Are you sure you want to remove this allocation?")) {
        fetch(`http://localhost:5000/api/allocated-subjects/${id}`, { method: "DELETE" })
            .then(response => response.text())
            .then(data => {
                alert("subject Allocation removed successfully!");
                fetchAllocations();
            })
            .catch(error => console.error("Error removing allocation:", error));
    }
}


// Function to fetch and display subjects
async function fetchSubjects(search = "") {
    const response = await fetch(`http://localhost:5000/api/subjects?search=${search}&page=${currentPage}&limit=${subjectsPerPage}`);
    const data = await response.json();
    renderSubjects(data.subjects, data.total);
}

function renderSubjects(subjects, totalSubjects) {
    const subjectTable = document.getElementById("subjectTable");
    subjectTable.innerHTML = "";

    if (subjects.length === 0) {
        subjectTable.innerHTML = "<tr><td colspan='6'>No subjects found</td></tr>";
        return;
    }

    subjects.forEach(subject => {
        subjectTable.innerHTML += `
            <tr>
                <td>${subject.id}</td>
                <td>${subject.subject_name}</td>
                <td>${subject.regulation}</td>
                <td>${subject.semester}</td>
                <td>${subject.branch}</td>
                <td>
                    <button onclick="deleteSubject(${subject.id})" style="background-color:rgb(220,0,26);"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    renderPaginationn(totalSubjects);
}

function renderPaginationn(totalSubjects) {
    const paginationDiv = document.getElementById("paginationSubject"); // Ensure correct ID
    const totalPages = Math.ceil(totalSubjects / subjectsPerPage);

    // Hide pagination if only one page or no subjects
    if (!totalSubjects || totalPages <= 1) {
        paginationDiv.innerHTML = "";
        return;
    }

    paginationDiv.innerHTML = `
        <button onclick="changePages(-1)" ${currentPage === 1 ? "disabled" : ""} style="background-color:#c38ffb">
            <i class="fas fa-arrow-left"></i> 
        </button>
        Page ${currentPage} of ${totalPages}
        <button onclick="changePages(1)" ${currentPage >= totalPages ? "disabled" : ""} style="background-color:#c38ffb">
            <i class="fas fa-arrow-right"></i>
        </button>
    `;
}


function changePages(direction) {
    const newPage = currentPage + direction;
    if (newPage < 1) return;
    currentPage = newPage;
    fetchSubjects(document.getElementById("searchSubject").value);
}

function searchSubjects() {
    currentPage = 1; // Reset to first page on new search
    fetchSubjects(document.getElementById("searchSubject").value);
}


// Function to add a subject
function addSubject() {
    const subjectName = document.getElementById("subjectName").value.trim();
    const regulationId = document.getElementById("regulationSelect").value;
    const semesterId = document.getElementById("semesterSelect").value;
    const branchId = document.getElementById("branchSelect").value;

    if (!subjectName || !regulationId || !semesterId || !branchId) {
        alert("Please fill in all fields before adding a subject.");
        return;
    }

    // ✅ Convert subject name to lowercase for proper comparison
    const normalizedSubjectName = subjectName.toLowerCase();

    // ✅ Fetch existing subjects to check for duplicates
    fetch("http://localhost:5000/api/subjects")
        .then(response => response.json())
        .then(data => {

            const subjects = data.subjects;
            if (!Array.isArray(subjects)) {
                console.error("Expected an array but got:", subjects);
                alert("Error fetching subjects. Please try again.");
                return;
            }

            // ✅ Check if the subject already exists in the same regulation, semester, and branch
            const isDuplicate = subjects.some(subj => 
                subj.subject_name.toLowerCase() === normalizedSubjectName &&
                subj.regulation_id == regulationId &&
                subj.semester_id == semesterId &&
                subj.branch_id == branchId
            );

            if (isDuplicate) {
                alert("This subject already exists for the selected regulation, semester, and branch.");
                return;
            }

            // ✅ Send request with IDs (allows same subject for different regulations, semesters, or branches)
            const requestBody = { 
                subject_name: subjectName, 
                regulation_id: regulationId, 
                semester_id: semesterId, 
                branch_id: branchId 
            };


            return fetch("http://localhost:5000/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });
        })
        .then(response => response.json()) // Parse JSON response
        .then(data => {
            if (data.success) {
                alert("Subject added successfully!");
                document.getElementById("subjectName").value = "";
                fetchSubjects(); // Refresh subject list
            } else {
                alert(`Failed to add subject: ${data.error}`);
            }
        })
        .catch(error => console.error("Error adding subject:", error));
}


// Function to delete a SUBJECT
function deleteSubject(id) {
    if (confirm("Are you sure you want to delete this subject?")) {
        fetch(`http://localhost:5000/api/subjects/${id}`, { method: "DELETE" })
            .then(response => response.text()) // Expect text response instead of JSON
            .then(data => {
                alert("Subject removed successfully!");
                fetchSubjects(); // Refresh the list after deletion
            })
            .catch(error => console.error("Error deleting subject:", error));
    }
}

async function searchUsers() {
    const searchInput = document.getElementById("searchInput").value;
    const response = await fetch(`${API_URL}?search=${searchInput}`);
    const users = await response.json();
    renderUsers(users,currentPage);
}

async function addUser() {
    const userType = document.getElementById("userType").value;
    const username = document.getElementById("username1").value;
    const email = document.getElementById("email1").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_type: userType, username, email, password }),
        });

        if (!response.ok) {
            // Handle HTTP errors
            const errorData = await response.json();
            throw new Error(errorData.error || "An unexpected error occurred.");
        }

        const data = await response.json();
        alert(data.message);
        // ✅ Reset input fields
        document.getElementById("userType").value="";
        document.getElementById("username1").value="";
        document.getElementById("email1").value="";
        document.getElementById("password").value="";
        searchUsers();
    } catch (error) {
        console.error("Signup Error:", error);
        alert(error.message);
    }
}


async function editUser(id) {
    const username = prompt("Enter new username:");
    const email = prompt("Enter new email:");

    if (username && email) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email })
            });

            if (response.ok) {
                alert("User updated successfully!");
                searchUsers();
            } else {
                alert("Error updating user. Please try again.");
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        }
    } else {
        alert("Update canceled. All fields are required.");
    }
}


async function resetPassword(id) {
    const newPassword = prompt("Enter new password:");
    if (newPassword) {
        try {
            const response = await fetch(`${API_URL}/reset-password/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword })
            });

            if (response.ok) {
                alert("Password reset successfully!");
            } else {
                alert("Error resetting password. Please try again.");
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        }
    } else {
        alert("Password reset canceled.");
    }
}


async function deleteUser(id) {
    if (confirm("Are you sure?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

            if (response.ok) {
                alert("User deleted successfully!");
                searchUsers();
            } else {
                alert("Error deleting user. Please try again.");
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
        }
    }
}


function renderUsers(users, page) {
    const userTable = document.getElementById("userTable");
    userTable.innerHTML = "";

    const start = (page - 1) * usersPerPage;
    const end = start + usersPerPage;
    const paginatedUsers = users.slice(start, end);

    paginatedUsers.forEach(user => {
        userTable.innerHTML += `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.user_type}</td>
                <td>
                    <button onclick="editUser(${user.id})" title="Edit" style="background-color: blue;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="resetPassword(${user.id})" title="Reset Password" style="background-color:rgb(57,166,104);">
                        <i class="fas fa-key"></i>
                    </button>
                    <button onclick="deleteUser(${user.id})" title="Delete" style="background-color:rgb(220,0,26);" >
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    renderPagination(users.length);
}

function renderPagination(totalUsers) {
    const paginationDiv = document.getElementById("pagination");
    const totalPages = Math.ceil(totalUsers / usersPerPage);

    paginationDiv.innerHTML = `
        <button onclick="changePage(-1)" ${currentPage === 1 ? "disabled" : ""} style="background-color:#c38ffb">
            <i class="fas fa-arrow-left"></i> 
        </button>
        Page ${currentPage} of ${totalPages}
        <button onclick="changePage(1)" ${currentPage === totalPages ? "disabled" : ""} style="background-color:#c38ffb">
            <i class="fas fa-arrow-right"></i>
        </button>
    `;
}


function changePage(direction) {
    currentPage += direction;
    searchUsers();
}
document.getElementById("upgradeSemesterBtn").addEventListener("click", async function () {
    const branch_id = document.getElementById("branchSelect3").value;
    const semester_id = document.getElementById("semesterSelect3").value;

    if (!branch_id || !semester_id) {
        return alert("Please select both branch and semester!");
    }

    const excludedRollNumbers = prompt("Enter roll numbers to exclude (comma-separated):")
        .split(",")
        .map(r => r.trim())
        .filter(r => r);

    const response = await fetch("http://localhost:5000/api/upgrade-semester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch_id, semester_id, excludedRollNumbers })
    });

    const data = await response.json();

    if (response.ok) {
        alert(`Semester upgraded! ${data.updatedRows} students updated.`);
        branch_id.value=""
        semester_id.value=""
        loadLastUpdatedDate(branch_id);
    } else {
        alert("Error: " + data.error);
    }
});


// Function to load last updated details
async function loadLastUpdatedDate(branch_id = "") {
    const response = await fetch(`http://localhost:5000/api/get-last-updated${branch_id ? "?branch_id=" + branch_id : ""}`);
    const data = await response.json();
    const container = document.getElementById("lastUpdatedContainer");

    container.innerHTML = "";

    const table = document.createElement("table");

    // Table Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Last Updated</th>
            <th>Branch</th>
            <th>Semester</th>
            <th>Excluded Roll Numbers</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    data.message.forEach(msg => {
        const lines = msg.split("\n");

        const updated = lines[0]?.replace("Last Updated On: ", "") || "-";
        const branch = lines[1]?.replace("Branch: ", "") || "-";
        const semester = lines[2]?.replace("Upgraded: ", "") || "-";
        const excluded = lines[3]?.replace("Excluded Roll Numbers:", "").trim();

        // If "None" is present, treat it as no excluded roll numbers
        const excludedText = excluded && excluded !== "None" ? excluded : "-";

        const tr = document.createElement("tr");

        // Loop through the data and create td for each row
        [updated, branch, semester, excludedText].forEach(text => {
            const td = document.createElement("td");
            td.textContent = text;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}









// Load last updated details on page load
loadLastUpdatedDate();


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


async function addStudents() {
    const userType = document.getElementById("userType2").value;
    const username = document.getElementById("username2").value;
    const email = document.getElementById("email2").value;
    const password = document.getElementById("password2").value;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_type: userType, username, email, password }),
        });

        if (!response.ok) {
            // Handle HTTP errors
            const errorData = await response.json();
            throw new Error(errorData.error || "An unexpected error occurred.");
        }

        const data = await response.json();
        
        // Store username and email in localStorage
        localStorage.setItem('username', username);
        localStorage.setItem('email', email);

        window.location.href = 'complete-profile.html';

        alert(data.message);

        // ✅ Reset input fields
        document.getElementById("userType").value = "";
        document.getElementById("username1").value = "";
        document.getElementById("email1").value = "";
        document.getElementById("password").value = "";
        searchUsers();
    } catch (error) {
        console.error("Signup Error:", error);
        alert(error.message);
    }
}

//display and search students

const pageSize = 10; // Number of rows per page

/// Fetch Students (Search + Pagination)
async function fetchStudents(query = "", page = 1) {
    try {
        const res = await fetch(`http://localhost:5000/api/students-profile?search=${encodeURIComponent(query)}&page=${page}&limit=${pageSize}`);
        const data = await res.json();

        console.log("API Response:", data);

        if (!Array.isArray(data.students)) {
            console.error("Unexpected response format:", data);
            return;
        }

        displayStudents(data.students);
        setupPagination(data.total, page);
    } catch (err) {
        console.error("Error fetching students:", err);
    }
}


// Display Students in the table
function displayStudents(students = []) {
    const tableBody = document.getElementById("studentTable");
    tableBody.innerHTML = "";

    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8">No students found</td></tr>`;
        return;
    }

    students.forEach((student) => {
        const row = `
            <tr>
                <td>${student.id}</td>
                <td>${student.username}</td>  <!-- Updated to display username -->
                <td>${student.full_name}</td>
                <td>${student.roll_number}</td>
                <td>${student.regulation_name}</td>  <!-- Display regulation name -->
                <td>${student.semester_name}</td>   <!-- Display semester name -->
                <td>${student.branch_name}</td>     <!-- Display branch name -->
                
            </tr>`;
        tableBody.innerHTML += row;
    });
}


// Setup Pagination
function setupPagination(total, currentPage) {
    const pagination = document.getElementById("pagination5");
    const totalPages = Math.ceil(total / pageSize);
    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <button onclick="goToPage(${i})" style="${i === currentPage ? 'font-weight:bold' : ''}">
                ${i}
            </button>`;
    }
}

// Go to the selected page
function goToPage(page) {
    currentPage = page;
    const query = document.getElementById("searchInput1").value;
    fetchStudents(query, page);
}


// Search students based on input
function searchStudents() {
    const query = document.getElementById("searchInput1").value;
    fetchStudents(query, 1);
}


// Load data on page load
window.onload = () => fetchStudents();



