const ITEMS = [
    { key: "transport", label: "Transport", price: 5, defaultChecked: true },
    { key: "entrance",  label: "Entrance Fee", price: 5, defaultChecked: true },
    { key: "alcohol",   label: "Alcohol", price: 1 },
    { key: "snacks",    label: "Snacks", price: 1 },
    { key: "fruits",    label: "Fruits", price: 0.5 },
    { key: "drinks",    label: "Drinks", price: 0.5 },
    { key: "meat",      label: "Meat", price: 2 }
];

const DEFAULT_NAMES = [
    "Elvis Moyo", "Dingulwazi Mtungwa", "Andile Msago", "Michael Mlonyeni",
    "Mfanelo Sibanda", "Mduduzi Mpofu", "Limukani Luphahla", "Mandlenkodi Zulu",
    "Bibian Dzumbunu", "Auxilia Tshuma", "Perseverance Mlonyeni", "Nkazimulo Ncube"
];

const STORAGE_KEY = "eventRegistrationData";
const money = n => "$" + n.toFixed(2);

let prices = {};
let people = [];

function newPerson(name = "") {
    const person = { name };
    ITEMS.forEach(item => person[item.key] = !!item.defaultChecked);
    return person;
}

function load() {
    ITEMS.forEach(item => prices[item.key] = item.price);
    people = DEFAULT_NAMES.map(newPerson);

    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.people) && saved.prices) {
            people = saved.people;
            prices = { ...prices, ...saved.prices };
        }
    } catch (e) { }
}

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ people, prices }));
    } catch (e) { }
}

function personTotal(person) {
    return ITEMS.reduce((sum, item) => sum + (person[item.key] ? prices[item.key] : 0), 0);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function renderPrices() {
    document.getElementById("priceList").innerHTML = ITEMS.map(item => `
        <label class="price-item">${item.label} $
            <input type="number" min="0" step="0.05"
                   data-price="${item.key}" value="${prices[item.key]}">
        </label>
    `).join("");
}

function renderTable() {
    document.getElementById("tableHead").innerHTML = `
        <tr>
            <th>No.</th>
            <th>Name</th>
            ${ITEMS.map(i => `
                <th data-toggle="${i.key}" title="Click to tick / untick everyone" style="cursor:pointer">
                    ${i.label}<span data-head="${i.key}">${money(prices[i.key])}</span>
                </th>`).join("")}
            <th>Total</th>
            <th>Action</th>
        </tr>`;

    document.getElementById("tableBody").innerHTML = people.map((person, r) => `
        <tr>
            <td>${r + 1}</td>
            <td class="name">
                <input type="text" value="${escapeHTML(person.name)}"
                       placeholder="Type a name..." data-name="${r}" data-r="${r}" data-c="0">
            </td>
            ${ITEMS.map((i, c) => `
                <td><input type="checkbox" data-row="${r}" data-key="${i.key}"
                    data-r="${r}" data-c="${c + 1}" ${person[i.key] ? "checked" : ""}></td>`).join("")}
            <td class="total" data-total="${r}">${money(personTotal(person))}</td>
            <td><button type="button" class="delete" data-delete="${r}">Delete</button></td>
        </tr>`).join("");

    document.getElementById("tableFoot").innerHTML = `
        <tr>
            <td colspan="2">TOTALS</td>
            ${ITEMS.map(i => `<td data-foot="${i.key}">$0.00</td>`).join("")}
            <td data-foot="all">$0.00</td>
            <td></td>
        </tr>`;

    updateTotals();
}

function updateTotals() {
    let grand = 0;

    people.forEach((person, r) => {
        const total = personTotal(person);
        grand += total;
        const cell = document.querySelector(`[data-total="${r}"]`);
        if (cell) cell.textContent = money(total);
    });

    ITEMS.forEach(item => {
        const sum = people.reduce((s, p) => s + (p[item.key] ? prices[item.key] : 0), 0);
        const cell = document.querySelector(`[data-foot="${item.key}"]`);
        if (cell) cell.textContent = money(sum);

        const head = document.querySelector(`[data-head="${item.key}"]`);
        if (head) head.textContent = money(prices[item.key]);
    });

    document.querySelector('[data-foot="all"]').textContent = money(grand);
    document.getElementById("grandTotal").textContent = money(grand);
    document.getElementById("countLabel").textContent = `(${people.length} people)`;

    save();
}

function focusCell(r, c) {
    const cell = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (cell) {
        cell.focus();
        if (cell.type === "text") cell.select();
    }
}

function addRow(name = "", focus = true) {
    people.push(newPerson(name));
    renderTable();
    if (focus) {
        focusCell(people.length - 1, 0);
        const last = document.querySelector(`[data-r="${people.length - 1}"]`);
        if (last) last.scrollIntoView({ block: "center" });
    }
}

const tableBody = document.getElementById("tableBody");

tableBody.addEventListener("change", e => {
    if (e.target.matches("input[type=checkbox]")) {
        people[e.target.dataset.row][e.target.dataset.key] = e.target.checked;
        updateTotals();
    }
});

tableBody.addEventListener("input", e => {
    if (e.target.matches("input[data-name]")) {
        people[e.target.dataset.name].name = e.target.value;
        save();
    }
});

tableBody.addEventListener("click", e => {
    const button = e.target.closest("button[data-delete]");
    if (!button) return;
    const r = Number(button.dataset.delete);
    if (confirm(`Delete ${people[r].name || "this row"}?`)) {
        people.splice(r, 1);
        renderTable();
    }
});

tableBody.addEventListener("keydown", e => {
    const el = e.target;
    if (el.dataset.r === undefined) return;

    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    const lastCol = ITEMS.length;

    if (e.key === "Enter") {
        e.preventDefault();
        if (r === people.length - 1) {
            addRow("", false);
            focusCell(r + 1, c);
        } else {
            focusCell(r + 1, c);
        }
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        focusCell(r + 1, c);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusCell(r - 1, c);
    } else if (e.key === "ArrowRight") {
        const atEnd = el.type !== "text" || el.selectionStart === el.value.length;
        if (atEnd && c < lastCol) {
            e.preventDefault();
            focusCell(r, c + 1);
        }
    } else if (e.key === "ArrowLeft") {
        const atStart = el.type !== "text" || el.selectionEnd === 0;
        if (atStart && c > 0) {
            e.preventDefault();
            focusCell(r, c - 1);
        }
    }
});

document.getElementById("tableHead").addEventListener("click", e => {
    const th = e.target.closest("th[data-toggle]");
    if (!th) return;
    const key = th.dataset.toggle;
    const allTicked = people.every(p => p[key]);
    people.forEach(p => p[key] = !allTicked);
    renderTable();
});

document.getElementById("priceList").addEventListener("input", e => {
    if (e.target.dataset.price) {
        prices[e.target.dataset.price] = parseFloat(e.target.value) || 0;
        updateTotals();
    }
});

document.getElementById("addButton").addEventListener("click", () => {
    const input = document.getElementById("newName");
    addRow(input.value.trim());
    input.value = "";
});

document.getElementById("newName").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("addButton").click();
});

