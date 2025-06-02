
// Add these variables at the top of your script
let hasUnsavedChanges = false;
const originalData = { categories: [] };

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
        const res = await fetch('http://localhost:5000/api/auth/verify', {
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
        const listedGrid = document.getElementById('listedProductGrid');
        const unlistedGrid = document.getElementById('unlistedProductGrid');

        listedGrid.innerHTML = '';
        unlistedGrid.innerHTML = '';

        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('Gagal mengambil data produk dari server.');

        const products = await response.json();
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

async function handleAddProduct() {
    const modal = document.getElementById('addProductModal');
    modal.classList.add('show');

    const form = document.getElementById('addProductForm');
    form.reset();

    // const preview = document.getElementById('imagePreview');
    // preview.style.backgroundImage = '';
    // preview.classList.add('empty');

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
        const image = document.getElementById('productImage').value.trim(); // hanya ambil nama file
        const selectedColors = [...colors];

        if (!name || isNaN(price) || isNaN(stock) || !category || !image) {
            alert('Mohon lengkapi semua data yang dibutuhkan.');
            return;
        }

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
            category_id: category, // pastikan ini ID, bukan nama!
            status: "unlisted", // default unlisted
            colors: selectedColors
        };

        try {
            const response = await fetch('http://localhost:5000/api/products/add', {
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
                colors: selectedColors,
                listed: false // karena status = draft
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
  event.preventDefault(); // Biar gak reload halaman

  const form = document.getElementById("editProductForm");
  const productId = form.getAttribute("data-product-id"); // Pastikan diset waktu buka modal edit

  const productData = {
    name: form.productName.value,
    category_id: parseInt(form.productCategory.value),
    price: parseFloat(form.productPrice.value),
    material: form.productMaterial.value,
    stock: parseInt(form.productStock.value),
    weight: parseFloat(form.productWeight.value),
    width: parseFloat(form.productWidth.value),
    depth: parseFloat(form.productLength.value), // panjang jadi depth
    height: parseFloat(form.productHeight.value),
    colors: selectedEditColors, // variabel ini perlu disiapkan sama kayak di addProduct
    image: form.productImage.value,
    description: form.productDescription.value,
    status: "draft"
  };

  try {
    const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      throw new Error("Gagal mengedit produk.");
    }

    alert("Produk berhasil diedit!");
    closeEditProductModal();
    await loadProducts(); // refresh daftar produk

  } catch (error) {
    console.error("Error editing product:", error);
    alert("Terjadi kesalahan saat mengedit produk.");
  }
}

// // Product actions
// async function addProduct() {
//     const modal = document.getElementById('addProductModal');
//     modal.classList.add('show');

//     const form = document.getElementById('addProductForm');
//     form.reset();

//     const preview = document.getElementById('imagePreview');
//     preview.style.backgroundImage = '';
//     preview.classList.add('empty');

//     colors = [];
//     updateColorList();

//     form.onsubmit = async function (e) {
//         e.preventDefault();

//         const formData = new FormData(form);
//         formData.append('selectedColors', JSON.stringify(colors));
//         console.log(formData)

//         try {
//             const response = await fetch('http://localhost:5000/api/products', {
//                 method: 'POST',
//                 body: formData
//             });

//             console.log(response)

//             if (response.ok) {
//                 alert('Produk berhasil ditambahkan.');
//                 modal.classList.remove('show');
//                 await loadProducts(); // Refresh tampilan
//             } else {
//                 const result = await response.json();
//                 alert('Gagal menambahkan produk: ' + result.message);
//             }
//         } catch (err) {
//             console.error('Error adding product:', err);
//             alert('Terjadi kesalahan saat menambahkan produk.');
//         }
//     };
// }

// async function editProduct(id) {
//     try {
//         const response = await fetch(`http://localhost:5000/api/products/${id}`);
//         const product = await response.json();

//         // Isi modal edit dengan data produk
//         const modal = document.getElementById('editProductModal');
//         modal.classList.add('show');

//         const form = document.getElementById('editProductForm');
//         form.product_id.value = product.product_id;
//         form.name.value = product.name;
//         form.price.value = product.price;
//         form.stock.value = product.stock;
//         form.description.value = product.description;
//         form.category_id.value = product.category_id;

//         // Update preview gambar
//         const preview = document.getElementById('editImagePreview');
//         preview.style.backgroundImage = `url('../../assets/images/${product.image}')`;
//         preview.classList.remove('empty');

//         colors = product.colors || [];
//         updateEditColorList();

//         // Submit handler
//         form.onsubmit = async function (e) {
//             e.preventDefault();
//             const formData = new FormData(form);
//             formData.append('selectedColors', JSON.stringify(colors));

//             try {
//                 const updateRes = await fetch(`http://localhost:5000/api/products/${id}`, {
//                     method: 'PUT',
//                     body: formData
//                 });

//                 if (updateRes.ok) {
//                     alert('Produk berhasil diupdate.');
//                     modal.classList.remove('show');
//                     await loadProducts();
//                 } else {
//                     const result = await updateRes.json();
//                     alert('Gagal mengupdate produk: ' + result.message);
//                 }
//             } catch (err) {
//                 console.error('Error updating product:', err);
//                 alert('Terjadi kesalahan saat mengupdate produk.');
//             }
//         };

//     } catch (err) {
//         console.error('Gagal mengambil data produk untuk edit:', err);
//     }
// }

// async function deleteProduct(id) {

//     if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
//         try {
//             const response = await fetch(`http://localhost:5000/api/products/${id}`, {
//                 method: 'DELETE'
//             });

//             console.log(response)

//             if (response.ok) {
//                 alert('Produk berhasil dihapus.');
//                 await loadProducts(); // Refresh tampilan
//             } else {
//                 const result = await response.json();
//                 alert('Gagal menghapus produk: ' + result.message);
//             }
//         } catch (err) {
//             console.error('Error deleting product:', err);
//             alert('Terjadi kesalahan saat menghapus produk.');
//         }
//     }
// }

// Search and filter
function searchProducts(value) {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        const category = card.querySelector('.product-category').textContent.toLowerCase();
        const searchText = value.toLowerCase();

        card.style.display = title.includes(searchText) || category.includes(searchText) ? '' : 'none';
    });
}

function filterByCategory(category) {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const cardCategory = card.querySelector('.product-category').textContent.toLowerCase();
        card.style.display = !category || cardCategory === category ? '' : 'none';
    });
}

