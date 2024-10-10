let countdownInterval;
let remainingSeconds;
let totalSeconds;

// Start or update the countdown
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    totalSeconds = request.interval;
    remainingSeconds = totalSeconds;

    startCountdown();
    sendResponse({ success: true });
  } else if (request.action === 'stop') {
    stopCountdown();
    sendResponse({ success: true });
  } else if (request.action === 'get-status') {
    sendResponse({
      remainingSeconds: remainingSeconds || 0,
      totalSeconds: totalSeconds || 0
    });
  } else if (request.action === 'update-badge') {
    updateBadge(request.text);
    sendResponse({ success: true });
  }
});

function startCountdown() {
  clearInterval(countdownInterval);
  updateBadge('ON'); // Set badge text to indicate the timer is running

  countdownInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      chrome.storage.local.set({ remainingSeconds });
      updateBadge('ON'); // Update badge text

      // Optionally, log the remaining time
      console.log(`Remaining time: ${remainingSeconds} seconds`);
    } else {
      reloadActiveTab();
      remainingSeconds = totalSeconds; // Reset countdown for the next cycle
      chrome.storage.local.set({ remainingSeconds });
    }
  }, 1000);
}

function stopCountdown() {
  clearInterval(countdownInterval);
  updateBadge(''); // Clear badge text
  chrome.storage.local.remove(['remainingSeconds', 'totalSeconds']);
}

function reloadActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

function updateBadge(text) {
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' }); // Red badge background
}


// background.js
chrome.runtime.onInstalled.addListener(() => {
  // Check if info.html has been shown before
  chrome.storage.local.get(['infoShown'], (result) => {
    if (!result.infoShown) {
      // Open info.html in a new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });

      // Mark info.html as shown
      chrome.storage.local.set({ infoShown: true });
    }
  });
});

// Listener to reset infoShown flag (for development purposes)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'resetInfoShown') {
    chrome.storage.local.set({ infoShown: false });
  }
});
