document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("flightForm");
  const inputSection = document.getElementById("inputSection");
  const resultsSection = document.getElementById("resultsSection");
  const statusCard = document.getElementById("statusCard");
  const alternativesContainer = document.getElementById("alternativesContainer");
  const cabContainer = document.getElementById("cabContainer");
  const backButton = document.getElementById("backButton");
  const resultsHeader = document.getElementById("resultsHeader");
  const altList = document.getElementById("altList");
  const refreshAlts = document.getElementById("refreshAlts");
  const resultsFixedHeader = document.getElementById("resultsFixedHeader");
  const backButtonFixed = document.getElementById("backButtonFixed");

  // --- Mock Data Functions ---
  function getMockPrediction(flightNumber) {
    const isDelayed = Math.random() > 0.3;
    const risk = isDelayed ? 30 + Math.floor(Math.random() * 70) : Math.floor(Math.random() * 30);
    return {
      isDelayed,
      risk,
      expDelay: isDelayed ? 15 + Math.floor(Math.random() * 120) : 0,
      flightDuration: 120 + Math.floor(Math.random() * 60),
      flight: flightNumber || "AI302",
      route: { from: "Delhi (DEL)", to: "Mumbai (BOM)" },
      schedule: { hour: 10, minute: 15 },
      airline: "Air India"
    };
  }

// Replace the old getMockAlternatives function in app.js
function getMockAlternatives() {
  // Mock data now matches the real API response structure
  return [
    { "airline": "DL", "departure_time": 959, "probability_delay": 0.1227 },
    { "airline": "AA", "departure_time": 715, "probability_delay": 0.1245 },
    { "airline": "DL", "departure_time": 1100, "probability_delay": 0.1368 },
    { "airline": "VJ", "departure_time": 1210, "probability_delay": 0.1398 },
    { "airline": "6E", "departure_time": 1206, "probability_delay": 0.1399 }
  ];
}




  // Add this new function to app.js
function formatApiTime(timeInt) {
  const timeStr = String(timeInt).padStart(4, '0');
  let hour = parseInt(timeStr.substring(0, 2), 10);
  const minute = timeStr.substring(2, 4);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
}


  // --- Formatting Functions ---
  function formatTime(hour, minute) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute < 10 ? '0' + minute : minute;
    return `${formattedHour}:${formattedMinute} ${ampm}`;
  }
  
  function formatDelay(delayMinutes) {
    if (delayMinutes <= 0) return 'On Time';
    const hours = Math.floor(delayMinutes / 60);
    const minutes = delayMinutes % 60;
    let delayString = '';
    if (hours > 0) delayString += `${hours}h `;
    if (minutes > 0) delayString += `${minutes}m`;
    return delayString.trim();
  }

  // --- Rendering Functions ---
  // Find and replace this entire function in your app.js file
// Replace your existing renderPrediction function with this one
function renderPrediction(pred) {
  // --- START: HEADER UPDATE ---

  // Get airport codes from the prediction object (fed from the form)
  const originCode = pred.route.from.toUpperCase();
  const destCode = pred.route.to.toUpperCase();
  
  // Get the date directly from the form input for accurate display
  // Adding 'T00:00:00' ensures the date is parsed correctly in the local timezone.
  const dateValue = document.getElementById("date").value;
  const displayDate = new Date(dateValue + 'T00:00:00');

  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = displayDate.toLocaleDateString('en-US', dateOptions);

  // Simplified header HTML showing only Origin, Destination, Airline, and Date
  resultsHeader.innerHTML = `
      <div class="flight-route">
          <div class="route-airport">${originCode}</div>
          <div class="route-line"></div>
          <div class="route-airport">${destCode}</div>
      </div>
      <div class="flight-details-sub">
          <span>${pred.airline}</span>
      </div>
      <div class="flight-details-date">${formattedDate}</div>
  `;

  // --- END: HEADER UPDATE ---


  // --- The rest of the function remains unchanged to preserve your fixes ---
  const scheduledDate = new Date();
  scheduledDate.setHours(pred.schedule.hour, pred.schedule.minute, 0);
  const scheduledTime = formatTime(scheduledDate.getHours(), scheduledDate.getMinutes());
  const departureDate = new Date(scheduledDate.getTime() - pred.flightDuration * 60000);
  const departureTime = formatTime(departureDate.getHours(), departureDate.getMinutes());

  statusCard.innerHTML = "";
  alternativesContainer.classList.toggle('hidden', !pred.isDelayed);
  
  const expectedDate = new Date(scheduledDate.getTime() + pred.expDelay * 60000);
  const expectedTime = formatTime(expectedDate.getHours(), expectedDate.getMinutes());
  const delayString = formatDelay(pred.expDelay);
  let statusHeaderHTML, visualTimelineHTML, metricsHTML;

  if (pred.isDelayed) {
    const totalVizDuration = pred.flightDuration + pred.expDelay;
    const onTimePercent = (pred.flightDuration / totalVizDuration) * 100;
    statusCard.className = "card status-card delayed";
    statusHeaderHTML = `<div class="status-header delayed"><div class="status-icon">🕒</div><h2>A ${delayString} Delay is Likely</h2></div><p class="status-subtitle">Based on our analysis, your arrival time has shifted.</p>`;
    
    // --- Overlap Fix Logic (Unchanged) ---
    let scheduledLabelHTML = '';
    const delayToFlightRatio = pred.expDelay / pred.flightDuration;

    if (delayToFlightRatio < 0.15) {
      scheduledLabelHTML = `
        <div class="time-label" style="position: absolute; left: ${onTimePercent}%; transform: translate(-60%, -120%); text-align: center;">
          <span>Scheduled</span><b>${scheduledTime}</b>
        </div>`;
    } else {
      scheduledLabelHTML = `
        <div class="time-label" style="position: absolute; left: ${onTimePercent}%; transform: translateX(-50%); text-align: center;">
          <span>Scheduled</span><b>${scheduledTime}</b>
        </div>`;
    }
    // --- End Overlap Fix Logic ---

    visualTimelineHTML = `<div class="visual-timeline"><div class="timeline-track"><div class="track-ontime" style="width: ${onTimePercent}%;"></div><div class="track-delay" style="flex-grow: 1;"></div><div class="timeline-marker" style="left: 0%;"></div><div class="timeline-marker" style="left: ${onTimePercent}%;"></div><div class="timeline-marker warn-marker" style="left: 100%;"></div><img src="plane.png" alt="Flight" class="plane-icon" style="left: ${onTimePercent}%;"></div><div class="timeline-labels"><div class="time-label" style="text-align: left;"><span>Departure</span><b>${departureTime}</b></div>${scheduledLabelHTML}<div class="time-label" style="text-align: right;"><span>Expected</span><b class="delayed-time">${expectedTime}</b></div></div></div>`;
    metricsHTML = `<div class="metrics-grid"><div class="metric-item"><h4 class="delayed-time">${pred.risk}%</h4><p>Delay Risk</p></div><div class="metric-item"><h4 class="delayed-time">${delayString}</h4><p>Expected Delay</p></div></div>`;
  } else {
    statusCard.className = "card status-card on-time";
    statusHeaderHTML = `<div class="status-header on-time"><div class="status-icon">✅</div><h2>Your Flight is On Schedule</h2></div><p class="status-subtitle">No delays are predicted at this time. Have a great flight!</p>`;
    visualTimelineHTML = `<div class="visual-timeline"><div class="timeline-track"><div class="track-ontime" style="width: 100%;"></div><div class="timeline-marker" style="left: 0%;"></div><div class="timeline-marker success-marker" style="left: 100%;"></div><img src="plane.png" alt="Flight" class="plane-icon" style="left: 100%;"></div><div class="timeline-labels"><div class="time-label"><span>Departure</span><b>${departureTime}</b></div><div class="time-label" style="text-align: right;"><span>Arrival</span><b>${scheduledTime}</b></div></div></div>`;
    metricsHTML = `<div class="metrics-grid"><div class="metric-item"><h4>${pred.risk}%</h4><p>Delay Risk</p></div><div class="metric-item"><h4 class="success-text">${delayString}</h4><p>Expected Delay</p></div></div>`;
  }
  statusCard.innerHTML = statusHeaderHTML + visualTimelineHTML + metricsHTML;
}

