// --- Data and Initialization ---

// Function to safely load data from localStorage
function loadData() {
    return {
        bookedSlots: JSON.parse(localStorage.getItem('bookedSlots')) || {},
        blockedSlots: JSON.parse(localStorage.getItem('blockedSlots')) || {}
    };
}

// Function to save data to localStorage
function saveData(booked, blocked) {
    localStorage.setItem('bookedSlots', JSON.stringify(booked));
    localStorage.setItem('blockedSlots', JSON.stringify(blocked));
}

// Time slot generation (remains the same)
const timeSlots = [];
for (let i = 0; i < 24; i++) {
    timeSlots.push(`${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`);
}

// --- Core Slot Logic ---

// Function to generate and display slots for a given date
function generateAndDisplaySlots(date, container, isOwnerView = false) {
    container.innerHTML = '';
    const dateKey = date;
    const { bookedSlots, blockedSlots } = loadData();

    timeSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('slot');
        slotDiv.textContent = slot;
        slotDiv.dataset.slot = slot;
        
        // Check for booked/blocked status
        const isBooked = (bookedSlots[dateKey] && bookedSlots[dateKey].includes(slot));
        const isBlocked = (blockedSlots[dateKey] && blockedSlots[dateKey].includes(slot));

        // Mark as booked/unavailable if booked OR blocked
        if (isBooked || isBlocked) {
            slotDiv.classList.add('booked');
        }

        if (isOwnerView) {
            // Owner clicks to toggle Block/Unbook
            slotDiv.addEventListener('click', () => toggleOwnerControl(slot, dateKey, slotDiv));
        } else {
            // User clicks to select/unselect available slots
            if (!isBooked && !isBlocked) {
                slotDiv.addEventListener('click', () => toggleSelectSlot(slotDiv));
            }
        }
        
        container.appendChild(slotDiv);
    });
}

// User side: Toggle selected slots
function toggleSelectSlot(slotDiv) {
    slotDiv.classList.toggle('selected');
}

// Owner side: Toggle block status AND unbook user slots
function toggleOwnerControl(slot, dateKey) {
    let { bookedSlots, blockedSlots } = loadData();
    let message = '';
    
    // 1. Check if the slot is currently booked by a user
    const isBookedByUser = bookedSlots[dateKey] && bookedSlots[dateKey].includes(slot);

    if (isBookedByUser) {
        // If booked, UNBOOK it (cancel user's booking)
        const index = bookedSlots[dateKey].indexOf(slot);
        bookedSlots[dateKey].splice(index, 1);
        message = `Slot ${slot} unbooked and released.`;
    } else {
        // If not booked, toggle the manual blocked status
        if (!blockedSlots[dateKey]) {
            blockedSlots[dateKey] = [];
        }
        const index = blockedSlots[dateKey].indexOf(slot);
        if (index > -1) {
            blockedSlots[dateKey].splice(index, 1); // Unblock it
            message = `Slot ${slot} manually unblocked.`;
        } else {
            blockedSlots[dateKey].push(slot); // Block it
            message = `Slot ${slot} manually blocked.`;
        }
    }
    
    // Save the new state to localStorage (synchronization point)
    saveData(bookedSlots, blockedSlots);
    
    // Re-render the Admin Panel immediately
    const ownerSlotsContainer = document.getElementById('ownerSlotsContainer');
    if (ownerSlotsContainer) {
        generateAndDisplaySlots(dateKey, ownerSlotsContainer, true);
        alert(message); // Provide feedback on the Admin page
    }
    
    // NOTE: The User Panel will automatically pick up the change when it refreshes or navigates to the date, 
    // or you could add a setInterval in the User Panel to constantly check localStorage for real-time syncing.
}

// --- Page-Specific Initialization ---

