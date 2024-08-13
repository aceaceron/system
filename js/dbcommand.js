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
    const countRef = ref(db, `checkin-checkout-count/${dateKey}`);

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
    const formattedNumber = String(sequentialNumber).padStart(4, '0');
    return `${dateKey}-${formattedNumber}`;
}

// Function to save check-in/check-out data to Firebase
export async function saveCheckInCheckOutData(selectedRoomId, duration, checkInDate, checkInTime, checkOutDate, checkOutTime, numberOfGuests, totalAmountPaid) {
    try {
        const uniqueId = await generateUniqueId();
        const newCheckInCheckOutRef = ref(db, `checkin-checkout/${uniqueId}`);

        const checkInCheckOutData = {
            selectedRoomId,
            duration,
            checkInDate,
            checkInTime,
            checkOutDate,
            checkOutTime,
            numberOfGuests,
            totalAmountPaid
        };

        await set(newCheckInCheckOutRef, checkInCheckOutData);
        console.log('Check-in/Check-out data saved with ID:', uniqueId);
    } catch (error) {
        console.error('Error saving check-in/check-out data:', error);
    }
}

window.fetchRoomData = async function(selectedRoomId) {
    try {
        const roomRef = ref(db, `checkin-checkout`); 
        const snapshot = await get(roomRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            let foundEntry = null;
            let uniqueId = null;

            // Iterate over each entry to find the one with the matching room ID
            for (let key in data) {
                if (data.hasOwnProperty(key) && data[key].selectedRoomId === selectedRoomId) {
                    foundEntry = data[key];
                    uniqueId = key;  // Save the key as the unique ID
                    break;
                }
            }
            if (foundEntry) {
                const { duration, checkInDate, checkInTime, checkOutDate, checkOutTime, numberOfGuests, totalAmountPaid } = foundEntry;

                const roomType = ['2', '4', '6', '8', '9', '10'].includes(selectedRoomId) ? 'Air-conditioned Room' : 'Standard Room';
                document.getElementById('roomInfoUnavail').textContent = `ROOM ${selectedRoomId}`;
                document.getElementById('UnavailRoomType').textContent = roomType;
                document.getElementById('UnavailDuration').textContent = `${duration} HOURS`;
                document.getElementById('UnavailCheckInDate').textContent = checkInDate;
                document.getElementById('UnavailCheckInTime').textContent = checkInTime;
                document.getElementById('UnavailCheckOutDate').textContent = checkOutDate;
                document.getElementById('UnavailCheckOutTime').textContent = checkOutTime;
                document.getElementById('UnavailNumOfGuest').textContent = numberOfGuests;
                document.getElementById('UnavailTotalAmountPaid').textContent = 'PHP ' + totalAmountPaid + '.00';


                // Display the unique ID in the panel
                document.getElementById('UnavailUniqueId').textContent = uniqueId;

                document.getElementById('slidingPanelUnavail').classList.add('show');
                document.getElementById('slidingPanelAirconAvail').classList.remove('show');
                document.getElementById('slidingPanelNonAirconAvail').classList.remove('show');
            } else {
            console.log('No data available for the selected room.');
            }
        }
    } catch (error) {
        console.error('Error fetching room details:', error);
    }
}

async function moveDataToPastCheckIn(uniqueId) {
    try {
        // Reference to the current check-in/check-out data using the unique ID
        const checkInCheckOutRef = ref(db, `checkin-checkout/${uniqueId}`);
        
        // Get the data
        const checkInCheckOutSnapshot = await get(checkInCheckOutRef);
        const checkInCheckOutData = checkInCheckOutSnapshot.val();

        if (checkInCheckOutData) {
            // Save the data to the pastCheckIn table using the same unique ID
            const pastCheckInRef = ref(db, `pastCheckIn/${uniqueId}`);
            
            // Save the data to the pastCheckIn table
            await set(pastCheckInRef, checkInCheckOutData);
            console.log(`Data moved to pastCheckIn with ID: ${uniqueId}`);
            
            // Remove the old data from checkin-checkout
            await remove(checkInCheckOutRef);
            console.log(`Data removed from checkin-checkout with ID: ${uniqueId}`);
        } else {
            console.log(`No check-in/check-out data found for ID ${uniqueId}`);
        }
    } catch (error) {
        console.error('Error moving data to pastCheckIn:', error);
    }
}

