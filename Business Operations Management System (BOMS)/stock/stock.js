// =====================================
// Elements
// =====================================

const deviceTableBody =
    document.getElementById("deviceTableBody");

const userRoleElement =
    document.getElementById("userRole");

const backButton =
    document.getElementById("backButton");

const logoutButton =
    document.getElementById("logoutButton");

const addDeviceButton =
    document.getElementById("addDeviceButton");

const deviceModal =
    document.getElementById("deviceModal");

const deviceModalTitle =
    document.getElementById("deviceModalTitle");

const deviceForm =
    document.getElementById("deviceForm");

const cancelDeviceButton =
    document.getElementById("cancelDeviceButton");

const saveDeviceButton =
    document.getElementById("saveDeviceButton");

const deviceFormMessage =
    document.getElementById("deviceFormMessage");

const deviceCustomer =
    document.getElementById("deviceCustomer");

const deviceType =
    document.getElementById("deviceType");

const deviceBrand =
    document.getElementById("deviceBrand");

const deviceModel =
    document.getElementById("deviceModel");

const deviceSerial =
    document.getElementById("deviceSerial");

const deviceShopTag =
    document.getElementById("deviceShopTag");

const deviceNote =
    document.getElementById("deviceNote");


// =====================================
// ตรวจสอบ Login
// =====================================

const userRole =
    sessionStorage.getItem("userRole");

const userId =
    sessionStorage.getItem("userId");


if (!userRole || !userId) {

    window.location.href =
        "login.html";

}


// =====================================
// แสดง Role
// =====================================

userRoleElement.textContent =
    "สิทธิ์: " + userRole;


// =====================================
// ตัวแปร
// =====================================

let customers = [];

let devices = [];

let editingDeviceId = null;


// =====================================
// ตรวจสอบสิทธิ์
// =====================================

const isStaff =
    userRole === "Employee" ||
    userRole === "Manager";


if (!isStaff) {

    addDeviceButton.style.display =
        "none";

}


// =====================================
// โหลด Customers
// =====================================

async function loadCustomers() {

    const { data, error } =
        await supabaseClient
            .from("customers")
            .select(`
                id,
                name,
                phone
            `)
            .order("name");


    if (error) {

        console.error(
            "โหลด Customers ไม่สำเร็จ:",
            error
        );

        return;

    }


    customers =
        data || [];


    deviceCustomer.innerHTML = `
        <option value="">
            -- เลือกลูกค้า --
        </option>
    `;


    customers.forEach(customer => {

        const option =
            document.createElement("option");


        option.value =
            customer.id;


        option.textContent =
            `${customer.name} (${customer.phone})`;


        deviceCustomer.appendChild(option);

    });

}


// =====================================
// โหลด Devices
// =====================================

async function loadDevices() {

    deviceTableBody.innerHTML = `
        <tr>

            <td colspan="7">
                กำลังโหลดข้อมูล...
            </td>

        </tr>
    `;


    const { data, error } =
        await supabaseClient
            .from("devices")
            .select(`
                id,
                customer_id,
                device_type,
                brand,
                model,
                serial_number,
                shop_tag,
                note,
                created_at,

                customers (
                    name,
                    phone
                )
            `)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "โหลด Devices ไม่สำเร็จ:",
            error
        );


        deviceTableBody.innerHTML = `
            <tr>

                <td colspan="7">
                    โหลดข้อมูลไม่สำเร็จ
                </td>

            </tr>
        `;

        return;

    }


    devices =
        data || [];


    renderDevices();

}


// =====================================
// แสดง Devices
// =====================================

function renderDevices() {

    if (!devices.length) {

        deviceTableBody.innerHTML = `
            <tr>

                <td colspan="7">
                    ยังไม่มีข้อมูลอุปกรณ์
                </td>

            </tr>
        `;

        return;

    }


    deviceTableBody.innerHTML = "";


    devices.forEach(device => {

        const row =
            document.createElement("tr");


        const customerName =
            device.customers?.name ?? "-";


        row.innerHTML = `

            <td>
                ${customerName}
            </td>


            <td>
                ${device.device_type ?? "-"}
            </td>


            <td>
                ${device.brand ?? "-"}
            </td>


            <td>
                ${device.model ?? "-"}
            </td>


            <td>
                ${device.serial_number ?? "-"}
            </td>


            <td>
                ${device.shop_tag ?? "-"}
            </td>


            <td>

                ${
                    isStaff
                        ? `
                            <button
                                class="edit-device-button"
                                data-id="${device.id}">

                                แก้ไข

                            </button>
                        `
                        : "-"
                }

            </td>

        `;


        deviceTableBody.appendChild(row);

    });

}


