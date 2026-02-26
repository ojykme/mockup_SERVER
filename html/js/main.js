document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('status');
    status.innerText = 'JavaScript is working! Current time: ' + new Date().toLocaleTimeString();
    status.style.color = '#4ecca3';
    console.log('Mock server front-end initialized.');
});
