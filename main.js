// Constants
const CURRENT_DATE = "currentDate";
const FAV_DATES = "favDates";
const API_KEY = '';
let datePickerOpen = false;

// Register PWA service worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.log("Service Worker registered"))
    .catch(error => console.error("Service Worker registration failed:", error));
}

// Set up listeners
document.getElementById("left-btn").onclick = goToPrevDay;
document.getElementById("right-btn").onclick = goToNextDay;
document.getElementById("fav-btn").onclick = addFavorite;
document.getElementById("unfav-btn").onclick = removeFavorite;
document.getElementById("current-date").onclick = () => {
    (datePickerOpen) ? datePicker.close() : datePicker.open();
    datePickerOpen = !datePickerOpen;
}

// Check localstorage for existing date
let currentDate = getDateString(getTodayDate());
localStorage.setItem(CURRENT_DATE, currentDate);

// If it's today, disable the Next Day button
updateNavButtonStatus();

// Date picker
const datePicker = MCDatepicker.create({
    el: '#current-date',
    autoClose: true,
    bodyType: 'inline',
    customClearBTN: '',
    dateFormat: 'MMM DD, YYYY',
    maxDate: getTodayDate(),
    selectedDate: new Date(currentDate + "T00:00:00"),
    theme: {
        theme_color: '#4a1734'
    }
  });

datePicker.onSelect((selectedDate, _) => {
    if (currentDate !== getDateString(selectedDate)) {
        currentDate = getDateString(selectedDate);
        localStorage.setItem(CURRENT_DATE, currentDate);
        fadeOutPageAnimation()
        .then(() => {
            showLoader();
            return getNASAData();
        })
        .then(() => fadeInPageAnimation());
    }
});
datePicker.markDatesCustom(date => {
    const favDates = (localStorage.getItem(FAV_DATES) ? localStorage.getItem(FAV_DATES) : '').split(', ');
    return favDates.indexOf(getDateString(date)) !== -1;
});

getNASAData();

const imgContainer = document.getElementById('img-content');
const lightbox = document.querySelector('.lightbox');
const lightboxImg = lightbox.querySelector('img');
const closeButton = lightbox.querySelector('.close-button');
const loadingSpinner = lightbox.querySelector('.loading-spinner');
imgContainer.onclick = openLightbox;
closeButton.onclick = closeLightbox;
lightbox.onclick = closeLightbox;

function getNASAData() {
    console.log(currentDate);
    return fetch(`/.netlify/functions/getNasaData?date=${currentDate}`)
        .then(resp => resp.json())
        .then(data => {
            // Hide loader when data comes and show main content
            hideLoader();

            // Show media containers based on content received
            if (data.media_type === "video") {
                hideContentOnPage("img-content");
                loadContentOnPage("vid-content", data);
            }
            else {
                hideContentOnPage("vid-content");
                loadContentOnPage("img-content", data);
            }
        });
}

function loadContentOnPage(mediaContainerId, data) {
    updateNavButtonStatus();
    updateFavButtonStatus();

    // Extract data
    const {code=200, url, title, explanation: desc} = data;
    console.log(data);

    if (code >= 400 || !url) {
        console.log("showing not found screen.....");
        document.getElementById("img-content").classList.add("hide");
        document.getElementById("vid-content").classList.add("hide");
        showNotFoundScreen();

        if (!desc) {
            document.getElementById("description").classList.add("hide");
            document.getElementById("title").innerText = 'Please pick another date!';
            document.querySelectorAll(".fav-wrapper i").forEach(i => i.classList.add("hide"));
        }
        else {
            document.getElementById("description").classList.remove("hide");
            document.querySelector(".fav-wrapper").classList.remove("hide");
            document.getElementById("title").innerText = title;
            document.getElementById("description").innerText = desc;
            document.getElementById("current-date").value = getReadableDate(new Date(currentDate + "T00:00:00"));
            datePicker.pickedDate = new Date(currentDate + "T00:00:00");
        }
    }
    else {
        hideNotFoundScreen();
        document.getElementById("description").classList.remove("hide");
        document.querySelector(".fav-wrapper").classList.remove("hide");
        document.getElementById(mediaContainerId).classList.remove("hide");

        document.getElementById(mediaContainerId).src = url;
        document.getElementById("title").innerText = title;
        document.getElementById("description").innerText = desc;
        document.getElementById("current-date").value = getReadableDate(new Date(currentDate + "T00:00:00"));
        datePicker.pickedDate = new Date(currentDate + "T00:00:00");
    }
}

