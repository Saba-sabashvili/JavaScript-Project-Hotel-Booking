const guestCardArea = document.getElementById('guest-card-area');
const logo = document.getElementById('logo');

logo.addEventListener('click', () => {
    window.location.href = 'home.html';
});

const burger = document.getElementById('burger');
const nav = document.getElementById('nav-links');

burger.addEventListener('click', () => {
  nav.classList.toggle('active');
  burger.classList.toggle('open');
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

function getAllRooms() {
    fetch('https://hotelbooking.stepprojects.ge/api/Rooms/GetAll')
        .then(res => res.json())
        .then(result => {
            console.log('Fetched all rooms:', result);
            createRoomCards(result);
        })
        .catch(error => console.error('Error loading all rooms:', error));
}

function createRoomCards(array) {
    guestCardArea.innerHTML = '';

    if (!array || array.length === 0) {
        guestCardArea.innerHTML = '<p>No rooms found for the selected parameters</p>';
        return;
    }

    const limitedArray = array.slice(0, 6);

    limitedArray.forEach(object => {
        const imageUrl = object.images?.[2]?.source || 'default-image.jpg';

        guestCardArea.innerHTML += `
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

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('home.html')) {
        getAllRooms();
    }
});