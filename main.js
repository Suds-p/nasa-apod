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
    currentDate = getOnlyDate(new Date())
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
    maxDate: new Date(),
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
    fetch(`https://api.nasa.gov/planetary/apod?date=${currentDate}&api_key=${API_KEY}`)
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

    updateNavButtonStatus();
    updateFavButtonStatus();
}

// --------- Listener functions ---------
function goToPrevDay() {
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() - 1);
    currentDate = getOnlyDate(currentDate);
    localStorage.setItem(CURRENT_DATE, currentDate);
    updateNavButtonStatus();
    showLoader();
    getNASAData();
}

function goToNextDay() {
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate = getOnlyDate(currentDate);
    localStorage.setItem(CURRENT_DATE, currentDate);
    updateNavButtonStatus();
    showLoader();
    getNASAData();
}

function addFavorite() {
    // Pull current list from local storage
    let currentFavs = localStorage.getItem(FAV_DATES);

    // Set to current if no list available, or add to the end
    if (!currentFavs) {
        currentFavs = currentDate;
    }
    else if (currentFavs.search(currentDate) === -1) {
        currentFavs += ", " + currentDate;
    }
    localStorage.setItem(FAV_DATES, currentFavs);
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
        localStorage.setItem(FAV_DATES, favDates);
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
    if (currentDate === getOnlyDate(new Date())) {
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