// --------- Listener functions ---------
function goToPrevDay(event) {
    Promise.all([fadeOutPageAnimation(event), createRipple(event)])
    .then(() => {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() - 1);
        currentDate = getDateString(currentDate);
        localStorage.setItem(CURRENT_DATE, currentDate);
        updateNavButtonStatus();
        showLoader();
        return getNASAData();
    })
    .then(() => fadeInPageAnimation(event));
}

function goToNextDay(event) {
    // Handle animation
    Promise.all([fadeOutPageAnimation(event), createRipple(event)])
    .then(() => {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = getDateString(currentDate);
        localStorage.setItem(CURRENT_DATE, currentDate);
        updateNavButtonStatus();
        showLoader();
        return getNASAData();
    })
    .then(() => fadeInPageAnimation(event));
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
        favIndex === 0 ? favDates.shift() : favDates.splice(favIndex, 1);
        currentFavs = favDates.join(', ');
        localStorage.setItem(FAV_DATES, currentFavs);
    }
    updateFavButtonStatus();
}

function openLightbox() {
    lightboxImg.style.display = 'none';

    lightboxImg.src = imgContainer.src;
    lightbox.classList.add('active');
    loadingSpinner.style.display = 'block';
    closeButton.style.display = 'block';

    lightboxImg.onload = () => {
        loadingSpinner.style.display = 'none';
        lightboxImg.style.display = 'block';
    }
}

function closeLightbox(event) {
    if (event.target === lightbox || event.target === closeButton) {
        lightbox.classList.remove('active');
        closeButton.style.display = 'none';
    }
}

// Handle escape key to close lightbox
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.style.display === 'block') {
        closeLightbox(event);
    }
});

// --------- Helper functions ---------

function hideContentOnPage(containerId) {
    document.getElementById(containerId).classList.add("hide");
}

function showLoader() {
    document.getElementById("loading").style.display = "flex";
    document.querySelector(".wrapper").classList.add("hide");
}

function hideLoader() {
    document.getElementById("loading").style.display = "none";
    document.querySelector(".wrapper").classList.remove("hide");
}

function showNotFoundScreen() {
    document.getElementById("not-found-wrapper").classList.remove("hide");
    document.querySelector("#not-found-wrapper img").src = "./not-found.jpg";
}

function hideNotFoundScreen() {
    document.getElementById("not-found-wrapper").classList.add("hide");
}

function getDateString(date) {
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
    if (currentDate === getDateString(getTodayDate())) {
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
        }, 600);
    })
}


function fadeOutPageAnimation(event) {
    if (event) {
        event.preventDefault();
    }
    
    document.querySelectorAll(".animate").forEach(w => w.classList.remove("fadein-anim"));
    document.querySelectorAll(".animate").forEach(w => w.classList.remove("fadeout-anim"));

    const pageAnimationPromise = new Promise((res) => {
        document.querySelectorAll(".animate").forEach(w => w.classList.add("fadeout-anim"));
        setTimeout(() => {
            res();
        }, 300);
    })

    return pageAnimationPromise;
}

function fadeInPageAnimation(event) {
    if (event) {
        event.preventDefault();
    }
    
    document.querySelectorAll(".animate").forEach(w => w.classList.remove("fadein-anim"));
    document.querySelectorAll(".animate").forEach(w => w.classList.remove("fadeout-anim"));

    const pageAnimationPromise = new Promise((res) => {
        document.querySelectorAll(".animate").forEach(w => w.classList.add("fadein-anim"));
        setTimeout(() => {
            res();
        }, 300);
    })

    return pageAnimationPromise;
}