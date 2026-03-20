// ==========================================
// HOTEL MANAGEMENT SYSTEM - CORE LOGIC
// ==========================================

// Predefined Data Models
const initialRooms = [
    { id: '101', type: 'Standard', name: 'Cozy Standard Room', price: 4500, status: 'available', features: ['1 Bed', 'Free Wi-Fi', 'TV'], image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80' },
    { id: '102', type: 'Standard', name: 'Standard Twin Room', price: 5000, status: 'cleaning', features: ['2 Beds', 'Free Wi-Fi', 'TV'], image: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=800&q=80' },
    { id: '201', type: 'Deluxe', name: 'Ocean View Deluxe', price: 12000, status: 'available', features: ['King Bed', 'Balcony', 'Minibar'], image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80' },
    { id: '202', type: 'Deluxe', name: 'Cityscape Deluxe', price: 10000, status: 'booked', features: ['Queen Bed', 'City View', 'Bathtub'], image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80' },
    { id: '301', type: 'Suite', name: 'Presidential Suite', price: 35000, status: 'available', features: ['2 Bedrooms', 'Living Room', 'Jacuzzi'], image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80' },
    { id: '302', type: 'Suite', name: 'Executive Suite', price: 25000, status: 'available', features: ['King Bed', 'Office Desk', 'Lounge'], image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80' }
];

// App State Management using LocalStorage
class AppState {
    constructor() {
        this.initStorage();
        this.rooms = this.get('aura_rooms');
        this.bookings = this.get('aura_bookings');
    }

    initStorage() {
        if (!localStorage.getItem('aura_rooms')) {
            localStorage.setItem('aura_rooms', JSON.stringify(initialRooms));
        }
        if (!localStorage.getItem('aura_bookings')) {
            localStorage.setItem('aura_bookings', JSON.stringify([]));
        }
    }

    get(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
    }

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        // Update local memory
        if (key === 'aura_rooms') this.rooms = data;
        if (key === 'aura_bookings') this.bookings = data;
    }

    reset() {
        localStorage.removeItem('aura_rooms');
        localStorage.removeItem('aura_bookings');
        this.initStorage();
        this.rooms = this.get('aura_rooms');
        this.bookings = this.get('aura_bookings');
    }
}

const state = new AppState();

// ==========================================
// NOTIFICATIONS
// ==========================================
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if(type === 'success') iconClass = 'fa-circle-check';
    if(type === 'error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);

    // Remove toast after animation finishes (5s)
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 5000);
}

// ==========================================
// NAVIGATION SYSTEM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.page-section');
    const mobileMenuBtn = document.getElementById('mobile-menu-icon');
    const navLinks = document.querySelector('.nav-links');

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            
            // Navigate if valid target
            if (targetId && document.getElementById(targetId)) {
                // Remove active classes
                navBtns.forEach(b => {
                    // Avoid removing active from CTA buttons that aren't in nav
                    if (b.closest('.nav-links')) b.classList.remove('active');
                });
                sections.forEach(s => {
                    s.classList.remove('active');
                    s.style.display = 'none';
                });

                // Set active class to nav button (if it's in nav)
                if (btn.closest('.nav-links')) {
                    btn.classList.add('active');
                } else {
                    // Find the corresponding nav button to make active
                    const matchingNavBtn = document.querySelector(`.nav-links .nav-btn[data-target="${targetId}"]`);
                    if(matchingNavBtn) matchingNavBtn.classList.add('active');
                }

                // Show target section
                const targetEl = document.getElementById(targetId);
                targetEl.style.display = 'block';
                // Trigger reflow for animation
                void targetEl.offsetWidth; 
                targetEl.classList.add('active');

                // Close mobile menu
                navLinks.classList.remove('show');

                // If navigating to rooms, render them
                if (targetId === 'rooms') renderRooms('All');
                // If navigating to admin, render dashboard
                if (targetId === 'admin') renderAdminDashboard();
            }
        });
    });

    // Reset data functionality
    const resetBtn = document.getElementById('reset-data-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all hotel data? This will clear all bookings and reset room statuses.')) {
                state.reset();
                showToast('System Reset', 'All data has been restored to factory defaults.', 'info');
                renderAdminDashboard();
                renderFeaturedRooms(); // Also update home page
            }
        });
    }

    // Initialize initial views
    renderFeaturedRooms();
    renderAdminDashboard();
});

// ==========================================
// RENDERERS
// ==========================================

