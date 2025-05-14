        document.addEventListener('DOMContentLoaded', function() {
            // Load components with correct relative paths
            loadComponent('../components/header.html', 'header-container');
            loadComponent('../components/footer.html', 'footer-container');
            
            const form = document.getElementById('contactForm');

            form.addEventListener('submit', async function (event) {
                event.preventDefault();

                const isValid = form.checkValidity(); // Validate form
                if (!isValid) {
                    alert('Please fill in all required fields.');
                    return;
                }

                const formData = {
                    nama: document.getElementById('nama').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    namaProduk: document.getElementById('namaProduk').value.trim(),
                    kategori: document.getElementById('kategori').value,
                    jumlah: document.getElementById('jumlah').value,
                    rincian: document.getElementById('rincian').value.trim(),
                    alamat: document.getElementById('alamat').value.trim(),
                };

                try {
                    // Send email using EmailJS
                    await emailjs.send('service_a862l6m', 'template_ih8am6p', formData);

                    // Show success message
                    const successMessage = document.getElementById('successMessage');
                    successMessage.style.display = 'block';
                    form.reset(); // Reset form
                } catch (error) {
                    console.error('Error sending email:', error);

                    // Show error message
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.style.display = 'block';
                }
                });
                });

                function updateQuantity(change) {
                    const input = document.getElementById('jumlah');
                    const newValue = parseInt(input.value) + change;
                    if (newValue >= 1) {
                        input.value = newValue;
                    }
                }

        function validateForm() {
            const requiredFields = document.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    const hint = field.nextElementSibling;
                    if (hint && hint.classList.contains('form-hint')) {
                        hint.style.color = '#e74c3c';
                    }
                } else {
                    field.classList.remove('error');
                    const hint = field.nextElementSibling;
                    if (hint && hint.classList.contains('form-hint')) {
                        hint.style.color = '';
                    }
                }
            });

            return isValid;
        }

        // Initialize Google Maps
        function initMap() {
            const location = { lat: -6.914744, lng: 107.609810 }; // Ganti dengan koordinat lokasi Anda
            const map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: location,
            });
            const marker = new google.maps.Marker({
                position: location,
                map: map,
                title: 'WOODSEEKER'
            });
        }
