const cardArea = document.getElementById('card-area');

const priceRange = document.getElementById('price');
const priceValue = document.getElementById('price-value');

const roomType = document.getElementById('room-type');

const checkInInput = document.getElementById('check-in');
const checkOutInput = document.getElementById('check-out');

const guestsSelect = document.getElementById('guests');

const applyFilterBtn = document.getElementById('apply-filter');
const resetFilterBtn = document.getElementById('reset-filter');

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

let allRooms = [];
let currentHotelId = null;

const roomTypeMap = {
    "Single": 1,
    "Double": 2,
    "Deluxe": 3
};

document.addEventListener('DOMContentLoaded', () => {
    let checkInPicker, checkOutPicker;

    checkInPicker = flatpickr("#check-in", {
        dateFormat: "Y-m-d",
        minDate: "today",
        defaultDate: "today",
        disableMobile: true,
        prevArrow: "<span>&lt;</span>",
        nextArrow: "<span>&gt;</span>",
        monthSelectorType: "static",
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                checkOutPicker.set('minDate', selectedDates[0]);
            }
        }
    });

    checkOutPicker = flatpickr("#check-out", {
        dateFormat: "Y-m-d",
        minDate: "today",
        disableMobile: true,
        prevArrow: "<span>&lt;</span>",
        nextArrow: "<span>&gt;</span>",
        monthSelectorType: "static",
    });

    if (window.location.pathname.includes('rooms.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const hotelId = urlParams.get('hotelId');

        if (hotelId) {
            currentHotelId = Number(hotelId);
            getRoomsByHotelId(currentHotelId);
        } else {
            getAllRooms();
        }
    }

    priceRange.addEventListener('input', () => {
        priceValue.textContent = `€${priceRange.value}`;
    });

    applyFilterBtn.addEventListener('click', applyFilters);
    resetFilterBtn.addEventListener('click', resetFilters);
});

function getAllRooms() {
    fetch('https://hotelbooking.stepprojects.ge/api/Rooms/GetAll')
        .then(res => res.json())
        .then(result => {
            console.log('Fetched all rooms:', result);
            allRooms = result;
            createRoomCards(allRooms);
        })
        .catch(error => console.error('Error loading all rooms:', error));
}

function getRoomsByHotelId(hotelId) {
    fetch('https://hotelbooking.stepprojects.ge/api/Rooms/GetAll')
        .then(res => res.json())
        .then(result => {
            console.log('All rooms (for filtering):', result);
            const filteredRooms = result.filter(room => room.hotelId === hotelId);
            console.log(`Rooms for hotelId ${hotelId}:`, filteredRooms);
            allRooms = filteredRooms;
            createRoomCards(filteredRooms);
        })
        .catch(error => console.error('Error fetching rooms by hotel ID:', error));
}

function createRoomCards(array) {
    cardArea.innerHTML = '';

    if (array.length === 0) {
        cardArea.innerHTML = '<p>No rooms found for the selected parameters</p>';
        return;
    }

    array.forEach(object => {
        const imageUrl = object.images?.[2]?.source || 'default-image.jpg';

        cardArea.innerHTML += `
        <div class="card">
            <div class="image-wrapper">
                <img src="${imageUrl}" alt="${object.name}">
                <button class="hover-btn" data-room-id="${object.id}">Book Now</button>
            </div>
            <div class="card-footer">
                <div class="card-footer-left"><h5>${object.name}</h5></div>
                <div class="card-footer-right">
                    <h5>€ ${object.pricePerNight}</h5>
                    <small>a night</small>
                </div>
            </div>
        </div>`;
    });
}

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('hover-btn')) {
    const roomId = event.target.dataset.roomId;
    window.location.href = `reservation.html?roomId=${roomId}`;
  }
});

async function applyFilters() {
    const selectedType = roomType.value;
    const priceFrom = 0;
    const priceTo = Number(priceRange.value) || Number(priceRange.max);
    const maximumGuests = guestsSelect.value ? Number(guestsSelect.value) : 0;
    const roomTypeId = selectedType ? roomTypeMap[selectedType] : 0;

    const checkIn = checkInInput._flatpickr.selectedDates[0]?.toISOString() || null;
    const checkOut = checkOutInput._flatpickr.selectedDates[0]?.toISOString() || null;

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
        alert("Check-out date must be after check-in date");
        return;
    }

    try {
        const payload = {};
        if (roomTypeId) payload.roomTypeId = roomTypeId;
        payload.priceFrom = priceFrom;
        payload.priceTo = priceTo;
        if (maximumGuests) payload.maximumGuests = maximumGuests;
        if (checkIn) payload.checkIn = checkIn;
        if (checkOut) payload.checkOut = checkOut;

        console.log('Sending payload:', payload);

        const response = await fetch('https://hotelbooking.stepprojects.ge/api/Rooms/GetFiltered', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const filteredRooms = await response.json();

        console.log('Filtered rooms from API:', filteredRooms);

        let roomsToFilter = filteredRooms;
        if (currentHotelId) {
            roomsToFilter = roomsToFilter.filter(room => room.hotelId === currentHotelId);
        }

        const availableRooms = roomsToFilter.filter(room => {
            const fitsGuests = maximumGuests === 0 || room.maximumGuests >= maximumGuests;
            const withinPrice = room.pricePerNight >= priceFrom && room.pricePerNight <= priceTo;

            let available = true;
            if (checkIn && checkOut) {
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                available = !room.bookedDates.some(b => {
                    const bookedDate = new Date(b.date);
                    return bookedDate >= checkInDate && bookedDate < checkOutDate;
                });
            }

            return fitsGuests && withinPrice && available;
        });

        console.log('After filtering:', availableRooms);
        createRoomCards(availableRooms);

    } catch (error) {
        console.error('Error fetching filtered rooms:', error);
        cardArea.innerHTML = '<p>Failed to load rooms. Please try again later.</p>';
    }
}

function resetFilters() {
    priceRange.value = 500;
    priceValue.textContent = `€${priceRange.value}`;
    roomType.value = '';
    checkInInput.value = '';
    checkOutInput.value = '';
    guestsSelect.value = 1;

    if (currentHotelId) {
        getRoomsByHotelId(currentHotelId);
    } else {
        getAllRooms();
    }
}