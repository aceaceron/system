// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyB3ueNqM29tpPKOsGyZ94uuYMFhkfXrT3M",
    authDomain: "lcdedb.firebaseapp.com",
    databaseURL: "https://lcdedb-default-rtdb.firebaseio.com",
    projectId: "lcdedb",
    storageBucket: "lcdedb.appspot.com",
    messagingSenderId: "113814487086",
    appId: "1:113814487086:web:a03f7044d7f838a8151fbf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // Initialize the Realtime Database

// Function to format the given date as 'yyMMdd'
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const datePart = String(date.getDate()).padStart(2, '0'); // Date (01-31)
    return `${year}${month}${datePart}`;
}

// Function to get the next sequential number for the date key
async function getNextSequentialNumber(dateKey) {
    const countRef = ref(db, `_countForReservation/${dateKey}`);

    try {
        const snapshot = await get(countRef);
        let count = 0;
        if (snapshot.exists()) {
            count = snapshot.val();
        }
        const nextCount = count + 1;
        await set(countRef, nextCount);
        return nextCount;
    } catch (error) {
        console.error('Error getting next sequential number:', error);
        throw error;
    }
}

// Function to generate a unique ID based on the reservation date and a sequential number
async function generateUniqueId(reservationDate) {
    const dateKey = formatDate(reservationDate);
    const sequentialNumber = await getNextSequentialNumber(dateKey);
    // Format sequential number with leading zeros
    const formattedNumber = String(sequentialNumber).padStart(2, '0');
    return `${dateKey}-${formattedNumber}`;
}


// Event listener for form submission
document.querySelector('.confirm').addEventListener('click', async function (event) {
    event.preventDefault();

    const lastName = document.getElementById('lastName');
    const firstName = document.getElementById('firstName');
    const phoneNumber = document.getElementById('phoneNumber');
    const emailAddress = document.getElementById('emailAddress');
    const date = document.getElementById('date');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const startingTime = document.getElementById("dropdownTime");
    const roomType = document.getElementById("dropdown0");
    const duration = document.getElementById("dropdown1");
    const extension = document.getElementById("dropdown2");

    let valid = true;

    // Validation checks
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
        try {
            const reservationId = await generateUniqueId(date.value);
            const reservationRef = ref(db, `reservations/${date.value}/${reservationId}`);
            
            await set(reservationRef, {
                lastName: lastName.value,
                firstName: firstName.value,
                phoneNumber: phoneNumber.value,
                emailAddress: emailAddress.value,
                date: date.value,
                startingTime: startingTime.value,
                roomType: roomType.value,
                duration: duration.value,
                extension: extension.value
            });

            alert("Form submitted successfully!");

            // Clear form fields
            lastName.value = '';
            firstName.value = '';
            phoneNumber.value = '';
            emailAddress.value = '';
            date.value = '';
            termsCheckbox.checked = false;
        } catch (error) {
            console.error("Error writing to Firebase: ", error);
        }
    } else {
        alert("Please fill out all required fields correctly and/or agree to the terms and conditions.");
    }
});