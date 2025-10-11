let bookedSlots = {};
let blockedSlots = {};

// Get HTML elements
const bookingDateInput = document.getElementById('bookingDate');
const slotsContainer = document.getElementById('slotsContainer');
const bookNowBtn = document.getElementById('bookNowBtn');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const ownerDateInput = document.getElementById('ownerDate');
const ownerSlotsContainer = document.getElementById('ownerSlotsContainer');
const showSlotsBtn = document.getElementById('showSlotsBtn');
const selectedDateText = document.getElementById('selectedDateText');
const dateError = document.getElementById('dateError');
const slotError = document.getElementById('slotError');
const ownerDateError = document.getElementById('ownerDateError');

// New elements for personal details
const userNameInput = document.getElementById('userName');
const userMobileInput = document.getElementById('userMobile');
const userAddressInput = document.getElementById('userAddress');
const nameError = document.getElementById('nameError');
const mobileError = document.getElementById('mobileError');

// Define sports and their ground relationships
const sports = {
    'football': 'ground1', // Shared ground with cricket
    'cricket': 'ground1',  // Shared ground with football
    'pickleball': 'ground2', // Separate ground
    'stitchball': 'ground3'  // Separate ground
};

const timeSlots = [];
for (let i = 0; i < 24; i++) {
    timeSlots.push(`${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`);
}

// Function to check if a slot is available for a specific sport
function isSlotAvailable(dateKey, slot, selectedSport) {
    const sportGround = sports[selectedSport];
    
    // Check if the slot is blocked
    if (blockedSlots[dateKey] && blockedSlots[dateKey].includes(slot)) {
        return false;
    }
    
    // Check all booked slots for conflicts
    if (bookedSlots[dateKey]) {
        for (const booking of bookedSlots[dateKey]) {
            if (booking.slot === slot) {
                // If it's the same ground, it's not available
                if (sports[booking.sport] === sportGround) {
                    return false;
                }
                // Special case: football and cricket share the same ground
                if ((selectedSport === 'football' || selectedSport === 'cricket') && 
                    (booking.sport === 'football' || booking.sport === 'cricket')) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Function to generate slots for a given date and display them
function generateAndDisplaySlots(date, container, isOwnerView = false) {
    container.innerHTML = ''; // Clear previous slots
    const dateKey = date;
    const selectedSport = document.querySelector('input[name="sport"]:checked').value;

    timeSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('slot');
        slotDiv.textContent = slot;
        slotDiv.dataset.slot = slot;

        // Check availability based on sport and ground
        const isAvailable = isSlotAvailable(dateKey, slot, selectedSport);
        
        if (!isAvailable) {
            slotDiv.classList.add('booked');
        }

        // Add click listeners
        if (isOwnerView) {
            // Owner can toggle block status
            slotDiv.addEventListener('click', () => toggleOwnerControl(slot, dateKey, slotDiv));
        } else {
            // Users can only select available slots
            if (isAvailable) {
                slotDiv.addEventListener('click', () => toggleSelectSlot(slotDiv));
            }
        }

        container.appendChild(slotDiv);
    });
}

// Function to get ground information for display
function getGroundInfo(sport) {
    const groundMap = {
        'football': 'Main Ground (Shared with Cricket)',
        'cricket': 'Main Ground (Shared with Football)',
        'pickleball': 'Pickleball Court',
        'stitchball': 'Stitchball Ground'
    };
    return groundMap[sport] || sport;
}

// User side: Toggle selected slots
function toggleSelectSlot(slotDiv) {
    slotDiv.classList.toggle('selected');
}

// New Function: Owner's control to block/unblock slots
function toggleOwnerControl(slot, dateKey, slotDiv) {
    if (!blockedSlots[dateKey]) {
        blockedSlots[dateKey] = [];
    }
    
    const index = blockedSlots[dateKey].indexOf(slot);
    if (index > -1) {
        blockedSlots[dateKey].splice(index, 1); // Unblock it
        slotDiv.classList.remove('booked');
    } else {
        blockedSlots[dateKey].push(slot); // Block it
        slotDiv.classList.add('booked');
    }
}

// Update slots when sport selection changes
document.querySelectorAll('input[name="sport"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const selectedDate = bookingDateInput.value;
        if (selectedDate) {
            generateAndDisplaySlots(selectedDate, slotsContainer);
        }
    });
});

// Event Listeners
bookingDateInput.addEventListener('change', (e) => {
    const selectedDate = e.target.value;
    selectedDateText.textContent = selectedDate;
    dateError.style.display = 'none';
    if (selectedDate) {
        generateAndDisplaySlots(selectedDate, slotsContainer);
    }
});

