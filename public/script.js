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

function missingPoints(points) {
    if (points > 0) return 0

    const userScore = document.getElementById(`score-${userSelect.value}`).textContent
    const netPoints = Number(userScore) + points
    console.log(netPoints)
    return netPoints > 0 ? 0 : Math.abs(netPoints)
}

async function postAction(points, action) {
    if (missingPoints(points) > 0) {
        showNotEnoughPointsModal(`You need ${missingPoints(points)} more points for selected reward.`);
        return;
    }

    try {
        const response = await fetch("/action/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": action,
                "user": userSelect.value,
                "points": points
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
document.getElementById("applyBtn").addEventListener("click", function () {
    postAction(25, "Applied to a Job");
});

document.getElementById("linkedinBtn").addEventListener("click", function () {
    postAction(10, "Reached Out on LinkedIn");
});

document.getElementById("coverLetterBtn").addEventListener("click", function () {
    postAction(10, "Wrote a Cover Letter");
});

document.getElementById("resumeBtn").addEventListener("click", function () {
    postAction(5, "Fixed Up Resume");
});

// Spending points functions
document.getElementById("sweetTreatBtn").addEventListener("click", function () {
    postAction(-100, "Got a sweet treat")
});

document.getElementById("buySomethingBtn").addEventListener("click", function () {
    postAction(-250, "Bought something nice")
});

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

});
*/