// Add Product Modal Functions
function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('show');
}

function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.style.backgroundImage = `url(${e.target.result})`;
            preview.classList.remove('empty');
        }
        reader.readAsDataURL(file);
    } else {
        preview.style.backgroundImage = '';
        preview.classList.add('empty');
    }
}

// Color management
let selectedColors = [];

function addSelectedColor() {
    const dropdown = document.getElementById('colorDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const colorId = selectedOption.value;
    const colorName = selectedOption.text;
    const colorHex = selectedOption.getAttribute('data-hex');

    const colorData = {
        id: colorId,
        name: colorName,
        hex: colorHex
    };

    // Cek apakah sudah dipilih
    if (!selectedColors.some(c => c.id === colorId)) {
        selectedColors.push(colorData);
        updateColorList();
    }
}

function removeColor(index) {
    selectedColors.splice(index, 1);
    updateColorList();
}

function updateColorList() {
    const colorList = document.getElementById('colorList');
    colorList.innerHTML = selectedColors.map((color, index) => `
        <div class="color-item">
            <div class="color-preview" style="background-color: ${color.hex}"></div>
            <span>${color.name}</span>
            <button type="button" onclick="removeColor(${index})">&times;</button>
            <input type="hidden" name="warna_id[]" value="${color.id}">
        </div>
    `).join('');
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
        const response = await fetch(`http://localhost:5000/api/products/${productId}/listing`, {
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
        const updatedProductRes = await fetch(`http://localhost:5000/api/products/${productId}`);
        const updatedProduct = await updatedProductRes.json();

        // Tambahkan kartu baru ke lokasi yang sesuai
        const targetGrid = newListedStatus
            ? document.getElementById('listedProductGrid')
            : document.getElementById('unlistedProductGrid');

        const categoryData = await fetch(`http://localhost:5000/api/categories/${updatedProduct.category_id}`).then(res => res.json());
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

// // Save product to unlisted section
// function saveProduct() {
//     const form = document.getElementById('addProductForm');
//     if (form.checkValidity()) {
//         const newProductId = 'product_' + new Date().getTime();

//         const fileInput = document.getElementById('productImage');
//         const fileName = fileInput.files[0] ? fileInput.files[0].name : '';

//         const name = document.getElementById('productName').value.trim();
//         const price = parseInt(document.getElementById('productPrice').value);
//         const description = document.getElementById('productDescription').value.trim();
//         const category = document.getElementById('productCategory').value.trim();

//         // Validasi tambahan
//         if (!name || isNaN(price) || price < 0 || !category) {
//             alert('Mohon isi semua data dengan benar.');
//             return;
//         }

//         const productData = {
//             id: newProductId,
//             name,
//             price,
//             image: fileName,
//             colors: [...selectedColors], // Hindari referensi langsung
//             description,
//             listed: false
//         };

//         let categoryFound = false;
//         for (const cat of window.productsData.categories) {
//             if (cat.name === category) {
//                 cat.products.push(productData);
//                 categoryFound = true;
//                 break;
//             }
//         }

//         if (!categoryFound) {
//             window.productsData.categories.push({
//                 name: category,
//                 products: [productData]
//             });
//         }

//         // Reset form dan UI
//         form.reset();
//         selectedColors = [];
//         updateColorList();

//         loadProducts();
//         closeAddProductModal();
//         switchSection('unlisted');
//         alert('Produk berhasil ditambahkan ke Disembunyikan!');
//     } else {
//         form.reportValidity();
//     }
// }

// Close modal when clicking outside
document.getElementById('addProductModal').addEventListener('click', function (event) {
    if (event.target === this) {
        closeAddProductModal();
    }
});

// Edit product functions
let editColors = [];

function editProduct(productId) {
    const product = findProduct(productId);
    if (!product) return;

    // Reset edit colors array
    editColors = [...(product.product.colors || [])];

    // Fill form with product data
    document.getElementById('editProductId').value = productId;
    document.getElementById('editProductName').value = product.product.name;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductPrice').value = product.product.price;
    document.getElementById('editProductDescription').value = product.product.description || '';

    // Update color list
    updateEditColorList();

    // Show current image
    const editImagePreview = document.getElementById('editImagePreview');
    editImagePreview.style.backgroundImage = `url(${product.product.image})`;
    editImagePreview.classList.remove('empty');

    // Show modal
    document.getElementById('editProductModal').classList.add('show');
}

function closeEditProductModal() {
    document.getElementById('editProductModal').classList.remove('show');
    document.getElementById('editProductForm').reset();
    document.getElementById('editImagePreview').style.backgroundImage = '';
    document.getElementById('editImagePreview').classList.add('empty');
    editColors = [];
    updateEditColorList();
}

function addSelectedColorEdit() {
    const dropdown = document.getElementById('editColorDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const colorName = selectedOption.text;
    const colorValue = selectedOption.getAttribute('data-hex');

    if (colorValue) {
        const colorData = {
            name: colorName,
            value: colorValue
        };

        // Cek apakah warna sudah ada
        if (!editColors.some(c => c.value === colorValue)) {
            editColors.push(colorData);
            updateEditColorList();
        }
    }
}

function removeEditColor(index) {
    editColors.splice(index, 1);
    updateEditColorList();
}

function updateEditColorList() {
    const colorList = document.getElementById('editColorList');
    colorList.innerHTML = editColors.map((color, index) => `
        <div class="color-item">
            <div class="color-preview" style="background-color: ${color.value}"></div>
            <span>${color.name}</span>
            <button type="button" onclick="removeEditColor(${index})">&times;</button>
        </div>
    `).join('');
}

function previewEditImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('editImagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.style.backgroundImage = `url(${e.target.result})`;
            preview.classList.remove('empty');
        }
        reader.readAsDataURL(file);
    } else {
        preview.style.backgroundImage = '';
        preview.classList.add('empty');
    }
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
        fetch(`http://localhost:5000/api/products/${productId}`, {
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
            fetch(`http://localhost:5000/api/products/${productId}`, {
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

// // Update trash count
// function updateTrashCount() {
//     const count = window.trashedProducts.length;
//     const trashCount = document.getElementById('trashCount');
//     trashCount.textContent = count;
//     trashCount.style.display = count > 0 ? 'flex' : 'none';
// }

// // Create trash product card
// function createTrashProductCard(product) {
//     const card = document.createElement('div');
//     card.className = 'product-card';
//     card.innerHTML = `
//                 <img src="../../assets/images/${product.image}" alt="${product.name}" class="product-image">
//                 <div class="product-content">
//                     <div class="product-header">
//                         <h3 class="product-title">${product.name}</h3>
//                     </div>
//                     <div class="product-category">${product.category}</div>
//                     <div class="product-price">Rp ${formatPrice(product.price)}</div>
//                     <div class="trash-actions">
//                         <button class="action-btn restore-btn" onclick="restoreProduct('${product.id}')">
//                             <i class="fas fa-undo"></i>
//                             Kembalikan
//                         </button>
//                         <button class="action-btn permanent-delete-btn" onclick="permanentDelete('${product.id}')">
//                             <i class="fas fa-trash"></i>
//                             Hapus Permanen
//                         </button>
//                     </div>
//                 </div>
//             `;
//     return card;
// }

// // Restore product from trash
// function restoreProduct(productId) {
//     const productIndex = window.trashedProducts.findIndex(p => p.id === productId);
//     if (productIndex !== -1) {
//         const product = window.trashedProducts[productIndex];

//         fetch(`http://localhost:5000/api/products/${productId}/restore`, {
//             method: 'PATCH'
//         })
//             .then(response => {
//                 if (!response.ok) throw new Error('Gagal mengembalikan produk');
//                 return response.json();
//             })
//             .then(restoredProduct => {
//                 // Hapus dari trash lokal
//                 window.trashedProducts.splice(productIndex, 1);

//                 // Tambahkan kembali ke data
//                 const category = window.productsData.categories.find(c => c.name === restoredProduct.category);
//                 if (category) {
//                     category.products.push(restoredProduct);
//                 }

//                 loadProducts();
//                 loadTrashProducts();
//                 updateTrashCount();
//                 alert('Produk berhasil dikembalikan ke Disembunyikan');
//             })
//             .catch(error => {
//                 console.error(error);
//                 alert('Terjadi kesalahan saat mengembalikan produk');
//             });

//         // Update UI
//         loadProducts();
//         loadTrashProducts();
//         updateTrashCount();
//         alert('Produk berhasil dikembalikan ke Disembunyikan');
//     }
// }

// // Permanent delete
// function permanentDelete(productId) {
//     if (confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
//         fetch(`http://localhost:5000/api/products/${productId}/permanent`, {
//             method: 'DELETE'
//         })
//             .then(response => {
//                 if (!response.ok) throw new Error('Gagal menghapus permanen');
//                 return response.json();
//             })
//             .then(() => {
//                 window.trashedProducts = window.trashedProducts.filter(p => p.id !== productId);
//                 loadTrashProducts();
//                 updateTrashCount();
//                 alert('Produk telah dihapus secara permanen');
//             })
//             .catch(error => {
//                 console.error(error);
//                 alert('Terjadi kesalahan saat menghapus produk');
//             });
//     }
// }
// // Load trash products dari backend
// async function loadTrashProducts() {
//     const trashGrid = document.getElementById('trashProductGrid');
//     trashGrid.innerHTML = '';

//     try {
//         const response = await fetch('http://localhost:5000/api/products/trash'); // misal endpoint backend untuk data trash
//         if (!response.ok) throw new Error('Gagal mengambil data tempat sampah');
//         const trashedProducts = await response.json();

//         if (trashedProducts.length === 0) {
//             trashGrid.innerHTML = '<div class="empty-trash">Tempat sampah kosong</div>';
//             return;
//         }

//         trashedProducts.forEach(product => {
//             const card = createTrashProductCard(product);
//             trashGrid.appendChild(card);
//         });
//     } catch (error) {
//         console.error(error);
//         trashGrid.innerHTML = '<div class="error">Gagal memuat data tempat sampah</div>';
//     }
// }

// // Tandai ada perubahan belum disimpan
// function markUnsavedChanges() {
//     hasUnsavedChanges = true;
//     const saveBtn = document.getElementById('saveChangesBtn');
//     if (!saveBtn.querySelector('.unsaved-indicator')) {
//         saveBtn.innerHTML += '<span class="unsaved-indicator"></span>';
//     }
// }

// // Simpan perubahan ke backend
// async function saveChanges() {
//     const saveBtn = document.getElementById('saveChangesBtn');

//     if (saveBtn.classList.contains('saving')) {
//         return;
//     }

//     try {
//         saveBtn.classList.add('saving');
//         saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

//         // Color mapping (sesuaikan dengan database Anda)
//         const colorMapping = {
//             'white': 1,
//             'brown': 2,
//             'black': 3,
//             'grey': 4,
//             // ... tambahkan mapping lainnya
//         };

//         const allProducts = [];
//         window.productsData.categories.forEach(category => {
//             category.products.forEach(product => {
//                 // Hapus field yang tidak perlu untuk backend
//                 const { category_name, ...cleanProduct } = product;

//                 const transformedProduct = {
//                     ...cleanProduct,
//                     colors: product.colors.map(colorName => colorMapping[colorName]).filter(id => id)
//                 };
//                 allProducts.push(transformedProduct);
//             });
//         });

//         console.log('📊 Status produk yang akan disimpan:');
//         allProducts.forEach(product => {
//             console.log(`- ${product.name}: ${product.status}`);
//         });
//         console.log('Produk setelah transform:', allProducts[0]);

//         // DEBUG: Lihat struktur produk pertama
//         console.log('Total produk:', allProducts.length);
//         console.log('Struktur produk pertama:', allProducts[0]);
//         console.log('Field yang ada:', Object.keys(allProducts[0]));

//         const response = await fetch('http://localhost:5000/api/products/update-many', {
//             method: 'PUT',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(allProducts) // Kirim array produk
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             console.log('Server error response:', errorText);
//             throw new Error(`Gagal menyimpan perubahan: ${errorText}`);
//         }

//         hasUnsavedChanges = false;
//         const indicator = saveBtn.querySelector('.unsaved-indicator');
//         if (indicator) indicator.remove();

//         alert('Perubahan berhasil disimpan!');
//     } catch (error) {
//         console.error('Error saving changes:', error);
//         alert('Gagal menyimpan perubahan. Silakan coba lagi.');
//     } finally {
//         saveBtn.classList.remove('saving');
//         saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
//     }
// }

// Peringatan ketika meninggalkan halaman ada perubahan belum disimpan
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?';
    }
});

// diperbaiki
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
}

