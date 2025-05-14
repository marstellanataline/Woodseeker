
        // Add these variables at the top of your script
        let hasUnsavedChanges = false;
        const originalData = { categories: [] };

        // Modify checkAuth function
        function checkAuth() {
            const session = localStorage.getItem('adminSession');
            if (!session) {
                window.location.replace('login.html');
                return;
            }

            try {
                const sessionData = JSON.parse(session);
                const now = new Date().getTime();
                
                if (now - sessionData.timestamp > 24 * 60 * 60 * 1000) {
                    localStorage.removeItem('adminSession');
                    window.location.replace('login.html');
                    return;
                }

                document.getElementById('adminEmail').textContent = sessionData.email;
                document.getElementById('profileEmail').textContent = sessionData.email;
                
                // Check if there's saved data in localStorage
                const savedData = localStorage.getItem('productsData');
                if (savedData) {
                    window.productsData = JSON.parse(savedData);
                    originalData.categories = JSON.parse(savedData).categories;
                    loadProducts();
                } else {
                    // If no saved data, load from JSON file
                    fetch('../../data/products.json')
                        .then(response => response.json())
                        .then(data => {
                            window.productsData = data;
                            originalData.categories = JSON.parse(JSON.stringify(data.categories));
                            loadProducts();
                        });
                }
            } catch (e) {
                localStorage.removeItem('adminSession');
                window.location.replace('login.html');
            }
        }

        // Toggle profile dropdown
        function toggleProfileDropdown() {
            const dropdown = document.getElementById('profileDropdown');
            dropdown.classList.toggle('show');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const profile = document.querySelector('.header-profile');
            const dropdown = document.getElementById('profileDropdown');
            
            if (!profile.contains(event.target) && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        });

        // Handle logout
        function handleLogout() {
            localStorage.removeItem('adminSession');
            window.location.replace('login.html');
        }

        // Load products with sections
        async function loadProducts() {
            try {
                const listedGrid = document.getElementById('listedProductGrid');
                const unlistedGrid = document.getElementById('unlistedProductGrid');
                
                listedGrid.innerHTML = '';
                unlistedGrid.innerHTML = '';

                if (!window.productsData) {
                    const savedData = localStorage.getItem('productsData');
                    if (savedData) {
                        window.productsData = JSON.parse(savedData);
                    } else {
                        const response = await fetch('../../data/products.json');
                        window.productsData = await response.json();
                    }
                }

                window.productsData.categories.forEach(category => {
                    category.products.forEach(product => {
                        const card = createProductCard(product, category.name);
                        if (product.listed) {
                            listedGrid.appendChild(card);
                        } else {
                            unlistedGrid.appendChild(card);
                        }
                    });
                });

                // Check if current state differs from original
                const currentState = JSON.stringify(window.productsData);
                const originalState = JSON.stringify({ categories: originalData.categories });
                if (currentState !== originalState) {
                    markUnsavedChanges();
                }
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
            card.setAttribute('data-product-id', product.id);
            card.innerHTML = `
                <img src="../../assets/images/${product.image}" alt="${product.name}" class="product-image">
                <div class="product-content">
                    <div class="product-header">
                        <h3 class="product-title">${product.name}</h3>
                        <span class="status-badge ${product.listed ? 'listed' : 'unlisted'}">
                            ${product.listed ? 'Ditampilkan di Web' : 'Draf'}
                        </span>
                    </div>
                    <div class="product-category">${category}</div>
                    <div class="product-price">Rp ${formatPrice(product.price)}</div>
                    <div class="product-actions">
                        <div class="action-row">
                            <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="toggle-list-btn ${product.listed ? 'unlist' : 'list'}" 
                                    onclick="toggleProductListing('${product.id}', ${!product.listed})">
                                <i class="fas fa-${product.listed ? 'eye-slash' : 'eye'}"></i>
                                ${product.listed ? 'Sembunyikan' : 'Tampilkan'}
                            </button>
                        </div>
                        <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                            Hapus
                        </button>
                    </div>
                </div>
            `;
            return card;
        }

        // Product actions
        function addProduct() {
            document.getElementById('addProductModal').classList.add('show');
            document.getElementById('addProductForm').reset();
            document.getElementById('imagePreview').style.backgroundImage = '';
            document.getElementById('imagePreview').classList.add('empty');
            colors = [];
            updateColorList();
        }

        function editProduct(id) {
            // Implement edit product functionality
            console.log('Editing product:', id);
        }

        function deleteProduct(id) {
            if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                // Implement delete product functionality
                console.log('Deleting product:', id);
            }
        }

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
                reader.onload = function(e) {
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
        let colors = [];

        function addCurrentColor() {
            const colorPicker = document.getElementById('colorPicker');
            const colorValue = colorPicker.value;
            
            if (colorValue) {
                const colorData = {
                    name: colorValue.toUpperCase(),
                    value: colorValue
                };
                
                if (!colors.some(c => c.value === colorValue)) {
                    colors.push(colorData);
                    updateColorList();
                }
            }
        }

        function removeColor(index) {
            colors.splice(index, 1);
            updateColorList();
        }

        function updateColorList() {
            const colorList = document.getElementById('colorList');
            colorList.innerHTML = colors.map((color, index) => `
                <div class="color-item">
                    <div class="color-preview" style="background-color: ${color.value}"></div>
                    <span>${color.name}</span>
                    <button type="button" onclick="removeColor(${index})">&times;</button>
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
                if (!window.productsData) {
                    throw new Error('Products data not loaded');
                }

                let productFound = false;
                window.productsData.categories.forEach(category => {
                    category.products.forEach(product => {
                        if (product.id === productId) {
                            product.listed = newListedStatus;
                            productFound = true;
                        }
                    });
                });

                if (!productFound) {
                    throw new Error('Product not found');
                }

                // Remove the product card from DOM
                const card = document.querySelector(`[data-product-id="${productId}"]`);
                if (card) {
                    card.remove();
                }

                // Create new card in the appropriate section
                const product = findProduct(productId);
                if (product) {
                    const newCard = createProductCard(product.product, product.category);
                    const targetGrid = newListedStatus ? 
                        document.getElementById('listedProductGrid') : 
                        document.getElementById('unlistedProductGrid');
                    targetGrid.appendChild(newCard);
                }

                // Switch to the appropriate section
                switchSection(newListedStatus ? 'listed' : 'unlisted');

                // Mark changes as unsaved
                markUnsavedChanges();

                // Show success message
                const message = newListedStatus ? 
                    'Produk berhasil dipindahkan ke Ditampilkan' : 
                    'Produk berhasil dipindahkan ke Disembunyikan';
                alert(message);

            } catch (error) {
                console.error('Error toggling product listing:', error);
                alert('Gagal memindahkan produk. Silakan coba lagi.');
            }
        }

        // Helper function to find product by ID
        function findProduct(productId) {
            for (const category of window.productsData.categories) {
                const product = category.products.find(p => p.id === productId);
                if (product) {
                    return { product, category: category.name };
                }
            }
            return null;
        }

        // Save product to unlisted section
        function saveProduct() {
            const form = document.getElementById('addProductForm');
            if (form.checkValidity()) {
                // Generate a unique ID for the new product
                const newProductId = 'product_' + new Date().getTime();

                // Get the file name from the file input
                const fileInput = document.getElementById('productImage');
                const fileName = fileInput.files[0] ? fileInput.files[0].name : '';

                const productData = {
                    id: newProductId,
                    name: document.getElementById('productName').value,
                    price: parseInt(document.getElementById('productPrice').value),
                    image: fileName,
                    colors: colors,
                    description: document.getElementById('productDescription').value,
                    listed: false // New products are unlisted by default
                };

                // Find the category in productsData and add the new product
                const category = document.getElementById('productCategory').value;
                let categoryFound = false;

                window.productsData.categories.forEach(cat => {
                    if (cat.name === category) {
                        categoryFound = true;
                        cat.products.push(productData);
                    }
                });

                // If category doesn't exist, create it
                if (!categoryFound) {
                    window.productsData.categories.push({
                        name: category,
                        products: [productData]
                    });
                }

                // Update UI
                loadProducts();
                closeAddProductModal();
                switchSection('unlisted');
                alert('Produk berhasil ditambahkan ke Disembunyikan!');
            } else {
                form.reportValidity();
            }
        }

        // Close modal when clicking outside
        document.getElementById('addProductModal').addEventListener('click', function(event) {
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
            editImagePreview.style.backgroundImage = `url(../../assets/images/${product.product.image})`;
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

        function addCurrentColorEdit() {
            const colorPicker = document.getElementById('editColorPicker');
            const colorValue = colorPicker.value;
            
            if (colorValue) {
                const colorData = {
                    name: colorValue.toUpperCase(),
                    value: colorValue
                };
                
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
                reader.onload = function(e) {
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
                window.productsData.categories.forEach(category => {
                    category.products.forEach(product => {
                        if (product.id === productId) {
                            Object.assign(product, productData);
                        }
                    });
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
        document.getElementById('editProductModal').addEventListener('click', function(event) {
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
                    // Remove from current data
                    window.productsData.categories.forEach(category => {
                        category.products = category.products.filter(p => p.id !== productId);
                    });

                    // Add to trash with timestamp
                    window.trashedProducts.push({
                        ...product.product,
                        category: product.category,
                        deletedAt: new Date().getTime()
                    });

                    // Update UI
                    loadProducts();
                    updateTrashCount();
                    alert('Produk telah dipindahkan ke tempat sampah');
                }
            }
        }

        // Update trash count
        function updateTrashCount() {
            const count = window.trashedProducts.length;
            const trashCount = document.getElementById('trashCount');
            trashCount.textContent = count;
            trashCount.style.display = count > 0 ? 'flex' : 'none';
        }

        // Create trash product card
        function createTrashProductCard(product) {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="../../assets/images/${product.image}" alt="${product.name}" class="product-image">
                <div class="product-content">
                    <div class="product-header">
                        <h3 class="product-title">${product.name}</h3>
                    </div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">Rp ${formatPrice(product.price)}</div>
                    <div class="trash-actions">
                        <button class="action-btn restore-btn" onclick="restoreProduct('${product.id}')">
                            <i class="fas fa-undo"></i>
                            Kembalikan
                        </button>
                        <button class="action-btn permanent-delete-btn" onclick="permanentDelete('${product.id}')">
                            <i class="fas fa-trash"></i>
                            Hapus Permanen
                        </button>
                    </div>
                </div>
            `;
            return card;
        }

        // Restore product from trash
        function restoreProduct(productId) {
            const productIndex = window.trashedProducts.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                const product = window.trashedProducts[productIndex];
                
                // Remove from trash
                window.trashedProducts.splice(productIndex, 1);

                // Add back to appropriate category
                let categoryFound = false;
                window.productsData.categories.forEach(category => {
                    if (category.name === product.category) {
                        categoryFound = true;
                        category.products.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image,
                            colors: product.colors,
                            description: product.description,
                            listed: false // Restored products go to unlisted by default
                        });
                    }
                });

                // Update UI
                loadProducts();
                loadTrashProducts();
                updateTrashCount();
                alert('Produk berhasil dikembalikan ke Disembunyikan');
            }
        }

        // Permanent delete
        function permanentDelete(productId) {
            if (confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
                const productIndex = window.trashedProducts.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    window.trashedProducts.splice(productIndex, 1);
                    loadTrashProducts();
                    updateTrashCount();
                    alert('Produk telah dihapus secara permanen');
                }
            }
        }

        // Load trash products
        function loadTrashProducts() {
            const trashGrid = document.getElementById('trashProductGrid');
            trashGrid.innerHTML = '';
            
            if (window.trashedProducts.length === 0) {
                trashGrid.innerHTML = '<div class="empty-trash">Tempat sampah kosong</div>';
                return;
            }

            window.trashedProducts.forEach(product => {
                const card = createTrashProductCard(product);
                trashGrid.appendChild(card);
            });
        }

        // Add function to mark unsaved changes
        function markUnsavedChanges() {
            hasUnsavedChanges = true;
            const saveBtn = document.getElementById('saveChangesBtn');
            if (!saveBtn.querySelector('.unsaved-indicator')) {
                saveBtn.innerHTML += '<span class="unsaved-indicator"></span>';
            }
        }

        // Modify save changes functionality
        async function saveChanges() {
            const saveBtn = document.getElementById('saveChangesBtn');
            
            if (saveBtn.classList.contains('saving')) {
                return;
            }

            try {
                saveBtn.classList.add('saving');
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

                // Save to localStorage
                localStorage.setItem('productsData', JSON.stringify(window.productsData));
                
                // Update original data
                originalData.categories = JSON.parse(JSON.stringify(window.productsData.categories));
                
                // Reset unsaved changes state
                hasUnsavedChanges = false;
                const indicator = saveBtn.querySelector('.unsaved-indicator');
                if (indicator) {
                    indicator.remove();
                }

                alert('Perubahan berhasil disimpan!');

            } catch (error) {
                console.error('Error saving changes:', error);
                alert('Gagal menyimpan perubahan. Silakan coba lagi.');
            } finally {
                saveBtn.classList.remove('saving');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            }
        }

        // Add warning when leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?';
            }
        });

        // Initialize
        checkAuth();
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

    