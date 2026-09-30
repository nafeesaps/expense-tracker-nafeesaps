// ==========================================
// EXPENSE TRACKER
// ==========================================

// Get elements from HTML
const transactionForm = document.getElementById("transaction-form");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("total-income");
const expenseElement = document.getElementById("total-expenses");

const transactionList = document.getElementById("transaction-list");
const emptyState = document.getElementById("empty-state");

const typeFilter = document.getElementById("type-filter");
const categoryFilter = document.getElementById("category-filter");

const submitButton = document.getElementById("submit-btn");
const cancelButton = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const formError = document.getElementById("form-error");

const clearAllButton = document.getElementById("clear-all-btn");

const monthlySummary = document.getElementById("monthly-summary");
const categoryChart = document.getElementById("category-chart");


// ==========================================
// APPLICATION DATA
// ==========================================

let transactions = JSON.parse(
    localStorage.getItem("expenseTrackerTransactions")
) || [];

let editingTransactionId = null;


// ==========================================
// INITIAL SETUP
// ==========================================

// Set today's date when the application opens
if (!dateInput.value) {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
}


// Initial display
updateCategoryFilter();
renderTransactions();
updateSummary();
renderMonthlySummary();
renderCategoryChart();


// ==========================================
// ADD / EDIT TRANSACTION
// ==========================================

transactionForm.addEventListener("submit", function (event) {

    event.preventDefault();

    formError.textContent = "";

    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();


    // Validation
    if (!amount || amount <= 0) {
        formError.textContent = "Please enter an amount greater than 0.";
        return;
    }

    if (!category) {
        formError.textContent = "Please select a category.";
        return;
    }

    if (!date) {
        formError.textContent = "Please select a date.";
        return;
    }


    // EDIT EXISTING TRANSACTION
    if (editingTransactionId !== null) {

        transactions = transactions.map(function (transaction) {

            if (transaction.id === editingTransactionId) {

                return {
                    ...transaction,
                    type: type,
                    amount: amount,
                    category: category,
                    date: date,
                    description: description
                };
            }

            return transaction;
        });

        editingTransactionId = null;

        submitButton.textContent = "Add Transaction";
        cancelButton.classList.add("hidden");
        formTitle.textContent = "Add Transaction";

    }

    // ADD NEW TRANSACTION
    else {

        const transaction = {
            id: Date.now(),
            type: type,
            amount: amount,
            category: category,
            date: date,
            description: description
        };

        transactions.push(transaction);
    }


    saveTransactions();

    transactionForm.reset();

    // Set date again after reset
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;

    updateCategoryFilter();
    renderTransactions();
    updateSummary();
    renderMonthlySummary();
    renderCategoryChart();
});


// ==========================================
// SAVE TO LOCAL STORAGE
// ==========================================

function saveTransactions() {

    localStorage.setItem(
        "expenseTrackerTransactions",
        JSON.stringify(transactions)
    );
}


// ==========================================
// DISPLAY TRANSACTIONS
// ==========================================

