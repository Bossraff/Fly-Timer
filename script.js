let stopwatchCount = 0;
const maxStopwatches = 5;
let stopwatches = {};

document.getElementById('addStopwatchBtn').addEventListener('click', addStopwatch);

// Load stopwatches and history from local storage
document.addEventListener('DOMContentLoaded', () => {
    loadStopwatches();
    loadHistory();
});

function loadStopwatches() {
    const storedStopwatches = JSON.parse(localStorage.getItem('stopwatches')) || [];
    storedStopwatches.forEach((stopwatch, index) => {
        stopwatchCount = index + 1;
        createStopwatchElement(stopwatchCount, stopwatch.elapsedMilliseconds, stopwatch.status);
        if (stopwatch.running) {
            startStopwatch(stopwatchCount, stopwatch.elapsedMilliseconds, stopwatch.startTime);
        } else {
            updateDisplay(stopwatchCount, stopwatch.elapsedMilliseconds);
        }
    });
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('history')) || [];
    history.forEach(record => addHistoryRecord(record));
}

function createStopwatchElement(id, elapsedMilliseconds = 0, status = '') {
    const stopwatchDiv = document.createElement('div');
    stopwatchDiv.className = 'stopwatch';
    stopwatchDiv.id = `stopwatch${id}`;

    stopwatchDiv.innerHTML = `
        <h2>Neuron ${id}</h2>
        <input type="text" placeholder="Coordinates" id="status${id}" value="${status}" onchange="updateStatus(${id})">
        <div class="stopwatch-display" id="display${id}">${formatTime(elapsedMilliseconds)}</div>
        <div class="stopwatch-buttons">
            <button onclick="startStopwatch(${id})">Start</button>
            <button onclick="stopStopwatch(${id})">Stop</button>
            <button onclick="resetStopwatch(${id})">Reset</button>
        </div>
    `;

    document.getElementById('stopwatches').appendChild(stopwatchDiv);
}

function addStopwatch() {
    if (stopwatchCount >= maxStopwatches) {
        showNotification('Maximum number of stopwatches reached', 'warning');
        return;
    }

    stopwatchCount++;
    createStopwatchElement(stopwatchCount);

    // Save to local storage
    saveStopwatches();
}

function startStopwatch(id, elapsedMilliseconds = 0, startTime = null) {
    if (!stopwatches[id]) {
        stopwatches[id] = {
            interval: null,
            elapsedMilliseconds: elapsedMilliseconds,
            startTime: startTime || Date.now(),
            status: document.getElementById(`status${id}`).value,
        };
    }

    if (stopwatches[id].interval) return;

    stopwatches[id].startTime = Date.now() - stopwatches[id].elapsedMilliseconds;
    stopwatches[id].interval = setInterval(() => {
        stopwatches[id].elapsedMilliseconds = Date.now() - stopwatches[id].startTime;
        updateDisplay(id, stopwatches[id].elapsedMilliseconds);
        saveStopwatches();
    }, 1000);
}

function stopStopwatch(id) {
    if (stopwatches[id] && stopwatches[id].interval) {
        clearInterval(stopwatches[id].interval);
        stopwatches[id].interval = null;
        addHistoryRecord({
            id,
            elapsedMilliseconds: stopwatches[id].elapsedMilliseconds,
            status: stopwatches[id].status,
            timestamp: new Date().toLocaleString()
        });
        saveStopwatches();
        saveHistory();
    }
}

function resetStopwatch(id) {
    stopStopwatch(id);
    stopwatches[id].elapsedMilliseconds = 0;
    updateDisplay(id, 0);
    saveStopwatches();
}

function updateDisplay(id, elapsedMilliseconds) {
    document.getElementById(`display${id}`).innerText = formatTime(elapsedMilliseconds);
}

function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateStatus(id) {
    if (stopwatches[id]) {
        stopwatches[id].status = document.getElementById(`status${id}`).value;
        saveStopwatches();
    }
}

function addHistoryRecord(record) {
    const historyList = document.getElementById('historyList');
    const listItem = document.createElement('li');
    listItem.innerText = `Neuron ${record.id} (${record.status}) stopped at ${formatTime(record.elapsedMilliseconds)} on ${record.timestamp}`;
    historyList.appendChild(listItem);
}

function saveStopwatches() {
    const stopwatchesToSave = [];
    for (let i = 1; i <= stopwatchCount; i++) {
        if (stopwatches[i]) {
            stopwatchesToSave.push({
                elapsedMilliseconds: stopwatches[i].elapsedMilliseconds,
                running: !!stopwatches[i].interval,
                startTime: stopwatches[i].startTime,
                status: stopwatches[i].status,
            });
        }
    }
    localStorage.setItem('stopwatches', JSON.stringify(stopwatchesToSave));
}

function saveHistory() {
    const historyList = document.getElementById('historyList');
    const history = [];
    historyList.childNodes.forEach(node => {
        history.push({
            id: node.innerText.match(/Neuron (\d+)/)[1],
            status: node.innerText.match(/\((.*?)\)/)[1],
            elapsedMilliseconds: parseTime(node.innerText.match(/stopped at (.*?) on/)[1]),
            timestamp: node.innerText.match(/on (.*)/)[1]
        });
    });
    localStorage.setItem('history', JSON.stringify(history));
}

function parseTime(timeString) {
    const parts = timeString.split(':').map(part => parseInt(part, 10));
    return ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000;
}

document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

function clearHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = ''; // Clear the list display
    localStorage.removeItem('history'); // Remove history from local storage
}

// Function to show a notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;

    // Set color based on type (info, success, warning, error, etc.)
    notification.style.backgroundColor = getColorByType(type);

    // Show notification
    notification.style.display = 'block';

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Function to get color based on notification type
function getColorByType(type) {
    switch (type) {
        case 'success':
            return '#28a745'; // Green for success
        case 'warning':
            return '#ffc107'; // Yellow for warning
        case 'error':
            return '#dc3545'; // Red for error
        default:
            return '#007bff'; // Blue for info (default)
    }
}

// Example usage:
document.getElementById('addStopwatchBtn').addEventListener('click', function() {
    showNotification('Stopwatch added successfully', 'success');
});

// Clear history button example
document.getElementById('clearHistoryBtn').addEventListener('click', function() {
    showNotification('History cleared', 'warning');
});
