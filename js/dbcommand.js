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
        console.log('Firebase script loaded and ready');

        document.getElementById('yesBtn').addEventListener('click', function() {
            document.getElementById('paymentConfirmationChkbox').checked = false;
            document.getElementById('yesBtn').disabled = true;
            if (selectedRoomId) {
                // Extract the necessary values
                const durationText = document.getElementById('ConfirmationDuration').textContent;
                const duration = parseInt(durationText.split(' ')[1]);
                const checkInDate = document.getElementById('ConfirmationCheckInDate').textContent.split(': ')[1];
                const checkInTime = document.getElementById('ConfirmationCheckInTime').textContent.split(': ')[1];
                const checkOutDate = document.getElementById('ConfirmationCheckOutDate').textContent.split(': ')[1];
                const checkOutTime = document.getElementById('ConfirmationCheckOutTime').textContent.split(': ')[1];
                const numberOfGuests = parseInt(document.getElementById('ConfirmationNumOfGuest').textContent.split(': ')[1]);
                const totalAmountPaid = parseFloat(document.getElementById('ConfirmationTotalAmountPaid').textContent.split('PHP ')[1]);
        
                // Find the button corresponding to the selected room and change its background color to red
                const roomButton = document.querySelector(`.room[data-room="${selectedRoomId}"]`);
                if (roomButton) {
                    roomButton.style.backgroundColor = 'red';
                    roomButton.style.color = 'white';
        
                    // Start the countdown timer
                    startCountdown(duration, roomButton);
        
                    // Save data
                    saveCheckInCheckOutData(selectedRoomId, duration, checkInDate, checkInTime, checkOutDate, checkOutTime, numberOfGuests, totalAmountPaid);
        
                    // Close the popup after confirming
                    closePopUpPaymentWindow();
        
                    // Automatically slide back the sliding panel
                    if (['2', '4', '6', '8', '9', '10'].includes(selectedRoomId)) {
                        document.getElementById('slidingPanelAirconAvail').classList.remove('show');
                    } else {
                        document.getElementById('slidingPanelNonAirconAvail').classList.remove('show');
                    }
                }
            }
        });
        
        console.log('External script loaded');