bookNowBtn.addEventListener('click', () => {
    // Reset error messages
    slotError.style.display = 'none';
    dateError.style.display = 'none';
    nameError.style.display = 'none';
    mobileError.style.display = 'none';

    const bookingDate = bookingDateInput.value;
    if (!bookingDate) {
        dateError.style.display = 'inline';
        return;
    }

    const selectedSlots = document.querySelectorAll('.slot.selected');
    if (selectedSlots.length === 0) {
        slotError.style.display = 'inline';
        return;
    }

    // Validate personal details
    const userName = userNameInput.value.trim();
    const userMobile = userMobileInput.value.trim();
    
    if (!userName) {
        nameError.style.display = 'inline';
        return;
    }
    
    if (!userMobile) {
        mobileError.style.display = 'inline';
        return;
    }
    
    // Basic mobile number validation (at least 10 digits)
    const mobileRegex = /^\d{10,}$/;
    if (!mobileRegex.test(userMobile.replace(/\D/g, ''))) {
        mobileError.style.display = 'inline';
        return;
    }

    const selectedSport = document.querySelector('input[name="sport"]:checked').value;
    const slotTimes = Array.from(selectedSlots).map(slot => slot.dataset.slot);

    const bookingDetails = {
        sport: selectedSport,
        ground: getGroundInfo(selectedSport),
        date: bookingDate,
        slots: slotTimes,
        name: userName,
        mobile: userMobile,
        address: userAddressInput.value.trim() || 'Not provided',
        bookingTime: new Date().toLocaleString()
    };

    // Store booking with sport and customer information
    if (!bookedSlots[bookingDate]) {
        bookedSlots[bookingDate] = [];
    }
    
    slotTimes.forEach(slot => {
        bookedSlots[bookingDate].push({
            slot: slot,
            sport: selectedSport,
            customerName: userName,
            customerMobile: userMobile,
            customerAddress: userAddressInput.value.trim() || 'Not provided',
            bookingTime: new Date().toLocaleString(),
            ground: getGroundInfo(selectedSport)
        });
    });

    // Generate QR code with booking details
    generateQRCode(JSON.stringify(bookingDetails));

    // Update the UI
    selectedSlots.forEach(slot => {
        slot.classList.remove('selected');
        slot.classList.add('booked');
    });

    // Show QR Code Popup
    showQRPopup();
});

// Function to show QR popup
function showQRPopup() {
    qrCodeContainer.classList.remove("hidden");
    overlay.classList.remove("hidden");
}

// Owner's panel - show all bookings with customer details
showSlotsBtn.addEventListener('click', () => {
    ownerDateError.style.display = 'none';
    const ownerDate = ownerDateInput.value;
    if (ownerDate) {
        generateOwnerSlots(ownerDate, ownerSlotsContainer);
    } else {
        ownerDateError.style.display = 'inline';
    }
});

// Function to generate owner view slots with customer details
function generateOwnerSlots(date, container) {
    container.innerHTML = '';
    const dateKey = date;

    // Create a modal for showing booking details
    createBookingDetailsModal();

    timeSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('slot');
        slotDiv.textContent = slot;
        slotDiv.dataset.slot = slot;

        // Check if slot is blocked
        const isBlocked = blockedSlots[dateKey] && blockedSlots[dateKey].includes(slot);
        
        // Check if slot has any bookings
        let slotBookings = [];
        
        if (bookedSlots[dateKey]) {
            slotBookings = bookedSlots[dateKey].filter(booking => booking.slot === slot);
            if (slotBookings.length > 0) {
                slotDiv.classList.add('booked');
                
                // Add click event to show booking details
                slotDiv.addEventListener('click', () => showBookingDetails(slot, slotBookings));
                
                // Add hover tooltip
                slotDiv.title = `Click to view ${slotBookings.length} booking(s)`;
                
                // Add badge to show number of bookings
                const badge = document.createElement('span');
                badge.classList.add('booking-badge');
                badge.textContent = slotBookings.length;
                slotDiv.appendChild(badge);
            }
        }

        if (isBlocked) {
            slotDiv.classList.add('blocked');
            slotDiv.title = 'Blocked by owner';
            slotDiv.addEventListener('click', () => toggleOwnerControl(slot, dateKey, slotDiv));
        } else if (slotBookings.length === 0) {
            // Only allow blocking if no bookings exist
            slotDiv.addEventListener('click', () => toggleOwnerControl(slot, dateKey, slotDiv));
        }

        container.appendChild(slotDiv);
    });
}

