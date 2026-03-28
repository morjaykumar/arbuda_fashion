const axios = require('axios');

async function seedProducts() {
const API_BASE_URL = 'http://localhost:5050/api';
    
    const sampleProducts = [
        {
            name: 'Premium Cotton Kurta',
            price: 2499,
            image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&fit=crop',
            category: 'kurta',
            stock: 25,
            description: 'Handwoven cotton kurta with traditional block prints. Comfortable for daily wear.'
        },
        {
            name: 'Silk Saree - Kanjivaram',
            price: 8999,
            image: 'https://images.unsplash.com/photo-1608251720301-8546844c7059?w=400&fit=crop',
            category: 'saree',
            stock: 12,
            description: 'Authentic Kanjivaram silk saree with gold zari border. Perfect for weddings.'
        },
        {
            name: 'Designer Lehenga Choli',
            price: 15999,
            image: 'https://images.unsplash.com/photo-1574629810360-7efdf4e114bd?w=400&fit=crop',
            category: 'lehenga',
            stock: 8,
            description: 'Embroidered lehenga with heavy dupatta. Bridal collection special.'
        },
        {
            name: 'Anarkali Suit Set',
            price: 3999,
            image: 'https://images.unsplash.com/photo-1602293589934-9e4077941c8a?w=400&fit=crop',
            category: 'anarkali',
            stock: 18,
            description: 'Floor-length anarkali with churidar and dupatta. Festive wear.'
        },
        {
            name: 'Banarasi Saree',
            price: 6999,
            image: 'https://images.unsplash.com/photo-1602293632231-7053479ca7e8?w=400&fit=crop',
            category: 'saree',
            stock: 15,
            description: 'Pure Banarasi weave with intricate motifs. Timeless elegance.'
        },
        {
            name: 'Embroidered Kurta Pajama',
            price: 2999,
            image: 'https://images.unsplash.com/photo-1612872087729-bb6e2f5b6acc?w=400&fit=crop',
            category: 'kurta',
            stock: 30,
            description: 'Thread work kurta with matching pajamas. Ideal for occasions.'
        },
        {
            name: 'Chiffon Salwar Suit',
            price: 1899,
            image: 'https://images.unsplash.com/photo-1598338536635-8e1e52e0c224?w=400&fit=crop',
            category: 'salwar',
            stock: 22,
            description: 'Lightweight chiffon suit with embroidered neckline. Everyday chic.'
        },
        {
            name: 'Bridal Lehenga',
            price: 24999,
            image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&fit=crop',
            category: 'lehenga',
            stock: 5,
            description: 'Luxury bridal lehenga with stone work. Once-in-a-lifetime glamour.'
        },
        {
            name: 'Printed Palazzo Set',
            price: 1299,
            image: 'https://images.unsplash.com/photo-1595972147782-1c6f8dbcbe70?w=400&fit=crop',
            category: 'palazzo',
            stock: 35,
            description: 'Comfortable palazzo with crop top. Casual fusion wear.'
        },
        {
            name: 'Georgette Saree',
            price: 3499,
            image: 'https://images.unsplash.com/photo-1571665344122-8ca67f29e5d6?w=400&fit=crop',
            category: 'saree',
            stock: 20,
            description: 'Flowy georgette saree with sequence work. Party perfect.'
        }
    ];

    console.log('🌱 Seeding products... (Server must be running on localhost:5000)');

    try {
        // Clear existing products first (optional)
        await axios.delete(`${API_BASE_URL}/products`);

        // Add sample products
        for (const product of sampleProducts) {
            await axios.post(`${API_BASE_URL}/products`, product);
            console.log(`✅ Added: ${product.name}`);
        }

        console.log('\n🎉 Successfully seeded 10 products!');
        console.log('🔗 Test at: http://localhost:5000');
    } catch (error) {
        console.error('❌ Seed failed:', error.response?.data || error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Server running: npm run dev');
        console.log('   2. MongoDB connected');
        console.log('   3. No firewall blocking localhost:5000');
    }
}

seedProducts();

