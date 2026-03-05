// Make train carriages clickable - redirects to event-details
document.addEventListener('DOMContentLoaded', function() {
    const trainCarriages = document.querySelectorAll('.kem-train-carriage');
    
    trainCarriages.forEach(carriage => {
        carriage.addEventListener('click', function(e) {
            // Don't trigger if clicking on links inside
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            // Get event ID and redirect to event details
            const eventId = this.dataset.eventId;
            if (eventId) {
                window.location.href = `event-details.html?id=${eventId}`;
            }
        });
    });
    
    // Handle "View Details" links separately
    document.querySelectorAll('.kem-details-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent train carriage click
            // Link already has href, so it will navigate naturally
        });
    });
    
    // Handle "Get Ticket"/"Buy Ticket" links
    document.querySelectorAll('.kem-ticket-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent train carriage click
            // Link already has href with event ID, so it will go to tickets page
        });
    });
    
    // Mobile menu toggle
    const menuBtn = document.getElementById('menuBtn');
    const mobileNav = document.getElementById('mobileNav');
    
    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });
    }
});
