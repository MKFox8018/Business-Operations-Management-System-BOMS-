const userRole = sessionStorage.getItem("userRole");
const userId = sessionStorage.getItem("userId");

const userRoleElement = document.getElementById("userRole");
const logoutButton = document.getElementById("logoutButton");

const addCustomerButton =
    document.getElementById("addCustomerButton");

const customerTableBody =
    document.getElementById("customerTableBody");

const searchInput =
    document.getElementById("searchInput");

const customerModal =
    document.getElementById("customerModal");

const modalTitle =
    document.getElementById("modalTitle");

const closeModalButton =
    document.getElementById("closeModalButton");

const cancelButton =
    document.getElementById("cancelButton");

const customerForm =
    document.getElementById("customerForm");

const customerId =
    document.getElementById("customerId");

const customerName =
    document.getElementById("customerName");

const customerPhone =
    document.getElementById("customerPhone");

const saveButton =
    document.getElementById("saveButton");

const message =
    document.getElementById("message");

const backButton =
    document.getElementById("backButton");


/* =========================
   ตรวจสอบ Login
========================= */

if (!userRole || !userId) {
    window.location.href = "login.html";
}


/* =========================
   แสดง Role
========================= */

userRoleElement.textContent =
    "สิทธิ์: " + userRole;


/* =========================
   ตรวจสอบสิทธิ์
========================= */

if (userRole !== "Employee" && userRole !== "Manager") {

    addCustomerButton.style.display = "none";

}


/* =========================
   โหลดลูกค้า
========================= */

let customers = [];

async function loadCustomers() {

    customerTableBody.innerHTML = `
        <tr>
            <td colspan="4" class="loading">
                กำลังโหลดข้อมูล...
            </td>
        </tr>
    `;

    const { data, error } = await supabaseClient
        .from("customers")
        .select("id, name, phone, created_at")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        customerTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    ไม่สามารถโหลดข้อมูลลูกค้าได้
                </td>
            </tr>
        `;

        message.textContent =
            "เกิดข้อผิดพลาด: " + error.message;

        return;
    }

    customers = data || [];

    renderCustomers(customers);
}


/* =========================
   แสดงข้อมูลลูกค้า
========================= */

function renderCustomers(list) {

    if (list.length === 0) {

        customerTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    ไม่พบข้อมูลลูกค้า
                </td>
            </tr>
        `;

        return;
    }

    customerTableBody.innerHTML = "";

    list.forEach(customer => {

        const row = document.createElement("tr");

        const createdDate =
            new Date(customer.created_at)
                .toLocaleDateString("th-TH");

        row.innerHTML = `
            <td>${escapeHtml(customer.name)}</td>

            <td>${escapeHtml(customer.phone)}</td>

            <td>${createdDate}</td>

            <td>

                ${
                    userRole === "Employee" ||
                    userRole === "Manager"

                    ?

                    `
                    <button
                        class="action-button edit-button"
                        data-id="${customer.id}"
                    >
                        ✏️ แก้ไข
                    </button>
                    `

                    :

                    ""
                }

            </td>
        `;

        customerTableBody.appendChild(row);
    });
}


/* =========================
   Search
========================= */

searchInput.addEventListener(
    "input",
    () => {

        const keyword =
            searchInput.value
                .trim()
                .toLowerCase();

        const filtered =
            customers.filter(customer => {

                const name =
                    (customer.name || "")
                        .toLowerCase();

                const phone =
                    (customer.phone || "")
                        .toLowerCase();

                return (
                    name.includes(keyword) ||
                    phone.includes(keyword)
                );
            });

        renderCustomers(filtered);
    }
);


/* =========================
   เปิด Modal เพิ่ม
========================= */

addCustomerButton.addEventListener(
    "click",
    () => {

        customerForm.reset();

        customerId.value = "";

        modalTitle.textContent =
            "➕ เพิ่มลูกค้า";

        saveButton.textContent =
            "บันทึก";

        message.textContent = "";

        customerModal.style.display =
            "flex";
    }
);


/* =========================
   เปิด Modal แก้ไข
========================= */

customerTableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".edit-button"
            );

        if (!button) return;

        const id =
            button.dataset.id;

        const customer =
            customers.find(
                item => item.id === id
            );

        if (!customer) return;

        customerId.value =
            customer.id;

        customerName.value =
            customer.name || "";

        customerPhone.value =
            customer.phone || "";

        modalTitle.textContent =
            "✏️ แก้ไขข้อมูลลูกค้า";

        saveButton.textContent =
            "บันทึกการแก้ไข";

        message.textContent = "";

        customerModal.style.display =
            "flex";
    }
);


/* =========================
   ปิด Modal
========================= */

function closeModal() {

    customerModal.style.display =
        "none";

    customerForm.reset();

    customerId.value = "";

    message.textContent = "";
}

closeModalButton.addEventListener(
    "click",
    closeModal
);

cancelButton.addEventListener(
    "click",
    closeModal
);


/* =========================
   เพิ่ม / แก้ไข Customer
========================= */

customerForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const name =
            customerName.value.trim();

        const phone =
            customerPhone.value.trim();

        const id =
            customerId.value;

        if (!name) {

            message.textContent =
                "กรุณากรอกชื่อลูกค้า";

            return;
        }

        if (!phone) {

            message.textContent =
                "กรุณากรอกเบอร์โทร";

            return;
        }

        saveButton.disabled = true;

        saveButton.textContent =
            "กำลังบันทึก...";

        message.textContent = "";


        /* ===== แก้ไข ===== */

        if (id) {

            const { error } =
                await supabaseClient
                    .from("customers")
                    .update({
                        name: name,
                        phone: phone
                    })
                    .eq("id", id);

            if (error) {

                console.error(error);

                message.textContent =
                    "แก้ไขไม่สำเร็จ: " +
                    error.message;

                saveButton.disabled = false;

                saveButton.textContent =
                    "บันทึกการแก้ไข";

                return;
            }

            alert(
                "แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว"
            );

        }


        /* ===== เพิ่ม ===== */

        else {

            const { error } =
                await supabaseClient
                    .from("customers")
                    .insert({
                        name: name,
                        phone: phone
                    });

            if (error) {

                console.error(error);

                message.textContent =
                    "เพิ่มลูกค้าไม่สำเร็จ: " +
                    error.message;

                saveButton.disabled = false;

                saveButton.textContent =
                    "บันทึก";

                return;
            }

            alert(
                "เพิ่มลูกค้าเรียบร้อยแล้ว"
            );
        }


        closeModal();

        await loadCustomers();
    }
);


/* =========================
   Back
========================= */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "main_menu.html";
    }
);


/* =========================
   Logout
========================= */

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth.signOut();

        sessionStorage.clear();

        window.location.href =
            "login.html";
    }
);


/* =========================
   ป้องกัน HTML Injection
========================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   เริ่มต้น
========================= */

loadCustomers();