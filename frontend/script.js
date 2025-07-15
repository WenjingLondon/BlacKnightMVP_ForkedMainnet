// 当页面滚动时逐个显示屏幕块
window.addEventListener('scroll', () => {
    const screens = document.querySelector('.screens');
    const screen1 = document.getElementById('screen1');
    const screen2 = document.getElementById('screen2');
    const screen3 = document.getElementById('screen3');

    if (window.scrollY > 200) {
        screens.classList.add('active');
        screen1.classList.add('active');
    }
    if (window.scrollY > 400) {
        screen2.classList.add('active');
    }
    if (window.scrollY > 600) {
        screen3.classList.add('active');
    }
});
