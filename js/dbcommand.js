// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

// Function to format the current date as YYYYMMDD
function formatDate() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
    const date = String(now.getDate()).padStart(2, '0'); // Date (01-31)
    return `${year}${month}${date}`;
}

// Function to get the next sequential number for the date key
async function getNextSequentialNumber(dateKey) {
    const countRef = ref(db, `_countForCheckIns/${dateKey}`);

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

// Function to generate a unique ID based on the current date and a sequential number
async function generateUniqueId() {
    const dateKey = formatDate();
    const sequentialNumber = await getNextSequentialNumber(dateKey);
    // Format sequential number with leading zeros
    const formattedNumber = String(sequentialNumber).padStart(3, '0');
    return `${dateKey}-${formattedNumber}`;
}

// Function to save check-in/check-out data to Firebase
export async function saveCheckInCheckOutData(roomNum, initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, totalDuration, numberOfGuests, totalAmountPaid) {
    try {
        const uniqueId = await generateUniqueId();
        const newCheckInCheckOutRef = ref(db, `currentCheckIn/${uniqueId}`);

        const checkInCheckOutData = {
            roomNum,
            initialDuration,
            checkInDate,
            checkInTime,
            checkOutDate,
            checkOutTime,
            totalDuration,
            numberOfGuests,
            totalAmountPaid
        };

        await set(newCheckInCheckOutRef, checkInCheckOutData);
        console.log('Check-in/Check-out data saved with ID:', uniqueId);
    } catch (error) {
        console.error('Error saving check-in/check-out data:', error);
    }
}

window.fetchRoomData = async function(roomNum) {
    try {
        const roomRef = ref(db, 'currentCheckIn'); 
        const snapshot = await get(roomRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            let foundEntry = null;
            let uniqueId = null;

            for (let key in data) {
                if (data.hasOwnProperty(key) && data[key].roomNum === roomNum) {
                    foundEntry = data[key];
                    uniqueId = key;  // Save the key as the unique ID
                    break;
                }
            }
            if (foundEntry) {
                const { initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, numberOfGuests, totalDuration, totalAmountPaid } = foundEntry;

                const roomType = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? 'Air-conditioned Room' : 'Standard Room';
                document.getElementById('roomInfoUnavail').textContent = 'ROOM ' + roomNum;
                document.getElementById('UnavailRoomType').textContent = roomType;
                document.getElementById('UnavailRoomNum').textContent = roomNum;
                document.getElementById('UnavailDuration').textContent = initialDuration + ' HOURS';
                document.getElementById('UnavailCheckInDate').textContent = checkInDate;
                document.getElementById('UnavailCheckInTime').textContent = checkInTime;
                document.getElementById('UnavailCheckOutDate').textContent = checkOutDate;
                document.getElementById('UnavailCheckOutTime').textContent = checkOutTime;
                document.getElementById('UnavailTotalDuration').textContent = totalDuration + ' HOURS';
                document.getElementById('UnavailNumOfGuest').textContent = numberOfGuests;
                document.getElementById('UnavailTotalAmountPaid').textContent = 'PHP ' + totalAmountPaid + '.00';

                document.getElementById('UnavailUniqueId').textContent = uniqueId;

                const currentTime = new Date().getTime();
                const checkoutDateTime = new Date(`${checkOutDate} ${checkOutTime}`).getTime();
                let remainingTime = checkoutDateTime - currentTime;

                // Find the button for the selected room
                const roomButton = document.querySelector(`#room${roomNum}`);
                if (roomButton) {
                    // Pass uniqueId and roomNum to startCountdown
                    startCountdown(remainingTime, roomButton, uniqueId, roomNum);
                }
            } else {
                console.log('No data available for the selected room.');
            }
        }
    } catch (error) {
        console.error('Error fetching room details:', error);
    }
}

let countdown;

function startCountdown(initialDuration, roomButton, uniqueId, roomId) {
    const availabilityText = roomButton.querySelector('.availability-text');

    countdown = setInterval(() => {  // Assign the interval ID to the higher-scoped variable
        let hours = Math.floor((initialDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((initialDuration % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((initialDuration % (1000 * 60)) / 1000);

        availabilityText.textContent = `${hours}h ${minutes}m ${seconds}s`;

        if (initialDuration <= 0) {
            clearInterval(countdown);
            roomButton.style.backgroundColor = 'skyblue';
            roomButton.style.color = 'black';
            roomButton.querySelector('.availability-text').textContent = "Available";
            moveDataToPastCheckIn(uniqueId);
            saveRoomState(roomId, true); // 'true' indicates the room is now available
        } else {
            initialDuration -= 1000;
        }
    }, 1000);
}

async function moveDataToPastCheckIn(uniqueId) {
    try {
        // Reference to the current check-in/check-out data using the unique ID
        const checkInCheckOutRef = ref(db, `currentCheckIn/${uniqueId}`);
        
        // Get the data
        const checkInCheckOutSnapshot = await get(checkInCheckOutRef);
        const checkInCheckOutData = checkInCheckOutSnapshot.val();

        if (checkInCheckOutData) {
            // Get the current date
            const currentDate = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

            // Save the data to the pastCheckIn table under the current date using the unique ID
            const pastCheckInRef = ref(db, `pastCheckIn/${currentDate}/${uniqueId}`);
            
            // Save the data to the pastCheckIn table
            await set(pastCheckInRef, checkInCheckOutData);
            console.log(`Data moved to pastCheckIn on ${currentDate} with ID: ${uniqueId}`);
            
            // Remove the old data from currentCheckIn
            await remove(checkInCheckOutRef);
            console.log(`Data removed from currentCheckIn with ID: ${uniqueId}`);
        } else {
            console.log(`No check-in/check-out data found for ID ${uniqueId}`);
        }
    } catch (error) {
        console.error('Error moving data to pastCheckIn:', error);
    }
}

// Constants for additional fees
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

document.getElementById('extendHr').addEventListener('click', async function() {
    try {
        // Show confirmation dialog to the user
        const confirmed = confirm('Are you sure you that the guest paid to extend the check-out time by one hour?');

        if (!confirmed) {
            console.log('Extension canceled.');
            return; // Exit if the user cancels
        }

        const uniqueIdElement = document.getElementById('UnavailUniqueId');
        const roomNumElement = document.getElementById('UnavailRoomNum');

        // Check if required DOM elements are present
        if (!uniqueIdElement || !roomNumElement) {
            console.error('Required DOM elements not found.');
            return;
        }

        // Retrieve unique ID and selected room number
        const uniqueId = uniqueIdElement.textContent.trim();
        const roomNum = roomNumElement.textContent.trim();

        if (!uniqueId || !roomNum) {
            console.error('Unique ID or Room Number is missing.');
            return;
        }

        // Determine the additional fee based on the room type
        const additionalFee = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? ADDITIONAL_EXTENSIONFEE_AIRCON : ADDITIONAL_EXTENSIONFEE_NON_AIRCON;

        // Reference to the current booking data in Firebase
        const bookingRef = ref(db, `currentCheckIn/${uniqueId}`);
        const snapshot = await get(bookingRef);

        if (!snapshot.exists()) {
            console.error('No data available for the given unique ID.');
            return;
        }

        const bookingData = snapshot.val();

        // Extract and format the check-out date and time
        const checkOutDateStr = bookingData.checkOutDate; // Format should be MM/DD/YYYY
        const checkOutTimeStr = bookingData.checkOutTime; // Format should be HH:MM:SS AM/PM

        // Create a Date object with the correct format
        const [month, day, year] = checkOutDateStr.split('/'); // MM/DD/YYYY
        const [time, modifier] = checkOutTimeStr.split(' '); // HH:MM:SS AM/PM
        const [hours, minutes, seconds] = time.split(':'); // HH:MM:SS

        // Convert to 24-hour format if necessary
        let hours24 = parseInt(hours, 10);
        if (modifier === 'PM' && hours24 < 12) hours24 += 12;
        if (modifier === 'AM' && hours24 === 12) hours24 = 0;

        // Construct the ISO 8601 date-time string
        const isoDateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours24.toString().padStart(2, '0')}:${minutes}:${seconds}`;
        
        // Log the formatted ISO date-time string for debugging
        console.log('Combining check-out date and time:', isoDateTimeStr);

        const checkOutDateTime = new Date(isoDateTimeStr);

        // Check if the Date object is valid
        if (isNaN(checkOutDateTime.getTime())) {
            console.error('Invalid check-out datetime format:', isoDateTimeStr);
            return;
        }

        // Add one hour to the check-out time
        checkOutDateTime.setHours(checkOutDateTime.getHours() + 1);
        
        // Convert the updated Date object to ISO string and local date/time strings
        const newCheckoutTimeISO = checkOutDateTime.toISOString();
        const newCheckoutDate = checkOutDateTime.toLocaleDateString();
        const newCheckoutTime = checkOutDateTime.toLocaleTimeString();

        // Log the new values for debugging
        console.log('New check-out date:', newCheckoutDate);
        console.log('New check-out time:', newCheckoutTime);

        const newTotalDuration = (bookingData.totalDuration || 0) + 1;

        // Update the total amount paid
        const originalAmount = parseFloat(document.getElementById('UnavailTotalAmountPaid').textContent.split('PHP ')[1]);
        const newTotalAmount = originalAmount + additionalFee;

        document.getElementById('UnavailTotalAmountPaid').textContent = `PHP ${newTotalAmount.toFixed(2)}`;

        // Update Firebase with the new checkout time and total amount
        await set(bookingRef, {
            ...bookingData,
            checkOutDate: newCheckoutDate,
            checkOutTime: newCheckoutTime,
            totalDuration: newTotalDuration, 
            totalAmountPaid: newTotalAmount
        });

        // Update the UI with the new check-out date and time
        document.getElementById('UnavailCheckOutDate').textContent = newCheckoutDate;
        document.getElementById('UnavailCheckOutTime').textContent = newCheckoutTime;
        document.getElementById('UnavailTotalDuration').textContent = `${newTotalDuration} HOURS`;

        console.log('Booking extended successfully.');
    } catch (error) {
        console.error('Error extending booking:', error);
    }
});

document.getElementById('timeOut').addEventListener('click', async function() {
    // Confirm action with the user
    const confirmed = confirm('Are you sure you want to mark this room as checked out? This action cannot be undone.');

    if (confirmed) {
        // Proceed if user pressed OK
        const uniqueId = document.getElementById('UnavailUniqueId').textContent; // Fetch the displayed unique ID
        
        // Reset the room's UI
        const roomButton = document.querySelector(`.room[data-room="${roomNum}"]`);
        if (roomButton) {
            roomButton.style.backgroundColor = 'skyblue';
            roomButton.style.color = 'black';
            roomButton.querySelector('.availability-text').textContent = "Available";
        }
        
        try {
            // Update the room's availability in Firebase
            const roomRef = ref(db, `roomsAvailability/${roomNum}/isAvailable`);
            await set(roomRef, true);
            console.log(`Room ${roomNum} availability updated to true`);

            // Move the data to the "pastCheckIn" table
            await moveDataToPastCheckIn(uniqueId);

            // Hide the sliding panel
            document.getElementById('slidingPanelUnavail').classList.remove('show');
            
            // Clear the countdown interval
            clearInterval(countdown);
        } catch (error) {
            console.error('Error during time-out process:', error);
        }
    } else {
        console.log('Time-out action canceled by user.');
    }
});

// Function to save room state (availability) to Firebase
export async function saveRoomState(roomId, isAvailable) {
    try {
        const roomRef = ref(db, `roomsAvailability/${roomId}`);
        await set(roomRef, {
            isAvailable
        });
        console.log('Room state saved:', roomId, 'Availability:', isAvailable);
    } catch (error) {
        console.error('Error saving room state:', error);
    }
}

// Function to retrieve room state from Firebase
async function getRoomState(roomId) {
    try {
        const roomRef = ref(db, `roomsAvailability/${roomId}`);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return { isAvailable: true }; // Default to available if no data
        }
    } catch (error) {
        console.error('Error retrieving room state:', error);
        return { isAvailable: true }; // Default to available in case of error
    }
}

// Function to initialize room with Firebase data
export async function initializeRoom(roomElement, roomId) {
    const roomState = await getRoomState(roomId);
    if (roomState && !roomState.isAvailable) {
        roomElement.style.backgroundColor = 'red';
        roomElement.style.color = 'white';
        changeAvailability(roomElement);
    }

    roomElement.addEventListener('click', async function() {
        if (window.yesBtnPressed) {
            // Save the room state to Firebase
            await saveRoomState(roomId, false);

            // Update the UI
            roomElement.style.backgroundColor = 'red';
            roomElement.style.color = 'white';
            changeAvailability(roomElement);
        }
    });
}

// Function to fetch and display reservations
async function displayReservations() {
    const reservationDiv = document.querySelector('.reservation');
    
    try {
        const reservationsRef = ref(db, 'reservations');
        const snapshot = await get(reservationsRef);

        if (snapshot.exists()) {
            const reservations = snapshot.val();
            reservationDiv.innerHTML = '';

            for (const [date, reservationsByDate] of Object.entries(reservations)) {
                for (const [reservationId, reservationData] of Object.entries(reservationsByDate)) {
                    const reservationDivElement = document.createElement('div');
                    reservationDivElement.classList.add('reservation-item');
                    
                    reservationDivElement.innerHTML = `
                        <p><strong>ID:</strong><br>${reservationId}</p>
                        <p><strong>Date:</strong><br>${reservationData.date}</p>
                        <p><strong>Starting Time:</strong><br>${reservationData.startingTime}</p>
                        <p><strong>Room Type:</strong><br>${reservationData.roomType}</p>
                        <p><strong>Duration:</strong><br>${reservationData.duration}</p>
                        <p><strong>Extension:</strong><br>${reservationData.extension}</p><hr>
                        <p><strong>Full Name:</strong><br>${reservationData.lastName}, ${reservationData.firstName}</p>
                        <p><strong>Phone Number:</strong><br>${reservationData.phoneNumber}</p>
                        <p><strong>Email Address:</strong><br>${reservationData.emailAddress}</p>
                        <div class="reservation-buttons">
                            <button class="btn-book"><i class="fa-solid fa-check"></i></button>
                            <button class="btn-no-show"><i class="fa-solid fa-user-slash"></i></button>
                            <button class="btn-invalid"><i class="fa-solid fa-text-slash"></i></button>
                        </div>
                    `;
                    reservationDiv.appendChild(reservationDivElement);
                }
            }

            // Attach event listeners after the content is rendered
            document.querySelectorAll('.btn-book').forEach(button => {
                button.addEventListener('click', function() {
                    const reservationItem = this.closest('.reservation-item');
                    const roomElement = reservationItem.querySelector('p:nth-child(4)'); // Adjust to correct nth-child if needed
                    
                    if (roomElement) {
                        const roomText = roomElement.textContent.trim();
            
                        // Extract the room type by splitting based on the colon and trimming
                        const roomTypeMatch = roomText.match(/Room Type:\s*(.*)/);
                        const roomType = roomTypeMatch ? roomTypeMatch[1].trim() : 'Unknown';
            
                        showRoomSelectionModal(roomType);
                    } else {
                        console.error('Room type element not found!');
                    }
                });
            });
            

        } else {
            reservationDiv.innerHTML = '<p>No reservations found.</p>';
        }
    } catch (error) {
        console.error('Error fetching reservations:', error);
    }
}

// // Function to show the room selection modal
// async function showRoomSelectionModal(roomType) {
//     const roomSelectionModal = document.getElementById('roomSelectionModal');
//     const roomNumbersContainer = document.getElementById('roomNumbersContainer');
//     roomNumbersContainer.innerHTML = ''; // Clear existing room numbers

//     const airconRooms = [1, 3, 5, 7];
//     const standardRooms = [2, 4, 6, 8, 9, 10];

//     // Determine which rooms should be shown based on the room type
//     const roomsToShow = roomType === 'AIRCON ROOM' ? airconRooms : standardRooms;

    

//     // Generate room numbers dynamically
//     for (let i = 1; i <= 10; i++) {
//         const roomDiv = document.createElement('div');
//         roomDiv.classList.add('room-number');
//         roomDiv.textContent = i;

        
//         // Fetch the room availability from Firebase
//         const roomState = await getRoomState(i);

//         // If the room is not available, disable it and change its appearance
//         if (roomState && !roomState.isAvailable) {
//             roomDiv.style.backgroundColor = 'red';
//             roomDiv.style.cursor = 'not-allowed';
//             roomDiv.classList.add('disabled'); 
//         }

//         // Disable rooms that don't match the room type
//         if (!roomsToShow.includes(i)) {
//             roomDiv.style.backgroundColor = 'gray';
//             roomDiv.style.cursor = 'not-allowed';
//             roomDiv.classList.add('disabled'); 
//         }

//         roomNumbersContainer.appendChild(roomDiv);
//     }

//     // Show the modal
//     roomSelectionModal.style.display = 'block';
// }

// Function to show the room selection modal
async function showRoomSelectionModal(roomType) {
    const roomSelectionModal = document.getElementById('roomSelectionModal');
    const roomNumbersContainer = document.getElementById('roomNumbersContainer');
    const roomNumbers = roomNumbersContainer.querySelectorAll('.room-number');

    // Reset styles for all room numbers
    roomNumbers.forEach(roomDiv => {
        roomDiv.classList.remove('disabled');
        roomDiv.style.backgroundColor = ''; // Reset to default
        roomDiv.style.cursor = ''; // Reset cursor
    });

    // Define which rooms should be disabled based on room type
    const airconRooms = [1, 3, 5, 7];
    const standardRooms = [2, 4, 6, 8, 9, 10];

    for (const roomDiv of roomNumbers) {
        const roomNumber = parseInt(roomDiv.getAttribute('data-room'), 10);

        // Fetch room availability from Firebase
        const roomState = await getRoomState(roomNumber);

        if ((roomType === 'NON-AIRCON ROOM' && standardRooms.includes(roomNumber)) || (roomType === 'AIRCON ROOM' && airconRooms.includes(roomNumber))) {
            roomDiv.classList.add('disabled');
            roomDiv.style.backgroundColor = 'Gray'; // Set background color to red
            roomDiv.style.cursor = 'not-allowed'; // Set cursor to not-allowed
        } else if (roomState && !roomState.isAvailable) {
            // If the room is not available, disable it and change its appearance
            roomDiv.style.backgroundColor = 'red';
            roomDiv.style.cursor = 'not-allowed';
            roomDiv.classList.add('disabled'); 
        } 
    }

    // Show the modal
    roomSelectionModal.style.display = 'block';
}

document.getElementById('closeRoomSelectionModal').addEventListener('click', function() {
    document.getElementById('roomSelectionModal').style.display = 'none';
});


document.getElementById('closeRoomSelectionModal').addEventListener('click', function() {
    document.getElementById('roomSelectionModal').style.display = 'none';
});

// Call the function to display reservations when the page loads
window.onload = displayReservations;

console.log('Firebase script loaded and ready');
