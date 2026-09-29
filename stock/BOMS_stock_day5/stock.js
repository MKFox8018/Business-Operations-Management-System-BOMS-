// =====================================
// Elements
// =====================================
const deviceTableBody = document.getElementById("deviceTableBody");
const userRoleElement = document.getElementById("userRole");
const backButton = document.getElementById("backButton");
const logoutButton = document.getElementById("logoutButton");
const addDeviceButton = document.getElementById("addDeviceButton");
const deviceModal = document.getElementById("deviceModal");
const deviceModalTitle = document.getElementById("deviceModalTitle");
const deviceForm = document.getElementById("deviceForm");
const cancelDeviceButton = document.getElementById("cancelDeviceButton");
const saveDeviceButton = document.getElementById("saveDeviceButton");
const deviceFormMessage = document.getElementById("deviceFormMessage");
const deviceCustomer = document.getElementById("deviceCustomer");
const deviceType = document.getElementById("deviceType");
const deviceBrand = document.getElementById("deviceBrand");
const deviceModel = document.getElementById("deviceModel");
const deviceSerial = document.getElementById("deviceSerial");
const deviceShopTag = document.getElementById("deviceShopTag");
const deviceNote = document.getElementById("deviceNote");

const manageModal = document.getElementById("manageModal");
const manageTitle = document.getElementById("manageTitle");
const manageSubtitle = document.getElementById("manageSubtitle");
const closeManageButton = document.getElementById("closeManageButton");
const accessoryForm = document.getElementById("accessoryForm");
const accessoryName = document.getElementById("accessoryName");
const accessoryList = document.getElementById("accessoryList");
const accessoryMessage = document.getElementById("accessoryMessage");
const deviceImageInput = document.getElementById("deviceImageInput");
const uploadImagesButton = document.getElementById("uploadImagesButton");
const imageList = document.getElementById("imageList");
const imageMessage = document.getElementById("imageMessage");

// =====================================
// Login / Role
// =====================================
const userRole = sessionStorage.getItem("userRole");
const userId = sessionStorage.getItem("userId");

if (!userRole || !userId) {
    window.location.href = "login.html";
    throw new Error("Not logged in");
}

userRoleElement.textContent = "สิทธิ์: " + userRole;

const isStaff = userRole === "Employee" || userRole === "Manager";
const isManager = userRole === "Manager";

if (!isStaff) addDeviceButton.style.display = "none";

// =====================================
// State
// =====================================
let customers = [];
let devices = [];
let editingDeviceId = null;
let managingDeviceId = null;

// =====================================
// Helpers
// =====================================
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("th-TH");
}

function resetDeviceForm() {
    deviceForm.reset();
    deviceFormMessage.textContent = "";
    editingDeviceId = null;
}

