function money(value) {
  return Number(value || 0).toFixed(2);
}

function parseMoney(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

async function loadBudget() {
  const res = await fetch("/budget-items");
  const items = await res.json();
  renderBudget(items);
}

function renderBudget(items) {
  const rows = document.getElementById("budget-rows");
  rows.innerHTML = "";
  let incomeTotal = 0;
  let expenseTotal = 0;

  items.forEach((item) => {
    incomeTotal += Number(item.income || 0);
    expenseTotal += Number(item.expense || 0);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input data-field="category" value="${escapeAttr(item.category)}"></td>
      <td><input data-field="description" value="${escapeAttr(item.description)}"></td>
      <td><input data-field="income" type="number" step="0.01" value="${money(item.income)}"></td>
      <td><input data-field="expense" type="number" step="0.01" value="${money(item.expense)}"></td>
      <td><button class="delete-row-btn" type="button">Delete</button></td>
    `;

    tr.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => saveRow(item.id, tr));
    });
    tr.querySelector(".delete-row-btn").onclick = () => deleteRow(item.id);
    rows.appendChild(tr);
  });

  document.getElementById("total-income").textContent = money(incomeTotal);
  document.getElementById("total-expense").textContent = money(expenseTotal);
  document.getElementById("balance").textContent = money(incomeTotal - expenseTotal);
}

function escapeAttr(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function saveRow(id, tr) {
  const data = {};
  tr.querySelectorAll("input").forEach((input) => {
    const field = input.dataset.field;
    data[field] = field === "income" || field === "expense" ? parseMoney(input.value) : input.value;
  });
  await fetch(`/budget-items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  loadBudget();
}

async function deleteRow(id) {
  await fetch(`/budget-items/${id}`, { method: "DELETE" });
  loadBudget();
}

document.getElementById("add-row-btn").onclick = async () => {
  await fetch("/budget-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: "", description: "", income: 0, expense: 0 }),
  });
  loadBudget();
};

loadBudget();
