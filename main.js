// Make train carriages clickable
document.addEventListener('DOMContentLoaded', function() {
    const carriages = document.querySelectorAll('.train-carriage');
    
    carriages.forEach(carriage => {
        carriage.addEventListener('click', function(e) {
            // Get event info
            const eventName = this.querySelector('h3').textContent;
            const eventDate = this.querySelector('.event-date').textContent;
            
            // You can replace this with navigation to tickets page
            console.log(`Clicked: ${eventName} on ${eventDate}`);
            // window.location.href = 'tickets.html';
        });
    });
    
    // Mobile menu toggle (keep this if you had it before)
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
});
