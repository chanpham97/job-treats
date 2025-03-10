document.addEventListener("DOMContentLoaded", () => {
    const perPage = 8;
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

    // Make the function globally available
    window.setupPagination = setupPagination;
});