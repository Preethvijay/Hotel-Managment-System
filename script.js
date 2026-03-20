// Hotel Management System JavaScript

class HotelManagementSystem {
    constructor() {
        this.rooms = this.loadFromStorage('rooms') || this.generateSampleRooms();
        this.guests = this.loadFromStorage('guests') || this.generateSampleGuests();
        this.reservations = this.loadFromStorage('reservations') || [];
        this.invoices = this.loadFromStorage('invoices') || this.generateSampleInvoices();
        
        this.currentPage = 'dashboard';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.renderDashboard();
        this.renderRooms();
        this.renderGuests();
        this.renderCalendar();
        this.renderInvoices();
        
        // Update date/time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    setupEventListeners() {
        // Sidebar navigation
        document.getElementById('toggleBtn').addEventListener('click', this.toggleSidebar);
        
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Modal controls
        this.setupModalControls();
        
        // Form submissions
        this.setupFormHandlers();
        
        // Filters and search
        this.setupFiltersAndSearch();
        
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        });
    }

    setupModalControls() {
        // Room modal
        document.getElementById('addRoomBtn').addEventListener('click', () => {
            document.getElementById('roomModal').classList.add('active');
        });
        
        document.getElementById('closeRoomModal').addEventListener('click', () => {
            document.getElementById('roomModal').classList.remove('active');
        });
        
        document.getElementById('cancelRoom').addEventListener('click', () => {
            document.getElementById('roomModal').classList.remove('active');
        });

        // Guest modal
        document.getElementById('addGuestBtn').addEventListener('click', () => {
            document.getElementById('guestModal').classList.add('active');
        });
        
        document.getElementById('closeGuestModal').addEventListener('click', () => {
            document.getElementById('guestModal').classList.remove('active');
        });
        
        document.getElementById('cancelGuest').addEventListener('click', () => {
            document.getElementById('guestModal').classList.remove('active');
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    setupFormHandlers() {
        // Room form
        document.getElementById('roomForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRoom(e.target);
        });

        // Guest form
        document.getElementById('guestForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGuest(e.target);
        });

        // Check-in form
        document.getElementById('checkinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processCheckin(e.target);
        });

        // Check-out form
        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processCheckout(e.target);
        });
    }

    setupFiltersAndSearch() {
        // Room filters
        document.getElementById('roomTypeFilter').addEventListener('change', () => {
            this.renderRooms();
        });
        
        document.getElementById('roomStatusFilter').addEventListener('change', () => {
            this.renderRooms();
        });

        // Guest search
        document.getElementById('guestSearch').addEventListener('input', (e) => {
            this.searchGuests(e.target.value);
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    navigateToPage(page) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Show selected page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(page).classList.add('active');

        this.currentPage = page;

        // Refresh page content if needed
        if (page === 'dashboard') {
            this.renderDashboard();
        } else if (page === 'reservations') {
            this.renderCalendar();
        }
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('dateTime').textContent = now.toLocaleDateString('en-US', options);
    }

    renderDashboard() {
        const totalRooms = this.rooms.length;
        const occupiedRooms = this.rooms.filter(room => room.status === 'occupied').length;
        const availableRooms = totalRooms - occupiedRooms;
        const todayRevenue = this.calculateTodayRevenue();

        document.getElementById('totalRooms').textContent = totalRooms;
        document.getElementById('occupiedRooms').textContent = occupiedRooms;
        document.getElementById('availableRooms').textContent = availableRooms;
        document.getElementById('todayRevenue').textContent = `$${todayRevenue.toLocaleString()}`;

        // Animate chart bars
        setTimeout(() => {
            document.querySelectorAll('.chart-bar').forEach(bar => {
                bar.style.setProperty('--height', bar.style.height);
            });
        }, 100);
    }

    renderRooms() {
        const typeFilter = document.getElementById('roomTypeFilter').value;
        const statusFilter = document.getElementById('roomStatusFilter').value;
        
        let filteredRooms = this.rooms;
        
        if (typeFilter) {
            filteredRooms = filteredRooms.filter(room => room.type === typeFilter);
        }
        
        if (statusFilter) {
            filteredRooms = filteredRooms.filter(room => room.status === statusFilter);
        }

        const roomsGrid = document.getElementById('roomsGrid');
        roomsGrid.innerHTML = '';

        filteredRooms.forEach(room => {
            const roomCard = this.createRoomCard(room);
            roomsGrid.appendChild(roomCard);
        });
    }

    createRoomCard(room) {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="room-header">
                <div class="room-number">Room ${room.number}</div>
                <div class="room-type">${room.type}</div>
            </div>
            <div class="room-body">
                <div class="room-status ${room.status}">${room.status}</div>
                <div class="room-price">₹${room.price}/night</div>
                <div class="room-actions">
                    <button class="btn btn-primary btn-sm" onclick="hotelMS.editRoom('${room.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="hotelMS.viewRoom('${room.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `;
        
        // animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, Math.random() * 200);
        
        return card;
    }

    renderGuests() {
        const tbody = document.getElementById('guestsTableBody');
        tbody.innerHTML = '';

        this.guests.forEach(guest => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${guest.id}</td>
                <td>${guest.name}</td>
                <td>${guest.email}</td>
                <td>${guest.phone}</td>
                <td>${guest.room || 'N/A'}</td>
                <td>${guest.checkin || 'N/A'}</td>
                <td>${guest.checkout || 'N/A'}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="hotelMS.editGuest('${guest.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="hotelMS.deleteGuest('${guest.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            dayHeader.style.fontWeight = 'bold';
            dayHeader.style.backgroundColor = '#f8f9fa';
            calendarGrid.appendChild(dayHeader);
        });

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Check if it's today
            if (today.getDate() === day && 
                today.getMonth() === this.currentMonth && 
                today.getFullYear() === this.currentYear) {
                dayElement.classList.add('today');
            }

            // Check for reservations
            const hasReservation = this.reservations.some(reservation => {
                const reservationDate = new Date(reservation.date);
                return reservationDate.getDate() === day &&
                       reservationDate.getMonth() === this.currentMonth &&
                       reservationDate.getFullYear() === this.currentYear;
            });

            if (hasReservation) {
                dayElement.classList.add('has-reservation');
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    renderInvoices() {
        const tbody = document.getElementById('invoicesTableBody');
        tbody.innerHTML = '';

        this.invoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${invoice.id}</td>
                <td>${invoice.guest}</td>
                <td>${invoice.room}</td>
                <td>₹${invoice.amount}</td>
                <td><span class="status-badge ${invoice.status}">${invoice.status}</span></td>
                <td>${invoice.date}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="hotelMS.viewInvoice('${invoice.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="hotelMS.printInvoice('${invoice.id}')">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    addRoom(form) {
        const formData = new FormData(form);
        const room = {
            id: this.generateId(),
            number: formData.get('number') || form.querySelector('input[placeholder="Room Number"]').value,
            type: formData.get('type') || form.querySelector('select').value,
            price: parseFloat(formData.get('price') || form.querySelector('input[placeholder="Price per night"]').value),
            description: formData.get('description') || form.querySelector('textarea').value,
            status: 'available'
        };

        this.rooms.push(room);
        this.saveToStorage('rooms', this.rooms);
        this.renderRooms();
        this.renderDashboard();
        
        document.getElementById('roomModal').classList.remove('active');
        form.reset();
        
        this.showNotification('Room added successfully!', 'success');
    }

    addGuest(form) {
        const formData = new FormData(form);
        const guest = {
            id: this.generateId(),
            name: formData.get('name') || form.querySelector('input[placeholder="Full Name"]').value,
            email: formData.get('email') || form.querySelector('input[placeholder="Email"]').value,
            phone: formData.get('phone') || form.querySelector('input[placeholder="Phone"]').value,
            address: formData.get('address') || form.querySelector('input[placeholder="Address"]').value,
            idNumber: formData.get('idNumber') || form.querySelector('input[placeholder="ID Number"]').value
        };

        this.guests.push(guest);
        this.saveToStorage('guests', this.guests);
        this.renderGuests();
        
        document.getElementById('guestModal').classList.remove('active');
        form.reset();
        
        this.showNotification('Guest added successfully!', 'success');
    }

    processCheckin(form) {
        const formData = new FormData(form);
        // Process check-in logic here
        this.showNotification('Check-in processed successfully!', 'success');
        form.reset();
    }

    processCheckout(form) {
        const formData = new FormData(form);
        const roomNumber = formData.get('room') || form.querySelector('input[placeholder="Room Number"]').value;
        
        // Find and update room status
        const room = this.rooms.find(r => r.number === roomNumber);
        if (room) {
            room.status = 'available';
            this.saveToStorage('rooms', this.rooms);
            this.renderRooms();
            this.renderDashboard();
            this.showNotification('Check-out processed successfully!', 'success');
        } else {
            this.showNotification('Room not found!', 'error');
        }
        
        form.reset();
    }

    searchGuests(query) {
        const filteredGuests = this.guests.filter(guest =>
            guest.name.toLowerCase().includes(query.toLowerCase()) ||
            guest.email.toLowerCase().includes(query.toLowerCase()) ||
            guest.phone.includes(query)
        );

        const tbody = document.getElementById('guestsTableBody');
        tbody.innerHTML = '';

        filteredGuests.forEach(guest => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${guest.id}</td>
                <td>${guest.name}</td>
                <td>${guest.email}</td>
                <td>${guest.phone}</td>
                <td>${guest.room || 'N/A'}</td>
                <td>${guest.checkin || 'N/A'}</td>
                <td>${guest.checkout || 'N/A'}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="hotelMS.editGuest('${guest.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="hotelMS.deleteGuest('${guest.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateSampleRooms() {
        const rooms = [];
        const types = ['single', 'double', 'suite'];
        const statuses = ['available', 'occupied', 'maintenance'];
        
        for (let i = 101; i <= 350; i++) {
            rooms.push({
                id: this.generateId(),
                number: i.toString(),
                type: types[Math.floor(Math.random() * types.length)],
                price: Math.floor(Math.random() * 200) + 100,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                description: `Comfortable ${types[Math.floor(Math.random() * types.length)]} room`
            });
        }
        
        return rooms;
    }

    generateSampleGuests() {
        return [
            {
                id: this.generateId(),
                name: 'John Doe',
                email: 'john.doe@email.com',
                phone: '+1-555-0123',
                room: '205',
                checkin: '2024-01-15',
                checkout: '2024-01-18'
            },
            {
                id: this.generateId(),
                name: 'Sarah Smith',
                email: 'sarah.smith@email.com',
                phone: '+1-555-0124',
                room: '312',
                checkin: '2024-01-14',
                checkout: '2024-01-16'
            },
            {
                id: this.generateId(),
                name: 'Mike Johnson',
                email: 'mike.johnson@email.com',
                phone: '+1-555-0125',
                room: '108',
                checkin: '2024-01-16',
                checkout: '2024-01-20'
            }
        ];
    }

    generateSampleInvoices() {
        return [
            {
                id: '001',
                guest: 'John Doe',
                room: '205',
                amount: 450,
                status: 'paid',
                date: '2024-01-15'
            },
            {
                id: '002',
                guest: 'Sarah Smith',
                room: '312',
                amount: 320,
                status: 'pending',
                date: '2024-01-14'
            },
            {
                id: '003',
                guest: 'Mike Johnson',
                room: '108',
                amount: 680,
                status: 'overdue',
                date: '2024-01-10'
            }
        ];
    }

    calculateTodayRevenue() {
        // Simulate today's revenue calculation
        return Math.floor(Math.random() * 15000) + 8000;
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Additional methods for room and guest management
    editRoom(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            // Populate form with room data and show modal
            this.showNotification('Edit room functionality would be implemented here', 'info');
        }
    }

    viewRoom(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            this.showNotification(`Viewing details for Room ${room.number}`, 'info');
        }
    }

    editGuest(guestId) {
        const guest = this.guests.find(g => g.id === guestId);
        if (guest) {
            this.showNotification('Edit guest functionality would be implemented here', 'info');
        }
    }

    deleteGuest(guestId) {
        if (confirm('Are you sure you want to delete this guest?')) {
            this.guests = this.guests.filter(g => g.id !== guestId);
            this.saveToStorage('guests', this.guests);
            this.renderGuests();
            this.showNotification('Guest deleted successfully!', 'success');
        }
    }

    viewInvoice(invoiceId) {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            this.showNotification(`Viewing invoice #${invoice.id}`, 'info');
        }
    }

    printInvoice(invoiceId) {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            this.showNotification(`Printing invoice #${invoice.id}`, 'info');
        }
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the Hotel Management System
const hotelMS = new HotelManagementSystem();

// Make it globally accessible for onclick handlers
window.hotelMS = hotelMS;