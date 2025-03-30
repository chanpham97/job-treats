function formatDate(date) {
    // Check if date is a string and parse it
    if (typeof date === 'string') {
        date = new Date(date);
    }
    // Use UTC methods to avoid timezone issues
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    const year = date.getUTCFullYear().toString().slice(-2);

    // console.log(date, `${month}/${day}/${year}`)
    return `${month}/${day}/${year}`;
}

function getStartOfWeek(date) {
    const estDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const startOfWeek = new Date(estDate);
    startOfWeek.setDate(estDate.getDate() - estDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek
}

function getEndOfWeek(date) {
    const startOfWeek = getStartOfWeek(date)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek
}

export { formatDate, getStartOfWeek, getEndOfWeek }