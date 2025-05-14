// Initialize map
function initMap() {
    // Replace with your actual coordinates
    const location = { lat: -6.914744, lng: 107.609810 };
    const mapElement = document.querySelector('.map');
    if (mapElement && typeof google !== 'undefined') {
        const map = new google.maps.Map(mapElement, {
            zoom: 15,
            center: location,
        });

        new google.maps.Marker({
            position: location,
            map: map,
        });
    }
}

// Load component function
async function loadComponent(url, containerId) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
        // Initialize hamburger menu after loading header
        if (containerId === 'header-container') {
            initHamburgerMenu();
        }
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('myForm');
    const templateId = form.getAttribute('data-template-id'); // Ambil template ID dari atribut data

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const isValid = form.checkValidity(); // Validasi form
        if (isValid) {
            emailjs.sendForm('woodseeker', templateId, form)
                .then(function () {
                    alert('Pesan berhasil dikirim!');
                    form.reset();
                }, function (error) {
                    alert('Gagal mengirim pesan: ' + JSON.stringify(error));
                    console.error('EmailJS Error:', error);
                });
        } else {
            alert('Please fill in all required fields.');
        }
    });
});



// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80, // Adjust for fixed header
                behavior: 'smooth'
            });
        }
    });
});

//b2b


// Mobile menu toggle (to be implemented with additional HTML/CSS)
function toggleMobileMenu() {
    const nav = document.querySelector('.nav-menu');
    nav.classList.toggle('active');
}

// Image slider for hero section
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
    if (!slides.length) return;

    slides[currentSlide].classList.remove('active'); // slide lama
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active'); // slide baru
}

// Auto advance slides
setInterval(() => {
    showSlide(currentSlide + 1);
}, 5000);

// Initialize first slide
showSlide(0);

// Color selection functionality for product cards
document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', function() {
        const card = this.closest('.category-card');
        card.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        this.classList.add('selected');
    });
});

// Function to handle order button click
function handleOrderClick(productName, category) {
    // Get selected color
    const selectedColor = document.querySelector('input[name="color"]:checked');
    const colorValue = selectedColor ? selectedColor.value : '';
    // Store product details in sessionStorage
    const productDetails = {
        name: productName,
        category: category,
        color: colorValue
    };
    sessionStorage.setItem('productDetails', JSON.stringify(productDetails));
    // Redirect to contact page
    window.location.href = '../pages/contact.html';
}

// Function to pre-fill contact form
function prefillContactForm() {
    const productDetails = sessionStorage.getItem('productDetails');
    if (productDetails) {
        const details = JSON.parse(productDetails);
        // Pre-fill the form fields
        const namaProdukInput = document.getElementById('namaProduk');
        const kategoriSelect = document.getElementById('kategori');
        const rincianTextarea = document.getElementById('rincian');
        if (namaProdukInput) namaProdukInput.value = details.name;
        if (kategoriSelect) kategoriSelect.value = details.category.toLowerCase();
        if (rincianTextarea && details.color) {
            // Capitalize first letter of color
            const capitalizedColor = details.color.charAt(0).toUpperCase() + details.color.slice(1);
            rincianTextarea.value = `Warna yang diinginkan: ${capitalizedColor}`;
        }
        // Clear the stored data
        sessionStorage.removeItem('productDetails');
    }
}

