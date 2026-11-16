let previewRows = [];
let ignoredRows = [];

function rowKey(row) {
    return `${row.date}|${row.description}|${row.amount}`;
}

function markDuplicates() {
    const counts = {};  // creates the variable with an object input
    previewRows.forEach((row) => {   
        const key = rowKey(row);
        counts[key] = (counts[key] || 0) +1;  // counts the amount already saved and adds 1. This helps is there is one later in the table
    });
    const trs = document.querySelectorAll("#preview-rows tr");
    previewRows.forEach((row, i) => {   // i gives position?
            const isDuplicate = counts[rowKey(row)] > 1 || (row.in_database && row.description === row.origionalDescription); 
            // its a duplicate if there it counts more than 1 or the descriotions are the same 
            trs[i].classList.toggle("duplicate", isDuplicate); //if its true is add the class "isDuplicate" to it
    });
}

function renderPreview() {
  const tbody = document.getElementById("preview-rows");
  tbody.innerHTML = "";
  previewRows.forEach((row) => {
    const tr = document.createElement("tr");
    ["select","date", "description", "amount", "direction", "category", "subcategory"].forEach((field) => {
        const td = document.createElement("td");
        if (field === "select") {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = Boolean(row.selected);
            checkbox.onchange = () => {
                row.selected = checkbox.checked;
            }
            td.appendChild(checkbox);
        }
        else if (field === "category" || field === "subcategory") { 
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
        } else if (field === "description") {
            const input = document.createElement("input"); // this makes it a text box
            input.value = row[field];  //keeps current description
            input.oninput = () => {
                row[field] = input.value;    //adds typing into box
                markDuplicates();       //rechecks for duplicates
            };
            td.appendChild(input);  //puts new text in table
        } else {
        td.textContent = row[field];
        }
        tr.appendChild(td);
    }); 
    tbody.appendChild(tr);
  });
  markDuplicates();
}

function renderIgnored() {
    const tbody = document.getElementById("ignored-rows");
    tbody.innerHTML = "";
    ignoredRows.forEach((row) => {
        const tr = document.createElement("tr");
        ["date", "description", "amount",].forEach((field) => {
            const td = document.createElement("td");
            td.textContent = row[field];
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
    const data = await res.json();
    previewRows = data.rows;
    previewRows.forEach((row) => {
        row.origionalDescription = row.description; // saves the original description
    });
    ignoredRows = data.ignored;
    renderPreview();
    renderIgnored();
  };

  document.getElementById("confirm-btn").onclick = async () => {
    if (previewRows.length == 0) { 
        return;
    }
    if (document.querySelectorAll("#preview-rows tr.duplicate")) {
        alert(`Duplicates found, please fix them before importing`);
        return;
    }
    const button = document.getElementById("confirm-btn")
    button.disabled = true;
    const res = await fetch("/transactions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(previewRows),
    });
    const result = await res.json();
    alert(`Imported ${result.imported} rows`)
    previewRows = [];
    ignoredRows = [];
    renderPreview();
    renderIgnored();
    loadCategories();
    button.disabled = false;
};

document.getElementById("clear-table-btn").onclick = () => {
    previewRows = [];
    ignoredRows = [];
    renderPreview();
    renderIgnored();
};

document.getElementById("delete-selected-btn").onclick = () => {
    previewRows = previewRows.filter((row) => !row.selected);  //rereders it without(!) the selected rows
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
  
