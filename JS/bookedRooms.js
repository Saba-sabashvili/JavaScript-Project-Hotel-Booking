const bookedRoomsArea = document.getElementById('booked-rooms-area');
const logo = document.getElementById('logo');

const burger = document.getElementById('burger');
const nav = document.getElementById('nav-links');

burger.addEventListener('click', () => {
  nav.classList.toggle('active');
  burger.classList.toggle('open');
});

logo.addEventListener('click', () => {
    window.location.href = 'home.html';
});

const backToTopBtn = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
});

async function getBookedRoomsData() {
    try {
        console.log('Fetching bookings from API...');
        const response = await fetch('https://hotelbooking.stepprojects.ge/api/Booking');
        console.log('Response status:', response.status);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const bookings = await response.json();
        console.log('Bookings data:', bookings);

        const [hotelsResponse, roomsResponse] = await Promise.all([
            fetch('https://hotelbooking.stepprojects.ge/api/Hotels/GetAll'),
            fetch('https://hotelbooking.stepprojects.ge/api/Rooms/GetAll')
        ]);

        if (!hotelsResponse.ok || !roomsResponse.ok) {
            throw new Error('Failed to fetch hotels or rooms');
        }

        const hotels = await hotelsResponse.json();
        const rooms = await roomsResponse.json();

        console.log('Hotels:', hotels);
        console.log('Rooms:', rooms);

        renderBookedRooms(bookings, hotels, rooms);
    } catch (error) {
        console.error('Error fetching booked rooms:', error);
        bookedRoomsArea.innerHTML = `<p style="color:red;">Failed to load bookings. Please try again later.</p>`;
    }
}

function renderBookedRooms(bookings, hotels, rooms) {
    if (!bookedRoomsArea) return;

    bookedRoomsArea.innerHTML = '';
    if (!bookings || bookings.length === 0) {
        bookedRoomsArea.innerHTML = '<p>No booked rooms found.</p>';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('bookings-table');

    table.innerHTML = `
        <thead>
            <tr>
                <th>Hotel</th>
                <th>Room</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Total Price</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    bookings.forEach(booking => {
        const room = rooms.find(r => r.id === booking.roomID);
        const hotel = hotels.find(h => h.id === room?.hotelId);

        const statusHTML = booking?.isConfirmed === true
            ? '<span class="status booked">Booked</span>'
            : '<span class="status canceled">Not Booked</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="hotel-cell">
                <div class="cell-wrapper">
                    <img src="${hotel?.featuredImage || 'default-hotel.jpg'}" alt="${hotel?.name || 'Unknown'}">
                    <span>${hotel?.name || 'Unknown Hotel'}</span>
                </div>
            </td>
            <td class="room-cell">
                <div class="cell-wrapper">
                    <img src="${room?.images?.[0]?.source || 'default-room.jpg'}" alt="${room?.name || 'Unknown'}">
                    <div class="text-wrapper">
                        <span>${room?.name || 'Unknown Room'}</span>
                        <small>€${room?.pricePerNight || '-'} / night</small>
                    </div>
                </div>
            </td>
            <td class="customer-cell">
                <p><strong>Name:</strong> ${booking.customerName || 'Unknown'}</p>
                <p><strong>Phone:</strong> ${booking.customerPhone || '-'}</p>
            </td>
            <td>${statusHTML}</td>
            <td>${booking.checkInDate?.split('T')[0] || '-'}</td>
            <td>${booking.checkOutDate?.split('T')[0] || '-'}</td>
            <td>€${booking.totalPrice ?? '-'}</td>
            <td><button class="cancel-btn" data-id="${booking.id}">Cancel Booking</button></td>
        `;
        tbody.appendChild(row);
    });

    bookedRoomsArea.appendChild(table);

    document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', async e => {
            const bookingId = e.target.dataset.id;
            if (!bookingId) return;

            if (confirm('Are you sure you want to cancel this booking?')) {
                await cancelBooking(bookingId);
            }
        });
    });
}

async function cancelBooking(bookingId) {
    try {
        const response = await fetch(`https://hotelbooking.stepprojects.ge/api/Booking/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: bookingId })
        });

        const text = await response.text();
        if (!response.ok) throw new Error(`Cannot cancel booking: ${text}`);

        alert('Booking canceled successfully!');
        getBookedRoomsData();
    } catch (error) {
        console.error('Error canceling booking:', error);
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('bookedRooms.html')) {
        getBookedRoomsData();
    }
});