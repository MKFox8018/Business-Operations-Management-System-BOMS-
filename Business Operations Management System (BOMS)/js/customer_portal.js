// =====================================================
// BOMS - Customer Portal
// =====================================================

// =====================================================
// DOM Elements
// =====================================================

const customerNameText =
    document.getElementById("customerNameText");

const welcomeText =
    document.getElementById("welcomeText");

const orderList =
    document.getElementById("orderList");

const logoutButton =
    document.getElementById("logoutButton");

const detailModal =
    document.getElementById("detailModal");

const detailContent =
    document.getElementById("detailContent");

const closeDetailButton =
    document.getElementById("closeDetailButton");


// =====================================================
// Session
// =====================================================

const userRole =
    sessionStorage.getItem("userRole");

const userId =
    sessionStorage.getItem("userId");


// =====================================================
// ตรวจสอบสิทธิ์
// =====================================================

if (userRole !== "Customer" || !userId) {

    window.location.href = "main_menu.html";

}


// =====================================================
// Helper: Escape HTML
// ป้องกันข้อมูลจาก Database ถูกตีความเป็น HTML
// =====================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// Helper: Status ภาษาไทย
// =====================================================

function getStatusText(status) {

    const statusMap = {

        waiting:
            "กำลังรอคิว",

        repairing:
            "กำลังซ่อม",

        completed:
            "ซ่อมเสร็จแล้วพร้อมส่ง",

        closed:
            "ปิดงาน"

    };

    return statusMap[status] || status || "-";

}


// =====================================================
// Helper: Format เงิน
// =====================================================

function formatMoney(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

}


// =====================================================
// Helper: Format วันที่
// =====================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("th-TH");

}


// =====================================================
// Helper: ตรวจว่าเป็น URL ภายนอกหรือไม่
// =====================================================

function isExternalURL(value) {

    if (!value) {
        return false;
    }

    return /^https?:\/\//i.test(String(value));

}


// =====================================================
// Storage Blob URLs
//
// เก็บ Blob URL ที่สร้างไว้เพื่อ revoke ตอนปิด Modal
// =====================================================

let activeBlobUrls = [];


// =====================================================
// ล้าง Blob URLs
// =====================================================

function clearBlobUrls() {

    activeBlobUrls.forEach(url => {

        try {

            URL.revokeObjectURL(url);

        } catch (error) {

            console.warn(
                "ไม่สามารถ revoke Blob URL:",
                error
            );

        }

    });

    activeBlobUrls = [];

}


// =====================================================
// โหลดรูปจาก Supabase Storage
//
// ใช้ download() แทน createSignedUrl()
// เพราะ Bucket เป็น Private และ download()
// ผ่านการตรวจสอบสิทธิ์ของ Customer ได้สำเร็จ
// =====================================================

async function loadStorageImage(imagePath) {

    if (!imagePath) {
        return null;
    }


    // -------------------------------------------------
    // ถ้าเป็น URL ภายนอก
    // -------------------------------------------------

    if (isExternalURL(imagePath)) {

        return String(imagePath);

    }


    // -------------------------------------------------
    // ตรวจสอบ Path
    // -------------------------------------------------

    const path =
        String(imagePath).trim();

    if (!path) {
        return null;
    }


    // -------------------------------------------------
    // Download จาก Supabase Storage
    // -------------------------------------------------

    const {
        data,
        error
    } = await supabaseClient.storage
        .from("device-images")
        .download(path);


    if (error) {

        console.error(
            "โหลดรูปจาก Storage ไม่สำเร็จ:",
            path,
            error
        );

        return null;

    }


    if (!data) {

        console.error(
            "Storage ไม่ส่งข้อมูลรูปกลับมา:",
            path
        );

        return null;

    }


    // -------------------------------------------------
    // สร้าง Blob URL
    // -------------------------------------------------

    const blobUrl =
        URL.createObjectURL(data);

    activeBlobUrls.push(blobUrl);

    return blobUrl;

}


// =====================================================
// สร้าง HTML รูปภาพ
// =====================================================

