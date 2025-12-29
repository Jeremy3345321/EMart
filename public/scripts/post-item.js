// post-item.js

// Check if user is logged in
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

if (!currentUser) {
    // Redirect to login if not logged in
    window.location.href = 'login.html';
}

// Dropdown menu toggle
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// View Profile button
document.getElementById('viewProfileBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    window.location.href = 'profile.html';
});

// Post Item button
document.getElementById('postItemBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    window.location.href = 'post-item.html';
});

// See Receipts button
const seeReceiptsBtn = document.getElementById('seeReceiptsBtn');
if (seeReceiptsBtn) {
    seeReceiptsBtn.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
        window.location.href = 'receipts.html';
    });
}
// Logout button
document.getElementById('logoutBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        alert('You have been logged out.');
        window.location.href = 'login.html';
    }
});

// Cart button handler
document.getElementById('cartBtn').addEventListener('click', function() {
    window.location.href = 'cart.html';
});

// Form handling
const postItemForm = document.getElementById('postItemForm');
const cancelBtn = document.getElementById('cancelBtn');

cancelBtn.addEventListener('click', function() {
    if (confirm('Discard changes and return to dashboard?')) {
        window.location.href = 'dashboard.html';
    }
});

postItemForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    console.log('📝 Form submitted');

    // Get form values directly from inputs
    const itemName = document.getElementById('itemName').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const condition = document.getElementById('condition').value;
    
    // Get checked tags
    const tagCheckboxes = document.querySelectorAll('input[name="tags"]:checked');
    const tags = Array.from(tagCheckboxes).map(cb => cb.value);

    console.log('Form data:', { itemName, description, price, condition, tags });

    // Validation
    if (!itemName) {
        alert('Please enter an item name.');
        return;
    }

    if (!description) {
        alert('Please enter a description.');
        return;
    }

    if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price greater than 0.');
        return;
    }

    if (!condition) {
        alert('Please select a condition.');
        return;
    }

    if (tags.length === 0) {
        alert('Please select at least one category.');
        return;
    }

    // Prepare item data
    const itemData = {
        itemName,
        ownerId: currentUser.userId,
        renterId: null,
        description,
        price,
        condition,
        tags,
        isRenting: true,
        isRented: false,
        imageUrl: null
    };

    console.log('Sending item data:', itemData);

    try {
        const response = await fetch('http://localhost:3000/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });

        console.log('Response status:', response.status);

        const result = await response.json();
        console.log('Response data:', result);

        if (result.success) {
            alert('Item posted successfully!');
            window.location.href = 'dashboard.html';
        } else {
            alert('Failed to post item: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error posting item:', error);
        alert('Failed to post item. Please check if the server is running.');
    }
});