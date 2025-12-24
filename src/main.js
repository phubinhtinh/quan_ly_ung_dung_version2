const form = document.getElementById('product-form');
const nameInput = document.getElementById('product-name');
const priceInput = document.getElementById('product-price');
const tableBody = document.getElementById('product-table');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const listProductLocal = JSON.parse(localStorage.getItem('productsLocal')) || [];
const listProductSession = JSON.parse(sessionStorage.getItem('productsSession')) || [];
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwYCsAz2SA2b4vtqUowvhLSB9e9Zu_iy3OSwLCf9qUd0DSE9OWLJo-17KSAPoJVXTrF/exec';
// Biến để theo dõi hàng đang sửa (null = không sửa)
let editingRow = null; 

// --- CÁC HÀM HỖ TRỢ ---

// Lấy ID tự động dựa vào số dòng hiện có
function getNextId() {
    return tableBody.rows.length + 1;
}

// Định dạng giá tiền: 1000000 -> 1.000.000
function formatPrice(value) {   
    return Number(value).toLocaleString('vi-VN');
}

// Chuyển giá trị (1.000.000) về số (1000000)
function parsePrice(formattedValue) {
    return formattedValue.replace(/\./g, '');
}

// Cập nhật lại ID các hàng sau khi Xóa
function updateRowIds() {
    const rows = tableBody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
    // ô đầu tiên (cells[0]) là ô ID
    rows[i].cells[0].textContent = i + 1;
    }
}

// Chuyển form về trạng thái "Thêm mới"
function resetFormToCreateMode() {
    formTitle.textContent = 'Thêm Sản phẩm Mới';
    submitButton.textContent = 'Thêm Sản phẩm';
    
    // Đổi màu nút về màu gốc (Thêm)
    submitButton.classList.remove('bg-blue-500', 'hover:bg-blue-700');
    submitButton.classList.add('bg-theme-primary', 'hover:bg-theme-dark');
    
    cancelButton.classList.add('hidden'); // Ẩn nút Hủy
    form.reset();
    editingRow = null;
}
// localStorage
function addLocalStorage(){
    const newProduct = {
        id: getNextId(),
        name: nameInput.value,
        price: priceInput.value
    };
    listProductLocal.push(newProduct);
    localStorage.setItem('productsLocal', JSON.stringify(listProductLocal));
}
// // // sessionStorage
function addSessionStorage(){
    const newProduct = {
        id: getNextId(),
        name: nameInput.value,
        price: priceInput.value
    };
    listProductSession.push(newProduct);
    sessionStorage.setItem('productsSession', JSON.stringify(listProductSession));
}
// lưu vào file Json
function addProduct() {
    const name = nameInput.value;
    const price = priceInput.value;

    const newProduct = { name, price };

    // Gửi yêu cầu POST tới server để lưu vào db.json
    fetch('http://localhost:3000/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Đã lưu vào server:', data);
        renderProducts(); // Tải lại bảng
        form.reset();
    });
}
function renderProducts() {
    fetch('http://localhost:3000/products')
        .then(res => res.json())
        .then(data => {
            // Logic vẽ bảng giống hệt như bài LocalStorage cũ của bạn
            console.log(data); 
        });
}

// Hàm gửi dữ liệu lên Google Sheets
function addToGoogleSheets(name, price) {
    const data = {
        tenSanPham: name,
        giaSanPham: price
    };

    return fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors', // Cần thiết đối với Google Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(() => console.log('Đã gửi dữ liệu lên Google Sheets'))
    .catch(err => console.error('Lỗi Google Sheets:', err));
}   
// --- XỬ LÝ SỰ KIỆN ---

// 1. SỰ KIỆN SUBMIT FORM (THÊM MỚI hoặc CẬP NHẬT)
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const price = priceInput.value.trim();

    if (!name || !price) {
    alert('Vui lòng nhập đầy đủ thông tin sản phẩm!');
    return;
    }

    // --- Logic CẬP NHẬT ---
    if (editingRow) {
        // Nếu đang sửa -> cập nhật
        editingRow.cells[1].textContent = name;
        editingRow.cells[2].textContent = formatPrice(price);
        
        // Trả form về trạng thái "Thêm mới"
        resetFormToCreateMode();
    } 
    // --- Logic THÊM MỚI ---
    else {
        e.preventDefault();
        // Nếu không -> thêm mới
        addLocalStorage();
        addSessionStorage();
        addProduct();
        addToGoogleSheets(nameInput.value, priceInput.value)
        const id = getNextId();
        const newRow = document.createElement('tr');
        newRow.className = 'border-b border-gray-200 hover:bg-gray-50';

        // CẬP NHẬT: Thêm class 'edit-btn' và 'delete-btn'
        newRow.innerHTML = `
            <td class="px-6 py-4">${id}</td>
            <td class="px-6 py-4">${name}</td>
            <td class="px-6 py-4">${formatPrice(price)}</td>
            <td class="px-6 py-4">
            <div class="flex space-x-2">
                <button class="edit-btn bg-yellow-500 text-white text-sm font-medium py-1 px-3 rounded-md hover:bg-yellow-600 transition-colors">Sửa</button>
                <button class="delete-btn bg-red-500 text-white text-sm font-medium py-1 px-3 rounded-md hover:bg-red-600 transition-colors">Xóa</button>
            </div>
            </td>
        `;

        tableBody.appendChild(newRow);
        form.reset();
    }
});

// 2. SỰ KIỆN CLICK VÀO CÁC NÚT (SỬA/XÓA)
// Dùng Event Delegation: Lắng nghe trên <tbody>
tableBody.addEventListener('click', function(e) {
    const clickedElement = e.target;
    
    // Lấy thẻ <tr> cha gần nhất của nút được bấm
    const row = clickedElement.closest('tr');

    // --- Logic XÓA ---
    if (clickedElement.classList.contains('delete-btn')) {
        if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            row.remove();
            updateRowIds(); // Cập nhật lại ID
            // Nếu lỡ tay xóa hàng đang sửa -> reset form
            if (editingRow === row) {
            resetFormToCreateMode();
            }
        }
    }

    // --- Logic SỬA ---
    if (clickedElement.classList.contains('edit-btn')) {
    // Lấy thông tin từ hàng
    const name = row.cells[1].textContent;
    const price = parsePrice(row.cells[2].textContent);

    // Đổ thông tin lên form
    nameInput.value = name;
    priceInput.value = price;

    // Đánh dấu hàng đang sửa
    editingRow = row;

    // Chuyển form sang trạng thái "Cập nhật"
    formTitle.textContent = 'Cập nhật Sản phẩm';
    submitButton.textContent = 'Cập nhật';
    
    // Đổi màu nút sang màu "Cập nhật" (màu xanh)
    submitButton.classList.remove('bg-theme-primary', 'hover:bg-theme-dark');
    submitButton.classList.add('bg-blue-500', 'hover:bg-blue-700');
    
    cancelButton.classList.remove('hidden'); // Hiển thị nút Hủy
    
    // Cuộn lên đầu trang để thấy form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// 3. SỰ KIỆN CLICK NÚT "HỦY"
cancelButton.addEventListener('click', function() {
    resetFormToCreateMode();
});
