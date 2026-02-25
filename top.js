// TOP 回到最上面
const backToTop = document.getElementById("backToTop");

// 捲動時顯示 / 隱藏
window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTop.style.display = "block";
    } else {
        backToTop.style.display = "none";
    }
});

// 點擊回到最上面
backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});
