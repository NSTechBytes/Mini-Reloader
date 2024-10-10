let countdownInterval;

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start-btn');
  const stopButton = document.getElementById('stop-btn');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const remainingTimeDisplay = document.getElementById('remaining-time');

  // Event listeners for buttons
  startButton.addEventListener('click', () => {
    const hours = parseInt(document.getElementById('hours').value) || 0;
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;

    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    if (totalSeconds > 0) {
      startCountdown(totalSeconds);
    } else {
      alert('Please enter a valid time.');
    }
  });

  stopButton.addEventListener('click', stopCountdown);

  presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const seconds = parseInt(button.getAttribute('data-time'));
      startCountdown(seconds);
    });
  });

  function startCountdown(seconds) {
    chrome.runtime.sendMessage({ action: 'start', interval: seconds }, () => {
      startButton.disabled = true;
      stopButton.disabled = false;
      chrome.storage.local.set({ countdownActive: true, totalSeconds: seconds });
      updateBadge('ON'); // Show notification icon
    });

    updateCountdownUI();
  }

  function stopCountdown() {
    chrome.runtime.sendMessage({ action: 'stop' }, () => {
      clearInterval(countdownInterval);
      remainingTimeDisplay.textContent = 'Time remaining: --:--:--';
      remainingTimeDisplay.style.display = 'none'; // Hide remaining time
      startButton.disabled = false;
      stopButton.disabled = true;
      chrome.storage.local.set({ countdownActive: false });
      updateBadge(''); // Remove notification icon
    });
  }

  function updateCountdownUI() {
    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      chrome.runtime.sendMessage({ action: 'get-status' }, (response) => {
        const remaining = response.remainingSeconds;

        if (remaining > 0) {
          const hrs = Math.floor(remaining / 3600);
          const mins = Math.floor((remaining % 3600) / 60);
          const secs = remaining % 60;

          remainingTimeDisplay.textContent =
            `Time remaining: ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          remainingTimeDisplay.style.display = 'block'; // Show remaining time
        } else {
          remainingTimeDisplay.textContent = 'Time remaining: --:--:--';
          remainingTimeDisplay.style.display = 'none'; // Hide remaining time
        }
      });
    }, 1000);
  }

  // Sync the UI with the current countdown when the popup is opened
  chrome.storage.local.get(['countdownActive', 'remainingSeconds'], (data) => {
    if (data.countdownActive) {
      updateCountdownUI();
      startButton.disabled = true;
      stopButton.disabled = false;
      remainingTimeDisplay.style.display = 'block'; // Show remaining time
      updateBadge('ON'); // Show notification icon
    } else {
      remainingTimeDisplay.textContent = 'Time remaining: --:--:--';
      remainingTimeDisplay.style.display = 'none'; // Hide remaining time
      startButton.disabled = false;
      stopButton.disabled = true;
      updateBadge(''); // Remove notification icon
    }
  });

  function updateBadge(text) {
    chrome.runtime.sendMessage({ action: 'update-badge', text: text });
  }
});