function createRoomCardHtml(room) {
    let badgeClass = 'room-type-badge';
    if(room.type === 'Suite') badgeClass += ' suite';
    if(room.type === 'Deluxe') badgeClass += ' deluxe';

    return `
        <div class="room-card glass-panel">
            <img src="${room.image}" alt="${room.name}" class="room-img">
            <div class="room-info">
                <span class="${badgeClass}">${room.type}</span>
                <h3>${room.name}</h3>
                <div class="room-features">
                    ${room.features.map(f => `<span><i class="fa-solid fa-check"></i> ${f}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                    <div class="room-price">₹${room.price}<span>/night</span></div>
                    <button class="btn btn-primary book-room-btn" data-type="${room.type}">Book Now</button>
                </div>
            </div>
        </div>
    `;
}

function renderFeaturedRooms() {
    const container = document.getElementById('featured-rooms-container');
    // Pick first 3 rooms for featured
    const featuredHtml = state.rooms.slice(0, 3).map(createRoomCardHtml).join('');
    container.innerHTML = featuredHtml;

    attachBookNowListeners();
}

function renderRooms(filterType = 'All') {
    const container = document.getElementById('rooms-container');
    const filteredRooms = filterType === 'All' 
        ? state.rooms 
        : state.rooms.filter(r => r.type === filterType);

    container.innerHTML = filteredRooms.map(createRoomCardHtml).join('');
    attachBookNowListeners();
}

// Room filter functionality
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderRooms(btn.getAttribute('data-filter'));
    });
});

function attachBookNowListeners() {
    document.querySelectorAll('.book-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const roomType = e.target.getAttribute('data-type');
            
            // Navigate to booking page
            document.querySelector('.nav-links .nav-btn[data-target="booking"]').click();
            
            // Pre-fill form
            document.getElementById('room-type').value = roomType;
            calculatePrice();
        });
    });
}

// ==========================================
// BOOKING SYSTEM
// ==========================================

const bookingForm = document.getElementById('booking-form');
const checkInInput = document.getElementById('check-in');
const checkOutInput = document.getElementById('check-out');
const roomTypeInput = document.getElementById('room-type');
const guestsInput = document.getElementById('guests-count');
const priceEstimateEl = document.getElementById('price-estimate');

// Set minimum dates
const today = new Date().toISOString().split('T')[0];
checkInInput.min = today;
checkInInput.addEventListener('change', () => {
    checkOutInput.min = checkInInput.value;
    calculatePrice();
});
checkOutInput.addEventListener('change', calculatePrice);
roomTypeInput.addEventListener('change', calculatePrice);
guestsInput.addEventListener('change', calculatePrice);

function calculatePrice() {
    if(!checkInInput.value || !checkOutInput.value || !roomTypeInput.value) {
        priceEstimateEl.textContent = '₹0.00';
        return;
    }

    const checkIn = new Date(checkInInput.value);
    const checkOut = new Date(checkOutInput.value);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if(nights <= 0) {
        priceEstimateEl.textContent = 'Invalid Dates';
        return;
    }

    // Find base price of room type
    const typicalRoom = state.rooms.find(r => r.type === roomTypeInput.value);
    const basePrice = typicalRoom ? typicalRoom.price : 0;
    
    const total = basePrice * nights;
    priceEstimateEl.textContent = `₹${total.toFixed(2)}`;
    return total;
}

bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const guestName = document.getElementById('guest-name').value;
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const roomType = roomTypeInput.value;
    
    // Simple validation
    if(new Date(checkOut) <= new Date(checkIn)) {
        showToast('Booking Error', 'Check-out date must be after Check-in date.', 'error');
        return;
    }

    // Find available room of this type
    const availableRoom = state.rooms.find(r => r.type === roomType && r.status === 'available');
    
    if(!availableRoom) {
        showToast('No Availability', `Sorry, no ${roomType} rooms are currently available.`, 'error');
        return;
    }

    const totalPrice = calculatePrice();
    const bookingId = 'BKG-' + Math.floor(Math.random() * 10000);

    const newBooking = {
        id: bookingId,
        guestName,
        checkIn,
        checkOut,
        roomType,
        roomId: availableRoom.id,
        price: totalPrice,
        status: 'Confirmed'
    };

    // Update state
    const updatedBookings = [...state.bookings, newBooking];
    state.set('aura_bookings', updatedBookings);

    // Update room status
    const updatedRooms = state.rooms.map(r => 
        r.id === availableRoom.id ? { ...r, status: 'booked' } : r
    );
    state.set('aura_rooms', updatedRooms);

    showToast('Booking Confirmed!', `Your ${roomType} room is booked. Booking ID: ${bookingId}`, 'success');
    bookingForm.reset();
    priceEstimateEl.textContent = '₹0.00';
});

// ==========================================
// ADMIN DASHBOARD
// ==========================================

function renderAdminDashboard() {
    // Calculate Stats
    const totalRooms = state.rooms.length;
    const availableRooms = state.rooms.filter(r => r.status === 'available').length;
    const occupiedRooms = state.rooms.filter(r => r.status === 'booked').length;
    const totalBookings = state.bookings.length;
    
    const revenue = state.bookings.reduce((sum, b) => sum + b.price, 0);

    document.getElementById('stat-total-rooms').textContent = totalRooms;
    document.getElementById('stat-available-rooms').textContent = availableRooms;
    document.getElementById('stat-occupied-rooms').textContent = occupiedRooms;
    document.getElementById('stat-total-bookings').textContent = totalBookings;
    document.getElementById('stat-revenue').textContent = `₹${revenue.toLocaleString()}`;

    // Render Bookings Table
    const bookingsTable = document.getElementById('bookings-table-body');
    if(state.bookings.length === 0) {
        bookingsTable.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No bookings yet.</td></tr>`;
    } else {
        bookingsTable.innerHTML = state.bookings.map(b => `
            <tr>
                <td>${b.id}</td>
                <td>${b.guestName}</td>
                <td>${b.roomType} (${b.roomId})</td>
                <td>${b.checkIn}</td>
                <td>${b.checkOut}</td>
                <td><span class="status-badge status-confirmed">${b.status}</span></td>
            </tr>
        `).join('');
    }

    // Render Room Status Table
    const roomsTable = document.getElementById('rooms-status-table-body');
    roomsTable.innerHTML = state.rooms.map(r => `
        <tr>
            <td>Room ${r.id}</td>
            <td>${r.type}</td>
            <td>₹${r.price}</td>
            <td>
                <span class="status-badge status-${r.status}">${r.status.toUpperCase()}</span>
            </td>
            <td>
                <select class="action-select status-changer" data-room-id="${r.id}">
                    <option value="" disabled selected>Update...</option>
                    <option value="available">Set Available</option>
                    <option value="cleaning">Set Cleaning</option>
                    <option value="booked">Set Booked</option>
                </select>
            </td>
        </tr>
    `).join('');

    // Attach status changers
    document.querySelectorAll('.status-changer').forEach(select => {
        select.addEventListener('change', (e) => {
            const roomId = e.target.getAttribute('data-room-id');
            const newStatus = e.target.value;
            
            const updatedRooms = state.rooms.map(r => 
                r.id === roomId ? { ...r, status: newStatus } : r
            );
            state.set('aura_rooms', updatedRooms);
            
            showToast('Status Updated', `Room ${roomId} is now ${newStatus}.`, 'success');
            renderAdminDashboard(); // Re-render to show updates
        });
    });
}