async function buildImageHTML(images) {

    if (!Array.isArray(images) ||
        images.length === 0) {

        return `
            <p>
                ไม่มีรูปภาพ
            </p>
        `;

    }


    const imageElements = [];


    for (const img of images) {

        if (!img || !img.image_url) {
            continue;
        }


        const imageUrl =
            await loadStorageImage(
                img.image_url
            );


        if (!imageUrl) {

            imageElements.push(`
                <div class="image-error">
                    ไม่สามารถโหลดรูปภาพได้
                </div>
            `);

            continue;

        }


        imageElements.push(`

            <div class="device-image-item">

                <img
                    src="${escapeHTML(imageUrl)}"
                    alt="รูปอุปกรณ์"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >

            </div>

        `);

    }


    if (imageElements.length === 0) {

        return `
            <p>
                ไม่สามารถโหลดรูปภาพได้
            </p>
        `;

    }


    return imageElements.join("");

}


// =====================================================
// โหลดข้อมูล Customer
// =====================================================

async function loadCustomer() {

    try {

        const {
            data: authData,
            error: authError
        } = await supabaseClient.auth.getUser();


        if (authError) {

            console.error(
                "ตรวจสอบผู้ใช้ไม่สำเร็จ:",
                authError
            );

            window.location.href =
                "login.html";

            return;

        }


        const user =
            authData?.user;


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        const {
            data: customer,
            error: customerError
        } = await supabaseClient

            .from("customers")

            .select(`
                id,
                name
            `)

            .eq("auth_user_id", user.id)

            .maybeSingle();


        if (customerError) {

            console.error(
                "โหลดข้อมูล Customer ไม่สำเร็จ:",
                customerError
            );

            customerNameText.textContent =
                "ไม่สามารถโหลดข้อมูลได้";

            welcomeText.textContent =
                "เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า";

            return;

        }


        if (!customer) {

            customerNameText.textContent =
                "ไม่พบข้อมูลลูกค้า";

            welcomeText.textContent =
                "ไม่พบข้อมูล Customer ที่เชื่อมกับบัญชีนี้";

            return;

        }


        customerNameText.textContent =
            customer.name || "-";


        welcomeText.textContent =
            `สวัสดี ${customer.name || ""}`;

    }

    catch (error) {

        console.error(
            "loadCustomer error:",
            error
        );

        customerNameText.textContent =
            "เกิดข้อผิดพลาด";

        welcomeText.textContent =
            "ไม่สามารถโหลดข้อมูลลูกค้าได้";

    }

}


// =====================================================
// โหลด Orders ของ Customer
// =====================================================

async function loadOrders() {

    orderList.innerHTML = `

        <p>
            กำลังโหลดข้อมูล...
        </p>

    `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("orders")

            .select(`

                id,
                order_code,
                main_problem,
                repair_cost,
                status,
                created_at,
                closed_at,

                devices (
                    id,
                    device_type,
                    brand,
                    model,
                    serial_number
                )

            `)

            .is("deleted_at", null)

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "โหลด Orders ไม่สำเร็จ:",
                error
            );

            orderList.innerHTML = `

                <p>
                    ไม่สามารถโหลดข้อมูลงานซ่อมได้
                </p>

            `;

            return;

        }


        const orders =
            Array.isArray(data)
                ? data
                : [];


        if (orders.length === 0) {

            orderList.innerHTML = `

                <p>
                    ยังไม่มีงานซ่อม
                </p>

            `;

            return;

        }


        orderList.innerHTML = "";


        orders.forEach(order => {

            const card =
                document.createElement("div");


            card.className =
                "order-card";


            const device =
                order.devices || {};


            const deviceName = [

                device.device_type,

                device.brand,

                device.model

            ]
                .filter(Boolean)
                .join(" ");


            card.innerHTML = `

                <h3>
                    ${escapeHTML(order.order_code)}
                </h3>


                <p>
                    ${escapeHTML(
                deviceName || "อุปกรณ์"
            )}
                </p>


                <p>
                    ${escapeHTML(
                order.main_problem || "-"
            )}
                </p>


                <p>

                    <strong>
                        ${formatMoney(order.repair_cost)}
                        บาท
                    </strong>

                </p>


                <span
                    class="status ${escapeHTML(order.status || "")}"
                >
                    ${escapeHTML(
                getStatusText(order.status)
            )}
                </span>


                <button
                    type="button"
                    class="detail-button"
                    data-order-id="${escapeHTML(order.id)}"
                >
                    ดูรายละเอียด
                </button>

            `;


            const detailButton =
                card.querySelector(
                    ".detail-button"
                );


            if (detailButton) {

                detailButton.addEventListener(
                    "click",
                    () => {

                        showDetail(
                            order.id
                        );

                    }
                );

            }


            orderList.appendChild(card);

        });

    }

    catch (error) {

        console.error(
            "loadOrders error:",
            error
        );

        orderList.innerHTML = `

            <p>
                ไม่สามารถโหลดข้อมูลงานซ่อมได้
            </p>

        `;

    }

}


