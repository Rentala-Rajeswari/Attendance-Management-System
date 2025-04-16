document.addEventListener("DOMContentLoaded", () => {
    // Signup Event Listener
    const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("signupUsername").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        const userType = document.getElementById("signupUserType").value;

        try {
            const response = await fetch("http://localhost:5000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, userType }),
            });

            const data = await response.json();

            if (data.error) {
                alert(data.error.sqlMessage || "An unknown error occurred.");
            } else {
                alert("Signup successful!");
            }
        } catch (error) {
            console.error("Signup Error:", error);
            alert("An error occurred during signup.");
        }
    });
}


    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            
            try {
                const response = await fetch("http://localhost:5000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    if (data.userType === "admin") {
                        window.location.href = "./admin/admin.html";
                    } else if (data.userType === "teacher") {
                        window.location.href = "./teacher/teacher.html";
                    } else {
                        window.location.href = "./student/student.html";
                    }
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Login Error:", error);
                alert("An error occurred during login.");
            }
        });
    }
    // Close Buttons
    document.getElementById("closeBtn")?.addEventListener("click", () => {
        window.close();
    });

    document.getElementById("closeSignupBtn")?.addEventListener("click", () => {
        window.close();
    });
    
});

function openSignup() {
    window.open('signup.html', 'width=600,height=600');
}
