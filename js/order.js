const orderTableBody =
    document.getElementById("orderTableBody");

const userRoleElement =
    document.getElementById("userRole");

const backButton =
    document.getElementById("backButton");

const logoutButton =
    document.getElementById("logoutButton");

const addOrderButton =
    document.getElementById("addOrderButton");

const orderModal =
    document.getElementById("orderModal");

const orderForm =
    document.getElementById("orderForm");

const cancelOrderButton =
    document.getElementById("cancelOrderButton");

const saveOrderButton =
    document.getElementById("saveOrderButton");

const orderFormMessage =
    document.getElementById("orderFormMessage");

const customerSelect =
    document.getElementById("customerSelect");

const deviceSelect =
    document.getElementById("deviceSelect");

const orderDetailModal =
    document.getElementById("orderDetailModal");

const orderDetailContent =
    document.getElementById("orderDetailContent");

const closeOrderDetailButton =
    document.getElementById("closeOrderDetailButton");


// =====================================
// ตรวจสอบสิทธิ์การเข้า Order
// =====================================

const userRole =
    sessionStorage.getItem("userRole");

const userId =
    sessionStorage.getItem("userId");


// ยังไม่ได้ Login
if (!userRole || !userId) {

    window.location.href =
        "login.html";

}


// Customer ห้ามเข้า Order
else if (userRole === "Customer") {

    window.location.href =
        "customer_portal.html";

}

// =====================================
// แสดง Role
// =====================================

userRoleElement.textContent =
    "สิทธิ์: " + userRole;


// =====================================
// ข้อมูลสำหรับ Form
// =====================================

let customers = [];
let devices = [];


// =====================================
// โหลด Customers
// =====================================

async function loadCustomers() {

    const { data, error } =
        await supabaseClient
            .from("customers")
            .select("id, name, phone")
            .order("name");

    if (error) {

        console.error(
            "โหลด Customers ไม่สำเร็จ:",
            error
        );

        return;
    }

    customers = data || [];

    customerSelect.innerHTML = `
        <option value="">
            -- เลือกลูกค้า --
        </option>
    `;

    customers.forEach(customer => {

        const option =
            document.createElement("option");

        option.value = customer.id;

        option.textContent =
            `${customer.name} (${customer.phone})`;

        customerSelect.appendChild(option);

    });

}


// =====================================
// โหลด Devices
// =====================================

async function loadDevices() {

    const { data, error } =
        await supabaseClient
            .from("devices")
            .select(`
                id,
                customer_id,
                device_type,
                brand,
                model,
                serial_number
            `)
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "โหลด Devices ไม่สำเร็จ:",
            error
        );

        return;
    }

    devices = data || [];

}


// =====================================
// แสดง Device ตาม Customer
// =====================================

function updateDeviceOptions() {

    const customerId =
        customerSelect.value;

    deviceSelect.innerHTML = `
        <option value="">
            -- เลือกอุปกรณ์ --
        </option>
    `;

    if (!customerId) {
        return;
    }

    const customerDevices =
        devices.filter(
            device =>
                device.customer_id === customerId
        );

    customerDevices.forEach(device => {

        const option =
            document.createElement("option");

        option.value = device.id;

        const deviceName = [
            device.device_type,
            device.brand,
            device.model
        ]
            .filter(Boolean)
            .join(" ");

        let text =
            deviceName || "อุปกรณ์";

        if (device.serial_number) {

            text +=
                ` | S/N: ${device.serial_number}`;

        }

        option.textContent = text;

        deviceSelect.appendChild(option);

    });

}


customerSelect.addEventListener(
    "change",
    updateDeviceOptions
);


// =====================================
// Status ภาษาไทย
// =====================================

function getStatusText(status) {

    const statusMap = {

        waiting: "กำลังรอคิว",

        repairing: "กำลังซ่อม",

        completed: "ซ่อมเสร็จแล้ว",

        closed: "ปิดงาน"

    };

    return statusMap[status] ?? status;

}


// =====================================
// โหลด Orders
// =====================================