// Run this logic when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the User Panel (index.html)
    const bookingDateInput = document.getElementById('bookingDate');
    if (bookingDateInput) {
        const slotsContainer = document.getElementById('slotsContainer');
        const bookNowBtn = document.getElementById('bookNowBtn');
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        const selectedDateText = document.getElementById('selectedDateText');
        const dateError = document.getElementById('dateError');
        const slotError = document.getElementById('slotError');
        const closeBtn = document.getElementById('closeBtn');
        const overlay = document.getElementById('overlay');
        
        // Display initial date placeholder
        selectedDateText.textContent = '[Please select a date]';

        // Event: Date change on User Panel
        bookingDateInput.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            selectedDateText.textContent = selectedDate;
            dateError.style.display = 'none';
            if (selectedDate) {
                generateAndDisplaySlots(selectedDate, slotsContainer);
            }
        });

        // Event: Book Now button click
        bookNowBtn.addEventListener('click', () => {
            const selectedSlots = document.querySelectorAll('.slot.selected');
            const bookingDate = bookingDateInput.value;

            dateError.style.display = bookingDate ? 'none' : 'block';
            slotError.style.display = selectedSlots.length === 0 ? 'block' : 'none';

            if (!bookingDate || selectedSlots.length === 0) {
                return;
            }

            const selectedSport = document.querySelector('input[name="sport"]:checked').value;
            const slotsToBook = Array.from(selectedSlots).map(slot => slot.dataset.slot);

            const bookingDetails = {
                sport: selectedSport,
                date: bookingDate,
                slots: slotsToBook
            };

            // Update the central data store
            let { bookedSlots, blockedSlots } = loadData();
            if (!bookedSlots[bookingDate]) {
                bookedSlots[bookingDate] = [];
            }
            slotsToBook.forEach(slot => {
                if (!bookedSlots[bookingDate].includes(slot)) { // Prevent re-booking if somehow possible
                    bookedSlots[bookingDate].push(slot);
                }
            });
            saveData(bookedSlots, blockedSlots); // Save the new booking

            // Update the UI
            generateAndDisplaySlots(bookingDate, slotsContainer); // Re-render to show booked status

            // Generate QR code and show popup
            generateQRCode(JSON.stringify(bookingDetails));
            qrCodeContainer.classList.remove("hidden");
            overlay.classList.remove("hidden");
            alert("Booking confirmed! Scan the QR code.");
        });

        // QR Code visibility controls
        if (closeBtn && overlay) {
            closeBtn.addEventListener("click", () => {
                qrCodeContainer.classList.add("hidden");
                overlay.classList.add("hidden");
            });
            overlay.addEventListener("click", () => {
                qrCodeContainer.classList.add("hidden");
                overlay.classList.add("hidden");
            });
        }
    } 
    
    // Check if we are on the Admin Panel (admin.html)
    const ownerDateInput = document.getElementById('ownerDate');
    if (ownerDateInput) {
        const ownerSlotsContainer = document.getElementById('ownerSlotsContainer');
        const showSlotsBtn = document.getElementById('showSlotsBtn');
        const ownerDateError = document.getElementById('ownerDateError');

        // Event: Show Slots button click on Admin Panel
        showSlotsBtn.addEventListener('click', () => {
            const ownerDate = ownerDateInput.value;
            ownerDateError.style.display = ownerDate ? 'none' : 'block';
            if (ownerDate) {
                generateAndDisplaySlots(ownerDate, ownerSlotsContainer, true);
            }
        });
    }
});

// QR Code generation function (used by User Panel)
function generateQRCode(text) {
    const qrCodeDiv = document.getElementById('qrcode');
    const detailsContainer = document.getElementById('bookingDetailsContainer');
    
    // Clear previous content
    qrCodeDiv.innerHTML = '';
    detailsContainer.innerHTML = '';

    new QRCode(qrCodeDiv, {
        text: text,
        width: 228,
        height: 228,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Show booking details under QR code
    let detailsObj = JSON.parse(text);
    let detailsHtml = `
        <div class="booking-details" style="margin-top: 20px;">
            <strong>Sport:</strong> ${detailsObj.sport}<br>
            <strong>Date:</strong> ${detailsObj.date}<br>
            <strong>Slots:</strong> ${detailsObj.slots.join(', ')}
        </div>
    `;
    detailsContainer.innerHTML = detailsHtml;
}