// Function to create booking details modal
function createBookingDetailsModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('bookingDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div class="modal fade" id="bookingDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Booking Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="bookingDetailsContent">
                        <!-- Booking details will be inserted here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Function to show booking details in modal
function showBookingDetails(slotTime, bookings) {
    const modalContent = document.getElementById('bookingDetailsContent');
    const ownerDate = ownerDateInput.value;
    
    let contentHTML = `
        <h6>Slot: ${slotTime} on ${ownerDate}</h6>
        <div class="booking-list">
    `;
    
    bookings.forEach((booking, index) => {
        contentHTML += `
            <div class="booking-item p-3 mb-3 border rounded">
                <h6>Booking ${index + 1}: ${booking.sport}</h6>
                <div class="row">
                    <div class="col-md-6">
                        <strong>Customer Details:</strong><br>
                        <strong>Name:</strong> ${booking.customerName}<br>
                        <strong>Mobile:</strong> ${booking.customerMobile}<br>
                        <strong>Address:</strong> ${booking.customerAddress}<br>
                    </div>
                    <div class="col-md-6">
                        <strong>Booking Information:</strong><br>
                        <strong>Ground:</strong> ${booking.ground}<br>
                        <strong>Booked At:</strong> ${booking.bookingTime}<br>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger mt-2 cancel-booking-btn" 
                        data-date="${ownerDate}" 
                        data-slot="${booking.slot}" 
                        data-sport="${booking.sport}" 
                        data-customer="${booking.customerName}">
                    Cancel Booking
                </button>
            </div>
        `;
    });
    
    contentHTML += `</div>`;
    modalContent.innerHTML = contentHTML;
    
    // Add event listeners to cancel buttons
    document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            const slot = this.getAttribute('data-slot');
            const sport = this.getAttribute('data-sport');
            const customerName = this.getAttribute('data-customer');
            cancelBooking(date, slot, sport, customerName);
        });
    });
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
}

// Function to cancel a booking
function cancelBooking(date, slot, sport, customerName) {
    if (confirm(`Are you sure you want to cancel ${customerName}'s ${sport} booking for ${slot} on ${date}?`)) {
        if (bookedSlots[date]) {
            // Find and remove the specific booking
            bookedSlots[date] = bookedSlots[date].filter(booking => 
                !(booking.slot === slot && booking.sport === sport && booking.customerName === customerName)
            );
            
            // Close the modal first
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal'));
            if (modal) {
                modal.hide();
            }
            
            // Refresh the owner slots view
            generateOwnerSlots(date, ownerSlotsContainer);
            
            // Also refresh user view if the same date is selected
            if (bookingDateInput.value === date) {
                generateAndDisplaySlots(date, slotsContainer);
            }
            
            alert('Booking cancelled successfully!');
        }
    }
}

// QR Code generation function with permanent link
function generateQRCode(text) {
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = ''; // Clear previous QR code

    // Permanent QR code link - replace with your actual booking website
    const permanentLink = "https://mr360turf.com/booking-confirmation";
    
    new QRCode(qrCodeDiv, {
        text: permanentLink, // Permanent link instead of booking data
        width: 228,
        height: 228,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Show booking details under QR code
    let detailsObj = JSON.parse(text);
    let detailsHtml = `
        <div class="booking-details mt-3">
            <strong>Booking Confirmed!</strong><br><br>
            <strong>Name:</strong> ${detailsObj.name}<br>
            <strong>Mobile:</strong> ${detailsObj.mobile}<br>
            <strong>Address:</strong> ${detailsObj.address}<br>
            <strong>Sport:</strong> ${detailsObj.sport}<br>
            <strong>Ground:</strong> ${detailsObj.ground}<br>
            <strong>Date:</strong> ${detailsObj.date}<br>
            <strong>Slots:</strong> ${detailsObj.slots.join(', ')}<br>
            <strong>Booked At:</strong> ${detailsObj.bookingTime}<br><br>
            <small class="text-muted">Scan QR code to visit our booking portal</small>
        </div>
    `;
    
    // Remove previous details if any
    let oldDetails = document.querySelector('#qrCodeContainer .booking-details');
    if (oldDetails) oldDetails.remove();
    qrCodeDiv.insertAdjacentHTML('afterend', detailsHtml);
}

// Get overlay and close button elements
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");

// Close popup
closeBtn.addEventListener("click", () => {
    qrCodeContainer.classList.add("hidden");
    overlay.classList.add("hidden");
});

// Close if overlay clicked
overlay.addEventListener("click", () => {
    qrCodeContainer.classList.add("hidden");
    overlay.classList.add("hidden");
});