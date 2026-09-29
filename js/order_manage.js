/* =========================================================
   BOMS - Order Management
========================================================= */


/* =========================
   User
========================= */

const userRole =
    sessionStorage.getItem("userRole");

const userId =
    sessionStorage.getItem("userId");


/* =========================
   Elements
========================= */

const userRoleElement =
    document.getElementById("userRole");

const logoutButton =
    document.getElementById("logoutButton");

const backButton =
    document.getElementById("backButton");

const orderTableBody =
    document.getElementById("orderTableBody");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const refreshButton =
    document.getElementById("refreshButton");

const message =
    document.getElementById("message");


/* =========================
   Edit Modal
========================= */

const editModal =
    document.getElementById("editModal");

const closeEditModalButton =
    document.getElementById(
        "closeEditModalButton"
    );

const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );

const editOrderForm =
    document.getElementById(
        "editOrderForm"
    );

const editOrderId =
    document.getElementById(
        "editOrderId"
    );

const editOrderCode =
    document.getElementById(
        "editOrderCode"
    );

const editCustomer =
    document.getElementById(
        "editCustomer"
    );

const editDevice =
    document.getElementById(
        "editDevice"
    );

const editMainProblem =
    document.getElementById(
        "editMainProblem"
    );

const editDescription =
    document.getElementById(
        "editDescription"
    );

const editRepairCost =
    document.getElementById(
        "editRepairCost"
    );

const editMessage =
    document.getElementById(
        "editMessage"
    );

const saveEditButton =
    document.getElementById(
        "saveEditButton"
    );


/* =========================
   Status Modal
========================= */

const statusModal =
    document.getElementById(
        "statusModal"
    );

const closeStatusModalButton =
    document.getElementById(
        "closeStatusModalButton"
    );

const cancelStatusButton =
    document.getElementById(
        "cancelStatusButton"
    );

const statusOrderCode =
    document.getElementById(
        "statusOrderCode"
    );

const currentStatus =
    document.getElementById(
        "currentStatus"
    );

const newStatus =
    document.getElementById(
        "newStatus"
    );

const statusNote =
    document.getElementById(
        "statusNote"
    );

const statusMessage =
    document.getElementById(
        "statusMessage"
    );

const saveStatusButton =
    document.getElementById(
        "saveStatusButton"
    );


/* =========================
   History Modal
========================= */

const historyModal =
    document.getElementById(
        "historyModal"
    );

const closeHistoryModalButton =
    document.getElementById(
        "closeHistoryModalButton"
    );

const historyOrderCode =
    document.getElementById(
        "historyOrderCode"
    );

const historyTableBody =
    document.getElementById(
        "historyTableBody"
    );


/* =========================
   Data
========================= */

let orders = [];

let customers = [];

let devices = [];

let currentStatusOrder = null;


/* =========================================================
   Login Check
========================================================= */

if (!userRole || !userId) {

    window.location.href =
        "login.html";
}


/* =========================================================
   Role Check
========================================================= */

if (
    userRole !== "Employee" &&
    userRole !== "Manager"
) {

    alert(
        "คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
    );

    window.location.href =
        "main_menu.html";
}


/* =========================================================
   Display Role
========================================================= */

userRoleElement.textContent =
    "สิทธิ์: " + userRole;


/* =========================================================
   Status Text
========================================================= */

function getStatusText(status) {

    switch (status) {

        case "waiting":
            return "กำลังรอคิว";

        case "repairing":
            return "กำลังซ่อม";

        case "completed":
            return "ซ่อมเสร็จแล้วพร้อมส่ง";

        case "closed":
            return "ปิดงาน";

        default:
            return status || "-";
    }
}


/* =========================================================
   Status Class
========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "waiting":
            return "status-waiting";

        case "repairing":
            return "status-repairing";

        case "completed":
            return "status-completed";

        case "closed":
            return "status-closed";

        default:
            return "";
    }
}


/* =========================================================
   Format Money
========================================================= */