// Replace the old renderAlternatives function in app.js
function renderAlternatives(originalDelay, alternatives) {
  altList.innerHTML = ""; // Clear previous list
  
  // Add a header for the new table-like layout
  const header = document.createElement("div");
  header.className = "alt-flight-item alt-flight-header";
  header.innerHTML = `
    <span>Flight</span>
    <span>Departure</span>
    <span>Delay Risk</span>
  `;
  altList.appendChild(header);

  alternatives.forEach((alt) => {
    const item = document.createElement("div");
    item.className = "alt-flight-item";
    
    const riskPercent = Math.round(alt.probability_delay * 100);

    // The HTML now uses divs for a clean, column-based layout
    item.innerHTML = `
      <div class="alt-detail airline-code">${alt.airline}</div>
      <div class="alt-detail departure-time">${formatApiTime(alt.departure_time)}</div>
      <div class="alt-detail risk-percent">${riskPercent}%</div>
    `;
    
    altList.appendChild(item);
  });
}

  function resetToSearch() {
    resultsSection.classList.add("hidden");
    inputSection.classList.remove("hidden");
    resultsFixedHeader.classList.add("hidden");
    document.body.classList.remove("results-visible");
    form.reset();
    window.scrollTo(0, 0);
  }

  // =======================================================
  // == CORRECTED EVENT LISTENER ==
  // =======================================================
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // FIXED: Get values from the new form fields that actually exist
    const airline = document.getElementById("airline").value.trim();
    const origin = document.getElementById("origin").value.trim();
    const dest = document.getElementById("dest").value.trim();

    // Create a dynamic flight identifier for display
    const flightIdentifier = `${airline.toUpperCase() || "FLIGHT"}`;
    
    // Call the original mock data function
    const prediction = getMockPrediction(flightIdentifier);

    // IMPORTANT: Override parts of the mock data with the user's actual input
    prediction.route.from = origin || "Origin";
    prediction.route.to = dest || "Destination";
    prediction.airline = airline.toUpperCase() || "Airline";
    
    // Render the main prediction card
    renderPrediction(prediction);

    // If the mock data shows a delay, render the mock alternatives
    if (prediction.isDelayed) {
      // FIXED: Pass the mock alternatives data to the render function
      renderAlternatives(prediction.expDelay, getMockAlternatives());
    }
    
    // Switch to the results view
    inputSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    resultsFixedHeader.classList.remove("hidden");
    document.body.classList.add("results-visible");
    window.scrollTo(0, 0);
  });

  backButton.addEventListener("click", resetToSearch);
  backButtonFixed.addEventListener("click", resetToSearch);
  
  refreshAlts.addEventListener("click", () => {
    const prediction = getMockPrediction("AI302"); // Use a placeholder
    if (prediction.isDelayed) {
      renderAlternatives(prediction.expDelay, getMockAlternatives());
    } else {
      alternativesContainer.classList.add('hidden');
    }
  });
});
