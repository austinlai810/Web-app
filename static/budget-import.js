let previewRows = [];

function renderPreview() {
  const tbody = document.getElementById("preview-rows");
  tbody.innerHTML = "";
  previewRows.forEach((row) => {
    const tr = document.createElement("tr");
    ["date", "description", "amount", "direction", "category", "subcategory"].forEach((field) => {
        const td = document.createElement("td");
        if (field === "category" || field === "subcategory") { 
            const input = document.createElement("input");
            if (field === "category") {
                input.setAttribute("list", "category-options");
              }
            if (field === "subcategory") {
                input.setAttribute("list", "subcategory-options");
              }
            input.value = row[field];
            input.oninput = () => {
                row[field] = input.value;
            }
            td.appendChild(input);
        } else {
        td.textContent = row[field];
        }
        tr.appendChild(td);
    }); 
    tbody.appendChild(tr);
  });
}

document.getElementById("preview-btn").onclick = async () => {
    const text = document.getElementById("csv-text").value;
    const res = await fetch("/transactions/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });
    const rows = await res.json();
    previewRows = rows;
    renderPreview();
  };

  async function loadCategories() {
    const res = await fetch("/categories");
    const items = await res.json();
    const categories = [...new Set(items.map((item) => item.category))];
    const subcategories = [...new Set(items.map((item) => item.subcategory))];
    fillList("category-options", categories);
    fillList("subcategory-options", subcategories);
  }
  
  function fillList(listId, values) {
    const list = document.getElementById(listId);
    list.innerHTML = "";
    values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        list.appendChild(option);
    });
  }
  
  loadCategories();
  