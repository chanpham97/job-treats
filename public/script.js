// Add User Flow
const addUserBtn = document.getElementById("addUserBtn");
const userNameInput = document.getElementById("newUserInput");
const userSelect = document.getElementById("userSelect");

async function postUser() {
    try {
        const response = await fetch("/user/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": userNameInput.value
            })

        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log(json);
        window.location.href = "/"
    } catch (error) {
        console.error(error.message);
    }
}

addUserBtn.addEventListener("click", () => {
    postUser()
})

// Posting action flow
function missingPoints(points) {
    if (points > 0) return 0

    const userScore = document.getElementById(`score-${userSelect.value}`).textContent
    const netPoints = Number(userScore) + points
    return netPoints > 0 ? 0 : Math.abs(netPoints)
}

async function postAction(id, action, points) {
    console.log(`Posting ${action} for ${points}`)
    if (missingPoints(points) > 0) {
        showNotEnoughPointsModal(`You need ${missingPoints(points)} more points for selected reward.`);
        return;
    }

    try {
        const actionData = {
            "user": userSelect.value,
            "actionType": id,
            "name": action,
            "points": points
        }

        console.log(actionData)
        const response = await fetch("/action/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(actionData)
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log(json);
        window.location.href = "/"
    } catch (error) {
        console.error(error.message);
    }
}

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

// Hide the pop-up when the button is clicked
document.getElementById('popupBtn').addEventListener('click', function () {
    document.getElementById('popup').style.display = 'none';
});

// Event listeners for each action button
const actionButtons = document.getElementsByClassName("action-type")
for(let i = 0; i < actionButtons.length; i++){
    let actionButton = actionButtons[i]
    actionButton.addEventListener("click", function () {
        console.log(`${actionButton.dataset.name} button clicked`)
        postAction(actionButton.id, actionButton.dataset.name, parseInt(actionButton.dataset.points));
    });   
}

/*
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
});
*/