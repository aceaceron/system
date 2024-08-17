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
async function generateCheckInId() {
    const dateKey = formatDate();
    const sequentialNumber = await getNextSequentialNumber(dateKey);
    // Format sequential number with leading zeros
    const formattedNumber = String(sequentialNumber).padStart(3, '0');
    return `${dateKey}-${formattedNumber}`;
}

// Function to save check-in/check-out data to Firebase
export async function saveCheckInData(roomNum, initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, extension, totalDuration, numberOfGuests, totalAmountPaid) {
    try {
        const checkInId = await generateCheckInId(); // Assuming this generates a unique ID
        const newCheckInCheckOutRef = ref(db, `currentCheckIn/${checkInId}`);

        const checkInCheckOutData = {
            roomNum,
            initialDuration,
            checkInDate,
            checkInTime,
            checkOutDate,
            checkOutTime,
            extension,
            totalDuration,
            numberOfGuests,
            totalAmountPaid
        };

        await set(newCheckInCheckOutRef, checkInCheckOutData);

        return checkInId; // Return the generated check-in ID
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
            let checkInId = null;

            for (let key in data) {
                if (data.hasOwnProperty(key) && data[key].roomNum === roomNum) {
                    foundEntry = data[key];
                    checkInId = key;  // Save the key as the unique ID
                    break;
                }
            }
            if (foundEntry) {
                const { initialDuration, checkInDate, checkInTime, checkOutDate, checkOutTime, extension, numberOfGuests, totalDuration, totalAmountPaid } = foundEntry;
                var extensionStatus = '';
                if (extension === 0) {
                    extensionStatus = 'NONE';
                } else if (extension === 1) {
                    extensionStatus = extension + " HOUR";
                }else {
                    extensionStatus = extension + " HOURS";
                }

                const roomType = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? 'Air-conditioned Room' : 'Standard Room';
                document.getElementById('roomInfoUnavail').textContent = 'ROOM ' + roomNum;
                document.getElementById('UnavailRoomType').textContent = roomType;
                document.getElementById('UnavailRoomNum').textContent = roomNum;
                document.getElementById('UnavailDuration').textContent = initialDuration + ' HOURS';
                document.getElementById('UnavailCheckInDate').textContent = checkInDate;
                document.getElementById('UnavailCheckInTime').textContent = checkInTime;
                document.getElementById('UnavailCheckOutDate').textContent = checkOutDate;
                document.getElementById('UnavailCheckOutTime').textContent = checkOutTime;
                document.getElementById('UnavailExtension').textContent = extensionStatus;
                document.getElementById('UnavailTotalDuration').textContent = totalDuration + ' HOURS';
                document.getElementById('UnavailNumOfGuest').textContent = numberOfGuests;
                document.getElementById('UnavailTotalAmountPaid').textContent = 'PHP ' + totalAmountPaid + '.00';

                document.getElementById('UnavailCheckInId').textContent = checkInId;

                const currentTime = new Date().getTime();
                const checkoutDateTime = new Date(`${checkOutDate} ${checkOutTime}`).getTime();
                let remainingTime = checkoutDateTime - currentTime;

                // Find the button for the selected room
                const roomButton = document.querySelector(`#room${roomNum}`);
                if (roomButton) {
                    // Pass checkInId and roomNum to startCountdown
                    startCountdown(remainingTime, roomButton, checkInId, roomNum);
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

function startCountdown(initialDuration, roomButton, checkInId, roomId) {
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
            moveDataToPastCheckIn(checkInId);
            saveRoomState(roomId, true); // 'true' indicates the room is now available
        } else {
            initialDuration -= 1000;
        }
    }, 1000);
}

async function moveDataToPastCheckIn(checkInId) {
    try {
        // Reference to the current check-in/check-out data using the unique ID
        const checkInCheckOutRef = ref(db, `currentCheckIn/${checkInId}`);
        
        // Get the data
        const checkInCheckOutSnapshot = await get(checkInCheckOutRef);
        const checkInCheckOutData = checkInCheckOutSnapshot.val();

        if (checkInCheckOutData) {
            // Get the current date
            const currentDate = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

            // Save the data to the pastCheckIn table under the current date using the unique ID
            const pastCheckInRef = ref(db, `pastCheckIn/${currentDate}/${checkInId}`);
            
            // Save the data to the pastCheckIn table
            await set(pastCheckInRef, checkInCheckOutData);
            
            // Remove the old data from currentCheckIn
            await remove(checkInCheckOutRef);
            
            location.reload(true);
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

        const checkInIdElement = document.getElementById('UnavailCheckInId');
        const roomNumElement = document.getElementById('UnavailRoomNum');

        // Check if required DOM elements are present
        if (!checkInIdElement || !roomNumElement) {
            console.error('Required DOM elements not found.');
            return;
        }

        // Retrieve unique ID and selected room number
        const checkInId = checkInIdElement.textContent.trim();
        const roomNum = roomNumElement.textContent.trim();

        if (!checkInId || !roomNum) {
            console.error('Unique ID or Room Number is missing.');
            return;
        }

        // Determine the additional fee based on the room type
        const additionalFee = ['2', '4', '6', '8', '9', '10'].includes(roomNum) ? ADDITIONAL_EXTENSIONFEE_AIRCON : ADDITIONAL_EXTENSIONFEE_NON_AIRCON;

        // Reference to the current booking data in Firebase
        const bookingRef = ref(db, `currentCheckIn/${checkInId}`);
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

        const newExtension = (bookingData.extension || 0) + 1;
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
            extension: newExtension,
            totalDuration: newTotalDuration, 
            totalAmountPaid: newTotalAmount
        });

        // Update the UI with the new check-out date and time
        document.getElementById('UnavailCheckOutDate').textContent = newCheckoutDate;
        document.getElementById('UnavailCheckOutTime').textContent = newCheckoutTime;
        document.getElementById('UnavailExtension').textContent = `${newExtension} HOURS`;
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
        const checkInId = document.getElementById('UnavailCheckInId').textContent; // Fetch the displayed unique ID
        
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
            await moveDataToPastCheckIn(checkInId);

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
        const reservationsRef = ref(db, 'activeReservations');
        const snapshot = await get(reservationsRef);

        if (snapshot.exists()) {
            const reservations = snapshot.val();
            reservationDiv.innerHTML = '';

            for (const [date, reservationsByDate] of Object.entries(reservations)) {
                for (const [reservationId, reservationData] of Object.entries(reservationsByDate)) {
                    const reservationDivElement = document.createElement('div');
                    reservationDivElement.classList.add('reservation-item');
                    var extensionStatus = '';
                    if (reservationData.extension === 0) {
                        extensionStatus = 'NONE';
                    } else if (reservationData.extension === 1) {
                        extensionStatus = reservationData.extension + " HOUR";
                    } else {
                        extensionStatus = reservationData.extension + " HOURS";
                    }
                    
                    reservationDivElement.innerHTML = `
                        <p><strong>Reservation ID:</strong><br>${reservationId}</p>
                        <p><strong>Reservation Date:</strong><br>${reservationData.reservationCheckInDate}</p>
                        <p><strong>Check-In Time:</strong><br>${reservationData.reservationCheckInTime}</p>
                        <p><strong>Room Type:</strong><br>${reservationData.roomType}</p>
                        <p><strong>Duration:</strong><br>${reservationData.duration} HOURS</p>
                        <p><strong>Number of Guests:</strong><br>${reservationData.numberOfGuests}</p>
                        <p><strong>Extension:</strong><br>${extensionStatus}</p>
                        <p><strong>Amount to Pay:</strong><br>PHP ${reservationData.amountToPay}.00</p><hr>
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

                    // Attach event listeners after the content is rendered
                    reservationDivElement.querySelector('.btn-book').addEventListener('click', function() {
                        const today = new Date();
                        const checkInDate = new Date(reservationData.reservationCheckInDate);
                        const checkInTime = reservationData.reservationCheckInTime;
                        const amountToPay = reservationData.amountToPay;
                    
                        // Parsing the check-in time considering AM/PM
                        const [time, modifier] = checkInTime.split(' ');
                        let [checkInHour, checkInMinute] = time.split(':').map(Number);
                    
                        if (modifier === 'PM' && checkInHour < 12) {
                            checkInHour += 12;
                        } else if (modifier === 'AM' && checkInHour === 12) {
                            checkInHour = 0;
                        }
                    
                        // Combine the check-in date and time into a single Date object
                        const checkInDateTime = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), checkInHour, checkInMinute);
                    
                        // Calculate the differences
                        const timeDifference = checkInDateTime - today;
                        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                        const minutesDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60));
                    
                        if (daysDifference > 0) {
                            alert(`Reservation check-in date for ID: ${reservationId} is not yet today. \nIt will be ${daysDifference} day/s to go.`);
                        } else if (daysDifference === 0 && minutesDifference > 10) {
                            alert(`Reservation for ID: ${reservationId} is not yet in this time. \n${minutesDifference} minutes to go.`);
                        } else if (daysDifference === 0 && minutesDifference <= 10) {
                            const roomElement = reservationDivElement.querySelector('p:nth-child(4)');
                        
                            if (roomElement) {
                                const roomText = roomElement.textContent.trim();
                        
                                // Extract the room type by splitting based on the colon and trimming
                                const roomTypeMatch = roomText.match(/Room Type:\s*(.*)/);
                                const roomType = roomTypeMatch ? roomTypeMatch[1].trim() : 'Unknown';
                        
                                // Ask if the customer has paid the amount
                                const isPaid = confirm(`Has the customer paid the amount PHP ${amountToPay}.00, for Reservation ID: ${reservationId}?\nThis action can not be undone!`);
                        
                                if (isPaid) {
                                    showRoomSelectionModal(roomType, reservationData, reservationId);
                                } else {
                                    alert('Please ensure the customer has paid before proceeding with the reservation.');
                                }
                            } else {
                                console.error('Room type element not found!');
                            }
                        } else {
                            alert("Please check your time and date.");
                        }
                        
                    });

                    reservationDivElement.querySelector('.btn-no-show').addEventListener('click', function() {
                        const today = new Date();
                        const checkInDate = new Date(reservationData.reservationCheckInDate);
                        const checkInTime = reservationData.reservationCheckInTime;
                        const reservationCheckInDate = reservationData.reservationCheckInDate;
                    
                        // Parsing the check-in time considering AM/PM
                        const [time, modifier] = checkInTime.split(' ');
                        let [checkInHour, checkInMinute] = time.split(':').map(Number);
                    
                        if (modifier === 'PM' && checkInHour < 12) {
                            checkInHour += 12;
                        } else if (modifier === 'AM' && checkInHour === 12) {
                            checkInHour = 0;
                        }
                    
                        // Combine the check-in date and time into a single Date object
                        const checkInDateTime = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), checkInHour, checkInMinute);
                    
                        // Calculate the differences
                        const timeDifference = checkInDateTime - today;
                        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                        const minutesDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60));
                    
                        if (daysDifference > 0) {
                            alert(`Reservation check-in date for ID: ${reservationId} is not yet today. \nIt will be ${daysDifference} day/s to go.`);
                        } else if (daysDifference === 0 && minutesDifference > 10) {
                            alert(`Reservation for ID: ${reservationId} is not yet in this time. \n${minutesDifference} minutes to go.`);
                        } else if (daysDifference === 0 && minutesDifference <= 10) {
                            const confirmNoShow = confirm(`Has the customer for Reservation ID: ${reservationId} no showed his/her reservation? \nThis action can not be undone!`);
                            if (confirmNoShow) {
                                const reason = 'No show / Did not appear';
                                moveToFailedReservations(reservationId, reservationCheckInDate, reason);
                            }
                        } else {
                            alert("Please check your time and date.");
                        }
                    });

                    reservationDivElement.querySelector('.btn-invalid').addEventListener('click', function() {
                        openInvalidModal(reservationId, reservationData);
                    });
                    
                }
            }

        } else {
            reservationDiv.innerHTML = '<p>No reservations found.</p>';
        }
    } catch (error) {
        console.error('Error fetching reservations:', error);
    }
}

async function setupRoomSelectionModal(roomType) {
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

        // Fetch room availability from Firebase (this is an async operation)
        const roomState = await getRoomState(roomNumber);

        if ((roomType === 'STANDARD ROOM' && standardRooms.includes(roomNumber)) ||
            (roomType === 'AIR-CONDITIONED ROOM' && airconRooms.includes(roomNumber))) {
            roomDiv.classList.add('disabled');
            roomDiv.style.backgroundColor = 'Gray'; // Set background color to gray
            roomDiv.style.cursor = 'not-allowed'; // Set cursor to not-allowed
        } else if (roomState && !roomState.isAvailable) {
            roomDiv.style.backgroundColor = 'red';
            roomDiv.style.cursor = 'not-allowed';
            roomDiv.classList.add('disabled');
        } else if (roomState && roomState.isAvailable) {
            roomDiv.style.backgroundColor = 'green';
        }
    }

    // After all room availability checks are done, show the modal
    roomSelectionModal.style.display = 'block';
}

async function showRoomSelectionModal(roomType, reservationData, reservationId) {
    // Show loading screen
    showLoadingScreen();

    try {
        await setupRoomSelectionModal(roomType);

        const roomNumbersContainer = document.getElementById('roomNumbersContainer');
        const roomNumbers = roomNumbersContainer.querySelectorAll('.room-number');

        roomNumbers.forEach(roomDiv => {
            if (roomDiv.style.backgroundColor === 'green') {
                // Add a click event listener for the green rooms
                roomDiv.addEventListener('click', async () => {
                    await handleRoomSelection(roomDiv, reservationData, reservationId);
                });
            }
        });

    } catch (error) {
        console.error('Error fetching room states:', error);
    } finally {
        // Hide the loading screen
        hideLoadingScreen();
    }
}

async function handleRoomSelection(roomDiv, reservationData, reservationId) {
    const roomNumber = roomDiv.getAttribute('data-room');
    const roomSelectionModal = document.getElementById('roomSelectionModal');

    if (reservationData && reservationId) {
        const { duration, extension, reservationCheckInDate } = reservationData;

        // Calculate check-out time
        const now = new Date();
        const checkOut = new Date(now.getTime() + (duration + extension) * 60 * 60 * 1000);
        const checkOutDate = checkOut.toLocaleDateString();
        const checkOutTime = checkOut.toLocaleTimeString();

        const totalDuration = duration + extension;

        // Save check-in/check-out data and get the checkInId
        const checkInId = await saveCheckInData(
            roomNumber,
            duration,
            now.toISOString().split('T')[0], // checkInDate
            now.toLocaleTimeString(), // checkInTime
            checkOutDate,
            checkOutTime,
            extension,
            totalDuration,
            reservationData.numberOfGuests,
            reservationData.amountToPay
        );

        // Move the reservation data to 'completedReservations', including the checkInId
        await moveToCompletedReservations(reservationId, reservationCheckInDate, checkInId);

        // Update room availability
        await saveRoomState(roomNumber, false);

        // Update UI
        roomDiv.style.backgroundColor = 'red';
        roomDiv.style.cursor = 'not-allowed';
        roomDiv.classList.add('disabled');

        location.reload(true);

        // Hide the modal
        roomSelectionModal.style.display = 'none';
    } else {
        console.error('Reservation data or ID is missing.');
    }
}

async function moveToCompletedReservations(reservationId, reservationCheckInDate, checkInId) {
    try {
        const reservationRef = ref(db, `activeReservations/${reservationCheckInDate}/${reservationId}`);
        const completedReservationRef = ref(db, `completedReservations/${reservationCheckInDate}/${reservationId}`);

        const reservationSnapshot = await get(reservationRef);

        if (reservationSnapshot.exists()) {
            const reservationDetails = reservationSnapshot.val();
            reservationDetails.checkInId = checkInId; // Add the checkInId to the reservation details
            
            await set(completedReservationRef, reservationDetails);
            await remove(reservationRef);
            
            location.reload(true);
        } else {
            console.error('Reservation data does not exist for ID:', reservationId);
            // Additional debugging info
            console.log('Path checked:', reservationRef.toString());
        }
    } catch (error) {
        console.error('Error moving data to completedReservations:', error);
    }
}

async function moveToFailedReservations(reservationId, reservationDate, reason) {
    try {
        const reservationRef = ref(db, `activeReservations/${reservationDate}/${reservationId}`);
        const failedReservationRef = ref(db, `failedReservations/${reservationDate}/${reservationId}`);

        const reservationSnapshot = await get(reservationRef);

        if (reservationSnapshot.exists()) {
            const reservationDetails = reservationSnapshot.val();
            reservationDetails.reasonForFailure = reason; // Add the reason to the reservation details
            
            await set(failedReservationRef, reservationDetails);
            await remove(reservationRef);
            
            console.log('Reservation moved to failedReservations successfully.');
            location.reload(true);
        } else {
            console.error('Reservation data does not exist for ID:', reservationId);
            console.log('Path checked:', reservationRef.toString());
        }
    } catch (error) {
        console.error('Error moving data to failedReservations:', error);
    }
}

// Get modal elements
const invalidModal = document.getElementById('invalidReservationModal');
const closeInvalidModal = document.getElementById('closeInvalidModal');
const moveToFailedBtn = document.getElementById('moveToFailed');
const editReservationBtn = document.getElementById('editReservation');
const invalidReservationMessage = document.getElementById('invalidReservationMessage');
const editReservationKey = document.getElementById('editReservationKey');
const editReservationValue = document.querySelector('.editReservationValue');

// Variables to store the current reservation data
let currentReservationId = '';
let currentReservationData = {};

// Open invalid reservation modal
function openInvalidModal(reservationId, reservationData) {
    currentReservationId = reservationId;
    currentReservationData = reservationData;
    var extensionStatus;

    if (reservationData.extension === 0) {
        extensionStatus = 'NONE';
    } else if (reservationData.extension === 1) {
        extensionStatus = reservationData.extension + " HOUR";
    } else {
        extensionStatus = reservationData.extension + " HOURS";
    }

    // Populate the reservation info in the modal
    document.getElementById('reservationInfoId').textContent = reservationId;
    document.getElementById('reservationInfoCheckInDate').textContent = reservationData.reservationCheckInDate;
    document.getElementById('reservationInfoCheckInTime').textContent = reservationData.reservationCheckInTime;
    document.getElementById('reservationInfoRoomType').textContent = reservationData.roomType;
    document.getElementById('reservationInfoDuration').textContent = reservationData.duration + ' HOURS';
    document.getElementById('reservationInfoExtension').textContent = extensionStatus;
    document.getElementById('reservationInfoNumOfGuest').textContent = reservationData.numberOfGuests;
    document.getElementById('reservationInfoTotalAmountPaid').textContent = `PHP ${reservationData.amountToPay}.00`;

    invalidReservationMessage.textContent = `Would you like to delete Reservation ID: ${reservationId} due to invalid values, or would you prefer to edit the values?`;

    const editReservationValueInput = document.querySelector('#editReservationValue');
    editReservationValueInput.value = reservationData.lastName;
    
    invalidModal.style.display = 'flex';
}

// Handle move to failed reservations
moveToFailedBtn.onclick = async function() {
    const reason = document.querySelector('.reasonOfFailure').value.trim();
    
    if (reason === '') {
        alert('Please provide a reason for the failure.');
        return;
    }

    await moveToFailedReservations(currentReservationId, currentReservationData.reservationCheckInDate, reason);
    invalidModal.style.display = 'none';
};

// Handle editing reservation values
editReservationKey.addEventListener('change', function() {
    const selectedKey = editReservationKey.value;
    editReservationValue.value = currentReservationData[selectedKey] || '';
});

editReservationBtn.onclick = async function() {
    const selectedKey = editReservationKey.value;
    const newValue = editReservationValue.value.trim();

    if (newValue === '') {
        alert('Please provide a new value.');
        return;
    }

    // Update the reservation data
    currentReservationData[selectedKey] = newValue;

    try {
        const reservationRef = ref(db, `activeReservations/${currentReservationData.reservationCheckInDate}/${currentReservationId}`);
        await set(reservationRef, currentReservationData);
        
        alert(`Reservation updated successfully!`);
        invalidModal.style.display = 'none';
        location.reload(true); // Reload the page to reflect changes
    } catch (error) {
        console.error('Error updating reservation:', error);
        alert('Failed to update the reservation. Please try again.');
    }
};

// Close the modal when the user clicks on the close button
closeInvalidModal.onclick = function() {
    invalidModal.style.display = 'none';
};

// Close the modal when the user clicks anywhere outside the modal
window.onclick = function(event) {
    if (event.target == invalidModal) {
        invalidModal.style.display = 'none';
    }
};


document.getElementById('closeRoomSelectionModal').addEventListener('click', function() {
    document.getElementById('roomSelectionModal').style.display = 'none';
});

// Function to show the loading screen
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'block';
}

// Function to hide the loading screen
function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    hideLoadingScreen();
});

// Call the function to display reservations when the page loads
window.onload = displayReservations;

console.log('Firebase script loaded and ready');