// =====================================
// เปิด Modal เพิ่ม Device
// =====================================

addDeviceButton.addEventListener(
    "click",
    async () => {

        editingDeviceId = null;


        deviceModalTitle.textContent =
            "เพิ่มอุปกรณ์";


        deviceForm.reset();


        deviceFormMessage.textContent =
            "";


        await loadCustomers();


        deviceModal.style.display =
            "flex";

    }
);


// =====================================
// เปิด Modal แก้ไข Device
// =====================================

async function openEditDevice(deviceId) {

    const device =
        devices.find(
            item =>
                item.id === deviceId
        );


    if (!device) {

        alert(
            "ไม่พบข้อมูลอุปกรณ์"
        );

        return;

    }


    editingDeviceId =
        deviceId;


    deviceModalTitle.textContent =
        "แก้ไขอุปกรณ์";


    deviceFormMessage.textContent =
        "";


    await loadCustomers();


    deviceCustomer.value =
        device.customer_id ?? "";


    deviceType.value =
        device.device_type ?? "";


    deviceBrand.value =
        device.brand ?? "";


    deviceModel.value =
        device.model ?? "";


    deviceSerial.value =
        device.serial_number ?? "";


    deviceShopTag.value =
        device.shop_tag ?? "";


    deviceNote.value =
        device.note ?? "";


    deviceModal.style.display =
        "flex";

}


// =====================================
// Click แก้ไข
// =====================================

deviceTableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".edit-device-button"
            );


        if (!button) {
            return;
        }


        const deviceId =
            button.dataset.id;


        openEditDevice(deviceId);

    }
);


// =====================================
// ปิด Modal
// =====================================

cancelDeviceButton.addEventListener(
    "click",
    () => {

        deviceModal.style.display =
            "none";

        editingDeviceId = null;

    }
);


// =====================================
// บันทึก Device
// =====================================

deviceForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isStaff) {

            deviceFormMessage.textContent =
                "คุณไม่มีสิทธิ์จัดการอุปกรณ์";

            return;

        }


        const customerId =
            deviceCustomer.value;


        const type =
            deviceType.value.trim();


        const brand =
            deviceBrand.value.trim();


        const model =
            deviceModel.value.trim();


        const serialNumber =
            deviceSerial.value.trim();


        const shopTag =
            deviceShopTag.value.trim();


        const note =
            deviceNote.value.trim();


        if (!customerId || !type) {

            deviceFormMessage.textContent =
                "กรุณาเลือกลูกค้าและประเภทอุปกรณ์";

            return;

        }


        saveDeviceButton.disabled =
            true;


        saveDeviceButton.textContent =
            "กำลังบันทึก...";


        deviceFormMessage.textContent =
            "";


        const deviceData = {

            customer_id: customerId,

            device_type: type,

            brand:
                brand || null,

            model:
                model || null,

            serial_number:
                serialNumber || null,

            shop_tag:
                shopTag || null,

            note:
                note || null

        };


        let result;


        // =====================================
        // UPDATE
        // =====================================

        if (editingDeviceId) {

            result =
                await supabaseClient
                    .from("devices")
                    .update(deviceData)
                    .eq(
                        "id",
                        editingDeviceId
                    );

        }


        // =====================================
        // INSERT
        // =====================================

        else {

            result =
                await supabaseClient
                    .from("devices")
                    .insert(deviceData);

        }


        if (result.error) {

            console.error(
                "บันทึก Device ไม่สำเร็จ:",
                result.error
            );


            deviceFormMessage.textContent =
                "บันทึกไม่สำเร็จ: " +
                result.error.message;


            saveDeviceButton.disabled =
                false;


            saveDeviceButton.textContent =
                "บันทึกอุปกรณ์";


            return;

        }


        // =====================================
        // สำเร็จ
        // =====================================

        deviceModal.style.display =
            "none";


        editingDeviceId =
            null;


        await loadDevices();


        alert(
            "บันทึกข้อมูลอุปกรณ์สำเร็จ"
        );


        saveDeviceButton.disabled =
            false;


        saveDeviceButton.textContent =
            "บันทึกอุปกรณ์";

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

loadCustomers();

loadDevices();