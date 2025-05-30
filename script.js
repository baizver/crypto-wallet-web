const tg = window.Telegram.WebApp;
tg.expand();

let lastScreen = "main";
let currentToken = null;

// Actions (Buy button)
function handleAction(type) {
    if (type === "buy") {
        showPopup("Buy functionality is under development.");
    }
}

// Coin selector bottom sheet
function openCoinSelector(actionType) {
    const overlay = document.createElement("div");
    overlay.className = "overlay-sheet";
    overlay.style.animation = "slideUp 0.3s ease-out";
    overlay.innerHTML = `
        <div class="sheet-header">
            <span class="title">${actionType === "send" ? "Send" : "Receive"} Crypto</span>
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="coin-list">
            <div class="coin-option" onclick="selectCoin('${actionType}', 'TRX')">
                <img src="assets/tron.svg" /> <span>TRX</span>
            </div>
            <div class="coin-option" onclick="selectCoin('${actionType}', 'USDT')">
                <img src="assets/usdt.svg" /> <span>USDT</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function selectCoin(action, coin) {
    document.querySelector(".overlay-sheet")?.remove();
    if (action === "send") openSendForm(coin);
    else if (action === "receive") openReceiveView(coin);
}

function openSendForm(coin) {
    hideAll();
    document.getElementById("send-form-view").classList.remove("hidden");
    lastScreen = "crypto";
}

function closeSendForm() {
    document.getElementById("send-form-view").classList.add("hidden");
    if (lastScreen === "crypto") document.getElementById("crypto-view").classList.remove("hidden");
    else document.getElementById("main-view").classList.remove("hidden");
}

function openReceiveView(coin) {
    hideAll();
    document.getElementById("receive-view").classList.remove("hidden");
    lastScreen = "main";

    const icon = document.getElementById("receive-icon");
    const name = document.getElementById("receive-name");
    const title = document.getElementById("receive-title");
    const address = document.getElementById("receive-address");
    const qr = document.getElementById("receive-qr");

    if (coin === "TRX") {
        icon.src = "assets/tron.svg";
        name.innerText = "TRX";
        title.innerText = "Receive TRX";
        address.innerText = "TUTCMBJfxzFygTdmRmfncFheqdthdaXzpL";
        qr.src = "assets/qrtron.jpg";
    } else {
        icon.src = "assets/usdt.svg";
        name.innerText = "USDT";
        title.innerText = "Receive USDT";
        address.innerText = "TUTCMBJfxzFygTdmRmfncFheqdthdaXzpL";
        qr.src = "assets/qrusdt.jpg";
    }
}


function closeReceiveView() {
    document.getElementById("receive-view").classList.add("hidden");
    document.getElementById("main-view").classList.remove("hidden");
}

function openCryptoView(coin) {
    hideAll();
    document.getElementById("crypto-view").classList.remove("hidden");

    currentToken = coin;

    const icon = document.getElementById("crypto-icon");
    const name = document.getElementById("crypto-name");
    const title = document.getElementById("crypto-title");
    const balance = document.getElementById("crypto-balance");

    if (coin === "TRX") {
        icon.src = "assets/tron.svg";
        name.innerText = "TRX";
        title.innerText = "TRX Wallet";
        balance.innerText = "0.032 TRX";
        renderTransactions("TRX");
    } else {
        icon.src = "assets/usdt.svg";
        name.innerText = "USDT";
        title.innerText = "USDT Wallet";

        const usdtBalance = parseFloat(localStorage.getItem("balance_usdt") || "0.00");
        balance.innerText = `${usdtBalance.toFixed(2)} USDT`;

        renderTransactions("USDT");
    }

    lastScreen = "main";
}

function renderTransactions(token) {
    const list = document.getElementById("tx-list");
    if (!list) return;

    list.innerHTML = "";

    const history = JSON.parse(localStorage.getItem(`tx_${token.toLowerCase()}`) || "[]");
    history.reverse().forEach(tx => {
        const txDiv = document.createElement("div");
        txDiv.className = "tx";
        txDiv.innerHTML = `
        <div class="tx-left">
            <div class="tx-icon ${tx.type}">${tx.type === "send" ? "↑" : "↓"}</div>
            <div>
                <div class="tx-type">${tx.type}</div>
                <div class="tx-to">${tx.type === "send" ? "To:" : "From:"} ${tx.address}</div>
            </div>
        </div>
        <div class="tx-right">
            <div class="tx-amount ${tx.amount > 0 ? 'green' : 'red'}">${tx.amount > 0 ? "+" : ""}${tx.amount.toFixed(2)} ${token}</div>
            <div class="tx-usd">$${tx.usd.toFixed(2)}</div>
        </div>
        `;
        list.appendChild(txDiv);
    });
}

function closeCryptoView() {
    document.getElementById("crypto-view").classList.add("hidden");
    document.getElementById("main-view").classList.remove("hidden");
}

function hideAll() {
    ["main-view", "send-form-view", "receive-view", "crypto-view"].forEach(id => {
        document.getElementById(id)?.classList.add("hidden");
    });
}

function validateSendForm() {
    const address = document.getElementById("send-address").value.trim();
    const amount = document.getElementById("send-amount").value.trim();
    const btn = document.getElementById("send-next-btn");
    btn.disabled = !(address.length > 0 && parseFloat(amount) > 0);
}

function pasteAddress() {
    navigator.clipboard.readText().then(text => {
        document.getElementById("send-address").value = text;
        validateSendForm();
    });
}

function setMax() {
    document.getElementById("send-amount").value = "3.00";
    validateSendForm();
}

function submitSendForm() {
    showPopup("Please top up 5.5 USDT worth of TRX to cover transaction fees.");
}

function showPopup(message) {
    const popup = document.getElementById("popup-message");
    const text = document.getElementById("popup-text");
    text.innerText = message;
    popup.classList.remove("hidden");
}

function closePopup() {
    document.getElementById("popup-message").classList.add("hidden");
}

function copyAddress() {
    const address = document.getElementById("receive-address").innerText;
    navigator.clipboard.writeText(address).then(() => {
        showPopup("Address copied to clipboard");
    });
}

// Referral bonus logic
const referral = tg.initDataUnsafe?.start_param;
const hasBonus = localStorage.getItem('ref_bonus');

if (referral && !hasBonus) {
    localStorage.setItem('ref_bonus', referral);
    localStorage.setItem('balance_usdt', '3.00');

    const history = JSON.parse(localStorage.getItem('tx_usdt') || '[]');
    history.push({
        type: 'receive',
        address: `Referral: ${referral}`,
        amount: 3.00,
        token: 'USDT',
        usd: 3.00,
        date: new Date().toISOString().split('T')[0]
    });
    localStorage.setItem('tx_usdt', JSON.stringify(history));
}
const user = tg.initDataUnsafe?.user;
if (user) {
    const usernameText = user.username ? ` (@${user.username})` : "";
    document.getElementById("user-info").innerText =
        `👋 Welcome, ${user.first_name}${usernameText}`;
}

// Automatically use selected token for Receive action
document.querySelectorAll('.icon-wrapper').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.innerText.toLowerCase().includes('receive') && currentToken) {
            openReceiveView(currentToken);
        }
    });
});
