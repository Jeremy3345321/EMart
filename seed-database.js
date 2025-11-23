// seed-database.js
// Run this file to populate your database with sample products
// Usage: node seed-database.js

const Database = require('./classes/Database');
const Item = require('./classes/Item');

// Sample products data
// NOTE: Owner IDs 1-6 should exist in your users table first!
const sampleProducts = [
    {
        name: "Wireless Bluetooth Headphones",
        ownerId: 1, // Make sure this user exists!
        description: "Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality.",
        price: 2499.00,
        condition: "Like New",
        tags: ["Electronics"],
    },
    {
        name: "Smart Fitness Watch",
        ownerId: 1,
        description: "Track your fitness goals with heart rate monitoring, GPS tracking, and sleep analysis.",
        price: 3999.00,
        condition: "Brand New",
        tags: ["Electronics", "Sports & Outdoors"],
    },
    {
        name: "Professional Camera Lens",
        ownerId: 1,
        description: "High-quality 50mm f/1.8 lens with beautiful bokeh effect.",
        price: 8500.00,
        condition: "Excellent",
        tags: ["Electronics"],
    },
    {
        name: "Designer Leather Handbag",
        ownerId: 1,
        description: "Elegant leather handbag perfect for formal occasions.",
        price: 5200.00,
        condition: "Like New",
        tags: ["Fashion & Apparel"],
    },
    {
        name: "Camping Tent (4-Person)",
        ownerId: 1,
        description: "Waterproof camping tent with easy setup for family adventures.",
        price: 3500.00,
        condition: "Good",
        tags: ["Sports & Outdoors"],
    },
    {
        name: "Electric Drill Set",
        ownerId: 1,
        description: "Complete drill set with multiple bits for home improvement projects.",
        price: 2800.00,
        condition: "Like New",
        tags: ["Home & Garden"],
    },
    {
        name: "Harry Potter Complete Book Set",
        ownerId: 1,
        description: "All 7 books in the Harry Potter series, collector's edition.",
        price: 1500.00,
        condition: "Excellent",
        tags: ["Books & Media"],
    },
    {
        name: "Professional Makeup Kit",
        ownerId: 1,
        description: "Complete makeup kit with brushes, palettes, and premium products.",
        price: 4200.00,
        condition: "Brand New",
        tags: ["Cosmetics"],
    },
    {
        name: "LEGO Architecture Set",
        ownerId: 1,
        description: "Build famous landmarks with this detailed LEGO set.",
        price: 3800.00,
        condition: "Brand New",
        tags: ["Toys & Hobbies"],
    },
    {
        name: "Car Vacuum Cleaner",
        ownerId: 1,
        description: "Portable vacuum cleaner perfect for keeping your car clean.",
        price: 1200.00,
        condition: "Like New",
        tags: ["Automotive"],
    },
    {
        name: "Baby Stroller",
        ownerId: 1,
        description: "Lightweight and foldable stroller with safety features.",
        price: 4500.00,
        condition: "Good",
        tags: ["Baby & Kids"],
    },
    {
        name: "Projector for Presentations",
        ownerId: 1,
        description: "HD projector perfect for office presentations and meetings.",
        price: 6500.00,
        condition: "Excellent",
        tags: ["Office & School", "Electronics"],
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');
        
        // Initialize database connection
        await Database.initialize();
        console.log('✅ Database connected\n');

        let successCount = 0;
        let errorCount = 0;

        // Insert each product
        for (const product of sampleProducts) {
            try {
                // Create new Item instance
                const item = new Item(
                    null, // itemId will be auto-generated
                    product.name,
                    product.ownerId,
                    null, // renterId (not rented yet)
                    product.imageUrl
                );

                // Set additional properties
                item.setDescription(product.description);
                item.setPrice(product.price);
                item.setCondition(product.condition);
                item.isRenting = true; // Available for rent
                item.isRented = false; // Not currently rented

                // Add tags
                product.tags.forEach(tag => {
                    item.addTag(tag);
                });

                // Save to database
                await Database.addItem(item);
                successCount++;
                console.log(`✅ Added: ${product.name}`);

            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to add ${product.name}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 Seeding complete!`);
        console.log(`✅ Successfully added: ${successCount} items`);
        if (errorCount > 0) {
            console.log(`❌ Failed: ${errorCount} items`);
        }
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        // Close database connection
        await Database.close();
        console.log('\n🔌 Database connection closed');
        process.exit();
    }
}

// Run the seeding function
seedDatabase();