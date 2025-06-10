
// Add these variables at the top of your script
let hasUnsavedChanges = false;
const originalData = { categories: [] };
const BASE_BACKEND_URL = 'https://woodseeker-backend.onrender.com'

// Check authentication
window.onload = () => {
    checkAuth();
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('login.html');
        return;
    }

    try {
        const res = await fetch(`${BASE_BACKEND_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            localStorage.removeItem('token');
            window.location.replace('login.html');
            return;
        }

        const data = await res.json();
        const email = data.user?.email || 'Admin';
        document.getElementById('adminEmail').textContent = email;
        document.getElementById('profileEmail').textContent = email;

        loadProducts();
    } catch (e) {
        console.error(e);
        localStorage.removeItem('token');
        window.location.replace('login.html');
    }
}

// Toggle profile dropdown
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const profile = document.querySelector('.header-profile');
    const dropdown = document.getElementById('profileDropdown');

    if (!profile.contains(event.target) && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    window.location.replace('login.html');
}

// Load products from backend API, group by category, and display them
async function loadProducts() {
    try {
        const response = await fetch(`${BASE_BACKEND_URL}/api/products`);
        const products = await response.json();
        if (!response.ok) throw new Error('Gagal mengambil data produk dari server.');

        const listedGrid = document.getElementById('listedProductGrid');
        const unlistedGrid = document.getElementById('unlistedProductGrid');

        listedGrid.innerHTML = '';
        unlistedGrid.innerHTML = '';


        console.log(products)
        // Group products by category_name
        const grouped = {};
        products.forEach(product => {
            const category = product.category_name || 'Lainnya';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(product);
        });

        // Simpan data global agar bisa dibandingkan nanti jika diedit
        window.productsData = {
            categories: Object.entries(grouped).map(([categoryName, products]) => ({
                name: categoryName,
                products
            }))
        };

        // Tampilkan kartu produk ke dalam grid yang sesuai
        window.productsData.categories.forEach(category => {
            category.products.forEach(product => {
                const card = createProductCard(product, category.name);
                if (product.status === 'listed') {
                    listedGrid.appendChild(card);
                } else {
                    unlistedGrid.appendChild(card);
                }
            });
        });

        // Simpan data awal untuk deteksi perubahan (jika perlu)
        window.originalData = JSON.parse(JSON.stringify(window.productsData));
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Format price with dots
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Create product card with list/unlist button
function createProductCard(product, category) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.product_id);

    const isListed = product.status === 'listed';

    card.innerHTML = `
        <img src="../../assets/images/${product.image}" alt="${product.name}" class="product-image">
        <div class="product-content">
            <div class="product-header">
                <h3 class="product-title">${product.name}</h3>
                <span class="status-badge ${isListed ? 'listed' : 'unlisted'}">
                    ${isListed ? 'Ditampilkan di Web' : 'Draf'}
                </span>
            </div>
            <div class="product-category">${category}</div>
            <div class="product-price">Rp ${formatPrice(product.price)}</div>
            <div class="product-actions">
                <div class="action-row">
                    <button class="action-btn edit-btn" onclick="editProduct('${product.product_id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="toggle-list-btn ${isListed ? 'unlist' : 'list'}" 
                            onclick="toggleProductListing('${product.product_id}', ${!isListed})">
                        <i class="fas fa-${isListed ? 'eye-slash' : 'eye'}"></i>
                        ${isListed ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                </div>
                <button class="action-btn delete-btn" onclick="deleteProduct('${product.product_id}')">
                    <i class="fas fa-trash"></i>
                    Hapus
                </button>
            </div>
        </div>
    `;

    return card;
}

// Update bagian dalam handleAddProduct() sebelum mengirim payload
async function handleAddProduct() {
    const modal = document.getElementById('addProductModal');
    modal.classList.add('show');

    const form = document.getElementById('addProductForm');
    form.reset();

    colors = [];
    updateColorList();

    form.onsubmit = async function (e) {
        e.preventDefault();

        const name = document.getElementById('productName').value.trim();
        const price = parseInt(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);
        const description = document.getElementById('productDescription').value.trim();
        const category = document.getElementById('productCategory').value.trim();
        const material = document.getElementById('productMaterial').value.trim();
        const weight = parseFloat(document.getElementById('productWeight').value);
        const width = parseFloat(document.getElementById('productWidth').value);
        const depth = parseFloat(document.getElementById('productDepth').value);
        const height = parseFloat(document.getElementById('productHeight').value);
        const image = document.getElementById('productImage').value.trim();

        if (!name || isNaN(price) || isNaN(stock) || !category || !image) {
            alert('Mohon lengkapi semua data yang dibutuhkan.');
            return;
        }

        // Konversi nama warna menjadi color ID (sama seperti di handleEditProduct)
        const colorIds = colors.map(colorName => {
            const dropdown = document.getElementById('colorDropdown'); // sesuaikan dengan ID dropdown Anda
            const option = Array.from(dropdown.options).find(opt =>
                opt.text.toLowerCase() === colorName.toLowerCase()
            );
            return option ? parseInt(option.value) : null;
        }).filter(id => id !== null);

        const payload = {
            name,
            price,
            stock,
            description,
            material,
            weight,
            width,
            depth,
            height,
            image,
            category_id: category,
            status: "unlisted",
            colors: colorIds // Kirim array color ID, bukan nama warna
        };

        try {
            const response = await fetch(`${BASE_BACKEND_URL}/api/products/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Gagal menambahkan produk.');
            }

            const result = await response.json();

            // Tambahkan ke window.productsData
            const newProduct = {
                id: result.productId,
                name,
                price,
                stock,
                description,
                material,
                weight,
                width,
                depth,
                height,
                image,
                colors: colors, // Simpan nama warna untuk UI
                listed: false
            };

            let categoryFound = false;
            for (const cat of window.productsData.categories) {
                if (cat.name === category) {
                    cat.products.push(newProduct);
                    categoryFound = true;
                    break;
                }
            }

            if (!categoryFound) {
                window.productsData.categories.push({
                    name: category,
                    products: [newProduct]
                });
            }

            // Reset form dan UI
            form.reset();
            colors = [];
            updateColorList();

            modal.classList.remove('show');
            loadProducts();
            switchSection('unlisted');
            alert('Produk berhasil ditambahkan ke database dan masuk ke Disembunyikan!');
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Terjadi kesalahan: ' + error.message);
        }
    };
}

