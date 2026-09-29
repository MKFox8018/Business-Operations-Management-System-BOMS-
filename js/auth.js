const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "กำลังเข้าสู่ระบบ...";
    loginMessage.textContent = "";

    // Login ด้วย Supabase Auth
    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        loginMessage.textContent =
            "เข้าสู่ระบบไม่สำเร็จ: " + error.message;

        loginButton.disabled = false;
        loginButton.textContent = "เข้าสู่ระบบ";
        return;
    }

    const userId = data.user.id;

    // ตรวจสอบ Role จาก Database Function
    const { data: role, error: roleError } =
        await supabaseClient.rpc("get_my_role");

    if (roleError) {
        console.error("ตรวจสอบ Role ไม่สำเร็จ:", roleError);

        loginMessage.textContent =
            "เข้าสู่ระบบสำเร็จ แต่ตรวจสอบสิทธิ์ไม่สำเร็จ";

        await supabaseClient.auth.signOut();

        loginButton.disabled = false;
        loginButton.textContent = "เข้าสู่ระบบ";
        return;
    }

    // ==============================
    // Employee / Manager
    // ==============================
    if (role) {

        sessionStorage.setItem("userRole", role);
        sessionStorage.setItem("userId", userId);

        console.log("Login สำเร็จ");
        console.log("Role:", role);

        // Employee / Manager → Main Menu
        window.location.href = "main_menu.html";

        return;
    }

    // ==============================
    // ตรวจสอบ Customer
    // ==============================
    const { data: customer, error: customerError } =
        await supabaseClient
            .from("customers")
            .select("id, name")
            .eq("auth_user_id", userId)
            .maybeSingle();

    if (customerError) {
        console.error(
            "ตรวจสอบ Customer ไม่สำเร็จ:",
            customerError
        );

        loginMessage.textContent =
            "ไม่สามารถตรวจสอบข้อมูล Customer ได้";

        await supabaseClient.auth.signOut();

        loginButton.disabled = false;
        loginButton.textContent = "เข้าสู่ระบบ";
        return;
    }

    // ==============================
    // Customer
    // ==============================
    if (customer) {

        sessionStorage.setItem("userRole", "Customer");
        sessionStorage.setItem("userId", userId);

        console.log("Login สำเร็จ");
        console.log("Role: Customer");

        // Customer → Customer Portal
        window.location.href = "customer_portal.html";

        return;
    }

    // ==============================
    // Auth สำเร็จ แต่ไม่มีข้อมูลใน BOMS
    // ==============================
    loginMessage.textContent =
        "บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูล BOMS";

    await supabaseClient.auth.signOut();

    loginButton.disabled = false;
    loginButton.textContent = "เข้าสู่ระบบ";
});