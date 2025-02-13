document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.querySelector(".big-block .btn-login button");
    const signupBlock = document.querySelector(".big-block");
    const loginBlock = document.querySelector(".login-block");
    const signbutton = document.querySelector(".login-block .btn button");

    loginButton.addEventListener("click", () => {
        signupBlock.style.transform = "translateX(-100%)";
        signupBlock.style.opacity = "0";
        loginBlock.style.transform = "translateX(0)";
        loginBlock.style.opacity = "1";
    });

    signbutton.addEventListener("click" , () => {
        loginBlock.style.transform = "translateX(100%)";
        loginBlock.style.opacity = "0";
        signupBlock.style.transform = "translateX(0)";
        signupBlock.style.opacity = "1";
    })
});

document.querySelector(".register-block a").addEventListener("click", async (event) => {
    event.preventDefault(); // Чтобы не переходило по ссылке

    const username = document.querySelector("input[placeholder='USERNAME']").value;
    const email = document.querySelector("input[placeholder='EMAIL']").value;
    const password = document.querySelector("input[placeholder='PASSWORD']").value;

    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    alert(data.message);
});
