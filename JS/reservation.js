const roomArea = document.getElementById('room-area');
const linksArea = document.getElementById('links-area');
const otherRoomsArea = document.getElementById('other-rooms-area');

const linkOne = document.getElementById('link-1');
const linkTwo = document.getElementById('link-2');
const linkThree = document.getElementById('link-3');

const logo = document.getElementById('logo');

const burger = document.getElementById('burger');
const nav = document.getElementById('nav-links');

const backToTopBtn = document.getElementById('backToTop');

if (burger && nav) {
  burger.addEventListener('click', () => {
    nav.classList.toggle('active');
    burger.classList.toggle('open');
  });
}

if (logo) {
  logo.addEventListener('click', () => {
    window.location.href = 'home.html';
  });
}

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    backToTopBtn.classList.toggle('show', window.scrollY > 300);
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function getAllRooms() {
  fetch('https://hotelbooking.stepprojects.ge/api/Rooms/GetAll')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(result => console.log('Fetched all rooms (fallback):', result))
    .catch(error => console.error('Error loading all rooms:', error));
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('reservation')) return;

  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');

  if (!roomId) {
    console.warn('No roomId found in URL. Falling back to GetAll()');
    getAllRooms();
    return;
  }

  fetch(`https://hotelbooking.stepprojects.ge/api/Rooms/GetRoom/${roomId}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(room => {
      console.log('Fetched room object:', room);
      createReservationArea(room);
    })
    .catch(error => {
      console.error('Error loading room:', error);
      if (roomArea) roomArea.innerHTML =
        '<p>Failed to load room details. Please try again later.</p>';
    });
});

function createReservationArea(room) {
  if (!roomArea) return;
  roomArea.innerHTML = '';

  const imagesArr = Array.isArray(room.images) ? room.images : [];
  const placeholder = 'default-image.jpg';

  const escapeHtml = s => String(s)
    .replace(/[&<>"'`=\/]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;', '`': '&#x60;',
      '=': '&#x3D;', '/': '&#x2F;'
    }[c]));

  const carouselIndicatorsHtml = (imagesArr.length ? imagesArr : [{ source: placeholder }])
    .map((_, idx) => `<button type="button" data-bs-target="#roomCarousel" data-bs-slide-to="${idx}" ${idx===0?'class="active" aria-current="true"':''} aria-label="Slide ${idx+1}"></button>`).join('');

  const carouselItemsHtml = (imagesArr.length ? imagesArr : [{ source: placeholder }])
    .map((imgObj, idx) => `<div class="carousel-item ${idx===0?'active':''}"><img src="${imgObj?.source||placeholder}" class="d-block w-100" alt="Room Image ${idx+1}"></div>`).join('');

  const carouselHtml = `
    <div class="room-carousel mb-4">
      <div id="roomCarousel" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-indicators">${carouselIndicatorsHtml}</div>
        <div class="carousel-inner">${carouselItemsHtml}</div>
        <button class="carousel-control-prev" type="button" data-bs-target="#roomCarousel" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#roomCarousel" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  `;

  const rightDivHtml = `
    <div class="reservation-div p-4 border rounded">
      <div class="reservation-header">
        <span class="line left"></span>
        <h2 class="reservation-title">Reservation</h2>
        <span class="line right"></span>
      </div>

      <div class="room-info">
        <span class="room-name">${escapeHtml(room.name || 'Room')}</span>
        <span class="room-price">€ ${escapeHtml(room.pricePerNight ?? 0)} - a night</span>
      </div>

      <form id="reservationForm" novalidate>
        <div class="form-row">
          <label for="checkInInput">Check-in</label>
          <div class="input-with-icon">
            <input type="text" id="checkInInput" class="form-control" placeholder="Check-In" autocomplete="off" required>
            <i class="bx bx-calendar calendar-icon" data-target="checkInInput" aria-hidden="true"></i>
          </div>
        </div>

        <div class="form-row">
          <label for="checkOutInput">Check-out</label>
          <div class="input-with-icon">
            <input type="text" id="checkOutInput" class="form-control" placeholder="Check-Out" autocomplete="off" required>
            <i class="bx bx-calendar calendar-icon" data-target="checkOutInput" aria-hidden="true"></i>
          </div>
        </div>

        <div class="form-row">
          <label for="customerName">Customer Name</label>
          <input type="text" id="customerName" class="form-control" required placeholder="Please enter your name">
        </div>

        <div class="form-row">
          <label for="customerPhone">Customer Tel-Phone</label>
          <input type="tel" id="customerPhone" class="form-control" required placeholder="Please enter your phone number">
        </div>

        <div class="total-price">
          <p><strong>Total Price:</strong> €<span id="totalPrice">0</span></p>
        </div>

        <button type="submit" class="btn btn-primary w-100" id="bookNowBtn" disabled>Book Now</button>
      </form>
    </div>
  `;

  roomArea.innerHTML = carouselHtml + rightDivHtml;

  if (window.bootstrap?.Carousel) {
    const carouselEl = document.getElementById('roomCarousel');
    window.bootstrap.Carousel.getOrCreateInstance(carouselEl, { interval: 3500, ride: 'carousel' });
  }

  const bookedDates = (Array.isArray(room.bookedDates) ? room.bookedDates : [])
    .map(b => {
      const d = new Date(b.date);
      return isNaN(d) ? null : d.toISOString().split('T')[0];
    }).filter(Boolean);

  const form = document.getElementById('reservationForm');
  const bookBtn = document.getElementById('bookNowBtn');
  const checkInInputEl = document.getElementById('checkInInput');
  const checkOutInputEl = document.getElementById('checkOutInput');
  const customerNameEl = document.getElementById('customerName');
  const customerPhoneEl = document.getElementById('customerPhone');
  const totalPriceEl = document.getElementById('totalPrice');

  const checkOutFpRef = { instance: null };

  const checkInFp = flatpickr(checkInInputEl, {
    dateFormat: "Y-m-d",
    allowInput: false,
    disable: bookedDates,
    minDate: "today",
    disableMobile: true,
    prevArrow: "<span>&lt;</span>",
    nextArrow: "<span>&gt;</span>",
    monthSelectorType: "static",
    onChange: function(selectedDates) {
      if (selectedDates.length > 0) {
          const nextDay = new Date(selectedDates[0]);
          nextDay.setDate(nextDay.getDate() + 1);
          checkOutFp.set('minDate', nextDay);
          checkOutFp.clear();
          checkOutFp.jumpToDate(selectedDates[0]);
        }
      }
  });

  const checkOutFp = flatpickr(checkOutInputEl, {
      dateFormat: "Y-m-d",
      allowInput: false,
      disable: bookedDates,
      minDate: "today",
      disableMobile: true,
      prevArrow: "<span>&lt;</span>",
      nextArrow: "<span>&gt;</span>",
      monthSelectorType: "static",
      onChange() {
          validateForm();
          updateTotalPrice();
      }
  });

  checkOutFpRef.instance = checkOutFp;

  document.querySelectorAll('.calendar-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const targetId = icon.dataset.target;
      const targetEl = document.getElementById(targetId);
      targetEl?._flatpickr?.open();
    });
  });

  function isoFromDateInput(input) {
    if (!input) return null;
    const [y,m,d] = input.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m-1, d, 0,0,0)).toISOString();
  }

  function computeDaysBetween(startISO, endISO) {
    const start = new Date(startISO);
    const end = new Date(endISO);
    if (isNaN(start) || isNaN(end)) return 0;
    return Math.ceil((end - start) / (1000*60*60*24));
  }

  function updateTotalPrice() {
    const checkInISO = isoFromDateInput(checkInInputEl.value);
    const checkOutISO = isoFromDateInput(checkOutInputEl.value);
    const days = checkInISO && checkOutISO ? computeDaysBetween(checkInISO, checkOutISO) : 0;
    totalPriceEl.textContent = days > 0 ? String(days * (room.pricePerNight || 0)) : '0';
  }

  function datesAreValid() {
    if (!checkInInputEl.value || !checkOutInputEl.value) return false;
    return new Date(checkOutInputEl.value) > new Date(checkInInputEl.value);
  }

  function validateForm() {
    updateTotalPrice();
    const allFilled = checkInInputEl.value && checkOutInputEl.value &&
    customerNameEl.value.trim() && customerPhoneEl.value.trim();
    bookBtn.disabled = !(allFilled && datesAreValid());
  }

  [checkInInputEl, checkOutInputEl, customerNameEl, customerPhoneEl].forEach(input => 
    input.addEventListener('input', validateForm)
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const checkInISO = isoFromDateInput(checkInInputEl.value);
    const checkOutISO = isoFromDateInput(checkOutInputEl.value);

    if (!checkInISO || !checkOutISO || new Date(checkOutISO) <= new Date(checkInISO)) {
      alert('Please enter valid check-in and check-out dates.');
      return;
    }

    const days = computeDaysBetween(checkInISO, checkOutISO);
    const totalPrice = days * (room.pricePerNight || 0);

    const payload = {
      id: 0,
      roomID: Number(room.id),
      checkInDate: checkInISO,
      checkOutDate: checkOutISO,
      totalPrice,
      isConfirmed: true,
      customerName: customerNameEl.value.trim(),
      customerId: 'tempCustomerID',
      customerPhone: customerPhoneEl.value.trim()
    };

    console.log('Booking payload:', payload);

    try {
      const res = await fetch('https://hotelbooking.stepprojects.ge/api/Booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (err) { }

      if (res.ok) {
        alert('Booking successful!');
        console.log('Server response:', parsed || text);
      } else {
        const serverMsg = (parsed && (parsed.message || parsed.error || parsed.errors)) || text || `HTTP ${res.status}`;
        console.error('Booking failed:', serverMsg);
        alert('Error booking room: ' + serverMsg);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Error booking room: ' + (err.message || String(err)));
    }
  });

  validateForm();
}