async function handleEditProduct(event) {
    event.preventDefault();

    const productId = document.getElementById('editProductForm').getAttribute('data-product-id');

    const name = document.getElementById('editProductName').value.trim();
    const price = parseInt(document.getElementById('editProductPrice').value);
    const stock = parseInt(document.getElementById('editProductStock').value);
    const description = document.getElementById('editProductDescription').value.trim();
    const category = document.getElementById('editProductCategory').value.trim();
    const material = document.getElementById('editProductMaterial').value.trim();
    const weight = parseFloat(document.getElementById('editProductWeight').value);
    const width = parseFloat(document.getElementById('editProductWidth').value);
    const depth = parseFloat(document.getElementById('editProductDepth').value);
    const height = parseFloat(document.getElementById('editProductHeight').value);
    const image = document.getElementById('editProductImage').value.trim();
    const selectedColors = [...editColors];

    // Validasi input
    if (!name || isNaN(price) || isNaN(stock) || !category || !image) {
        alert('Mohon lengkapi semua data yang dibutuhkan.');
        return;
    }

    // Ambil status produk yang sudah ada (jangan ubah status saat edit)
    let currentStatus = 'unlisted'; // default
    try {
        const currentProductRes = await fetch(`${BASE_BACKEND_URL}/api/products/${productId}`);
        const currentProduct = await currentProductRes.json();
        currentStatus = currentProduct.status;
    } catch (err) {
        console.warn('Could not fetch current product status, using default');
    }

    const colorIds = editColors.map(colorName => {
        const dropdown = document.getElementById('editColorDropdown');
        const option = Array.from(dropdown.options).find(opt =>
            opt.text.toLowerCase() === colorName.toLowerCase()
        );
        return option ? parseInt(option.value) : null;
    }).filter(id => id !== null);

    const payload = {
        name,
        price,
        stock,
        description,
        material,
        weight,
        width,
        depth,
        height,
        image,
        category_id: category,
        status: currentStatus, // Pertahankan status yang sudah ada
        colors: colorIds
    };

    try {
        const response = await fetch(`${BASE_BACKEND_URL}/api/products/update/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Gagal mengedit produk.');
        }

        document.getElementById('editProductModal').classList.remove('show');
        loadProducts(); // Refresh data
        alert('Produk berhasil diperbarui!');
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Terjadi kesalahan: ' + error.message);
    }
}

// Add Product Modal Functions
function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('show');
}


// Color management
// Pastikan variabel colors sudah dideklarasikan di bagian atas file
let colors = [];

// Fungsi untuk menambah warna pada form tambah produk baru
function addSelectedColor() {
    const dropdown = document.getElementById('colorDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        alert('Pilih warna terlebih dahulu!');
        return;
    }
    
    const colorName = selectedOption.text.toLowerCase(); // lowercase untuk cocokkan dengan backend
    const colorValue = selectedOption.getAttribute('data-hex');
    const colorId = selectedOption.value;

    if (colorName && colorValue) {
        // Cek apakah warna sudah ada (by name lowercase)
        if (!colors.includes(colorName)) {
            colors.push(colorName);
            updateColorList();
            
            // Reset dropdown ke pilihan pertama
            dropdown.selectedIndex = 0;
        } else {
            alert('Warna sudah dipilih!');
        }
    }
}

// Fungsi untuk update tampilan daftar warna - sesuai dengan HTML yang ada
function updateColorList() {
    const colorListContainer = document.getElementById('colorList'); // Sesuai dengan HTML
    
    if (!colorListContainer) {
        console.warn('Element colorList tidak ditemukan');
        return;
    }
    
    // Kosongkan container
    colorListContainer.innerHTML = '';
    
    // Jika tidak ada warna yang dipilih
    if (colors.length === 0) {
        colorListContainer.innerHTML = '<p class="no-colors">Belum ada warna dipilih</p>';
        return;
    }
    
    // Tampilkan setiap warna yang dipilih
    colors.forEach((colorName, index) => {
        // Ambil data hex dari dropdown untuk tampilan
        const dropdown = document.getElementById('colorDropdown');
        const option = Array.from(dropdown.options).find(opt => 
            opt.text.toLowerCase() === colorName.toLowerCase()
        );
        const hexColor = option ? option.getAttribute('data-hex') : '#007bff';
        
        const colorItem = document.createElement('div');
        colorItem.className = 'selected-color-item';
        colorItem.style.cssText = `
            display: inline-flex; 
            align-items: center; 
            background-color: ${hexColor}; 
            color: ${hexColor === '#000000' || hexColor === '#A52A2A' ? 'white' : 'black'};
            padding: 6px 12px; 
            margin: 3px; 
            border-radius: 20px; 
            font-size: 13px;
            border: 1px solid #ddd;
        `;
        
        colorItem.innerHTML = `
            <span class="color-name" style="margin-right: 8px; text-transform: capitalize;">${colorName}</span>
            <button type="button" class="remove-color-btn" onclick="removeColor(${index})" 
                style="background: none; border: none; color: inherit; cursor: pointer; font-size: 16px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 4px;"
                title="Hapus warna">
                ×
            </button>
        `;
        
        colorListContainer.appendChild(colorItem);
    });
    
    // Tambahkan info jumlah warna
    const countInfo = document.createElement('div');
    countInfo.className = 'color-count-info';
    countInfo.style.cssText = 'margin-top: 8px; font-size: 12px; color: #666;';
    countInfo.textContent = `${colors.length} warna dipilih`;
    colorListContainer.appendChild(countInfo);
}

// Fungsi untuk menghapus warna dari daftar
function removeColor(index) {
    colors.splice(index, 1);
    updateColorList();
}

// Switch between Listed and Unlisted sections
function switchSection(section) {
    const tabs = document.querySelectorAll('.section-tab');
    const sections = document.querySelectorAll('.section-content');

    // First, remove active class from all tabs and sections
    tabs.forEach(tab => tab.classList.remove('active'));
    sections.forEach(content => content.classList.remove('active'));

    if (section === 'trash') {
        // Hide tabs when in trash section
        document.querySelector('.section-tabs').style.display = 'none';
        document.getElementById('trashSection').classList.add('active');
        loadTrashProducts();
    } else {
        // Show tabs for other sections
        document.querySelector('.section-tabs').style.display = 'flex';
        const selectedTab = document.querySelector(`.section-tab[onclick*="${section}"]`);
        const selectedSection = document.getElementById(`${section}Section`);

        if (selectedTab) selectedTab.classList.add('active');
        if (selectedSection) selectedSection.classList.add('active');
    }
}

// Toggle product listing status
async function toggleProductListing(productId, newListedStatus) {
    try {
        const response = await fetch(`${BASE_BACKEND_URL}/api/products/${productId}/listing`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ listed: newListedStatus })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Gagal memperbarui status listing');
        }

        // Hapus kartu produk lama dari DOM
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (card) card.remove();

        // Ambil data produk yang baru
        const updatedProductRes = await fetch(`${BASE_BACKEND_URL}/api/products/${productId}`);
        const updatedProduct = await updatedProductRes.json();

        // Tambahkan kartu baru ke lokasi yang sesuai
        const targetGrid = newListedStatus
            ? document.getElementById('listedProductGrid')
            : document.getElementById('unlistedProductGrid');

        const categoryData = await fetch(`${BASE_BACKEND_URL}/api/categories/${updatedProduct.category_id}`).then(res => res.json());
        const categoryName = categoryData.category_name || categoryData.name || 'Lainnya';
        const newCard = createProductCard(updatedProduct, categoryName);
        targetGrid.appendChild(newCard);

        switchSection(newListedStatus ? 'listed' : 'unlisted');

        // markUnsavedChanges();

        const message = newListedStatus
            ? 'Produk berhasil dipindahkan ke Ditampilkan'
            : 'Produk berhasil dipindahkan ke Disembunyikan';

        alert(message);
    } catch (error) {
        console.error('Error toggling product listing:', error);
        alert('Gagal memindahkan produk. Silakan coba lagi.');
    }
}

// Helper function to find product by ID
function findProduct(productId) {
    for (const category of window.productsData.categories) {
        const product = category.products.find(p => p.product_id == productId);
        if (product) {
            return { product, category: category.name };
        }
    }
    return null;
}

// Close modal when clicking outside
document.getElementById('addProductModal').addEventListener('click', function (event) {
    if (event.target === this) {
        closeAddProductModal();
    }
});

// Edit product functions
let editColors = [];

async function editProduct(productId) {
    try {
        // Ambil data produk dari backend
        const response = await fetch(`${BASE_BACKEND_URL}/api/products/${productId}`);
        if (!response.ok) throw new Error('Gagal mengambil data produk');

        const product = await response.json();

        // Reset edit colors array dengan data dari backend
        editColors = [...(product.colors || [])];

        // Set data-product-id ke form
        const form = document.getElementById("editProductForm");
        form.setAttribute("data-product-id", productId);

        // Isi form dengan data produk dari backend
        document.getElementById('editProductName').value = product.name || '';
        document.getElementById('editProductCategory').value = product.category_id || '';
        document.getElementById('editProductPrice').value = product.price || '';
        document.getElementById('editProductStock').value = product.stock || '';
        document.getElementById('editProductMaterial').value = product.material || '';
        document.getElementById('editProductWeight').value = product.weight || '';
        document.getElementById('editProductWidth').value = product.width || '';
        document.getElementById('editProductDepth').value = product.depth || '';
        document.getElementById('editProductHeight').value = product.height || '';
        document.getElementById('editProductImage').value = product.image || '';
        document.getElementById('editProductDescription').value = product.description || '';

        // Update daftar warna
        updateEditColorList();

        // Tampilkan modal edit
        document.getElementById('editProductModal').classList.add('show');

        // Pasang event handler untuk form submit
        form.onsubmit = handleEditProduct;

    } catch (error) {
        console.error('Error loading product for edit:', error);
        alert('Gagal memuat data produk untuk diedit: ' + error.message);
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').classList.remove('show');
    document.getElementById('editProductForm').reset();

    editColors = []; // RESET
    updateEditColorList();
}

// Fungsi untuk menambah warna pada form edit produk
function addSelectedColorEdit() {
    const dropdown = document.getElementById('editColorDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) {
        alert('Pilih warna terlebih dahulu!');
        return;
    }
    
    const colorName = selectedOption.text.toLowerCase(); // lowercase untuk cocokkan dengan backend
    const colorValue = selectedOption.getAttribute('data-hex');
    const colorId = selectedOption.value;

    if (colorName && colorValue) {
        // Cek apakah warna sudah ada (by name lowercase)
        if (!editColors.includes(colorName)) {
            editColors.push(colorName);
            updateEditColorList();
            
            // Reset dropdown ke pilihan pertama
            dropdown.selectedIndex = 0;
        } else {
            alert('Warna sudah dipilih!');
        }
    }
}

// Fungsi untuk update tampilan daftar warna edit - style yang sama dengan add
function updateEditColorList() {
    const colorListContainer = document.getElementById('editColorList');
    
    if (!colorListContainer) {
        console.warn('Element editColorList tidak ditemukan');
        return;
    }
    
    // Kosongkan container
    colorListContainer.innerHTML = '';
    
    // Jika tidak ada warna yang dipilih
    if (editColors.length === 0) {
        colorListContainer.innerHTML = '<p class="no-colors">Belum ada warna dipilih</p>';
        return;
    }
    
    // Tampilkan setiap warna yang dipilih
    editColors.forEach((colorName, index) => {
        // Ambil data hex dari dropdown untuk tampilan
        const dropdown = document.getElementById('editColorDropdown');
        const option = Array.from(dropdown.options).find(opt => 
            opt.text.toLowerCase() === colorName.toLowerCase()
        );
        const hexColor = option ? option.getAttribute('data-hex') : '#007bff';
        
        const colorItem = document.createElement('div');
        colorItem.className = 'selected-color-item';
        colorItem.style.cssText = `
            display: inline-flex; 
            align-items: center; 
            background-color: ${hexColor}; 
            color: ${hexColor === '#000000' || hexColor === '#A52A2A' ? 'white' : 'black'};
            padding: 6px 12px; 
            margin: 3px; 
            border-radius: 20px; 
            font-size: 13px;
            border: 1px solid #ddd;
        `;
        
        colorItem.innerHTML = `
            <span class="color-name" style="margin-right: 8px; text-transform: capitalize;">${colorName}</span>
            <button type="button" class="remove-color-btn" onclick="removeEditColor(${index})" 
                style="background: none; border: none; color: inherit; cursor: pointer; font-size: 16px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 4px;"
                title="Hapus warna">
                ×
            </button>
        `;
        
        colorListContainer.appendChild(colorItem);
    });
    
    // Tambahkan info jumlah warna
    const countInfo = document.createElement('div');
    countInfo.className = 'color-count-info';
    countInfo.style.cssText = 'margin-top: 8px; font-size: 12px; color: #666;';
    countInfo.textContent = `${editColors.length} warna dipilih`;
    colorListContainer.appendChild(countInfo);
}

// Fungsi untuk menghapus warna dari daftar edit
function removeEditColor(index) {
    editColors.splice(index, 1);
    updateEditColorList();
}

function saveEditProduct() {
    const form = document.getElementById('editProductForm');
    if (form.checkValidity()) {
        const productId = document.getElementById('editProductId').value;
        const productData = {
            id: productId,
            name: document.getElementById('editProductName').value,
            category: document.getElementById('editProductCategory').value,
            price: parseInt(document.getElementById('editProductPrice').value),
            colors: editColors,
            description: document.getElementById('editProductDescription').value,
            image: document.getElementById('editProductImage').files[0] || findProduct(productId).product.image
        };

        // Update product in data
        // Kirim data ke backend
        const formData = new FormData();
        formData.append('id', productData.id);
        formData.append('name', productData.name);
        formData.append('category', productData.category);
        formData.append('price', productData.price);
        formData.append('description', productData.description);
        formData.append('colors', JSON.stringify(productData.colors)); // karena array
        if (productData.image instanceof File) {
            formData.append('image', productData.image); // jika user upload gambar baru
        } else {
            formData.append('existingImage', productData.image); // untuk jaga-jaga gambar lama
        }

        // Misal endpoint backend untuk edit: /api/products/:id
        fetch(`${BASE_BACKEND_URL}/api/products/${productId}`, {
            method: 'POST', // atau 'PUT' / 'PATCH' sesuai backend kamu
            body: formData
        })
            .then(response => {
                if (!response.ok) throw new Error('Gagal update produk');
                return response.json();
            })
            .then(updatedProduct => {
                // Opsional: update local data (kalau perlu)
                const category = window.productsData.categories.find(c => c.name === updatedProduct.category);
                if (category) {
                    const index = category.products.findIndex(p => p.id === updatedProduct.id);
                    if (index !== -1) {
                        category.products[index] = updatedProduct;
                    }
                }

                closeEditProductModal();
                alert('Produk berhasil diperbarui!');
                loadProducts();
            })
            .catch(error => {
                console.error('Error updating product:', error);
                alert('Terjadi kesalahan saat memperbarui produk.');
            });

        console.log('Saving edited product:', productData);
        closeEditProductModal();
        alert('Produk berhasil diperbarui!');
        loadProducts();
    } else {
        form.reportValidity();
    }
}

// Close modals when clicking outside
document.getElementById('editProductModal').addEventListener('click', function (event) {
    if (event.target === this) {
        closeEditProductModal();
    }
});

// Initialize trash array in window object
window.trashedProducts = [];

// Delete product function
function deleteProduct(productId) {
    if (confirm('Apakah Anda yakin ingin memindahkan produk ini ke tempat sampah?')) {
        const product = findProduct(productId);

        if (product) {
            fetch(`${BASE_BACKEND_URL}/api/products/${productId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) throw new Error('Gagal memindahkan produk');
                    return response.json();
                })
                .then(deletedProduct => {
                    window.trashedProducts.push({
                        ...deletedProduct,
                        deletedAt: new Date().getTime()
                    });

                    window.productsData.categories.forEach(category => {
                        category.products = category.products.filter(p => p.id !== productId);
                    });

                    // UI Update hanya setelah data benar-benar dihapus
                    loadProducts();
                    alert('Produk telah dipindahkan ke tempat sampah');
                })
                .catch(error => {
                    console.error(error);
                    alert('Terjadi kesalahan saat menghapus produk');
                });

        } else {
            console.log("Produk tidak ditemukan");
        }
    }
}

