
// =====================================
// ตรวจสอบสิทธิ์การเข้า Main Menu
// =====================================

const mainMenuRole =
    sessionStorage.getItem("userRole");

const mainMenuUserId =
    sessionStorage.getItem("userId");


// ยังไม่ได้ Login
if (!mainMenuRole || !mainMenuUserId) {

    window.location.href = "login.html";

}


// Customer ห้ามเข้า Main Menu
else if (mainMenuRole === "Customer") {

    window.location.href = "customer_portal.html";

}

const userRole = sessionStorage.getItem("userRole");
const userId = sessionStorage.getItem("userId");

const userRoleElement = document.getElementById("userRole");
const logoutButton = document.getElementById("logoutButton");

// ถ้าไม่มีข้อมูล Login ให้กลับหน้า Login
if (!userRole || !userId) {
    window.location.href = "login.html";
}

// แสดง Role
userRoleElement.textContent = "สิทธิ์: " + userRole;


// Logout
logoutButton.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    sessionStorage.clear();

    window.location.href = "login.html";
});