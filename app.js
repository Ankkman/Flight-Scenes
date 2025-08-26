document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("flightForm");
  const inputSection = document.getElementById("inputSection");
  const resultsSection = document.getElementById("resultsSection");
  const statusCard = document.getElementById("statusCard");
  const alternativesContainer = document.getElementById("alternativesContainer");
  const cabContainer = document.getElementById("cabContainer");
  const backButton = document.getElementById("backButton");

  // Results Header
  const resultsHeader = document.getElementById("resultsHeader");

  // Alternatives
  const altList = document.getElementById("altList");
  const refreshAlts = document.getElementById("refreshAlts");

  function getMockPrediction(flightNumber) {
    const isDelayed = Math.random() > 0.3;
    const risk = isDelayed ? 30 + Math.floor(Math.random() * 70) : Math.floor(Math.random() * 30);
    return {
      isDelayed,
      risk,
      expDelay: isDelayed ? 15 + Math.floor(Math.random() * 120) : 0,
      flightDuration: 120 + Math.floor(Math.random() * 60), // Mocked flight duration in minutes
      flight: flightNumber || "AI302",
      route: { from: "Delhi (DEL)", to: "Mumbai (BOM)" },
      schedule: { hour: 10, minute: 15 },
      airline: "Air India"
    };
  }

  function getMockAlternatives() {
    return [
      { flight: "AI404", risk: 18, delay: 10, airline: "Air India" },
      { flight: "6E112", risk: 12, delay: 5, airline: "IndiGo" },
      { flight: "VJ212", risk: 25, delay: 20, airline: "Vistara" }
    ];
  }

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

  function renderPrediction(pred) {
    // Populate the new results header
    const originCode = pred.route.from.match(/\((.*?)\)/)[1];
    const destCode = pred.route.to.match(/\((.*?)\)/)[1];

    // Calculate both scheduled arrival and departure times
    const scheduledDate = new Date();
    scheduledDate.setHours(pred.schedule.hour, pred.schedule.minute, 0);
    const scheduledTime = formatTime(scheduledDate.getHours(), scheduledDate.getMinutes());
    const departureDate = new Date(scheduledDate.getTime() - pred.flightDuration * 60000);
    const departureTime = formatTime(departureDate.getHours(), departureDate.getMinutes());
// Format the date for display
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = scheduledDate.toLocaleDateString('en-US', dateOptions);

    resultsHeader.innerHTML = `
        <div class="flight-route">
            <div class="route-airport">${originCode}</div>
            <div class="route-line"></div>
            <div class="route-airport">${destCode}</div>
        </div>
        <div class="flight-details-sub">
            <span>${pred.flight.toUpperCase()}</span> • 
            <span>${pred.airline}</span> • 
            <span>${departureTime} - ${scheduledTime}</span>
        </div>
        <div class="flight-details-date">${formattedDate}</div>
    `;

    // Populate the status card
    statusCard.innerHTML = "";
    alternativesContainer.classList.toggle('hidden', !pred.isDelayed);
    cabContainer.classList.toggle('hidden', !pred.isDelayed);
    
    const expectedDate = new Date(scheduledDate.getTime() + pred.expDelay * 60000);
    const expectedTime = formatTime(expectedDate.getHours(), expectedDate.getMinutes());
    
    const delayString = formatDelay(pred.expDelay);

    let statusHeaderHTML, visualTimelineHTML, metricsHTML;
    
    if (pred.isDelayed) {
        const totalVizDuration = pred.flightDuration + pred.expDelay;
        const onTimePercent = (pred.flightDuration / totalVizDuration) * 100;
        
        statusCard.className = "card status-card delayed";
        statusHeaderHTML = `<div class="status-header delayed"><div class="status-icon">🕒</div><h2>A ${delayString} Delay is Likely</h2></div>
            <p class="status-subtitle">Based on our analysis, your arrival time has shifted.</p>`;
        
        const shortDelayThreshold = 0.20;
        const delayToFlightRatio = pred.expDelay / pred.flightDuration;
        let scheduledLabelHTML = '';

        if (delayToFlightRatio > shortDelayThreshold) {
            scheduledLabelHTML = `
                <div class="time-label" style="position: absolute; left: ${onTimePercent}%; transform: translateX(-50%); text-align: center;">
                    <span>Scheduled</span><b>${scheduledTime}</b>
                </div>`;
        } else {
            scheduledLabelHTML = `
                <div class="time-label" style="position: absolute; left: ${onTimePercent}%; transform: translateX(-70%); text-align: center; bottom: 70px;">
                    <span>Scheduled</span><b>${scheduledTime}</b>
                </div>`;
        }

        visualTimelineHTML = `
            <div class="visual-timeline">
            <div class="timeline-track">
                <div class="track-ontime" style="width: ${onTimePercent}%;"></div>
                <div class="track-delay" style="flex-grow: 1;"></div>
                <div class="timeline-marker" style="left: 0%;"></div>
                <div class="timeline-marker" style="left: ${onTimePercent}%;"></div>
                <div class="timeline-marker warn-marker" style="left: 100%;"></div>
                <img src="plane.png" alt="Flight" class="plane-icon" style="left: ${onTimePercent}%;">
            </div>
            <div class="timeline-labels">
                <div class="time-label" style="text-align: left;">
                    <span>Departure</span><b>${departureTime}</b>
                </div>
                ${scheduledLabelHTML} 
                <div class="time-label" style="text-align: right;">
                    <span>Expected</span><b class="delayed-time">${expectedTime}</b>
                </div>
            </div>
            </div>`;

        metricsHTML = `
        <div class="metrics-grid">
            <div class="metric-item"><h4 class="delayed-time">${pred.risk}%</h4><p>Delay Risk</p></div>
            <div class="metric-item"><h4 class="delayed-time">${delayString}</h4><p>Expected Delay</p></div>
        </div>`;

    } else {
        statusCard.className = "card status-card on-time";
        statusHeaderHTML = `<div class="status-header on-time"><div class="status-icon">✅</div><h2>Your Flight is On Schedule</h2></div>
            <p class="status-subtitle">No delays are predicted at this time. Have a great flight!</p>`;

        visualTimelineHTML = `
            <div class="visual-timeline">
            <div class="timeline-track">
                <div class="track-ontime" style="width: 100%;"></div>
                <div class="timeline-marker" style="left: 0%;"></div>
                <div class="timeline-marker success-marker" style="left: 100%;"></div>
                <img src="plane.png" alt="Flight" class="plane-icon" style="left: 100%;">
            </div>
            <div class="timeline-labels">
                <div class="time-label"><span>Departure</span><b>${departureTime}</b></div>
                <div class="time-label" style="text-align: right;"><span>Arrival</span><b>${scheduledTime}</b></div>
            </div>
            </div>`;

        metricsHTML = `
        <div class="metrics-grid">
            <div class="metric-item"><h4>${pred.risk}%</h4><p>Delay Risk</p></div>
            <div class="metric-item"><h4 class="success-text">${delayString}</h4><p>Expected Delay</p></div>
        </div>`;
    }
    
    statusCard.innerHTML = statusHeaderHTML + visualTimelineHTML + metricsHTML;
  }

  function renderAlternatives(originalDelay) {
    const alts = getMockAlternatives();
    altList.innerHTML = "";
    alts.forEach((alt) => {
      const li = document.createElement("div"); // Changed to div for grid
      li.className = "alt-flight-card";
      const timeSaved = originalDelay - alt.delay;
      
      li.innerHTML = `
        <div class="alt-card-header">
            <span class="alt-airline-name">${alt.flight} - ${alt.airline}</span>
            <span class="highlight-benefit green-bg">Saves ~${formatDelay(timeSaved)}</span>
        </div>
        <div class="alt-card-body">
            <p>Delay Risk: <strong>${alt.risk}%</strong></p>
            <p>Expected Delay: <strong>${formatDelay(alt.delay)}</strong></p>
        </div>
        <button class="alt-card-cta">View Details</button>`;
      altList.appendChild(li);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const flightNumber = document.getElementById("flightNumber").value.trim();
    const prediction = getMockPrediction(flightNumber);
    renderPrediction(prediction);
    if (prediction.isDelayed) {
      renderAlternatives(prediction.expDelay);
    }
    
    inputSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    window.scrollTo(0, 0);
  });

  backButton.addEventListener("click", () => {
    resultsSection.classList.add("hidden");
    inputSection.classList.remove("hidden");
    form.reset();
  });
  
  refreshAlts.addEventListener("click", () => {
    const prediction = getMockPrediction("AI302"); // Use a placeholder
    if (prediction.isDelayed) {
        renderAlternatives(prediction.expDelay);
    } else {
        alternativesContainer.classList.add('hidden');
    }
  });
});