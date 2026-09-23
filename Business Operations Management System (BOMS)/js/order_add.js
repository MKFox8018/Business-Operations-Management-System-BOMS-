// =====================================
// ตรวจสอบ Login
// =====================================

const userRole =
    sessionStorage.getItem("userRole");

const userId =
    sessionStorage.getItem("userId");


if (!userRole || !userId) {

    window.location.href = "login.html";

}


// =====================================
// Element
// =====================================

const userRoleElement =
    document.getElementById("userRole");

const backButton =
    document.getElementById("backButton");

const logoutButton =
    document.getElementById("logoutButton");

const orderForm =
    document.getElementById("orderForm");

const customerSelect =
    document.getElementById("customerSelect");

const deviceSelect =
    document.getElementById("deviceSelect");

const saveOrderButton =
    document.getElementById("saveOrderButton");

const cancelOrderButton =
    document.getElementById("cancelOrderButton");

const orderFormMessage =
    document.getElementById("orderFormMessage");


// =====================================
// แสดง Role
// =====================================

userRoleElement.textContent =
    "สิทธิ์: " + userRole;


// =====================================
// ตรวจสอบสิทธิ์
// =====================================

if (
    userRole !== "Employee" &&
    userRole !== "Manager"
) {

    orderForm.innerHTML = `
        <p>
            บัญชีนี้ไม่มีสิทธิ์สร้าง Order
        </p>
    `;

}


// =====================================
// ตัวแปร
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

        orderFormMessage.textContent =
            "โหลดข้อมูลลูกค้าไม่สำเร็จ";

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


        option.value =
            customer.id;


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

        orderFormMessage.textContent =
            "โหลดข้อมูลอุปกรณ์ไม่สำเร็จ";

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


        option.value =
            device.id;


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


        option.textContent =
            text;


        deviceSelect.appendChild(option);

    });

}


// =====================================
// เปลี่ยน Customer
// =====================================

customerSelect.addEventListener(
    "change",
    updateDeviceOptions
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


        // =====================================
        // ตรวจสอบข้อมูล
        // =====================================

        if (!customerId || !deviceId) {

            orderFormMessage.textContent =
                "กรุณาเลือกลูกค้าและอุปกรณ์";

            return;

        }


        if (!orderCode) {

            orderFormMessage.textContent =
                "กรุณากรอกรหัสงาน";

            return;

        }


        if (!mainProblem) {

            orderFormMessage.textContent =
                "กรุณากรอกปัญหาหลัก";

            return;

        }


        if (repairCost < 0) {

            orderFormMessage.textContent =
                "ค่าซ่อมต้องไม่ติดลบ";

            return;

        }


        // =====================================
        // ปิดปุ่ม
        // =====================================

        saveOrderButton.disabled =
            true;

        saveOrderButton.textContent =
            "กำลังบันทึก...";

        orderFormMessage.textContent =
            "";


        // =====================================
        // Insert Order
        // =====================================

        const { data, error } =
            await supabaseClient
                .from("orders")
                .insert({

                    customer_id:
                        customerId,

                    device_id:
                        deviceId,

                    order_code:
                        orderCode,

                    main_problem:
                        mainProblem,

                    description:
                        description,

                    repair_cost:
                        repairCost,

                    status:
                        "waiting"

                })
                .select()
                .single();


        // =====================================
        // ตรวจสอบ Error
        // =====================================

        if (error) {

            console.error(
                "สร้าง Order ไม่สำเร็จ:",
                error
            );


            if (
                error.code === "23505"
            ) {

                orderFormMessage.textContent =
                    "รหัสงานนี้มีอยู่แล้ว กรุณาใช้รหัสอื่น";

            } else {

                orderFormMessage.textContent =
                    "บันทึกไม่สำเร็จ: " +
                    error.message;

            }


            saveOrderButton.disabled =
                false;

            saveOrderButton.textContent =
                "บันทึก Order";

            return;

        }


        // =====================================
        // สำเร็จ
        // =====================================

        console.log(
            "สร้าง Order สำเร็จ:",
            data
        );


        alert(
            "รับงานซ่อมเรียบร้อยแล้ว"
        );


        // กลับหน้ารายการ Order

        window.location.href =
            "order.html";

    }
);


// =====================================
// ยกเลิก
// =====================================

cancelOrderButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "main_menu.html";

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

async function init() {

    if (
        userRole !== "Employee" &&
        userRole !== "Manager"
    ) {

        return;

    }


    await loadCustomers();

    await loadDevices();

    updateDeviceOptions();

}


init();