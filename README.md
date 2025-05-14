# WOODSEEKER - Premium Furniture Website

Sebuah website profesional untuk bisnis furniture yang menyediakan berbagai macam perabotan berkualitas tinggi.

## Struktur Proyek

```
woodseeker/
├── assets/
│   ├── css/
│   │   ├── admin.css
│   │   ├── dashboard.css
│   │   ├── forgot.css
│   │   └── style.css
│   ├── js/
│   │   ├── dashboard.js
│   │   ├── emailJS.js
│   │   ├── formHandlerB2B.js
│   │   ├── formHandlerContact.js
│   │   └── script.js
│   └── images/
├── components/
│   ├── header.html
│   ├── footer.html
│   ├── hero.html
│   ├── catalog.html
├── config/
│   └── app.config.js
├── data/
│   └── products.json
├── libs/
├── pages/
│   ├── about.html
│   ├── b2b.html
│   ├── catalog.html
│   ├── contact.html
│   ├── login.html
│   ├── product-detail.html
│   └── admin/
│       ├── dashboard.html
│       ├── forgot-password.html
│       ├── login.html
│       └── profile.html
├── tests/
│   └── app.test.js
├── index.html
├── LICENSE.md
├── package.json
└── README.md
```

## Fitur

- Responsive design untuk semua device
- Katalog produk dengan filter dan pencarian
- Sistem login admin
- Form pemesanan produk
- Integrasi dengan Google Maps
- Halaman B2B untuk kerjasama bisnis
- Contact form untuk customer service
- Halaman admin untuk mengelola produk dan profil

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript (Vanilla)
- Google Maps API
- Font Awesome Icons

## Cara Menjalankan Proyek

1. Clone repository ini:
```bash
git clone [URL_REPOSITORY]
```

2. Masuk ke direktori proyek:
```bash
cd woodseeker
```

3. Jalankan dengan server lokal. Beberapa opsi:
   - Menggunakan Python:
     ```bash
     python -m http.server
     ```
   - Menggunakan Node.js:
     ```bash
     npx serve
     ```
   - Menggunakan PHP:
     ```bash
     php -S localhost:8000
     ```
   - Atau gunakan extension Live Server di VS Code

4. Buka browser dan akses:
```
http://localhost:8000
```

## Pengembangan

1. Struktur komponen dipisahkan untuk memudahkan maintenance
2. Gunakan BEM naming convention untuk CSS
3. Ikuti JavaScript best practices dan ES6+ features
4. Pastikan semua gambar dioptimasi sebelum di-upload
5. Tambahkan unit test di folder `tests/`

## Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## License

MIT License - lihat file [LICENSE.md](LICENSE.md) untuk detail

## Contact

- Website: [www.woodseeker.com](http://www.woodseeker.com)
- Email: info@woodseeker.com
- Instagram: @woodseeker