function formatMoney(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString(
        "th-TH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
   Escape HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   Load Customers
========================================================= */

async function loadCustomers() {

    const {
        data,
        error
    } = await supabaseClient
        .from("customers")
        .select(
            "id, name, phone"
        )
        .order(
            "name",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "Load customers error:",
            error
        );

        return;
    }

    customers =
        data || [];

    fillCustomerSelect();
}


/* =========================================================
   Fill Customer Select
========================================================= */

function fillCustomerSelect() {

    editCustomer.innerHTML = `
        <option value="">
            เลือกลูกค้า
        </option>
    `;

    customers.forEach(customer => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            customer.id;

        option.textContent =
            `${customer.name} (${customer.phone})`;

        editCustomer.appendChild(
            option
        );
    });
}


/* =========================================================
   Load Devices
========================================================= */

async function loadDevices() {

    const {
        data,
        error
    } = await supabaseClient
        .from("devices")
        .select(`
            id,
            customer_id,
            device_type,
            brand,
            model,
            serial_number,
            shop_tag
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "Load devices error:",
            error
        );

        return;
    }

    devices =
        data || [];
}


/* =========================================================
   Fill Device Select
========================================================= */

function fillDeviceSelect(
    customerId,
    selectedDeviceId = ""
) {

    editDevice.innerHTML = `
        <option value="">
            เลือกอุปกรณ์
        </option>
    `;

    if (!customerId) {

        return;
    }

    const customerDevices =
        devices.filter(
            device =>
                device.customer_id ===
                customerId
        );


    customerDevices.forEach(
        device => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                device.id;

            let deviceName =
                device.device_type ||
                "อุปกรณ์";

            if (device.brand) {

                deviceName +=
                    " " + device.brand;
            }

            if (device.model) {

                deviceName +=
                    " " + device.model;
            }

            if (
                device.shop_tag
            ) {

                deviceName +=
                    ` [${device.shop_tag}]`;
            }

            option.textContent =
                deviceName;

            editDevice.appendChild(
                option
            );
        }
    );

    if (selectedDeviceId) {

        editDevice.value =
            selectedDeviceId;
    }
}


/* =========================================================
   Customer Changed
========================================================= */

editCustomer.addEventListener(
    "change",
    () => {

        fillDeviceSelect(
            editCustomer.value
        );
    }
);


/* =========================================================
   Load Orders
========================================================= */

async function loadOrders() {

    orderTableBody.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="loading"
            >
                กำลังโหลดข้อมูล...
            </td>
        </tr>
    `;

    message.textContent = "";


    const {
        data,
        error
    } = await supabaseClient
        .from("orders")
        .select(`
            id,
            customer_id,
            device_id,
            order_code,
            main_problem,
            description,
            repair_cost,
            status,
            closed_at,
            created_at,

            customers (
                id,
                name,
                phone
            ),

            devices (
                id,
                device_type,
                brand,
                model,
                serial_number,
                shop_tag
            )
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Load orders error:",
            error
        );

        orderTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty"
                >
                    ไม่สามารถโหลดข้อมูล Order ได้
                </td>
            </tr>
        `;

        message.textContent =
            "เกิดข้อผิดพลาด: " +
            error.message;

        return;
    }


    orders =
        data || [];

    renderOrders();
}


/* =========================================================
   Render Orders
========================================================= */

function renderOrders() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        statusFilter.value;


    const filteredOrders =
        orders.filter(order => {

            const customerName =
                order.customers?.name ||
                "";

            const problem =
                order.main_problem ||
                "";

            const code =
                order.order_code ||
                "";

            const device =
                order.devices;

            const deviceText =
                [
                    device?.device_type,
                    device?.brand,
                    device?.model,
                    device?.serial_number,
                    device?.shop_tag
                ]
                    .filter(Boolean)
                    .join(" ");


            const searchText =
                (
                    code +
                    " " +
                    customerName +
                    " " +
                    problem +
                    " " +
                    deviceText
                )
                    .toLowerCase();


            const matchSearch =
                !keyword ||
                searchText.includes(
                    keyword
                );


            const matchStatus =
                !selectedStatus ||
                order.status ===
                selectedStatus;


            return (
                matchSearch &&
                matchStatus
            );
        });


    if (
        filteredOrders.length === 0
    ) {

        orderTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty"
                >
                    ไม่พบ Order
                </td>
            </tr>
        `;

        return;
    }


    orderTableBody.innerHTML = "";


    filteredOrders.forEach(
        order => {

            const row =
                document.createElement(
                    "tr"
                );


            const customerName =
                order.customers?.name ||
                "-";


            const device =
                order.devices;


            const deviceName =
                [
                    device?.device_type,
                    device?.brand,
                    device?.model
                ]
                    .filter(Boolean)
                    .join(" ") ||
                "-";


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtml(
                order.order_code
            )}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                customerName
            )}
                </td>

                <td>
                    ${escapeHtml(
                deviceName
            )}

                    ${device?.shop_tag
                    ?
                    `<br>
                         <small>
                            Tag:
                            ${escapeHtml(
                        device.shop_tag
                    )}
                         </small>`
                    :
                    ""
                }
                </td>

                <td>
                    ${escapeHtml(
                    order.main_problem
                )}
                </td>

                <td>
                    ${formatMoney(
                    order.repair_cost
                )}
                </td>

                <td>

                    <span
                        class="status-badge
                        ${getStatusClass(
                    order.status
                )}"
                    >
                        ${escapeHtml(
                    getStatusText(
                        order.status
                    )
                )}
                    </span>

                </td>

                <td>

                    <button
                        class="action-button edit-button"
                        data-action="edit"
                        data-id="${order.id}"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        class="action-button status-button"
                        data-action="status"
                        data-id="${order.id}"
                    >
                        🔄 สถานะ
                    </button>

                    <button
                        class="action-button history-button"
                        data-action="history"
                        data-id="${order.id}"
                    >
                        📋 ประวัติ
                    </button>
                    
                    ${userRole === "Manager"
                    ? `
        <button
            class="action-button delete-button"
            data-action="delete"
            data-id="${order.id}"
        >
            🗑️ ลบงาน
        </button>
    `
                    : ""
                }

                </td>
            `;


            orderTableBody.appendChild(
                row
            );
        }
    );
}