// Example usage in the 'timeOut' button click event
document.getElementById('timeOut').addEventListener('click', async function() {
    const uniqueId = document.getElementById('UnavailUniqueId').textContent; // Fetch the displayed unique ID
    
    // Reset the room's UI
    const roomButton = document.querySelector(`.room[data-room="${selectedRoomId}"]`);
    if (roomButton) {
        roomButton.style.backgroundColor = 'skyblue';
        roomButton.style.color = 'black';
        roomButton.querySelector('.availability-text').textContent = "Available";
    }
    
    // Update the room's availability in Firebase
    const roomRef = ref(db, `rooms/${selectedRoomId}/isAvailable`);
    await set(roomRef, true);
    console.log(`Room ${selectedRoomId} availability updated to true`);

    // Move the data to the "pastCheckIn" table
    await moveDataToPastCheckIn(uniqueId);

    // Hide the sliding panel
    document.getElementById('slidingPanelUnavail').classList.remove('show');
});

// Function to save room state (availability) to Firebase
export async function saveRoomState(roomId, isAvailable) {
    try {
        const roomRef = ref(db, `rooms/${roomId}`);
        await set(roomRef, {
            isAvailable
        });
        console.log('Room state saved:', roomId, 'Availability:', isAvailable);
    } catch (error) {
        console.error('Error saving room state:', error);
    }
}

// Function to retrieve room state from Firebase
export async function getRoomState(roomId) {
    try {
        const roomRef = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log('No room state data available');
            return null;
        }
    } catch (error) {
        console.error('Error retrieving room state:', error);
        return null;
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
        } else {
            console.log('Room state not saved as #yesBtn was not pressed');
        }
    });
}

Constants for additional fees
const ADDITIONAL_EXTENSIONFEE_NON_AIRCON = 100;
const ADDITIONAL_EXTENSIONFEE_AIRCON = 150;

document.getElementById('extendHr').addEventListener('click', async function() {
    try {
        // Show confirmation dialog to the user
        const confirmed = confirm('Are you sure you want to extend the check-out time by one hour?');

        if (!confirmed) {
            console.log('Extension canceled by user.');
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
        const selectedRoomId = roomNumElement.textContent.trim();

        if (!uniqueId || !selectedRoomId) {
            console.error('Unique ID or Room Number is missing.');
            return;
        }

        // Determine the additional fee based on the room type
        const additionalFee = ['2', '4', '6', '8', '9', '10'].includes(selectedRoomId) ? ADDITIONAL_EXTENSIONFEE_AIRCON : ADDITIONAL_EXTENSIONFEE_NON_AIRCON;

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

        // Update the total amount paid
        const originalAmount = parseFloat(document.getElementById('UnavailTotalAmountPaid').textContent.split('PHP ')[1]);
        const newTotalAmount = originalAmount + additionalFee;
        document.getElementById('UnavailTotalAmountPaid').textContent = `PHP ${newTotalAmount.toFixed(2)}`;

        // Update Firebase with the new checkout time and total amount
        await set(bookingRef, {
            ...bookingData,
            checkOutDate: newCheckoutDate,
            checkOutTime: newCheckoutTime,
            totalAmountPaid: newTotalAmount
        });

        // Update the UI with the new check-out date and time
        document.getElementById('UnavailCheckOutDate').textContent = newCheckoutDate;
        document.getElementById('UnavailCheckOutTime').textContent = newCheckoutTime;

        console.log('Booking extended successfully.');
    } catch (error) {
        console.error('Error extending booking:', error);
    }
});

console.log('Firebase script loaded and ready');
