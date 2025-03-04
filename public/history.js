// Get form elements
const oldUserSelect = document.getElementById("oldUserName");
const addOldActionForm = document.getElementById("addOldActionForm");
const oldActionSelect = document.getElementById("oldActionName");
const oldActionDate = document.getElementById("oldActionDate");

async function postOldAction(user, action, date) {
    try {
        const response = await fetch("/action/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": action,
                "user": user,
                "date": date, // Include the custom date
                "points": getPointsForAction(action) // Helper function to determine points
            })
        });
        
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        
        const json = await response.json();
        console.log(json);
        window.location.reload(); // Refresh the history page to show new action
    } catch (error) {
        console.error(error.message);
    }
}

// Helper function to determine points based on action type
function getPointsForAction(action) {
    const pointsMap = {
        "Applied to a Job": 25,
        "Reached Out on LinkedIn": 10,
        "Wrote a Cover Letter": 10,
        "Fixed Up Resume": 5,
        "Got a sweet treat": -100,
        "Bought something nice": -250
    };
    return pointsMap[action] || 0;
}

// Form submission handler
addOldActionForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission

    const selectedUser = oldUserSelect.value;
    const selectedAction = oldActionSelect.value;
    const selectedDate = oldActionDate.value;
    
    if (selectedAction && selectedDate) {
        postOldAction(selectedUser, selectedAction, selectedDate);
    }
});

// Add click event listeners to all delete buttons
document.querySelectorAll('.delete-action').forEach(button => {
    button.addEventListener('click', async (e) => {
        if (confirm('Are you sure you want to delete this action?')) {
            const actionId = e.target.dataset.id; // Get the action ID from data-id attribute
            try {
                const response = await fetch(`/action/delete/${actionId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                window.location.reload(); // This is the one-liner that refreshes the page!

            } catch (error) {
                console.error('Error:', error);
                alert('Failed to delete action');
            }
        }

    });
});