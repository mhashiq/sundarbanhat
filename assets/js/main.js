document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-btn')) {
            navMenu.classList.remove('active');
        }
    });

    // Update active link based on current page
    let currentPage = window.location.pathname.split('/').pop() || 'index.html';
    currentPage = currentPage.split('?')[0].split('#')[0]; // Strip hashes/queries to fix broken active states
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update active link for Mobile Bottom Nav
    const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
    bottomNavLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Product Details Modal Dynamic Logic
    const productCards = document.querySelectorAll('.product-card');
    const productModal = document.getElementById('productModal');
    
    if (productCards.length > 0 && productModal) {
        const modalImg = document.getElementById('modalImg');
        const modalTitle = document.getElementById('modalTitle');
        const modalSubcategory = document.getElementById('modalSubcategory');
        const modalPrice = document.getElementById('modalPrice');
        const modalDesc = document.getElementById('modalDesc');
        const closeModalBtn = document.getElementById('closeModal');

        // Open Modal
        productCards.forEach(card => {
            const viewBtn = card.querySelector('.view-details-btn');
            if(viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modalImg.src = card.getAttribute('data-img');
                    modalTitle.textContent = card.getAttribute('data-title');
                    modalSubcategory.textContent = card.getAttribute('data-subcategory');
                    modalPrice.textContent = card.getAttribute('data-price');
                    modalDesc.textContent = card.getAttribute('data-desc');
                    
                    productModal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Stop background scrolling
                });
            }
        });

        // Close Modal
        const closeModal = () => {
            productModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        closeModalBtn.addEventListener('click', closeModal);
        
        // Close on clicking outside
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeModal();
            }
        });
    }

    // Modal Accordion Logic
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('active');
        });
    });
});