// ==========================================
// CHATBOT SYSTEM
// ==========================================

const chatToggle = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('chatbot-window');
const closeChat = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chatbot-messages');

chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('hide');
    if(!chatWindow.classList.contains('hide')) chatInput.focus();
});

closeChat.addEventListener('click', () => {
    chatWindow.classList.add('hide');
});

const defaultResponses = {
    'price': 'Our rooms start at ₹4500/night for Standard, ₹10000/night for Deluxe, and ₹25000/night for Suites.',
    'hi': 'Hello! Welcome to Haven. How can I help you today?',
    'hello': 'Hello! Welcome to Haven. How can I help you today?',
    'available': 'You can check room availability by visiting the "Rooms" section or doing a test booking!',
    'book': 'To book a room, simply go to the "Book Now" section in the menu, select your dates, and fill in your details.',
    'location': 'We are located in the heart of the virtual city, providing a premium getaway experience.',
    'amenities': 'All our rooms feature free high-speed Wi-Fi, premium bedding, and a complimentary minibar.'
};

function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = isUser ? 'user-message' : 'bot-message';
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatSubmit() {
    const text = chatInput.value.trim().toLowerCase();
    if(!text) return;

    // Add user message
    addMessage(chatInput.value, true);
    chatInput.value = '';

    // Simple reply logic
    setTimeout(() => {
        let response = "I'm sorry, I don't quite understand. Could you please check the 'Rooms' or 'Book Now' section for more details?";
        
        for (const [key, val] of Object.entries(defaultResponses)) {
            if (text.includes(key)) {
                response = val;
                break;
            }
        }
        
        addMessage(response, false);
    }, 600);
}

sendBtn.addEventListener('click', handleChatSubmit);
chatInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') handleChatSubmit();
});