function renderTransactions() {

    transactionList.innerHTML = "";

    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;


    const filteredTransactions = transactions
        .filter(function (transaction) {

            const typeMatches =
                selectedType === "all" ||
                transaction.type === selectedType;

            const categoryMatches =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            return typeMatches && categoryMatches;
        })
        .sort(function (a, b) {

            return new Date(b.date) - new Date(a.date);
        });


    if (filteredTransactions.length === 0) {

        emptyState.style.display = "block";

    } else {

        emptyState.style.display = "none";
    }


    filteredTransactions.forEach(function (transaction) {

        const item = document.createElement("div");

        item.className = "transaction-item";


        const sign = transaction.type === "income"
            ? "+"
            : "-";


        const icon = transaction.type === "income"
            ? "↑"
            : "↓";


        const formattedDate = formatDate(transaction.date);


        item.innerHTML = `
            <div class="transaction-info">

                <div class="transaction-icon ${transaction.type}">
                    ${icon}
                </div>

                <div class="transaction-details">

                    <h3>
                        ${escapeHTML(
                            transaction.description || transaction.category
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(transaction.category)}
                        •
                        ${formattedDate}
                    </p>

                </div>

            </div>


            <div class="transaction-right">

                <span class="transaction-amount ${transaction.type}">
                    ${sign}${formatCurrency(transaction.amount)}
                </span>

                <div class="transaction-actions">

                    <button
                        class="edit-btn"
                        onclick="editTransaction(${transaction.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTransaction(${transaction.id})"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;


        transactionList.appendChild(item);
    });
}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary() {

    let totalIncome = 0;
    let totalExpenses = 0;


    transactions.forEach(function (transaction) {

        if (transaction.type === "income") {

            totalIncome += transaction.amount;

        } else {

            totalExpenses += transaction.amount;
        }
    });


    const balance = totalIncome - totalExpenses;


    incomeElement.textContent = formatCurrency(totalIncome);
    expenseElement.textContent = formatCurrency(totalExpenses);
    balanceElement.textContent = formatCurrency(balance);
}


// ==========================================
// EDIT TRANSACTION
// ==========================================

function editTransaction(id) {

    const transaction = transactions.find(function (item) {
        return item.id === id;
    });


    if (!transaction) {
        return;
    }


    editingTransactionId = id;


    typeInput.value = transaction.type;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;


    formTitle.textContent = "Edit Transaction";

    submitButton.textContent = "Save Changes";

    cancelButton.classList.remove("hidden");


    // Scroll to form
    transactionForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// CANCEL EDIT
// ==========================================

cancelButton.addEventListener("click", function () {

    editingTransactionId = null;

    transactionForm.reset();

    formTitle.textContent = "Add Transaction";

    submitButton.textContent = "Add Transaction";

    cancelButton.classList.add("hidden");

    formError.textContent = "";


    // Restore today's date
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
});


// ==========================================
// DELETE TRANSACTION
// ==========================================

function deleteTransaction(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );


    if (!confirmed) {
        return;
    }


    transactions = transactions.filter(function (transaction) {
        return transaction.id !== id;
    });


    saveTransactions();

    updateCategoryFilter();
    renderTransactions();
    updateSummary();
    renderMonthlySummary();
    renderCategoryChart();
}


// ==========================================
// CLEAR ALL TRANSACTIONS
// ==========================================

clearAllButton.addEventListener("click", function () {

    if (transactions.length === 0) {
        return;
    }


    const confirmed = confirm(
        "Are you sure you want to delete all transactions?"
    );


    if (!confirmed) {
        return;
    }


    transactions = [];

    saveTransactions();

    updateCategoryFilter();
    renderTransactions();
    updateSummary();
    renderMonthlySummary();
    renderCategoryChart();
});


// ==========================================
// TYPE FILTER
// ==========================================

typeFilter.addEventListener("change", function () {

    renderTransactions();
});


// ==========================================
// CATEGORY FILTER
// ==========================================

categoryFilter.addEventListener("change", function () {

    renderTransactions();
});


// ==========================================
// UPDATE CATEGORY FILTER
// ==========================================

function updateCategoryFilter() {

    const currentValue = categoryFilter.value;


    const categories = [...new Set(
        transactions.map(function (transaction) {
            return transaction.category;
        })
    )].sort();


    categoryFilter.innerHTML = `
        <option value="all">All categories</option>
    `;


    categories.forEach(function (category) {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });


    if (categories.includes(currentValue)) {

        categoryFilter.value = currentValue;

    } else {

        categoryFilter.value = "all";
    }
}


// ==========================================
// MONTHLY SUMMARY
// ==========================================

function renderMonthlySummary() {

    monthlySummary.innerHTML = "";


    const monthlyExpenses = {};


    transactions.forEach(function (transaction) {

        if (transaction.type !== "expense") {
            return;
        }


        const month = transaction.date.substring(0, 7);


        if (!monthlyExpenses[month]) {
            monthlyExpenses[month] = 0;
        }


        monthlyExpenses[month] += transaction.amount;
    });


    const months = Object.keys(monthlyExpenses).sort().reverse();


    if (months.length === 0) {

        monthlySummary.innerHTML = `
            <p class="section-subtitle">
                No expense data available yet.
            </p>
        `;

        return;
    }


    months.forEach(function (month) {

        const [year, monthNumber] = month.split("-");


        const monthName = new Date(
            Number(year),
            Number(monthNumber) - 1
        ).toLocaleString("en-IN", {
            month: "long",
            year: "numeric"
        });


        const card = document.createElement("div");

        card.className = "month-card";


        card.innerHTML = `
            <div>
                <h3>${monthName}</h3>
                <p>Total expenses</p>
            </div>

            <strong>
                ${formatCurrency(monthlyExpenses[month])}
            </strong>
        `;


        monthlySummary.appendChild(card);
    });
}


// ==========================================
// CATEGORY EXPENSE CHART
// ==========================================

function renderCategoryChart() {

    categoryChart.innerHTML = "";


    const categoryTotals = {};


    transactions.forEach(function (transaction) {

        if (transaction.type !== "expense") {
            return;
        }


        if (!categoryTotals[transaction.category]) {
            categoryTotals[transaction.category] = 0;
        }


        categoryTotals[transaction.category] += transaction.amount;
    });


    const categories = Object.entries(categoryTotals)
        .sort(function (a, b) {
            return b[1] - a[1];
        });


    if (categories.length === 0) {

        categoryChart.innerHTML = `
            <p class="section-subtitle">
                No expense data available yet.
            </p>
        `;

        return;
    }


    const highestAmount = categories[0][1];


    categories.forEach(function ([category, amount]) {

        const percentage =
            (amount / highestAmount) * 100;


        const row = document.createElement("div");

        row.className = "chart-row";


        row.innerHTML = `
            <div class="chart-label">

                <span>${escapeHTML(category)}</span>

                <span>${formatCurrency(amount)}</span>

            </div>

            <div class="chart-track">

                <div
                    class="chart-bar"
                    style="width: ${percentage}%"
                ></div>

            </div>
        `;


        categoryChart.appendChild(row);
    });
}


// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {

    const date = new Date(dateString + "T00:00:00");


    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ==========================================
// BASIC HTML SAFETY
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}