document.getElementById("resetButton").addEventListener("click", () => {
    if (!confirm("Reset all ticks to their defaults?")) return;
    people = people.map(p => newPerson(p.name));
    renderTable();
});

document.getElementById("exportButton").addEventListener("click", () => {
    const rows = [["No.", "Name", ...ITEMS.map(i => i.label), "Total"]];

    people.forEach((p, i) => {
        rows.push([i + 1, p.name,
            ...ITEMS.map(item => p[item.key] ? prices[item.key].toFixed(2) : "0.00"),
            personTotal(p).toFixed(2)]);
    });

    const grand = people.reduce((s, p) => s + personTotal(p), 0);
    rows.push(["", "TOTAL", ...ITEMS.map(() => ""), grand.toFixed(2)]);

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "event-registrations.csv";
    link.click();
    URL.revokeObjectURL(link.href);
});

load();
renderPrices();
renderTable();

function showNotification(message) {
    let toast = document.getElementById("selectToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "selectToast";
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: #2e7d32; color: #fff; padding: 12px 18px;
            border-radius: 8px; font-size: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,.25);
            opacity: 0; transition: opacity .3s;`;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.opacity = "0", 2500);
}

function everythingSelected() {
    return people.length > 0 && people.every(p => ITEMS.every(i => p[i.key]));
}

tableBody.addEventListener("change", e => {
    if (e.target.matches("input[type=checkbox]") && everythingSelected()) {
        showNotification("Everything is selected ✔");
    }
});

document.getElementById("tableHead").addEventListener("click", e => {
    const th = e.target.closest("th[data-toggle]");
    if (!th) return;
    const key = th.dataset.toggle;
    if (!people.every(p => p[key])) return;
    const label = ITEMS.find(i => i.key === key).label;
    showNotification(everythingSelected()
        ? "Everything is selected ✔"
        : `${label} selected for everyone ✔`);
});