linkOne.addEventListener('click', () => {
  linksArea.innerHTML = '';

  linksArea.innerHTML = '';

  linkOne.style.color = '#5E5E5E';
  linkOne.style.border = '1px solid #E1E1E1'
  linkOne.style.borderBottom = 'none';

  linkTwo.style.border = 'none';
  linkTwo.style.color = '#5ABAC6';

  linkThree.style.border = 'none';
  linkThree.style.color = '#5ABAC6';

  linksArea.innerHTML = `
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse interdum eleifend augue, quis rhoncus purus fermentum. In hendrerit risus arcu, in eleifend metus dapibus varius. Nulla dolor sapien, laoreet vel tincidunt non, egestas non justo. Phasellus et mattis lectus, et gravida urna.</p>
  <div class="links-area-footer">
    <p>Donec pretium sem non tincidunt iaculis. Nunc at pharetra eros, a varius leo. Mauris id hendrerit justo. Mauris egestas magna vitae nisi ultricies semper. Nam vitae suscipit magna. Nam et felis nulla. Ut nec magna tortor. Nulla dolor sapien, laoreet vel tincidunt non, egestas non justo.</p>
    <img src="../Utilities/restaurant-01.jpg" alt="stake">
  </div>`
})

linkTwo.addEventListener('click', () => {
  linksArea.innerHTML = '';

  linkOne.style.border = 'none';
  linkOne.style.color = '#5ABAC6';

  linkTwo.style.color = '#5E5E5E';
  linkTwo.style.border = '1px solid #E1E1E1'
  linkTwo.style.borderBottom = 'none';

  linkThree.style.border = 'none';
  linkThree.style.color = '#5ABAC6';

  linksArea.innerHTML = `
  <p>Phasellus sodales justo felis, a vestibulum risus mattis vitae. Aliquam vitae varius elit, non facilisis massa. Vestibulum luctus diam mollis gravida bibendum. Aliquam mattis velit dolor, sit amet semper erat auctor vel. Integer auctor in dui ac vehicula. Integer fermentum nunc ut arcu feugiat, nec placerat nunc tincidunt. Pellentesque in massa eu augue placerat cursus sed quis magna.</p>
  `
})

