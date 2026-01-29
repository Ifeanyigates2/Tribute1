document.addEventListener('DOMContentLoaded', () => {
    // Hero Animation
    const heroContent = document.querySelector('.hero-content');

    setTimeout(() => {
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
        heroContent.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
    }, 100);

    // Header Scroll Effect
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.card, .bio-text, .gallery-item, h2');

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
    });

    // Handle Tribute Form Submission
    const tributeForm = document.getElementById('tribute-form');
    const tributesContainer = document.querySelector('.tribute-cards');

    // Load tributes from the database
    fetch('/api/tributes')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                tributesContainer.innerHTML = '';
            }
            data.forEach(tribute => {
                addTributeToDOM(tribute.name, tribute.relationship, tribute.message, false);
            });
        })
        .catch(() => {
            // If the API is unavailable, keep the page usable without blocking.
        });

    if (tributeForm) {
        tributeForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const relationshipInput = document.getElementById('relationship');
            const messageInput = document.getElementById('message');

            const name = nameInput.value;
            const relationship = relationshipInput.value;
            const message = messageInput.value;

            if (name && message) {
                addTributeToDOM(name, relationship, message, true);
                submitTribute(name, relationship, message);

                // Clear form
                nameInput.value = '';
                relationshipInput.value = '';
                messageInput.value = '';

                // Show success feedback (simple alert for now or custom UI)
                alert('Thank you for sharing your memory.');
            }
        });
    }

    function addTributeToDOM(name, relationship, message, isNew) {
        const card = document.createElement('div');
        card.classList.add('card');
        if (isNew) {
            card.classList.add('new-tribute');
        }

        const messageP = document.createElement('p');
        messageP.classList.add('message');
        messageP.textContent = `"${message}"`;

        const authorSpan = document.createElement('span');
        authorSpan.classList.add('author');
        const relationshipSuffix = relationship ? ` (${relationship})` : '';
        authorSpan.textContent = `- ${name}${relationshipSuffix}`;

        card.appendChild(messageP);
        card.appendChild(authorSpan);

        // Add to beginning of list
        tributesContainer.prepend(card);

        // Observer for animation if not new (new ones have own animation class)
        if (!isNew) {
            // For already loaded ones, we simply let them be or apply the observer if we want them to fade in on scroll
            // However, since they are added on load, they might be in viewport.
            // Let's manually trigger their visibility or let the existing observer logic handle them if they were in DOM before.
            // Since we are adding them AFTER DOMContentLoaded started, the initial querySelectorAll missed them.
            // Let's just make them visible immediately or observe them.
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            observer.observe(card);
        }
    }

    function submitTribute(name, relationship, message) {
        fetch('/api/tributes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, relationship, message })
        }).catch(() => {
            // Keep the UI responsive even if the submission fails.
        });
    }
});
