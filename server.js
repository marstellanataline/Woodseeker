const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // untuk akses dashboard.html dari browser

// Path ke file products.json
const dataPath = path.join(__dirname, 'data', 'products.json');

// Endpoint untuk tambah produk
app.post('/api/add-product', (req, res) => {
    const newProduct = req.body;

    try {
        const file = fs.readFileSync(dataPath, 'utf-8');
        const data = JSON.parse(file);

        const categoryName = newProduct.category;
        let category = data.categories.find(c => c.name === categoryName);

        if (!category) {
            category = { name: categoryName, products: [] };
            data.categories.push(category);
        }

        category.products.push({
            ...newProduct,
            id: 'product_' + Date.now(),
            listed: false
        });

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        res.status(200).json({ message: 'Produk berhasil ditambahkan!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal menyimpan produk.' });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