/* =========================================================
   Search
========================================================= */

searchInput.addEventListener(
    "input",
    renderOrders
);


/* =========================================================
   Status Filter
========================================================= */

statusFilter.addEventListener(
    "change",
    renderOrders
);


/* =========================================================
   Refresh
========================================================= */

refreshButton.addEventListener(
    "click",
    async () => {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "กำลังโหลด...";

        await loadOrders();

        refreshButton.disabled =
            false;

        refreshButton.textContent =
            "🔄 รีเฟรช";
    }
);


/* =========================================================
   Open Edit Modal
========================================================= */

function openEditModal(order) {

    editMessage.textContent = "";

    editOrderId.value =
        order.id;

    editOrderCode.value =
        order.order_code || "";

    editCustomer.value =
        order.customer_id || "";

    fillDeviceSelect(
        order.customer_id,
        order.device_id
    );

    editMainProblem.value =
        order.main_problem || "";

    editDescription.value =
        order.description || "";

    editRepairCost.value =
        order.repair_cost ?? 0;

    editModal.style.display =
        "flex";
}


/* =========================================================
   Close Edit Modal
========================================================= */

function closeEditModal() {

    editModal.style.display =
        "none";

    editOrderForm.reset();

    editOrderId.value = "";

    editMessage.textContent = "";
}


closeEditModalButton.addEventListener(
    "click",
    closeEditModal
);


cancelEditButton.addEventListener(
    "click",
    closeEditModal
);


/* =========================================================
   Save Edit Order
========================================================= */

editOrderForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            editOrderId.value;

        const orderCode =
            editOrderCode.value.trim();

        const customerId =
            editCustomer.value;

        const deviceId =
            editDevice.value;

        const mainProblem =
            editMainProblem.value.trim();

        const description =
            editDescription.value.trim();

        const repairCost =
            Number(
                editRepairCost.value
            );


        if (!orderCode) {

            editMessage.textContent =
                "กรุณากรอก Order Code";

            return;
        }


        if (!customerId) {

            editMessage.textContent =
                "กรุณาเลือกลูกค้า";

            return;
        }


        if (!deviceId) {

            editMessage.textContent =
                "กรุณาเลือกอุปกรณ์";

            return;
        }


        if (!mainProblem) {

            editMessage.textContent =
                "กรุณากรอกสาเหตุหลัก";

            return;
        }


        if (
            Number.isNaN(repairCost) ||
            repairCost < 0
        ) {

            editMessage.textContent =
                "ค่าซ่อมไม่ถูกต้อง";

            return;
        }


        saveEditButton.disabled =
            true;

        saveEditButton.textContent =
            "กำลังบันทึก...";

        editMessage.textContent = "";


        const {
            error
        } = await supabaseClient
            .from("orders")
            .update({
                order_code:
                    orderCode,

                customer_id:
                    customerId,

                device_id:
                    deviceId,

                main_problem:
                    mainProblem,

                description:
                    description,

                repair_cost:
                    repairCost
            })
            .eq(
                "id",
                id
            );


        if (error) {

            console.error(
                "Update order error:",
                error
            );


            if (
                error.code ===
                "23505"
            ) {

                editMessage.textContent =
                    "Order Code นี้มีอยู่แล้ว";

            } else {

                editMessage.textContent =
                    "แก้ไขไม่สำเร็จ: " +
                    error.message;
            }


            saveEditButton.disabled =
                false;

            saveEditButton.textContent =
                "บันทึกการแก้ไข";

            return;
        }


        alert(
            "แก้ไข Order เรียบร้อยแล้ว"
        );


        closeEditModal();

        await loadOrders();
    }
);


/* =========================================================
   Open Status Modal
========================================================= */

function openStatusModal(order) {

    // หา Order ตัวล่าสุดจากข้อมูลในหน้า
    const latestOrder = orders.find(
        item => item.id === order.id
    );

    if (!latestOrder) {
        alert("ไม่พบข้อมูล Order ล่าสุด");
        return;
    }

    currentStatusOrder = latestOrder;

    statusOrderCode.textContent =
        latestOrder.order_code;

    currentStatus.textContent =
        getStatusText(
            latestOrder.status
        );

    newStatus.value =
        latestOrder.status;

    statusNote.value = "";

    statusMessage.textContent = "";

    statusModal.style.display = "flex";
}


/* =========================================================
   Close Status Modal
========================================================= */

function closeStatusModal() {

    statusModal.style.display =
        "none";

    currentStatusOrder =
        null;

    statusNote.value = "";

    statusMessage.textContent = "";
}


closeStatusModalButton.addEventListener(
    "click",
    closeStatusModal
);


cancelStatusButton.addEventListener(
    "click",
    closeStatusModal
);


/* =========================================================
   Save Status
========================================================= */

saveStatusButton.addEventListener(
    "click",
    async () => {

        if (!currentStatusOrder) {

            return;
        }


        const order =
            currentStatusOrder;

        const selectedStatus =
            newStatus.value;

        const note =
            statusNote.value.trim();


        if (
            selectedStatus ===
            order.status
        ) {

            statusMessage.textContent =
                "สถานะใหม่เหมือนกับสถานะปัจจุบัน";

            return;
        }


        saveStatusButton.disabled =
            true;

        saveStatusButton.textContent =
            "กำลังบันทึก...";

        statusMessage.textContent = "";


        const updateData = {

            status:
                selectedStatus
        };


        if (
            selectedStatus ===
            "closed"
        ) {

            updateData.closed_at =
                new Date().toISOString();

        } else {

            updateData.closed_at =
                null;
        }


        const {
            error
        } = await supabaseClient
            .from("orders")
            .update(
                updateData
            )
            .eq(
                "id",
                order.id
            );


        if (error) {

            console.error(
                "Update status error:",
                error
            );

            statusMessage.textContent =
                "เปลี่ยนสถานะไม่สำเร็จ: " +
                error.message;

            saveStatusButton.disabled =
                false;

            saveStatusButton.textContent =
                "บันทึกสถานะ";

            return;
        }


        /*
         * Trigger ใน Database
         * จะสร้าง order_status_history
         * ให้อัตโนมัติ
         *
         * note จะถูกบันทึกแยกไม่ได้
         * เพราะ trigger ปัจจุบันไม่ได้รับ note
         */


        alert(
            "เปลี่ยนสถานะเรียบร้อยแล้ว"
        );

        window.location.reload();
    }
);