linkThree.addEventListener('click', () => {
  linksArea.innerHTML = '';

  linkOne.style.border = 'none';
  linkOne.style.color = '#5ABAC6';

  linkTwo.style.border = 'none';
  linkTwo.style.color = '#5ABAC6';

  linkThree.style.color = '#5E5E5E';
  linkThree.style.border = '1px solid #E1E1E1'
  linkThree.style.borderBottom = 'none';

  linksArea.innerHTML = `
  <p>Aa vestibulum risus mattis vitae. Aliquam vitae varius elit, non facilisis massa. Vestibulum luctus diam mollis gravida bibendum. Aliquam mattis velit dolor, sit amet semper erat auctor vel. Integer auctor in dui ac vehicula. Integer fermentum nunc ut arcu feugiat, nec placerat nunc tincidunt. Pellentesque in massa eu augue placerat cursus sed quis magna.</p>
  `
})

function getOtherRooms(){
  fetch('https://hotelbooking.stepprojects.ge/api/Rooms/GetAll')
  .then(res => res.json())
  .then(result => {
    console.log('Fetched all rooms:', result);
    createOtherRoomsCards(result);
  })
  .catch(error => console.error('Error loading all rooms:', error));
}

function createOtherRoomsCards(array){
  otherRoomsArea.innerHTML = '';

  if (!array || array.length === 0) {
      otherRoomsArea.innerHTML = '<p>No rooms found for the selected parameters</p>';
      return;
  }

  const limitedArray = array.slice(0, 3);

    limitedArray.forEach(object => {
        const imageUrl = object.images?.[2]?.source || 'default-image.jpg';

        otherRoomsArea.innerHTML += `
        <div class="room-card">
            <div class="image-wrapper">
                <img src="${imageUrl}" alt="${object.name}">
                <button class="book-now" data-room-id="${object.id}">Book Now</button>
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

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('reservation.html')) {
        getOtherRooms();
    }
});

otherRoomsArea.addEventListener('click', (event) => {
    if (event.target.classList.contains('book-now')) {
        const roomId = event.target.dataset.roomId;
        fetch(`https://hotelbooking.stepprojects.ge/api/Rooms/GetRoom/${roomId}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(room => {
                console.log('Fetched room object for other room:', room);
                createReservationArea(room);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            })
            .catch(error => {
                console.error('Error loading room:', error);
                alert('Failed to load room details. Please try again later.');
            });
    }
});