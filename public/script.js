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

    const userScore = document.getElementById(`score-${userSelect.value}`).dataset.spendingPoints
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

        checkForTreat(actionData.user, actionData.points)
    } catch (error) {
        console.error(error.message);
    }
}

// Event listeners for each action button
const actionButtons = document.getElementsByClassName("action-type")
for (let i = 0; i < actionButtons.length; i++) {
    let actionButton = actionButtons[i]
    actionButton.addEventListener("click", function () {
        console.log(`${actionButton.dataset.name} button clicked`)
        postAction(actionButton.id, actionButton.dataset.name, parseInt(actionButton.dataset.points));
    });
}

// Event listeners for user profile buttons
const userLinks = document.querySelectorAll(".scoreboard li")
for (let i = 0; i < userLinks.length; i++) {
    let userLink = userLinks[i]
    userLink.addEventListener("click", () => {
        const userName = userLink.dataset.user;
        window.location.href = `/profile/${(userName)}`;
    });
};

function showPopup(message) {
    let popup = document.getElementById('popup');
    let popupMessage = document.getElementById('popupMessage');

    popupMessage.textContent = message;
    popup.style.display = 'flex';
}

document.getElementById('popupBtn').addEventListener('click', function () {
    document.getElementById('popup').style.display = 'none';
    window.location.reload()
});


async function checkForTreat(userName, pointsAdded) {
    const response = await fetch('/treats/weekly');
    const availableTreats = await response.json();
    const user = window.appData.users.find(user => user.name === userName);
    const currentWeeklyPoints = user.weeklyPoints;
    const newTotalPoints = currentWeeklyPoints + pointsAdded;
    const earnedTreatIds = user.weeklyTreats ? user.weeklyTreats.map(treat => treat.treat) : [];

    console.log(earnedTreatIds)
    const newlyEligibleTreats = availableTreats.filter(treat =>
        newTotalPoints >= treat.pointsRequired && !earnedTreatIds.includes(treat._id)
    );

    if (newlyEligibleTreats.length === 0) {
        console.log('No eligible treats')
        window.location.reload()
    }

    for (const treat of newlyEligibleTreats) {
        try {
            const response = await fetch('/treats/user-add', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user._id,
                    treatTypeId: treat._id
                })
            });
            console.log(response)
            showPopup(`You earned a ${treat.name}`);
        } catch(error) {
            console.log(error)
        }
    }

    return true;
}
