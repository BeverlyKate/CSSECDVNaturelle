document.addEventListener("DOMContentLoaded", function() {
    const logs_wrapper = document.getElementById("logs-wrapper");
    const logs_tabs_container = document.getElementById("logs-tabs-container");

    logs_wrapper.addEventListener("scroll", function(e) {
        if (e.target.scrollTop > 0) {
            logs_tabs_container.classList.add("scroll-active");
        } else {
            logs_tabs_container.classList.remove("scroll-active");
        }
    })
});