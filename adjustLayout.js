function adjustLayout() {
    const width = window.innerWidth;
    const inputElem = document.getElementById("input-wrapper");
    const navWrapper = document.getElementById("nav-btns");
    const titleWrapper = document.getElementById("title-wrapper");

    if (width > 900) {
        // Place in title area
        titleWrapper.insertBefore(inputElem, titleWrapper.firstChild);
    }
    else {
        // Place in middle of nav bar
        navWrapper.insertBefore(inputElem, navWrapper.firstElementChild.nextElementSibling);
    }
}

adjustLayout();
window.onresize = adjustLayout;