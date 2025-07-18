// ==UserScript==
// @name         AADigital Turbo Hunter FINAL B -01118568524
// @namespace    http://tampermonkey.net/
// @version      //25
// @description  Auto-fill, inject date
// @match        *://egy.almaviva-visa.it/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

const PASSWORD = '****';

function promptPassword(callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        background:rgba(0,0,0,0.8);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
        background:white;
        padding:20px;
        border-radius:8px;
        text-align:center;
        font-family:sans-serif;
    `;

    box.innerHTML = `
        <h2 style="margin-bottom:12px;">🔒 Enter Password</h2>
        <input type="password" id="pwInput" placeholder="Enter password..." style="width:100%;padding:10px;font-size:14px;">
        <button id="pwSubmit" style="margin-top:12px;padding:8px 16px;background:#007bff;color:white;border:none;border-radius:4px;font-size:14px;">OK</button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const pwInput = document.getElementById('pwInput');
    const pwSubmit = document.getElementById('pwSubmit');

    // Shared handler for both button click and Enter key
    function checkPassword() {
        const value = pwInput.value;
        if (value === PASSWORD) {
            document.body.removeChild(overlay);
            callback(); // proceed
        } else {
            alert("Wrong password. Access denied.");
        }
    }

    pwSubmit.onclick = checkPassword;

    pwInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    pwInput.focus(); // Focus the input field immediately
}

    const MAX_ATTEMPTS = 25; // Still here, though not strictly used in the main retry logic now
    const CHECK_INTERVAL_MS = 5;
    let attempts = 0;
    let retryTimer = null;
    let hunting = false;
    let lastTriggerMinute = -1;
    let fieldsReady = false;
    let appointmentFound = false;
    let alertButtonClicked = false; // Flag to track if the alert button has been clicked
    let isRunning = true; // Flag to control the while loop
    let stopConditionMet = false;
    let buttonClickedThisInterval = false; // Flag to ensure only one click per interval

    // New Visa Options
    const visaOptions = [
         '----',
        'Family Reunion Visa for spouses (D)',
        'Business Visa (C)',
        'Family Reunion Visa for children (D)',
        'Study Visa (D)',
        'Tourism Visa (C)',
        'Study Visa (C)',
        'Re-entry Visa (D)',
        'Family Reunion Visa for parents, (D)',
        'Employment Visa (D)',
        'Employment (record number 2025)'
        

    ];

    function setSelection(key, value) {
        localStorage.setItem('almaviva_' + key, value);
    }

    function getSelection(key) {
        return localStorage.getItem('almaviva_' + key);
    }

    function initScript() {
        createClock();
        createControlPanel();
        waitForFieldsProperly();
        // Start observing for the alert button after the initial setup
        observeAlertButton();
        startSuccessCheckLoop(); // Start checking for success condition
    }

    function initScript() {
        createClock();
        createControlPanel();
        waitForFieldsProperly();
        // Start observing for the alert button after the initial setup
        observeAlertButton();
        startSuccessCheckLoop(); // Start checking for success condition
    }

   function createClock() {
    const clockDiv = document.createElement('div');
    clockDiv.style.cssText = `
        position:fixed;
        top:570px;
        right:20px;
        width:280px;
        padding:8px;
        background:#fff;
        border:2px solid #007bff;
        z-index:9999;
        border-radius:6px;
        font-size:25px;
        color:#007bff;
        text-align:center;
        cursor:move;
    `;
    document.body.appendChild(clockDiv);

    setInterval(() => {
        const now = new Date();
        clockDiv.innerText =
            now.toLocaleTimeString() + '.' +
            now.getMilliseconds().toString().padStart(3, '0');
    }, 50);

    // Drag logic for clock
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    clockDiv.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - clockDiv.offsetLeft;
        offsetY = e.clientY - clockDiv.offsetTop;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', stopDrag, { once: true });
    });

    function onMouseMove(e) {
        if (isDragging) {
            clockDiv.style.left = `${e.clientX - offsetX}px`;
            clockDiv.style.top = `${e.clientY - offsetY}px`;
            clockDiv.style.right = 'auto'; // prevent conflicting right value
            clockDiv.style.bottom = 'auto'; // in case you ever change bottom
        }
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
    }
}

 function createControlPanel() {
    const windowDiv = document.createElement('div');
    windowDiv.id = 'customWindow';
    windowDiv.style.cssText = `
        position:fixed;
        top:130px;
        right:20px;
        width:280px;
        background:#fff;
        border:2px solid #007bff;
        border-radius:8px;
        box-shadow:0 2px 12px rgba(0,0,0,0.2);
        z-index:99999;
        font-family:sans-serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        cursor:move;
        background:#007bff;
        color:#fff;
        padding:6px 10px;
        font-weight:bold;
        border-top-left-radius:6px;
        border-top-right-radius:6px;
        display:flex;
        justify-content:space-between;
        align-items:center;
    `;
    header.innerHTML = `
    <span style="flex:1; text-align:center;">HUNTER</span>
    <div>
        <button id="minBtn" style="border:none;background:transparent;color:white;font-weight:bold;margin-right:4px;">_</button>
        <button id="closeBtn" style="border:none;background:transparent;color:white;font-weight:bold;">×</button>
    </div>
`;

    const content = document.createElement('div');
    content.id = 'panelContent';
    content.style.padding = '8px';
    content.innerHTML = `
        <div style="text-align:center;font-weight:bold;color:#007bff;margin-bottom:2px;">
        ©️ 2025 AA DIGITAL SOLUTIONS
        </div>
        <label>Center:</label>
        <select id="center" style="width:100%;padding:4px;border:1px solid #007cff;border-radius:6px;">
            <option value="">----</option>
            <option value="mat-option-0">Cairo</option>
            <option value="mat-option-1">Alexandria</option>
        </select>
        <label>Service Level:</label>
        <select id="serviceLevel" style="width:100%;padding:4px;border:1px solid #007cff;border-radius:6px;">
            <option value="mat-option-2">Standard - 1750</option>
            <option value="mat-option-3">VIP - 3810</option>
        </select>
        <label>Visa:</label>
        <select id="visaType" style="width:100%;padding:4px;border:1px solid #007cff;border-radius:6px;">${visaOptions.map(v => `<option value="${v}">${v}</option>`).join('')}</select>
        <label>Date:</label>
        <input id="dateInput" type="date" style="width:100%;padding:4px;margin-bottom:5px;border:1px solid #007cff;border-radius:6px;">
        <button id="startRetryBtn" style="width:49%;padding:8px;background:#ffc107;color:#100;border:none;float:left;">Start Hunting</button>
        <button id="stopRetryBtn" style="width:49%;padding:8px;background:#dc3545;color:#fff;border:none;float:right;">Stop</button>
        <div style="clear:both;"></div>
        <label>Target Seconds:</label>
        <input id="targetSeconds" type="number" min="0" max="59" value="58" style="width:100%;padding:4px;margin-bottom:5px;border:1px solid #007cff;border-radius:6px;">
        <label>Target Milliseconds:</label>
        <input id="targetMilliseconds" type="number" min="0" max="999" value="750" style="width:100%;padding:4px;margin-bottom:5px;border:1px solid #007cff;border-radius:6px;">
        <p id="retries" style="text-align:center;color:#dc3545;font-weight:bold;margin-top:8px;font-size:16px;">Attempts: 0</p>
    `;

        windowDiv.appendChild(header);
    windowDiv.appendChild(content);
    document.body.appendChild(windowDiv);
// Find the HUNTER span inside the header
const hunterSpan = header.querySelector('span');

// Define the toggle function
function togglePanelMinimize() {
    if (content.style.display === 'none') {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

// Attach the click event to HUNTER
hunterSpan.addEventListener('click', () => {
    togglePanelMinimize();
});


    // Restore previous selections
    document.getElementById('center').value = getSelection('center') || 'mat-option-0';
    document.getElementById('visaType').value = getSelection('visaType') || visaOptions[0];
    document.getElementById('dateInput').value = getSelection('selectedDate') || new Date().toISOString().split('T')[0];

    document.getElementById('center').addEventListener('change', () => setSelection('center', document.getElementById('center').value));
    document.getElementById('visaType').addEventListener('change', () => setSelection('visaType', document.getElementById('visaType').value));
    document.getElementById('dateInput').addEventListener('change', () => setSelection('selectedDate', document.getElementById('dateInput').value));

    document.getElementById('startRetryBtn').onclick = () => {
        if (!hunting && fieldsReady) startHunting();
    };

    document.getElementById('stopRetryBtn').onclick = () => {
        stopHunting();
        alert('Hunting manually stopped.');
    };

    // Drag logic
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - windowDiv.offsetLeft;
        offsetY = e.clientY - windowDiv.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
        }, { once: true });
    });

    function onMouseMove(e) {
        if (isDragging) {
            windowDiv.style.left = `${e.clientX - offsetX}px`;
            windowDiv.style.top = `${e.clientY - offsetY}px`;
        }
    }

    // Minimize
    document.getElementById('minBtn').onclick = () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    };

    // Shutdown
    document.getElementById('closeBtn').onclick = () => {
        stopHunting();
        windowDiv.remove();
    };
}

    function waitForFieldsProperly() {
        const check = setInterval(() => {
            const centerDropdown = document.querySelector('#mat-select-value-1');
            const visaDropdown = document.querySelector('#mat-select-value-3');
            const cityField = document.querySelector('input[placeholder*="city of entry"]');
            const checkboxes = document.querySelectorAll('input[type=checkbox]');
            const dateField = document.querySelector('input[placeholder="DD/MM/YYYY"]');

            if (centerDropdown && visaDropdown && cityField && dateField && checkboxes.length > 0) {
                clearInterval(check);
                setTimeout(() => {
                    fillForm();
                }, 750);
            }
        }, 50);
    }

    function fillForm() {
        selectDropdown('#mat-select-value-1', getSelection('center'), () => {
            selectDropdown('#mat-select-value-5', 'mat-option-2', () => {
                // Use the selected visa option (BY NAME)
                const selectedVisa = getSelection('visaType') || visaOptions[0];
                selectVisaByName('#mat-select-value-3', selectedVisa, () => {
                    fillInputs(() => {
                        fieldsReady = true;
                        injectDateByValue(() => { // Use direct value injection
                            clickAvailability(); // Initial click
                        });
                    });
                });
            });
        });
    }

    function selectDropdown(selector, optionId, callback) {
        const dropdown = document.querySelector(selector);
        if (dropdown && optionId) {
            dropdown.click();
            const waitOption = setInterval(() => {
                const option = document.getElementById(optionId);
                if (option) {
                    clearInterval(waitOption);
                    option.click();
                    setTimeout(callback, 300);
                }
            }, 50);
        } else {
            console.warn(`Dropdown with selector ${selector} not found or optionId missing.`);
            if (callback) callback(); // Proceed even if selection fails
        }
    }

    function selectVisaByName(selector, visaName, callback) {
        const dropdown = document.querySelector(selector);
        if (dropdown && visaName) {
            dropdown.click();
            const waitOption = setInterval(() => {
                const option = Array.from(document.querySelectorAll('mat-option'))
                .find(option => option.innerText.trim() === visaName);

                if (option) {
                    clearInterval(waitOption);
                    option.click();
                    setTimeout(callback, 300);
                } else {
                    // If option not found after a while, maybe the list hasn't loaded?
                    // This might need more sophisticated handling depending on site behavior.
                    // For now, let's just log a warning and stop checking.
                    console.warn(`Visa option with name "${visaName}" not found.`);
                    clearInterval(waitOption);
                    setTimeout(callback, 300); // Proceed anyway
                }
            }, 50);
        } else {
            console.warn(`Dropdown with selector ${selector} not found or visaName missing.`);
            if (callback) callback(); // Proceed even if selection fails
        }
    }

    function fillInputs(callback) {
        const cityField = document.querySelector('input[placeholder*="city of entry"]');
        if (cityField) {
            cityField.value = 'Italy';
            cityField.dispatchEvent(new Event('input', { bubbles: true }));
            cityField.dispatchEvent(new Event('change', { bubbles: true })); // Add change event
        } else {
            console.warn("City input field not found.");
        }

        document.querySelectorAll('input[type=checkbox]').forEach(cb => {
            if (!cb.checked) {
                cb.click();
            }
        });
        console.log("Checkboxes clicked.");
        setTimeout(callback, 200);
    }

    function injectDateByValue(callback) {
        const selectedDate = getSelection('selectedDate');
        if (!selectedDate) {
            console.warn("No date selected for injection.");
            if (callback) callback();
            return;
        }

        const dateInput = document.querySelector('input[placeholder="DD/MM/YYYY"]');
        if (!dateInput) {
            console.warn("Date input field not found for injection.");
            if (callback) callback();
            return;
        }

        // Try common date formats including the standard YYYY-MM-DD from input type="date"
        const [year, month, day] = selectedDate.split('-');
        const formats = [
            `${day}/${month}/${year}`, // DD/MM/YYYY (Likely the target format)
            `${month}/${day}/${year}`, // MM/DD/YYYY
            `${day}-${month}-${year}`, // DD-MM-YYYY
            `${year}-${month}-${day}`, // YYYY-MM-DD (Value from date input)
        ];

        let success = false;
        for (const formattedDate of formats) {
            dateInput.value = formattedDate;
            // Dispatch multiple events to simulate user typing/pasting
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            dateInput.dispatchEvent(new Event('blur', { bubbles: true })); // Blur can trigger validation

            // Add a small delay to allow potential validation to run
            const isValid = !dateInput.classList.contains('ng-invalid') && dateInput.value === formattedDate; // Check class and value
            if (isValid) {
                console.log("Date injected successfully and appears valid with format:", formattedDate);
                success = true;
                break;
            } else {
                console.warn("Date format failed validation or value mismatch:", formattedDate);
            }
        }

        if (!success) {
            console.error("All attempted date formats failed to validate or match the input value.");
            // You might want to clear the field or show an error to the user here
            // dateInput.value = '';
        }

        setTimeout(callback, 300); // Proceed even if injection failed
    }

    function playClickBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 950;
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.warn("⚠️ AudioContext beep failed:", e);
        }
    }

    async function clickElement(selector) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`Clicking element: ${selector}`);
                playClickBeep();
                element.click();
                return true; // Indicate success
            } else {
                console.warn(`Element not found: ${selector}`);
                return false; // Indicate failure
            }
        } catch (error) {
            console.error(`Error clicking element: ${selector}`, error);
            return false; // Indicate failure
        }
    }

    async function clickAvailability() {
        const clicked = await clickElement('#cdk-step-content-0-0 > app-memebers-number > div.flex.flex-col.lg\\:flex-row.lg\\:justify-end > div > button');
        if (clicked) {
            attempts++;
            document.getElementById('retries').innerText = `Attempts: ${attempts}`;
            buttonClickedThisInterval = true; // Set the flag
        }
    }

    async function clickAlertButton() {
        const clicked = await clickElement('#cdk-step-content-0-0 > app-memebers-number > app-visasys-allert-card > div.allert-card.ng-star-inserted > div.visasys-button.w-72.mt-6');
        if (clicked && !alertButtonClicked) {
            alertButtonClicked = true;
            console.log("Clicked alert card button");
        }
    }

    function observeAlertButton() {
        const observer = new MutationObserver((mutations) => {
            const alertButtonSelector = '#cdk-step-content-0-0 > app-memebers-number > app-visasys-allert-card > div.allert-card.ng-star-inserted > div.visasys-button.w-72.mt-6';
            const alertButton = document.querySelector(alertButtonSelector);

            if (alertButton && !alertButtonClicked) {
                console.log("Alert button detected by observer.");
                clickAlertButton(); // Click it when it appears and hasn't been clicked
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log("MutationObserver started for alert button.");
    }

    function startSuccessCheckLoop() {
        const observer = new MutationObserver(() => {
            checkSuccessCondition(observer);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        console.log("MutationObserver started for alert button.");
    }

    function checkSuccessCondition(observer) {
        const successElement = document.querySelector('#cdk-step-content-0-0 > app-memebers-number > app-visasys-allert-card > div.allert-card.ng-star-inserted > div.flex.flex-col.gap-3 > p.font-bold.text-center.text-lg');
        if (successElement && successElement.textContent.trim().includes("Appointments available")) {
            console.log("Success condition met. Stopping the loop.");
            stopConditionMet = true;
            isRunning = false;
            observer.disconnect();
            stopHunting();
        }
    }

    async function startHunting() {
        if (stopConditionMet) {
            console.log("Hunting aborted: Success condition already met.");
            return; // Do not start hunting if the success condition is already met
        }

        hunting = true;
        document.getElementById('startRetryBtn').innerText = 'Hunting...';
        console.log("Hunting started.");
        buttonClickedThisInterval = false; // Reset flag at the start of hunting

        // Clear any existing timer
        if (retryTimer) clearInterval(retryTimer);

        retryTimer = setInterval(async () => { // Mark the interval function as async
            if (stopConditionMet) {
                console.log("Hunting stopped due to success condition.");
                stopHunting();
                return; // Stop the interval if the success condition is met during hunting
            }

            const now = new Date();

            // Target a time just before the minute changes, e.g., 59.900 to 59.999
            // Adjust the milliseconds range based on observation
            const targetSeconds = parseInt(document.getElementById('targetSeconds').value, 10);
            const targetMilliseconds = parseInt(document.getElementById('targetMilliseconds').value, 10);

            if (
                now.getSeconds() === targetSeconds &&
                now.getMilliseconds() >= targetMilliseconds &&
                !buttonClickedThisInterval
            ) {


                // Ensure we only trigger once per second within the target range
                // Using a flag per second might be better than per minute for this narrow window
                // Let's stick to the minute check for now, assuming the button is re-clickable quickly
                // if (now.getMinutes() !== lastTriggerMinute && !appointmentFound) { // Revert if needed
                lastTriggerMinute = now.getMinutes(); // Update last triggered minute
                await clickAvailability(); // Click the availability button
                // } // Revert if needed
            }
            // Also check and click the alert button independently of the time
            await clickAlertButton();

            // Reset the flag for the next interval
            if (now.getSeconds() === 0) {
                buttonClickedThisInterval = false; // Reset the flag every new second
            }

        }, CHECK_INTERVAL_MS); // Check very frequently
    }


    function stopHunting() {
        if (retryTimer) clearInterval(retryTimer);
        hunting = false;
        lastTriggerMinute = -1; // Reset minute tracker
        alertButtonClicked = false; // Reset alert button flag
        document.getElementById('startRetryBtn').innerText = 'Start Hunting';
        buttonClickedThisInterval = false; // Reset the click flag on stop
        console.log("Hunting stopped.");
    }
   // Ensure the script runs after the page content is fully loaded
const runWithPassword = () => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => promptPassword(initScript), 500);
    } else {
        window.addEventListener('load', () => {
            setTimeout(() => promptPassword(initScript), 500);
        });
    }
};

runWithPassword();
})();
