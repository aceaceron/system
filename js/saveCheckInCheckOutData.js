import { saveCheckInCheckOutData } from '/js/dbcommand.js'; // Adjust the path accordingly
    
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