// Function to load product details
async function loadProductDetails(productId) {
    try {
        const response = await fetch('../data/products.json');
        const data = await response.json();
        // Find the product in the categories
        let foundProduct = null;
        for (const category of data.categories) {
            const product = category.products.find(p => p.id === productId);
            if (product) {
                foundProduct = product;
                break;
            }
        }

        if (foundProduct) {
            // Update page title
            document.title = `${foundProduct.name} - WOODSEEKER`;

            // Update product information
            document.querySelector('.product-info h1').textContent = foundProduct.name;
            document.querySelector('.product-info .price').textContent = `Rp ${foundProduct.price.toLocaleString()}`;

            // Update meta information
            const metaValues = document.querySelectorAll('.meta-item .value');
            metaValues[0].textContent = foundProduct.category || '';

            // Update main image
            const mainImage = document.getElementById('mainImage');
            if (mainImage) {
                mainImage.src = `../assets/images/${foundProduct.image}`;
                mainImage.alt = foundProduct.name;
            }

            // Update color options if available
            if (foundProduct.colors && foundProduct.colors.length > 0) {
                const colorOptions = document.querySelector('.color-options');
                colorOptions.innerHTML = foundProduct.colors.map(color => `
                    <label class="color-option">
                        <input type="radio" name="color" value="${color}" ${color === foundProduct.colors[0] ? 'checked' : ''}>
                        <span class="color-dot ${color}"></span>
                        <span>${color.charAt(0).toUpperCase() + color.slice(1)}</span>
                    </label>
                `).join('');
            }

            // Update order button
            const orderButton = document.querySelector('.buy-now');
            if (orderButton) {
                orderButton.onclick = () => handleOrderClick(foundProduct.name, foundProduct.category || '');
            }

            // Update specifications
            const specsList = document.querySelector('.specs ul');
            if (specsList) {
                specsList.innerHTML = `
                    <li><strong>Material:</strong> ${foundProduct.material || 'Solid Wood'}</li>
                    <li><strong>Dimensions:</strong> ${foundProduct.dimensions ? 
                        `${foundProduct.dimensions.width}cm x ${foundProduct.dimensions.depth}cm x ${foundProduct.dimensions.height}cm` 
                        : 'N/A'}</li>
                    <li><strong>Weight:</strong> ${foundProduct.weight || 'N/A'}</li>
                `;
            }

            // Update description
            const description = document.querySelector('.description p');
            if (description) {
                description.textContent = foundProduct.description;
            }

            // Update stock info
            const stockStatus = document.querySelector('.stock-status');
            if (stockStatus) {
                const inStock = foundProduct.stock > 0;
                stockStatus.className = `stock-status ${inStock ? 'in-stock' : 'out-of-stock'}`;
                stockStatus.textContent = inStock ? 'In Stock' : 'Out of Stock';
            }
        }
    } catch (error) {
        console.error('Error loading product details:', error);
    }
}

// Initialize hamburger menu functionality
function initHamburgerMenu() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    // Remove any existing overlay first
    const existingOverlay = document.querySelector('.menu-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    // Create new overlay
    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    document.body.appendChild(menuOverlay);

    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            menuOverlay.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
            }
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
            });
        });
    }
}

// Load featured products
async function loadFeaturedProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        const track = document.querySelector('.product-track');
        
        // Get featured products (first product from each category)
        const featuredProducts = data.categories
            .map(category => category.products[0])
            .filter(product => product);

        // Create inner container for animation
        const trackInner = document.createElement('div');
        trackInner.className = 'product-track-inner';

        // Create original set of cards
        featuredProducts.forEach(product => {
            const card = createProductCard(product);
            trackInner.appendChild(card);
        });

        // Clone the products for smooth infinite scroll
        featuredProducts.forEach(product => {
            const card = createProductCard(product);
            trackInner.appendChild(card);
        });

        // Add the inner track to the main track
        track.appendChild(trackInner);

        // Set CSS variable for animation
        document.documentElement.style.setProperty('--card-count', featuredProducts.length);

        // Clone the inner track when animation is near end
        trackInner.addEventListener('animationend', () => {
            trackInner.style.animation = 'none';
            trackInner.offsetHeight; // Trigger reflow
            trackInner.style.animation = null;
        });

    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="assets/images/${product.image}" alt="${product.name}">
        <div class="product-card-content">
            <h3>${product.name}</h3>
            <p class="price">Rp ${product.price.toLocaleString()}</p>
            <a href="pages/product-detail.html?id=${product.id}" class="btn-small">View Details</a>
        </div>
    `;
    return card;
}

// Initialize hero slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slider .slide');
    const indicators = document.querySelectorAll('.slide-indicators .indicator');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlide = 0;
    let slideInterval;
    let touchStartX = 0;
    let touchEndX = 0;

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        indicators[currentSlide].classList.remove('active');

        currentSlide = index;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;

        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Event listeners for navigation buttons
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prevSlide();
            resetInterval();
        });

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            nextSlide();
            resetInterval();
        });
    }

    // Event listeners for indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
            resetInterval();
        });
    });

    // Touch events for mobile swipe
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        heroSection.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
            resetInterval();
        }
    }

    // Auto advance slides
    function startInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    startInterval();
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the index page
    const isIndexPage = window.location.pathname === '/' ||
        window.location.pathname.endsWith('index.html');

    // Load components with correct paths
    const componentPath = isIndexPage ? 'components/' : '../components/';
    loadComponent(componentPath + 'header.html', 'header-container');
    loadComponent(componentPath + 'footer.html', 'footer-container');
    loadComponent(componentPath + 'hero.html', 'hero-placeholder');
    loadComponent(componentPath + 'contact-form.html', 'contact-form-container');
    loadComponent(componentPath + 'contact-info.html', 'contact-info-container');
    // Initialize features specific to index page
    if (isIndexPage) {
        loadComponent(componentPath + 'hero.html', 'hero-placeholder').then(() => {
            initHeroSlider();
        });
        loadFeaturedProducts();
    }
}); 