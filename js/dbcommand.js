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

// // Function to save room state (availability and timer start time) to Firebase
// async function saveRoomState(roomId, isAvailable) {
//     try {
//         const roomRef = ref(db, `rooms/${roomId}`);
//         await set(roomRef, {
//             isAvailable
//         });
//         console.log('Room state saved:', roomId);
//     } catch (error) {
//         console.error('Error saving room state:', error);
//     }
// }

// // Function to retrieve room state from Firebase
// export async function getRoomState(roomId) {
//     try {
//         const roomRef = ref(db, `rooms/${roomId}`);
//         const snapshot = await get(roomRef);
//         if (snapshot.exists()) {
//             return snapshot.val();
//         } else {
//             console.log('No room state data available');
//             return null;
//         }
//     } catch (error) {
//         console.error('Error retrieving room state:', error);
//         return null;
//     }
// }

// // Function to initialize room state and timer
// export async function initializeRoom(roomElement, roomId) {
//     const roomState = await getRoomState(roomId);
//     if (roomState && !roomState.isAvailable) {
//         roomElement.style.backgroundColor = 'red';
//         roomElement.style.color = 'white';
//         changeAvailability(roomElement);
//     }

//     roomElement.addEventListener('click', async function() {
//         // Save the room state to Firebase
//         await saveRoomState(roomId, false);

//         // Update the UI
//         roomElement.style.backgroundColor = 'red';
//         roomElement.style.color = 'white';
//         changeAvailability(roomElement);
//     });
// }


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

console.log('Firebase script loaded and ready');