// =====================================================
// แสดงรายละเอียด Order
// =====================================================

window.showDetail = async function (orderId) {

    if (!orderId) {
        return;
    }


    // -------------------------------------------------
    // เปิด Modal
    // -------------------------------------------------

    detailModal.style.display =
        "flex";


    detailContent.innerHTML = `

        <p>
            กำลังโหลดรายละเอียด...
        </p>

    `;


    // -------------------------------------------------
    // ล้าง Blob URL เก่า
    // -------------------------------------------------

    clearBlobUrls();


    try {

        // =================================================
        // โหลด Order
        // =================================================

        const {
            data: order,
            error: orderError
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
                created_at,
                closed_at,

                devices (
                    id,
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

            detailContent.innerHTML = `

                <p>
                    ไม่สามารถโหลดรายละเอียดงานซ่อมได้
                </p>

            `;

            return;

        }


        if (!order) {

            detailContent.innerHTML = `

                <p>
                    ไม่พบข้อมูลงานซ่อม
                </p>

            `;

            return;

        }


        // =================================================
        // โหลด Accessories
        // =================================================

        const {
            data: accessories,
            error: accessoriesError
        } = await supabaseClient
            .from("device_accessories")
            .select(`
        id,
        device_id,
        order_id,
        accessory_name,
        created_at
    `)
            .eq(
                "order_id",
                orderId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (accessoriesError) {

            console.error(
                "โหลด Accessories ไม่สำเร็จ:",
                accessoriesError
            );

        }


        // =================================================
        // โหลด Images
        // =================================================

        const {
            data: images,
            error: imagesError
        } = await supabaseClient

            .from("device_images")

            .select(`

                id,
                device_id,
                image_url,
                created_at

            `)

            .eq("order_id", orderId)

            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (imagesError) {

            console.error(
                "โหลด Device Images ไม่สำเร็จ:",
                imagesError
            );

        }


        // =================================================
        // โหลด Status History
        // =================================================

        const {
            data: history,
            error: historyError
        } = await supabaseClient

            .from("order_status_history")

            .select(`

                id,
                old_status,
                new_status,
                changed_by,
                changed_at,
                note

            `)

            .eq(
                "order_id",
                orderId
            )

            .order(
                "changed_at",
                {
                    ascending: true
                }
            );


        if (historyError) {

            console.error(
                "โหลดประวัติสถานะไม่สำเร็จ:",
                historyError
            );

        }


        // =================================================
        // Prepare Data
        // =================================================

        const device =
            order.devices || {};


        const accessoryList =
            Array.isArray(accessories)
                ? accessories
                : [];


        const imageList =
            Array.isArray(images)
                ? images
                : [];


        const historyList =
            Array.isArray(history)
                ? history
                : [];


        // =================================================
        // Accessories HTML
        // =================================================

        let accessoriesHTML = "";


        if (accessoryList.length === 0) {

            accessoriesHTML = `

                <p>
                    ไม่มีอุปกรณ์เสริม
                </p>

            `;

        }

        else {

            accessoriesHTML = `

                <ul>

                    ${accessoryList
                    .map(accessory => `

                                <li>
                                    ${escapeHTML(
                        accessory.accessory_name || "-"
                    )}
                                </li>

                            `)
                    .join("")
                }

                </ul>

            `;

        }


        // =================================================
        // History HTML
        // =================================================

        let historyHTML = "";


        if (historyList.length === 0) {

            historyHTML = `

                <p>
                    ยังไม่มีประวัติสถานะ
                </p>

            `;

        }

        else {

            historyHTML = historyList

                .map(item => `

                    <p>

                        <strong>
                            ${escapeHTML(
                    getStatusText(
                        item.new_status
                    )
                )}
                        </strong>

                        -

                        ${escapeHTML(
                    formatDate(
                        item.changed_at
                    )
                )}

                        ${item.note
                        ? `
                                    <br>
                                    <small>
                                        ${escapeHTML(
                            item.note
                        )}
                                    </small>
                                `
                        : ""
                    }

                    </p>

                `)

                .join("");

        }


        // =================================================
        // โหลดรูปจาก Storage
        // =================================================

        const imageHTML =
            await buildImageHTML(
                imageList
            );


        // =================================================
        // แสดงรายละเอียด
        // =================================================

        detailContent.innerHTML = `

            <h3>
                ${escapeHTML(
            order.order_code
        )}
            </h3>


            <p>

                <strong>
                    สถานะ:
                </strong>

                ${escapeHTML(
            getStatusText(
                order.status
            )
        )}

            </p>


            <p>

                <strong>
                    ปัญหา:
                </strong>

                ${escapeHTML(
            order.main_problem || "-"
        )}

            </p>


            <p>

                <strong>
                    รายละเอียด:
                </strong>

                ${escapeHTML(
            order.description || "-"
        )}

            </p>


            <p>

                <strong>
                    ค่าซ่อม:
                </strong>

                ${formatMoney(
            order.repair_cost
        )}

                บาท

            </p>


            <p>

                <strong>
                    วันที่รับงาน:
                </strong>

                ${escapeHTML(
            formatDate(
                order.created_at
            )
        )}

            </p>


            ${order.closed_at
                ? `

                        <p>

                            <strong>
                                วันที่ปิดงาน:
                            </strong>

                            ${escapeHTML(
                    formatDate(
                        order.closed_at
                    )
                )}

                        </p>

                    `
                : ""
            }


            <hr>


            <h3>
                💻 อุปกรณ์
            </h3>


            <p>

                <strong>
                    ประเภท:
                </strong>

                ${escapeHTML(
                device.device_type || "-"
            )}

            </p>


            <p>

                <strong>
                    ยี่ห้อ:
                </strong>

                ${escapeHTML(
                device.brand || "-"
            )}

            </p>


            <p>

                <strong>
                    รุ่น:
                </strong>

                ${escapeHTML(
                device.model || "-"
            )}

            </p>


            <p>

                <strong>
                    S/N:
                </strong>

                ${escapeHTML(
                device.serial_number || "-"
            )}

            </p>


            <p>

                <strong>
                    Shop Tag:
                </strong>

                ${escapeHTML(
                device.shop_tag || "-"
            )}

            </p>


            <p>

                <strong>
                    หมายเหตุอุปกรณ์:
                </strong>

                ${escapeHTML(
                device.note || "-"
            )}

            </p>


            <hr>


            <h3>
                📦 อุปกรณ์เสริม
            </h3>

            ${accessoriesHTML}


            <hr>


            <h3>
                🖼️ รูปภาพ
            </h3>


            <div class="image-grid">

                ${imageHTML}

            </div>


            <hr>


            <h3>
                📜 ประวัติสถานะ
            </h3>

            ${historyHTML}

        `;

    }

    catch (error) {

        console.error(
            "showDetail error:",
            error
        );


        detailContent.innerHTML = `

            <p>
                เกิดข้อผิดพลาดในการโหลดรายละเอียด
            </p>

        `;

    }

};


// =====================================================
// ปิด Modal
// =====================================================

if (closeDetailButton) {

    closeDetailButton.onclick = () => {

        detailModal.style.display =
            "none";

        clearBlobUrls();

    };

}


// =====================================================
// คลิกพื้นที่นอก Modal เพื่อปิด
// =====================================================

if (detailModal) {

    detailModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                detailModal
            ) {

                detailModal.style.display =
                    "none";

                clearBlobUrls();

            }

        }
    );

}


// =====================================================
// ปุ่ม Logout
// =====================================================

if (logoutButton) {

    logoutButton.onclick =
        async () => {

            try {

                await supabaseClient.auth.signOut();

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            clearBlobUrls();

            sessionStorage.clear();

            window.location.href =
                "login.html";

        };

}


// =====================================================
// กด ESC เพื่อปิด Modal
// =====================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            detailModal.style.display === "flex"
        ) {

            detailModal.style.display =
                "none";

            clearBlobUrls();

        }

    }
);


// =====================================================
// Initial Load
// =====================================================

async function initCustomerPortal() {

    await loadCustomer();

    await loadOrders();

}


initCustomerPortal();