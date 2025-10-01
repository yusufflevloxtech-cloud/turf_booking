    // A simple database to store booked and blocked slots
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

    const sports = ['football', 'cricket', 'pickelball'];
    const timeSlots = [];
    for (let i = 0; i < 24; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`);
    }

    // Function to generate slots for a given date and display them
    function generateAndDisplaySlots(date, container, isOwnerView = false) {
        container.innerHTML = ''; // Clear previous slots
        const dateKey = date;

        timeSlots.forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('slot');
            slotDiv.textContent = slot;
            slotDiv.dataset.slot = slot;

            // Check for both booked and blocked status
            const isBooked = (bookedSlots[dateKey] && bookedSlots[dateKey].includes(slot));
            const isBlocked = (blockedSlots[dateKey] && blockedSlots[dateKey].includes(slot));

            if (isBooked || isBlocked) {
                slotDiv.classList.add('booked');
            }

            // Add click listeners
            if (isOwnerView) {
                // Owner can toggle block status and unbook user slots
                slotDiv.addEventListener('click', () => toggleOwnerControl(slot, dateKey, slotDiv));
            } else {
                // Users can only select available slots
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

    // New Function: Owner's control to unbook or block slots
    function toggleOwnerControl(slot, dateKey, slotDiv) {
        // Check if the slot is already booked by a user
        const isBookedByUser = bookedSlots[dateKey] && bookedSlots[dateKey].includes(slot);

        if (isBookedByUser) {
            // If it's a user-booked slot, unbook it
            const index = bookedSlots[dateKey].indexOf(slot);
            bookedSlots[dateKey].splice(index, 1);
        } else {
            // If it's not a user-booked slot, then toggle the manual blocked status
            if (!blockedSlots[dateKey]) {
                blockedSlots[dateKey] = [];
            }
            const index = blockedSlots[dateKey].indexOf(slot);
            if (index > -1) {
                blockedSlots[dateKey].splice(index, 1); // Unblock it
            } else {
                blockedSlots[dateKey].push(slot); // Block it
            }
        }

        // Crucial: Re-render both panels to reflect the change
        generateAndDisplaySlots(dateKey, ownerSlotsContainer, true);
        if (bookingDateInput.value === dateKey) {
            generateAndDisplaySlots(dateKey, slotsContainer);
        }
    }

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
        slotError.style.display = 'none';
        dateError.style.display = 'none';

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

        const bookingDetails = {
            sport: document.querySelector('input[name="sport"]:checked').value,
            date: bookingDate,
            slots: Array.from(selectedSlots).map(slot => slot.dataset.slot)
        };

        if (!bookedSlots[bookingDate]) {
            bookedSlots[bookingDate] = [];
        }
        bookingDetails.slots.forEach(slot => {
            bookedSlots[bookingDate].push(slot);
        });

        // Generate QR code with booking details
        generateQRCode(JSON.stringify(bookingDetails));

        // Update the UI
        selectedSlots.forEach(slot => {
            slot.classList.remove('selected');
            slot.classList.add('booked');
        });
    });

    // Owner's panel
    showSlotsBtn.addEventListener('click', () => {
        ownerDateError.style.display = 'none';
        const ownerDate = ownerDateInput.value;
        if (ownerDate) {
            generateAndDisplaySlots(ownerDate, ownerSlotsContainer, true);
        } else {
            ownerDateError.style.display = 'inline';
        }
    });

    // QR Code generation function
    function generateQRCode(text) {
        const qrCodeDiv = document.getElementById('qrcode');
        qrCodeDiv.innerHTML = '';
        qrCodeContainer.classList.remove('hidden');

        new QRCode(qrCodeDiv, {
            text: text,
            width: 228,
            height:228,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }



//popup QR code
    const overlay = document.getElementById("overlay");
    const closeBtn = document.getElementById("closeBtn");
    const qrDiv = document.getElementById("qrcode");

    // Generate QR once
    const qrCode = new QRCode(qrDiv, {
      text: "https://your-booking-link.com",
      width: 228,
      height: 228,
      colorDark: "#000000",
      colorLight: "#ffffff"
    });

    // Show popup only if date and slots are selected
    bookNowBtn.addEventListener("click", () => {
      const bookingDate = bookingDateInput.value;
      const selectedSlots = document.querySelectorAll('.slot.selected');
      if (!bookingDate || selectedSlots.length === 0) {
        return; // Do not show QR popup
      }
      qrCodeContainer.classList.remove("hidden");
      overlay.classList.remove("hidden");
    });

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

// booking details for under QR code
    function generateQRCode(text) {
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';
    qrCodeContainer.classList.remove('hidden');

    new QRCode(qrCodeDiv, {
        text: text,
        width: 228,
        height:228,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Show booking details under QR code
    let detailsObj = JSON.parse(text);
    let detailsHtml = `
        <div class="booking-details">
            <strong>Sport:</strong> ${detailsObj.sport}<br>
            <strong>Date:</strong> ${detailsObj.date}<br>
            <strong>Slots:</strong> ${detailsObj.slots.join(', ')}
        </div>
    `;
    // Remove previous details if any
    let oldDetails = document.querySelector('#qrCodeContainer .booking-details');
    if (oldDetails) oldDetails.remove();
    qrCodeDiv.insertAdjacentHTML('afterend', detailsHtml);
}
