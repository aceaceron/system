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
    const elements = document.querySelectorAll('.info, .backgroundphoto, .content, .container3-content, .comment-box, .comments-list, .container3 .container3-content .gallery-item img, .container5, .container6');
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

    
});
var today = new Date();

        // Calculate tomorrow's date
        var tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Format tomorrow's date as yyyy-mm-dd
        var dd = String(tomorrow.getDate()).padStart(2, '0');
        var mm = String(tomorrow.getMonth() + 1).padStart(2, '0'); // January is 0!
        var yyyy = tomorrow.getFullYear();

        var tomorrowFormatted = yyyy + '-' + mm + '-' + dd;

        // Set the min attribute of the date input to tomorrow's date
        document.getElementById('date').setAttribute('min', tomorrowFormatted);
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

// Section 4: Event Rental Reservation Popup
const popup2 = document.getElementById('event-popup');
const eventtac = document.querySelector('.eventtac');
const closeBtn2 = document.querySelector('.close-btn2');

eventtac.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default anchor behavior
    popup2.style.display = 'block';
});

closeBtn2.addEventListener('click', () => {
    popup2.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === popup) {
        popup2.style.display = 'none';
    }
});

document.querySelector('.confirm').addEventListener('click', function(event) {
    event.preventDefault();

    const lastName = document.getElementById('lastName');
    const firstName = document.getElementById('firstName');
    const phoneNumber = document.getElementById('phoneNumber');
    const emailAddress = document.getElementById('emailAddress');
    const date = document.getElementById('date');
    const termsCheckbox = document.getElementById('termsCheckbox');

    let valid = true;

    if (lastName.value.trim() === "") {
        lastName.classList.add('error');
        valid = false;
    } else {
        lastName.classList.remove('error');
    }

    if (firstName.value.trim() === "") {
        firstName.classList.add('error');
        valid = false;
    } else {
        firstName.classList.remove('error');
    }

    if (phoneNumber.value.trim() === "") {
        phoneNumber.classList.add('error');
        valid = false;
    } else {
        phoneNumber.classList.remove('error');
    }

    if (emailAddress.value.trim() === "" || !emailAddress.checkValidity()) {
        emailAddress.classList.add('error');
        valid = false;
    } else {
        emailAddress.classList.remove('error');
    }

    if (date.value.trim() === "") {
        date.classList.add('error');
        valid = false;
    } else {
        date.classList.remove('error');
    }

    if (!termsCheckbox.checked) {
        termsCheckbox.classList.add('error');
        valid = false;
    } else {
        termsCheckbox.classList.remove('error');
    }

    if (valid) {
        // Proceed with form submission
        alert("Form submitted successfully!");
        // You can submit the form here
        // document.querySelector('form').submit();
        lastName.value = '';
        firstName.value = '';
        phoneNumber.value = '';
        emailAddress.value = '';
        date.value = '';
        termsCheckbox.checked = false;
    } else {
        alert("Please fill out all required fields correctly and/or agree to the terms and conditions.");
    }

    
});