async function loadOrders() {

    orderTableBody.innerHTML = `
        <tr>
            <td colspan="7">
                กำลังโหลดข้อมูล...
            </td>
        </tr>
    `;


    const { data, error } =
        await supabaseClient
            .from("orders")
            .select(`
                id,
                order_code,
                main_problem,
                repair_cost,
                status,
                created_at,

                customers (
                    name,
                    phone
                ),

                devices (
                    device_type,
                    brand,
                    model,
                    serial_number
                )
            `)
            .is("deleted_at", null)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "โหลด Orders ไม่สำเร็จ:",
            error
        );

        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    โหลดข้อมูลไม่สำเร็จ
                </td>
            </tr>
        `;

        return;
    }


    if (!data || data.length === 0) {

        orderTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    ยังไม่มีรายการซ่อม
                </td>
            </tr>
        `;

        return;
    }


    orderTableBody.innerHTML = "";


    data.forEach(order => {

        const customerName =
            order.customers?.name ?? "-";

        const device =
            order.devices;


        const deviceName = device
            ? `${device.brand ?? ""} ${device.model ?? ""}`.trim()
            : "-";


        const repairCost =
            Number(order.repair_cost || 0)
                .toLocaleString("th-TH", {
                    minimumFractionDigits: 2
                });


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${order.order_code}</td>

            <td>${customerName}</td>

            <td>
                ${device?.device_type ?? "-"}
                <br>
                ${deviceName}
            </td>

            <td>${order.main_problem ?? "-"}</td>

            <td>${repairCost} บาท</td>

            <td>
                <span class="status status-${order.status}">
                    ${getStatusText(order.status)}
                </span>
            </td>

            <td>
                <button
                    class="view-button"
                    data-id="${order.id}">
                    ดูรายละเอียด
                </button>
            </td>
        `;


        orderTableBody.appendChild(row);

    });

}


// =====================================
// ดูรายละเอียด Order
// =====================================

async function showOrderDetail(orderId) {

    orderDetailModal.style.display = "flex";

    orderDetailContent.innerHTML =
        "กำลังโหลดข้อมูล...";


    // =====================================
    // โหลด Order
    // =====================================

    const { data: order, error: orderError } =
        await supabaseClient
            .from("orders")
            .select(`
                id,
                order_code,
                main_problem,
                description,
                repair_cost,
                status,
                created_at,
                closed_at,

                customers (
                    name,
                    phone
                ),

                devices (
                    device_type,
                    brand,
                    model,
                    serial_number,
                    shop_tag,
                    note
                )
            `)
            .eq("id", orderId)
            .single();


    if (orderError) {

        console.error(
            "โหลดรายละเอียด Order ไม่สำเร็จ:",
            orderError
        );

        orderDetailContent.innerHTML =
            "โหลดรายละเอียดไม่สำเร็จ";

        return;
    }


    // =====================================
    // โหลด Status History
    // =====================================

    const {
        data: history,
        error: historyError
    } =
        await supabaseClient
            .from("order_status_history")
            .select(`
                old_status,
                new_status,
                changed_at,
                note
            `)
            .eq("order_id", orderId)
            .order("changed_at", {
                ascending: true
            });


    if (historyError) {

        console.error(
            "โหลดประวัติ Status ไม่สำเร็จ:",
            historyError
        );

    }


    const customer =
        order.customers;

    const device =
        order.devices;


    const repairCost =
        Number(order.repair_cost || 0)
            .toLocaleString("th-TH", {
                minimumFractionDigits: 2
            });


    // =====================================
    // สร้าง History
    // =====================================

    let historyHTML = "";


    if (history && history.length > 0) {

        historyHTML =
            history.map(item => {

                const oldStatus =
                    item.old_status
                        ? getStatusText(item.old_status)
                        : "เริ่มต้น";


                const newStatus =
                    getStatusText(item.new_status);


                const date =
                    new Date(item.changed_at)
                        .toLocaleString("th-TH");


                return `
                    <div>

                        <strong>
                            ${oldStatus}
                        </strong>

                        →

                        <strong>
                            ${newStatus}
                        </strong>

                        <br>

                        <small>
                            ${date}
                        </small>

                        ${
                            item.note
                                ? `
                                    <br>
                                    หมายเหตุ:
                                    ${item.note}
                                `
                                : ""
                        }

                    </div>

                    <hr>
                `;

            }).join("");

    } else {

        historyHTML =
            "ยังไม่มีประวัติสถานะ";

    }


    // =====================================
    // สร้าง Status Control
    // =====================================

    let statusControlHTML = "";


    if (
        userRole === "Employee" ||
        userRole === "Manager"
    ) {

        statusControlHTML = `

            <hr>

            <p>
                <strong>
                    เปลี่ยนสถานะงาน
                </strong>
            </p>

            <select id="detailStatusSelect">

                <option value="waiting"
                    ${order.status === "waiting" ? "selected" : ""}>
                    กำลังรอคิว
                </option>

                <option value="repairing"
                    ${order.status === "repairing" ? "selected" : ""}>
                    กำลังซ่อม
                </option>

                <option value="completed"
                    ${order.status === "completed" ? "selected" : ""}>
                    ซ่อมเสร็จแล้ว
                </option>

                <option value="closed"
                    ${order.status === "closed" ? "selected" : ""}>
                    ปิดงาน
                </option>

            </select>

            <button
                type="button"
                id="updateStatusButton">

                บันทึกสถานะ

            </button>

            <p id="statusUpdateMessage"></p>

        `;

    }


    // =====================================
    // แสดงรายละเอียด
    // =====================================

    orderDetailContent.innerHTML = `

        <p>
            <strong>รหัสงาน:</strong>
            ${order.order_code}
        </p>

        <p>
            <strong>ลูกค้า:</strong>
            ${customer?.name ?? "-"}
        </p>

        <p>
            <strong>เบอร์โทร:</strong>
            ${customer?.phone ?? "-"}
        </p>

        <p>
            <strong>อุปกรณ์:</strong>
            ${device?.device_type ?? "-"}
        </p>

        <p>
            <strong>ยี่ห้อ:</strong>
            ${device?.brand ?? "-"}
        </p>

        <p>
            <strong>รุ่น:</strong>
            ${device?.model ?? "-"}
        </p>

        <p>
            <strong>S/N:</strong>
            ${device?.serial_number ?? "-"}
        </p>

        <p>
            <strong>Shop Tag:</strong>
            ${device?.shop_tag ?? "-"}
        </p>

        <p>
            <strong>หมายเหตุอุปกรณ์:</strong>
            ${device?.note ?? "-"}
        </p>

        <p>
            <strong>ปัญหาหลัก:</strong>
            ${order.main_problem ?? "-"}
        </p>

        <p>
            <strong>รายละเอียด:</strong>
            ${order.description ?? "-"}
        </p>

        <p>
            <strong>ค่าซ่อม:</strong>
            ${repairCost} บาท
        </p>

        <p>
            <strong>สถานะ:</strong>
            ${getStatusText(order.status)}
        </p>

        <p>
            <strong>วันที่รับงาน:</strong>
            ${new Date(order.created_at)
                .toLocaleString("th-TH")}
        </p>

        ${
            order.closed_at
                ? `
                    <p>
                        <strong>
                            วันที่ปิดงาน:
                        </strong>

                        ${new Date(order.closed_at)
                            .toLocaleString("th-TH")}
                    </p>
                `
                : ""
        }

        ${statusControlHTML}

        <hr>

        <p>
            <strong>
                ประวัติสถานะ
            </strong>
        </p>

        ${historyHTML}

    `;


    // =====================================
    // ปุ่มเปลี่ยน Status
    // =====================================

    if (
        userRole === "Employee" ||
        userRole === "Manager"
    ) {

        const statusSelect =
            document.getElementById(
                "detailStatusSelect"
            );

        const updateStatusButton =
            document.getElementById(
                "updateStatusButton"
            );

        const statusUpdateMessage =
            document.getElementById(
                "statusUpdateMessage"
            );


        updateStatusButton.addEventListener(
            "click",
            async () => {

                const newStatus =
                    statusSelect.value;


                updateStatusButton.disabled =
                    true;

                updateStatusButton.textContent =
                    "กำลังบันทึก...";

                statusUpdateMessage.textContent =
                    "";


                // =====================================
                // closed_at
                // =====================================

                let closedAt = null;


                if (newStatus === "closed") {

                    closedAt =
                        new Date().toISOString();

                }


                // =====================================
                // Update Order
                // =====================================

                const { error } =
                    await supabaseClient
                        .from("orders")
                        .update({
                            status: newStatus,
                            closed_at: closedAt
                        })
                        .eq("id", orderId);


                if (error) {

                    console.error(
                        "เปลี่ยน Status ไม่สำเร็จ:",
                        error
                    );

                    statusUpdateMessage.textContent =
                        "เปลี่ยนสถานะไม่สำเร็จ: " +
                        error.message;

                    updateStatusButton.disabled =
                        false;

                    updateStatusButton.textContent =
                        "บันทึกสถานะ";

                    return;

                }


                statusUpdateMessage.textContent =
                    "เปลี่ยนสถานะสำเร็จ";


                // =====================================
                // Reload ตาราง
                // =====================================

                await loadOrders();


                // =====================================
                // Reload Detail
                // =====================================

                await showOrderDetail(orderId);

            }
        );

    }

}


// =====================================
// ปุ่ม ดูรายละเอียด
// =====================================

orderTableBody.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(".view-button");

        if (!button) {
            return;
        }

        const orderId =
            button.dataset.id;

        showOrderDetail(orderId);

    }
);


// =====================================
// ปิด Detail Modal
// =====================================

closeOrderDetailButton.addEventListener(
    "click",
    () => {

        orderDetailModal.style.display =
            "none";

    }
);


// =====================================
// เปิด Form รับงาน
// =====================================

addOrderButton.addEventListener(
    "click",
    async () => {

        orderForm.reset();

        orderFormMessage.textContent =
            "";

        orderModal.style.display =
            "flex";

        await loadCustomers();

        await loadDevices();

        updateDeviceOptions();

    }
);


// =====================================
// ปิด Form
// =====================================

cancelOrderButton.addEventListener(
    "click",
    () => {

        orderModal.style.display =
            "none";

    }
);


// =====================================
// บันทึก Order
// =====================================

orderForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const customerId =
            customerSelect.value;

        const deviceId =
            deviceSelect.value;

        const orderCode =
            document
                .getElementById("orderCode")
                .value
                .trim();

        const mainProblem =
            document
                .getElementById("mainProblem")
                .value
                .trim();

        const description =
            document
                .getElementById("description")
                .value
                .trim();

        const repairCost =
            Number(
                document
                    .getElementById("repairCost")
                    .value || 0
            );


        if (!customerId || !deviceId) {

            orderFormMessage.textContent =
                "กรุณาเลือกลูกค้าและอุปกรณ์";

            return;
        }


        saveOrderButton.disabled =
            true;

        saveOrderButton.textContent =
            "กำลังบันทึก...";

        orderFormMessage.textContent =
            "";


        const { data, error } =
            await supabaseClient
                .from("orders")
                .insert({
                    customer_id: customerId,
                    device_id: deviceId,
                    order_code: orderCode,
                    main_problem: mainProblem,
                    description: description,
                    repair_cost: repairCost,
                    status: "waiting"
                })
                .select()
                .single();


        if (error) {

            console.error(
                "สร้าง Order ไม่สำเร็จ:",
                error
            );

            orderFormMessage.textContent =
                "บันทึกไม่สำเร็จ: " +
                error.message;

            saveOrderButton.disabled =
                false;

            saveOrderButton.textContent =
                "บันทึกงาน";

            return;
        }


        console.log(
            "สร้าง Order สำเร็จ:",
            data
        );


        orderModal.style.display =
            "none";


        await loadOrders();


        alert(
            "รับงานซ่อมเรียบร้อยแล้ว"
        );


        saveOrderButton.disabled =
            false;

        saveOrderButton.textContent =
            "บันทึกงาน";

    }
);


// =====================================
// กลับหน้าหลัก
// =====================================

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "main_menu.html";

    }
);


// =====================================
// Logout
// =====================================

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth.signOut();

        sessionStorage.clear();

        window.location.href =
            "login.html";

    }
);


// =====================================
// เริ่มต้น
// =====================================

loadOrders();