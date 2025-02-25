document.addEventListener("DOMContentLoaded", function () {
    let scores = { "Chan": 0, "Sabina": 0 };
    const scoreDisplayChan = document.getElementById("score-Chan");
    const scoreDisplaySabina = document.getElementById("score-Sabina");
    const historyList = document.getElementById("historyList");
    const userSelect = document.getElementById("userSelect");
    const addUserBtn = document.getElementById("addUserBtn");
    const userNameInput = document.getElementById("newUserInput");

    function getCurrentDate() {
        const today = new Date();
        const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Get month and ensure it's two digits
        const day = today.getDate().toString().padStart(2, '0'); // Get day and ensure it's two digits
        const year = today.getFullYear().toString().slice(-2); // Get last two digits of the year

        return `${month}/${day}/${year}`;
    }

    // Track if 100 point pop-up has been shown for each user
    let popupShown = {
        "Chan": {
            100: false,
            250: false
        },
        "Sabina": {
            100: false,
            250: false
        }
    };

    function updateScoreboard() {
        scoreDisplayChan.textContent = scores["Chan"];
        scoreDisplaySabina.textContent = scores["Sabina"];
    }

    // Function to update score and show pop-up
    function addPoints(points, action) {
        const user = userSelect.value;

        scores[user] += points;
        updateScoreboard();

        // Add to history list
        const listItem = document.createElement("li");
        listItem.textContent = `${user}: ${action} (${getCurrentDate()})`;
        historyList.prepend(listItem);

        // Check if user has reached 100 or 250 points and show pop-up
        if (scores[user] >= 100 && scores[user] < 250 && !popupShown[user][100]) {
            showPopup("You earned a sweet treat!"); // Adding dollar value for 100 points
            popupShown[user][100] = true; // Set the flag to prevent showing the 100-point pop-up again
        } else if (scores[user] >= 250 && !popupShown[user][250]) {
            showPopup("You get to buy yourself something nice!"); // Adding dollar value for 250 points
            popupShown[user][250] = true;
        }
    }

    // Show the pop-up message
    function showPopup(message, dollarAmount) {
        let popup = document.getElementById('popup');
        let popupMessage = document.getElementById('popupMessage');
        let dollarValue = document.getElementById('dollarValue'); // Get the dollar amount element

        popupMessage.textContent = message;
        if (dollarAmount) {
            dollarValue.textContent = dollarAmount; // Set the dollar amount if provided
        }
        popup.style.display = 'flex';
    }

    // Hide the pop-up when the button is clicked
    document.getElementById('popupBtn').addEventListener('click', function () {
        document.getElementById('popup').style.display = 'none';
    });

    // Event listeners for each action button
    document.getElementById("applyBtn").addEventListener("click", function () {
        addPoints(25, "Applied to a Job");
    });

    document.getElementById("linkedinBtn").addEventListener("click", function () {
        addPoints(10, "Reached Out on LinkedIn");
    });

    document.getElementById("coverLetterBtn").addEventListener("click", function () {
        addPoints(10, "Wrote a Cover Letter");
    });

    document.getElementById("resumeBtn").addEventListener("click", function () {
        addPoints(5, "Fixed Up Resume");
    });

    function subtractPoints(points, action) {
        const user = userSelect.value;

        if (scores[user] >= points) {
            scores[user] -= points; // Deduct points

            // Reset flags based on next message to be shown
            if (scores[user] < 250) {
                popupShown[user][250] = false
            }
            if (scores[user] < 100) {
                popupShown[user][100] = false
            }

            updateScoreboard();

            // Add to history list
            const listItem = document.createElement("li");
            listItem.textContent = `${user}: ${action} (${getCurrentDate()})`;
            historyList.prepend(listItem);
        } else {
            const missingPoints = points - scores[user]
            showNotEnoughPointsModal(`You need ${missingPoints} more points for selected reward.`);
        }
    }

    // Spending points functions
    document.getElementById("sweetTreatBtn").addEventListener("click", function () {
        subtractPoints(100, "Got sweet treat")
    });

    document.getElementById("buySomethingBtn").addEventListener("click", function () {
        subtractPoints(250, "Bought something nice")
    });

    // Not Enough Points Modal
    const notEnoughPointsModal = document.getElementById("notEnoughPointsModal");
    const closeNotEnoughPointsBtn = document.getElementById("closeNotEnoughPointsBtn");
    const notEnoughPointsMessage = document.getElementById("notEnoughPointsMessage");

    // Show the modal for not enough points
    function showNotEnoughPointsModal(message) {
        notEnoughPointsMessage.textContent = message;
        notEnoughPointsModal.style.display = "flex"; // Make sure the modal is visible
    }

    // Close the modal
    closeNotEnoughPointsBtn.addEventListener("click", function () {
        notEnoughPointsModal.style.display = "none";
    });

    // Add User functionality
    addUserBtn.addEventListener("click", function () {
        const userName = userNameInput.value.trim();
        if (userName && !(userName in scores)) {
            scores[userName] = 0;

            // Add user to popupShown object to track pop-up status
            popupShown[userName] = {
                100: false,
                250: false
            };

            // Create a new option element for the select dropdown
            const option = document.createElement("option");
            option.value = userName;
            option.textContent = userName;
            userSelect.appendChild(option);

            // Create a new <li> in the score list for the user
            const scoreItem = document.createElement("li");
            scoreItem.textContent = `${userName}: 0 XP`;
            scoreList.appendChild(scoreItem);

            // Reset the user input field
            userNameInput.value = "";
        } else if (userName === "") {
            alert("Please enter a valid name.");
        } else {
            alert("This user already exists.");
        }
    });

    updateScoreboard();
});
