const hotelArea = document.getElementById('hotel-area');
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

async function getAllHotels() {
    try {
        const response = await fetch('https://hotelbooking.stepprojects.ge/api/Hotels/GetAll');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched Hotels:', data);
        createHotelCards(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function createHotelCards(array) {
    hotelArea.innerHTML = '';
    
    if (array.length === 0) {
        hotelArea.innerHTML = '<p>No hotels found</p>';
        return;
    }

    array.forEach(object => {
        hotelArea.innerHTML += `
        <div class="card">
            <div class="image-wrapper">
                <img src="${object.featuredImage}" alt="${object.name}">
                <button class="hover-btn" onclick="viewHotelRooms(${object.id})">View Rooms</button>
            </div>
            <div class="card-footer">
                <h5>${object.name}</h5>
            </div>
        </div>`;
    });
}

function viewHotelRooms(hotelId) {
    window.location.href = `./rooms.html?hotelId=${hotelId}`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('hotels.html')) {
        getAllHotels();
    }
});