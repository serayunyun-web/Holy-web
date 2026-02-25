document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     取得 DOM
  =============================== */
  const form = document.getElementById("contactForm");
  const emailInput = document.getElementById("email");
  const successBox = document.getElementById("formSuccess");
  const closeBtn = successBox.querySelector(".close-btn");

  let successTimer = null;

  /* ===============================
     Email 錯誤提示節點
  =============================== */
  const emailError = document.createElement("div");
  emailError.className = "error-text";
  emailError.style.display = "none";
  emailInput.after(emailError);

  /* ===============================
     表單送出處理
  =============================== */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // 重置錯誤狀態
    emailInput.classList.remove("input-error");
    emailError.style.display = "none";
    clearTimeout(successTimer);

    const email = emailInput.value.trim();
    const rule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 必填檢查
    if (!email) {
      showEmailError("此欄位為必填");
      return;
    }

    // 格式檢查
    if (!rule.test(email)) {
      showEmailError("請輸入正確的 Email 格式");
      return;
    }

    /* ===============================
       顯示成功訊息 + 滑到上方
    =============================== */
    successBox.classList.add("show");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    successTimer = setTimeout(() => {
      successBox.classList.remove("show");
    }, 3000);

    form.reset();
  });

  /* ===============================
     手動關閉成功提示
  =============================== */
  closeBtn.addEventListener("click", () => {
    successBox.classList.remove("show");
    clearTimeout(successTimer);
  });

  /* ===============================
     輸入時清除錯誤
  =============================== */
  emailInput.addEventListener("input", () => {
    emailInput.classList.remove("input-error");
    emailError.style.display = "none";
  });

  /* ===============================
     共用函式
  =============================== */
  function showEmailError(message) {
    emailInput.classList.add("input-error");
    emailError.textContent = message;
    emailError.style.display = "block";
  }

});
   