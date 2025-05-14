const config = {
    app: {
        name: 'WOODSEEKER',
        version: '1.0.0',
        baseUrl: 'http://localhost:8000'
    },
    api: {
        googleMaps: {
            apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
            defaultLocation: {
                lat: -6.914744,
                lng: 107.609810
            }
        }
    },
    database: {
        productsPath: '/data/products.json'
    },
    contact: {
        email: 'info@woodseeker.com',
        phone: '1234567890',
        address: 'Jalan Contoh No. 123, Kota, Negara'
    },
    social: {
        instagram: '@woodseeker',
        facebook: 'woodseeker.furniture',
        twitter: '@woodseeker'
    }
};

export default config; 