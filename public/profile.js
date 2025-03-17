document.addEventListener("DOMContentLoaded", async () => {
    const perPage = 12;
    let currentPage = 1;

    // This function is called in profile.ejs, so it gets data dynamically
    function setupPagination(actions) {
        function renderActions() {
            const start = (currentPage - 1) * perPage;
            const end = start + perPage;
            document.getElementById("action-history").innerHTML = actions
                .slice(start, end)
                .map(action => `<div class="action-item">${action.name} on ${action.formattedDate}</div>`)
                .join("");

            document.getElementById("pageNumber").innerText = currentPage;
            document.getElementById("prevPage").disabled = currentPage === 1;
            document.getElementById("nextPage").disabled = end >= actions.length;
        }

        document.getElementById("prevPage").addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderActions();
            }
        });

        document.getElementById("nextPage").addEventListener("click", () => {
            if ((currentPage * perPage) < actions.length) {
                currentPage++;
                renderActions();
            }
        });

        renderActions();
    }

    const editButton = document.querySelector(".edit-button");
    const userInfoDiv = document.querySelector(".user-info");

    editButton.addEventListener("click", async () => {
        // Get current values
        const name = document.getElementById("user-name").innerText;
        const goal = document.getElementById("user-goal").innerText;

        // Replace elements with input fields
        userInfoDiv.innerHTML = `
            <label for="name">Name:</label>
            <input type="text" id="edit-name" name="name" value="${name}" required>
            <br>
            <label for="weeklyGoal">Goal:</label>
            <input type="number" id="edit-goal" name="weeklyGoal" value="${goal}" required>

            <button id="save-button">Save</button>
            <button id="cancel-button">Cancel</button>
        `;

        // Add event listeners to new buttons
        document.getElementById("save-button").addEventListener("click", async () => {
            const updatedName = document.getElementById("edit-name").value;
            const updatedGoal = document.getElementById("edit-goal").value;
            try {
                await fetch("/user/update", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        originalName: name,
                        updatedName: updatedName,
                        weeklyGoal: updatedGoal
                    })
                })
                window.location.href = `/profile/${updatedName}`
            } catch (error) {
                alert("Error updating user info.");
                console.log(error)
            }
        });

        document.getElementById("cancel-button").addEventListener("click", () => {
            location.reload(); // Reload to reset the form
        });
    });

    // Make the function globally available
    window.setupPagination = setupPagination;
});