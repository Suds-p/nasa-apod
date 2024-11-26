// Constants
const CURRENT_DATE = "currentDate";
const FAV_DATES = "favDates";
const API_KEY = '';

// Set up listeners
document.getElementById("left-btn").onclick = goToPrevDay;
document.getElementById("right-btn").onclick = goToNextDay;
document.getElementById("fav-btn").onclick = addFavorite;
document.getElementById("unfav-btn").onclick = removeFavorite;

// Check localstorage for existing date
let currentDate = localStorage.getItem(CURRENT_DATE);
console.log(currentDate);
if (!currentDate) {
    currentDate = getOnlyDate(getTodayDate());
    localStorage.setItem(CURRENT_DATE, currentDate);
}

// If it's today, disable the Next Day button
updateNavButtonStatus();

// Date picker?
const datePicker = MCDatepicker.create({
    el: '#current-date',
    autoClose: true,
    bodyType: 'inline',
    closeOnBlur: true,
    customClearBTN: '',
    dateFormat: 'MMM DD, YYYY',
    maxDate: getTodayDate(),
    selectedDate: new Date(currentDate + "T00:00:00"),
    theme: {
        theme_color: '#4a1734'
    }
  });

datePicker.onSelect((date, _) => {
    currentDate = getOnlyDate(date);
    localStorage.setItem(CURRENT_DATE, currentDate);
    showLoader();
    getNASAData();
});
datePicker.markDatesCustom(date => {
    const favDates = (localStorage.getItem(FAV_DATES) ? localStorage.getItem(FAV_DATES) : '').split(', ');
    return favDates.indexOf(getOnlyDate(date)) !== -1;
});

getNASAData();

function getNASAData() {
    console.log(currentDate);
    fetch(`/.netlify/functions/getNasaData?date=${currentDate}`)
        .then(resp => resp.json())
        .then(data => {
            console.log(data);

            // Hide loader when data comes and show main content
            hideLoader();

            // Show media containers based on content received
            if (data.media_type === "image") {
                hideContentOnPage("vid-content");
                loadContentOnPage("img-content", data);
            }
            else {
                hideContentOnPage("img-content");
                loadContentOnPage("vid-content", data);
            }
        });
}

function loadContentOnPage(containerId, data) {
    // Extract data
    const {url, title, explanation: desc} = data;

    document.getElementById(containerId).style.display = "block";
    document.getElementById(containerId).src = url;
    document.getElementById("title").innerText = title;
    document.getElementById("description").innerText = desc;
    document.getElementById("current-date").value = getReadableDate(new Date(currentDate + "T00:00:00"));
    datePicker.pickedDate = new Date(currentDate + "T00:00:00");

    updateNavButtonStatus();
    updateFavButtonStatus();
}

// --------- Listener functions ---------
function goToPrevDay(event) {
    createRipple(event)
    .then(() => {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() - 1);
        currentDate = getOnlyDate(currentDate);
        localStorage.setItem(CURRENT_DATE, currentDate);
        updateNavButtonStatus();
        showLoader();
        getNASAData();
    });
}

function goToNextDay(event) {
    // Handle animation
    createRipple(event)
    .then(() => {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = getOnlyDate(currentDate);
        localStorage.setItem(CURRENT_DATE, currentDate);
        updateNavButtonStatus();
        showLoader();
        getNASAData();
    });
}

function addFavorite() {
    // Pull current list from local storage
    let currentFavs = localStorage.getItem(FAV_DATES) ? localStorage.getItem(FAV_DATES) : '';
    let favDates = currentFavs.split(', ');
    let favIndex = favDates.indexOf(currentDate);

    // Add date if it doesn't already exist
    if (!currentFavs) {
        favDates = [currentDate];
    }
    else if (favIndex === -1) {
        favDates.push(currentDate)
    }
    localStorage.setItem(FAV_DATES, favDates.join(', '));
    updateFavButtonStatus();
}

function removeFavorite() {
    // Search for index of date and remove 
    let currentFavs = localStorage.getItem(FAV_DATES) ? localStorage.getItem(FAV_DATES) : '';
    let favDates = currentFavs.split(', ');
    let favIndex = favDates.indexOf(currentDate);
    if (favIndex !== -1) {
        favIndex === 0 ? favDates.shift() : favDates.splice(favIndex, favIndex);
        currentFavs = favDates.join(', ');
        localStorage.setItem(FAV_DATES, currentFavs);
    }
    updateFavButtonStatus();
}

// --------- Helper functions ---------

function hideContentOnPage(containerId) {
    document.getElementById(containerId).style.display = "none";
}

function showLoader() {
    document.getElementById("loading").style.display = "flex";
    document.querySelector(".wrapper").classList.add("hide");
}

function hideLoader() {
    document.getElementById("loading").style.display = "none";
    document.querySelector(".wrapper").classList.remove("hide");
}

function getOnlyDate(date) {
    return date.toISOString().substring(0, 10);
}

function getTodayDate() {
    let date = new Date();
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.valueOf() - timezoneOffset);
}

function getReadableDate(date) {
    let baseDateStr = date.toDateString().substring(4);
    return baseDateStr.substring(0, 6) + ", " + baseDateStr.substring(7)
}

function disableButton(buttonId) {
    document.getElementById(buttonId).classList.add("disabled");
}

function enableButton(buttonId) {
    document.getElementById(buttonId).classList.remove("disabled");
}

function updateNavButtonStatus() {
    if (currentDate === getOnlyDate(getTodayDate())) {
        disableButton("right-btn");
    }
    else {
        enableButton("right-btn");
    }
}

function updateFavButtonStatus() {
    let currentFavs = localStorage.getItem(FAV_DATES) ? localStorage.getItem(FAV_DATES) : '';
    if (currentFavs.search(currentDate) === -1) {
        // image is not favorited
        document.getElementById("unfav-btn").classList.add("hide");
        document.getElementById("fav-btn").classList.remove("hide");
    }
    else {
        // image is favorited
        document.getElementById("fav-btn").classList.add("hide");
        document.getElementById("unfav-btn").classList.remove("hide");
    }
}

// Animation helper
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
        ripple.remove();
    }
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - (button.offsetLeft + radius)}px`;
    circle.style.top = `${event.clientY - (button.offsetTop + radius)}px`;
    circle.classList.add("ripple");
    
    button.appendChild(circle);

    return new Promise((res) => {
        setTimeout(() => {
            circle.remove();
            res();
        }, 570);
    })
}