/* =========================================================
   Open History Modal
========================================================= */

async function openHistoryModal(order) {

    historyOrderCode.textContent =
        order.order_code;

    historyTableBody.innerHTML = `
        <tr>
            <td
                colspan="4"
                class="loading"
            >
                กำลังโหลด...
            </td>
        </tr>
    `;

    historyModal.style.display =
        "flex";


    const {
        data,
        error
    } = await supabaseClient
        .from(
            "order_status_history"
        )
        .select(`
            id,
            old_status,
            new_status,
            changed_at,
            note
        `)
        .eq(
            "order_id",
            order.id
        )
        .order(
            "changed_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Load history error:",
            error
        );

        historyTableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty"
                >
                    ไม่สามารถโหลดประวัติได้
                </td>
            </tr>
        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        historyTableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty"
                >
                    ยังไม่มีประวัติสถานะ
                </td>
            </tr>
        `;

        return;
    }


    historyTableBody.innerHTML = "";


    data.forEach(
        history => {

            const row =
                document.createElement(
                    "tr"
                );


            const date =
                new Date(
                    history.changed_at
                ).toLocaleString(
                    "th-TH"
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                history.old_status
                    ?
                    getStatusText(
                        history.old_status
                    )
                    :
                    "-"
            )}
                </td>

                <td>
                    ${escapeHtml(
                getStatusText(
                    history.new_status
                )
            )}
                </td>

                <td>
                    ${escapeHtml(
                history.note ||
                "-"
            )}
                </td>

                <td>
                    ${escapeHtml(
                date
            )}
                </td>

            `;


            historyTableBody.appendChild(
                row
            );
        }
    );
}


/* =========================================================
   Close History Modal
========================================================= */

function closeHistoryModal() {

    historyModal.style.display =
        "none";

    historyTableBody.innerHTML = "";
}


closeHistoryModalButton.addEventListener(
    "click",
    closeHistoryModal
);


/* =========================================================
   Delete Order - Manager Only
========================================================= */

async function deleteOrder(order) {

    if (userRole !== "Manager") {
        alert(
            "คุณไม่มีสิทธิ์ลบงาน"
        );

        return;
    }

    const confirmed =
        confirm(
            `ต้องการลบงาน ${order.order_code} หรือไม่?\n\nการลบนี้ไม่สามารถย้อนกลับได้`
        );

    if (!confirmed) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("orders")
            .delete()
            .eq("id", order.id);

    if (error) {

        console.error(
            "ลบ Order ไม่สำเร็จ:",
            error
        );

        alert(
            "ลบงานไม่สำเร็จ: " +
            error.message
        );

        return;
    }

    alert(
        "ลบงานเรียบร้อยแล้ว"
    );

    window.location.reload();
}

/* =========================================================
   Table Actions
========================================================= */

orderTableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {

            return;
        }


        const action =
            button.dataset.action;

        const id =
            button.dataset.id;


        const order =
            orders.find(
                item =>
                    item.id === id
            );


        if (!order) {

            return;
        }


        if (
            action ===
            "edit"
        ) {

            openEditModal(
                order
            );

            return;
        }


        if (
            action ===
            "status"
        ) {

            openStatusModal(
                order
            );

            return;
        }


        if (
            action ===
            "history"
        ) {

            openHistoryModal(
                order
            );

            return;
        }
        if (
            action ===
            "delete"
        ) {

            deleteOrder(
                order
            );

            return;
        }
    }
);


/* =========================================================
   Back
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "main_menu.html";
    }
);


/* =========================================================
   Logout
========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();

        sessionStorage.clear();

        window.location.href =
            "login.html";
    }
);


/* =========================================================
   Close Modal When Clicking Outside
========================================================= */

window.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            editModal
        ) {

            closeEditModal();
        }


        if (
            event.target ===
            statusModal
        ) {

            closeStatusModal();
        }


        if (
            event.target ===
            historyModal
        ) {

            closeHistoryModal();
        }
    }
);


/* =========================================================
   Initialize
========================================================= */

async function init() {

    await loadCustomers();

    await loadDevices();

    await loadOrders();
}


init();