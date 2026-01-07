// post-item.js - Updated with rental duration support

// Check if user is logged in
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');

if (!currentUser) {
    window.location.href = 'login.html';
}

// Dropdown menu toggle
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

menuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

document.addEventListener('click', function(e) {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Menu buttons
document.getElementById('viewProfileBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    window.location.href = 'profile.html';
});

document.getElementById('postItemBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    window.location.href = 'post-item.html';
});

const seeReceiptsBtn = document.getElementById('seeReceiptsBtn');
if (seeReceiptsBtn) {
    seeReceiptsBtn.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
        window.location.href = 'receipts.html';
    });
}

document.getElementById('logoutBtn').addEventListener('click', function() {
    dropdownMenu.classList.remove('show');
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        alert('You have been logged out.');
        window.location.href = 'login.html';
    }
});

document.getElementById('cartBtn').addEventListener('click', function() {
    window.location.href = 'cart.html';
});

// Image handling
const itemImageInput = document.getElementById('itemImage');
const imagePreview = document.getElementById('imagePreview');

itemImageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            itemImageInput.value = '';
            imagePreview.innerHTML = '';
            return;
        }

        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPG, PNG, GIF)');
            itemImageInput.value = '';
            imagePreview.innerHTML = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" onclick="removeImage()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
        };
        reader.readAsDataURL(file);
    }
});

function removeImage() {
    itemImageInput.value = '';
    imagePreview.innerHTML = '';
}

// NEW: Duration display update
const rentalDurationInput = document.getElementById('rentalDuration');
const durationUnitSelect = document.getElementById('durationUnit');
const durationDisplay = document.getElementById('durationDisplay');

function updateDurationDisplay() {
    const duration = rentalDurationInput.value || 1;
    const unit = durationUnitSelect.value;
    const plural = duration > 1 ? 's' : '';
    durationDisplay.textContent = `${duration} ${unit}${plural}`;
}

rentalDurationInput.addEventListener('input', updateDurationDisplay);
durationUnitSelect.addEventListener('change', updateDurationDisplay);

// NEW: Min/Max duration validation
const minDurationInput = document.getElementById('minDuration');
const maxDurationInput = document.getElementById('maxDuration');

minDurationInput.addEventListener('input', function() {
    const min = parseInt(this.value) || 0;
    const max = parseInt(maxDurationInput.value) || 0;
    
    if (max > 0 && min > max) {
        this.setCustomValidity('Minimum duration cannot exceed maximum duration');
    } else {
        this.setCustomValidity('');
    }
});

maxDurationInput.addEventListener('input', function() {
    const min = parseInt(minDurationInput.value) || 0;
    const max = parseInt(this.value) || 0;
    
    if (min > 0 && max > 0 && max < min) {
        this.setCustomValidity('Maximum duration must be greater than minimum duration');
    } else {
        this.setCustomValidity('');
    }
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

    // Get form values
    const itemName = document.getElementById('itemName').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const condition = document.getElementById('condition').value;
    
    // NEW: Get duration values
    const rentalDuration = parseInt(document.getElementById('rentalDuration').value);
    const durationUnit = document.getElementById('durationUnit').value;
    const minDuration = minDurationInput.value ? parseInt(minDurationInput.value) : null;
    const maxDuration = maxDurationInput.value ? parseInt(maxDurationInput.value) : null;
    
    // Get checked tags
    const tagCheckboxes = document.querySelectorAll('input[name="tags"]:checked');
    const tags = Array.from(tagCheckboxes).map(cb => cb.value);

    console.log('Form data:', { 
        itemName, description, price, condition, tags,
        rentalDuration, durationUnit, minDuration, maxDuration
    });

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

    // NEW: Validate duration
    if (isNaN(rentalDuration) || rentalDuration <= 0) {
        alert('Please enter a valid rental duration.');
        return;
    }

    if (minDuration && maxDuration && minDuration > maxDuration) {
        alert('Minimum duration cannot exceed maximum duration.');
        return;
    }

    // Get image as Base64
    let imageBase64 = null;
    if (itemImageInput.files[0]) {
        try {
            imageBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(itemImageInput.files[0]);
            });
            console.log('✅ Image converted to Base64');
        } catch (error) {
            console.error('Error reading image:', error);
            alert('Failed to process image. Please try again.');
            return;
        }
    }

    // Prepare item data with duration fields
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
        imageUrl: imageBase64,
        // NEW: Duration fields
        rentalDuration,
        rentalDurationUnit: durationUnit,
        minRentalDuration: minDuration,
        maxRentalDuration: maxDuration
    };

    console.log('Sending item data:', { 
        ...itemData, 
        imageUrl: imageBase64 ? '(Base64 data)' : null 
    });

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