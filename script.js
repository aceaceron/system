// Section 1: Intersection Observer for Scroll Animations
function handleIntersection(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);  // Optional: Stops observing after element is in view
        }
    });
}

const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver(handleIntersection, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.info, .backgroundphoto, .content, .container3-content, .comment-box, .comments-list, .container5, .container6');
    elements.forEach(element => observer.observe(element));

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Set min date for date input
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
});

// Section 2: Comment Handling
function addComment() {
    const nameInput = document.getElementById('nameInput');
    const dateTimeInput = document.getElementById('dateTimeInput');
    const fileInput = document.getElementById('fileInput');
    const commentInput = document.getElementById('commentInput');
    const commentsList = document.getElementById('commentsList');

    if (nameInput.value.trim() && dateTimeInput.value.trim() && fileInput.files.length > 0 && commentInput.value.trim()) {
        const newComment = document.createElement('div');
        newComment.classList.add('comment');

        const profileIcon = document.createElement('img');
        profileIcon.src = 'img/user.png';
        profileIcon.alt = 'Profile Icon';

        const commentDetails = document.createElement('div');
        commentDetails.classList.add('comment-details');

        const name = document.createElement('div');
        name.classList.add('name');
        name.textContent = nameInput.value;

        const dateTime = document.createElement('div');
        dateTime.classList.add('date-time');
        dateTime.textContent = new Date(dateTimeInput.value).toLocaleString();

        const commentText = document.createElement('div');
        commentText.textContent = commentInput.value;

        const fileLink = document.createElement('a');
        fileLink.href = URL.createObjectURL(fileInput.files[0]);
        fileLink.classList.add('file-link');
        fileLink.textContent = 'View Proof of Visit';
        fileLink.target = '_blank';

        commentDetails.appendChild(name);
        commentDetails.appendChild(dateTime);
        commentDetails.appendChild(commentText);
        commentDetails.appendChild(fileLink);

        newComment.appendChild(profileIcon);
        newComment.appendChild(commentDetails);

        commentsList.appendChild(newComment);

        // Clear form fields
        nameInput.value = '';
        dateTimeInput.value = '';
        fileInput.value = '';
        commentInput.value = '';
    } else {
        alert('Please enter all fields.');
    }
}

// Section 3: Terms and Conditions Popup
const popup = document.getElementById('terms-popup');
const tac = document.querySelector('.tac');
const closeBtn = document.querySelector('.close-btn');

tac.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default anchor behavior
    popup.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});