// Peringatan ketika meninggalkan halaman ada perubahan belum disimpan
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?';
    }
});

// Event listeners untuk search dan filter
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('productSearch');
    const categorySelect = document.getElementById('categoryFilter');

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filterDashboardProducts(searchTerm, categorySelect.value.toLowerCase());
    });

    categorySelect.addEventListener('change', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filterDashboardProducts(searchTerm, categorySelect.value.toLowerCase());
    });
});

function filterDashboardProducts(searchTerm, selectedCategory) {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
        const category = card.querySelector('.product-category')?.textContent.toLowerCase() || '';

        const isMatch = (!searchTerm || title.includes(searchTerm)) &&
            (!selectedCategory || category === selectedCategory);

        card.style.display = isMatch ? '' : 'none';
    });
    
    // Check for no results and show message
    checkDashboardNoResults();
}

function checkDashboardNoResults() {
    const productCards = document.querySelectorAll('.product-card');
    const visibleCards = Array.from(productCards).filter(card => 
        card.style.display !== 'none'
    );
    
    // Remove existing no results message
    const existingMessage = document.querySelector('.no-results-dashboard');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Add no results message if no visible cards
    if (visibleCards.length === 0) {
        // Find the best container for the message
        const container = document.querySelector('.products-container') || 
                         document.querySelector('.dashboard-content') ||
                         document.querySelector('.products-grid') ||
                         document.querySelector('.container') ||
                         document.body;
        
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results-dashboard';
        noResultsDiv.innerHTML = `
            <div style="
                text-align: center; 
                padding: 40px 20px; 
                color: #666;
                font-size: 16px;
                background: #f8f9fa;
                border-radius: 8px;
                margin: 20px;
                border: 1px solid #e9ecef;
            ">
                <div style="margin-bottom: 16px;">
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24" style="opacity: 0.4;">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                </div>
                <p style="margin: 0; font-weight: 600;">No Products Found</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #888;">
                    Try adjusting your search terms or category filter
                </p>
            </div>
        `;
        
        // Insert the message in the best location
        if (productCards.length > 0) {
            // Insert after the last product card's parent container
            const firstCard = productCards[0];
            const cardContainer = firstCard.parentElement;
            cardContainer.appendChild(noResultsDiv);
        } else {
            // Fallback: append to main container
            container.appendChild(noResultsDiv);
        }
    }
}