// =====================================
// Customers
// =====================================
async function loadCustomers() {
    const { data, error } = await supabaseClient
        .from("customers")
        .select("id, name, phone")
        .order("name");

    if (error) {
        console.error("โหลด Customers ไม่สำเร็จ:", error);
        return;
    }

    customers = data || [];
    deviceCustomer.innerHTML = '<option value="">-- เลือกลูกค้า --</option>';

    customers.forEach(customer => {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.phone})`;
        deviceCustomer.appendChild(option);
    });
}

// =====================================
// Devices
// =====================================
async function loadDevices() {
    deviceTableBody.innerHTML = '<tr><td colspan="7">กำลังโหลดข้อมูล...</td></tr>';

    const { data, error } = await supabaseClient
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
            customers ( name, phone )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("โหลด Devices ไม่สำเร็จ:", error);
        deviceTableBody.innerHTML = '<tr><td colspan="7">โหลดข้อมูลไม่สำเร็จ</td></tr>';
        return;
    }

    devices = data || [];
    renderDevices();
}

function renderDevices() {
    if (!devices.length) {
        deviceTableBody.innerHTML = '<tr><td colspan="7">ยังไม่มีข้อมูลอุปกรณ์</td></tr>';
        return;
    }

    deviceTableBody.innerHTML = "";

    devices.forEach(device => {
        const row = document.createElement("tr");
        const customerName = device.customers?.name ?? "-";

        row.innerHTML = `
            <td>${escapeHtml(customerName)}</td>
            <td>${escapeHtml(device.device_type ?? "-")}</td>
            <td>${escapeHtml(device.brand ?? "-")}</td>
            <td>${escapeHtml(device.model ?? "-")}</td>
            <td>${escapeHtml(device.serial_number ?? "-")}</td>
            <td>${escapeHtml(device.shop_tag ?? "-")}</td>
            <td>
                <div class="action-buttons">
                    ${isStaff ? `<button class="edit-device-button" data-id="${device.id}">แก้ไข</button>` : ""}
                    <button class="manage-device-button" data-id="${device.id}">จัดการ</button>
                </div>
            </td>
        `;
        deviceTableBody.appendChild(row);
    });
}

// =====================================
// Device Add / Edit
// =====================================
addDeviceButton.addEventListener("click", async () => {
    if (!isStaff) return;
    resetDeviceForm();
    deviceModalTitle.textContent = "เพิ่มอุปกรณ์";
    await loadCustomers();
    deviceModal.style.display = "flex";
});

async function openEditDevice(deviceId) {
    if (!isStaff) return;

    const device = devices.find(item => item.id === deviceId);
    if (!device) {
        alert("ไม่พบข้อมูลอุปกรณ์");
        return;
    }

    editingDeviceId = deviceId;
    deviceModalTitle.textContent = "แก้ไขอุปกรณ์";
    deviceFormMessage.textContent = "";
    await loadCustomers();

    deviceCustomer.value = device.customer_id ?? "";
    deviceType.value = device.device_type ?? "";
    deviceBrand.value = device.brand ?? "";
    deviceModel.value = device.model ?? "";
    deviceSerial.value = device.serial_number ?? "";
    deviceShopTag.value = device.shop_tag ?? "";
    deviceNote.value = device.note ?? "";
    deviceModal.style.display = "flex";
}

deviceTableBody.addEventListener("click", event => {
    const editButton = event.target.closest(".edit-device-button");
    if (editButton) {
        openEditDevice(editButton.dataset.id);
        return;
    }

    const manageButton = event.target.closest(".manage-device-button");
    if (manageButton) openManageDevice(manageButton.dataset.id);
});

cancelDeviceButton.addEventListener("click", () => {
    deviceModal.style.display = "none";
    resetDeviceForm();
});

deviceForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!isStaff) {
        deviceFormMessage.textContent = "คุณไม่มีสิทธิ์จัดการอุปกรณ์";
        return;
    }

    const customerId = deviceCustomer.value;
    const type = deviceType.value.trim();
    const brand = deviceBrand.value.trim();
    const model = deviceModel.value.trim();
    const serialNumber = deviceSerial.value.trim();
    const shopTag = deviceShopTag.value.trim();
    const note = deviceNote.value.trim();

    if (!customerId || !type) {
        deviceFormMessage.textContent = "กรุณาเลือกลูกค้าและประเภทอุปกรณ์";
        return;
    }

    saveDeviceButton.disabled = true;
    saveDeviceButton.textContent = "กำลังบันทึก...";
    deviceFormMessage.textContent = "";

    const deviceData = {
        customer_id: customerId,
        device_type: type,
        brand: brand || null,
        model: model || null,
        serial_number: serialNumber || null,
        shop_tag: shopTag || null,
        note: note || null
    };

    let result;

    if (editingDeviceId) {
        result = await supabaseClient
            .from("devices")
            .update(deviceData)
            .eq("id", editingDeviceId);
    } else {
        result = await supabaseClient
            .from("devices")
            .insert(deviceData);
    }

    if (result.error) {
        console.error("บันทึก Device ไม่สำเร็จ:", result.error);
        deviceFormMessage.textContent = "บันทึกไม่สำเร็จ: " + result.error.message;
        saveDeviceButton.disabled = false;
        saveDeviceButton.textContent = "บันทึกอุปกรณ์";
        return;
    }

    deviceModal.style.display = "none";
    resetDeviceForm();
    await loadDevices();

    alert("บันทึกข้อมูลอุปกรณ์สำเร็จ");
    saveDeviceButton.disabled = false;
    saveDeviceButton.textContent = "บันทึกอุปกรณ์";
});

// =====================================
// Manage Device Modal
// =====================================
async function openManageDevice(deviceId) {
    const device = devices.find(item => item.id === deviceId);
    if (!device) {
        alert("ไม่พบข้อมูลอุปกรณ์");
        return;
    }

    managingDeviceId = deviceId;
    manageTitle.textContent = "จัดการอุปกรณ์";
    manageSubtitle.textContent = `${device.device_type || "-"} ${device.brand || ""} ${device.model || ""} | S/N: ${device.serial_number || "-"}`;

    accessoryMessage.textContent = "";
    imageMessage.textContent = "";
    accessoryName.value = "";
    deviceImageInput.value = "";

    if (!isStaff) {
        accessoryForm.style.display = "none";
        document.getElementById("imageUploadArea").style.display = "none";
    } else {
        accessoryForm.style.display = "flex";
        document.getElementById("imageUploadArea").style.display = "flex";
    }

    manageModal.style.display = "flex";
    await Promise.all([loadAccessories(), loadImages()]);
}

closeManageButton.addEventListener("click", () => {
    manageModal.style.display = "none";
    managingDeviceId = null;
});

// =====================================
// Accessories
// =====================================
async function loadAccessories() {
    if (!managingDeviceId) return;

    accessoryList.innerHTML = '<p class="empty-text">กำลังโหลด...</p>';

    const { data, error } = await supabaseClient
        .from("device_accessories")
        .select("id, device_id, accessory_name, created_at")
        .eq("device_id", managingDeviceId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("โหลด Accessories ไม่สำเร็จ:", error);
        accessoryList.innerHTML = '<p class="empty-text">โหลด Accessories ไม่สำเร็จ</p>';
        return;
    }

    if (!data?.length) {
        accessoryList.innerHTML = '<p class="empty-text">ยังไม่มี Accessories</p>';
        return;
    }

    accessoryList.innerHTML = data.map(item => `
        <div class="item-row">
            <span class="item-name">${escapeHtml(item.accessory_name)}</span>
            ${isManager ? `<button class="danger-button delete-accessory-button" data-id="${item.id}">ลบ</button>` : ""}
        </div>
    `).join("");
}

accessoryForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isStaff || !managingDeviceId) return;

    const name = accessoryName.value.trim();
    if (!name) return;

    const addButton = document.getElementById("addAccessoryButton");
    addButton.disabled = true;
    accessoryMessage.textContent = "";

    const { error } = await supabaseClient
        .from("device_accessories")
        .insert({
            device_id: managingDeviceId,
            accessory_name: name
        });

    addButton.disabled = false;

    if (error) {
        console.error("เพิ่ม Accessories ไม่สำเร็จ:", error);
        accessoryMessage.textContent = "เพิ่มไม่สำเร็จ: " + error.message;
        return;
    }

    accessoryName.value = "";
    await loadAccessories();
});

accessoryList.addEventListener("click", async event => {
    const button = event.target.closest(".delete-accessory-button");
    if (!button || !isManager) return;

    if (!confirm("ต้องการลบ Accessories รายการนี้หรือไม่?")) return;

    button.disabled = true;

    const { error } = await supabaseClient
        .from("device_accessories")
        .delete()
        .eq("id", button.dataset.id);

    if (error) {
        console.error("ลบ Accessories ไม่สำเร็จ:", error);
        alert("ลบไม่สำเร็จ: " + error.message);
        button.disabled = false;
        return;
    }

    await loadAccessories();
});

// =====================================
// Device Images - Private Storage
// =====================================
async function loadImages() {
    if (!managingDeviceId) return;

    imageList.innerHTML = '<p class="empty-text">กำลังโหลด...</p>';

    const { data, error } = await supabaseClient
        .from("device_images")
        .select("id, device_id, image_url, created_at")
        .eq("device_id", managingDeviceId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("โหลดรูปภาพไม่สำเร็จ:", error);
        imageList.innerHTML = '<p class="empty-text">โหลดรูปภาพไม่สำเร็จ</p>';
        return;
    }

    if (!data?.length) {
        imageList.innerHTML = '<p class="empty-text">ยังไม่มีรูปภาพ</p>';
        return;
    }

    const cards = [];

    for (const image of data) {
        const { data: signedData, error: signedError } = await supabaseClient.storage
            .from("device-images")
            .createSignedUrl(image.image_url, 60 * 60);

        if (signedError) {
            console.error("สร้าง Signed URL ไม่สำเร็จ:", signedError);
            continue;
        }

        cards.push(`
            <div class="image-card">
                <img src="${escapeHtml(signedData.signedUrl)}" alt="รูปอุปกรณ์" loading="lazy">
                <div class="image-card-footer">
                    <span class="image-date">${escapeHtml(formatDate(image.created_at))}</span>
                    ${isManager ? `<button class="danger-button delete-image-button" data-id="${image.id}" data-path="${encodeURIComponent(image.image_url)}">ลบ</button>` : ""}
                </div>
            </div>
        `);
    }

    imageList.innerHTML = cards.length ? cards.join("") : '<p class="empty-text">ไม่สามารถแสดงรูปภาพได้</p>';
}

uploadImagesButton.addEventListener("click", async () => {
    if (!isStaff || !managingDeviceId) return;

    const files = Array.from(deviceImageInput.files || []);
    if (!files.length) {
        imageMessage.textContent = "กรุณาเลือกรูปภาพก่อน";
        return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const invalid = files.find(file => !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024);

    if (invalid) {
        imageMessage.textContent = `ไฟล์ ${invalid.name} ไม่รองรับ หรือมีขนาดเกิน 10 MB`;
        return;
    }

    uploadImagesButton.disabled = true;
    imageMessage.textContent = `กำลังอัปโหลด ${files.length} รูป...`;

    let successCount = 0;

    for (const file of files) {
        const safeName = file.name
            .normalize("NFKD")
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
        const storagePath = `${managingDeviceId}/${uniqueName}`;

        const { error: uploadError } = await supabaseClient.storage
            .from("device-images")
            .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            });

        if (uploadError) {
            console.error("Upload ไม่สำเร็จ:", uploadError);
            continue;
        }

        // เก็บ Storage Path ใน image_url เพราะ Bucket เป็น Private
        const { error: insertError } = await supabaseClient
            .from("device_images")
            .insert({
                device_id: managingDeviceId,
                image_url: storagePath
            });

        if (insertError) {
            console.error("บันทึก device_images ไม่สำเร็จ:", insertError);
            continue;
        }

        successCount++;
    }

    deviceImageInput.value = "";
    uploadImagesButton.disabled = false;
    imageMessage.textContent = `อัปโหลดสำเร็จ ${successCount}/${files.length} รูป`;
    await loadImages();
});

imageList.addEventListener("click", async event => {
    const button = event.target.closest(".delete-image-button");
    if (!button || !isManager) return;

    if (!confirm("ต้องการลบรูปนี้หรือไม่?")) return;

    button.disabled = true;

    const imageId = button.dataset.id;
    const storagePath = decodeURIComponent(button.dataset.path);

    const { error: storageError } = await supabaseClient.storage
        .from("device-images")
        .remove([storagePath]);

    if (storageError) {
        console.error("ลบไฟล์จาก Storage ไม่สำเร็จ:", storageError);
        alert("ลบไฟล์ไม่สำเร็จ: " + storageError.message);
        button.disabled = false;
        return;
    }

    const { error: dbError } = await supabaseClient
        .from("device_images")
        .delete()
        .eq("id", imageId);

    if (dbError) {
        console.error("ลบข้อมูล device_images ไม่สำเร็จ:", dbError);
        alert("ลบข้อมูลรูปไม่สำเร็จ: " + dbError.message);
        button.disabled = false;
        return;
    }

    await loadImages();
});

// =====================================
// Navigation / Logout
// =====================================
backButton.addEventListener("click", () => {
    window.location.href = "main_menu.html";
});

logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    sessionStorage.clear();
    window.location.href = "login.html";
});

// =====================================
// Init
// =====================================
loadCustomers();
loadDevices();
