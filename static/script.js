let selectedId = null;

async function loadNotes() {
  const res = await fetch("/notes");
  const notes = await res.json();
  const list = document.getElementById("notes-list");
  list.innerHTML = "";
  notes.forEach(note => {
    const div = document.createElement("div");
    div.className = "note-item" + (note.id === selectedId ? " active" : "");
    div.textContent = note.title || "(untitled)";
    div.onclick = () => selectNote(note);
    list.appendChild(div);
  });
}

function selectNote(note) {
  selectedId = note.id;
  document.getElementById("title-input").value = note.title;
  document.getElementById("content-input").value = note.content;
  loadNotes();
}

document.getElementById("new-note-btn").onclick = () => {
  selectedId = null;
  document.getElementById("title-input").value = "";
  document.getElementById("content-input").value = "";
  loadNotes();
};

document.getElementById("save-btn").onclick = async () => {
  const title = document.getElementById("title-input").value;
  const content = document.getElementById("content-input").value;

  if (selectedId === null) {
    const res = await fetch("/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const newNote = await res.json();
    selectedId = newNote.id;
  } else {
    await fetch(`/notes/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
  }
  loadNotes();
};

document.getElementById("delete-btn").onclick = async () => {
  if (selectedId === null) return;
  await fetch(`/notes/${selectedId}`, { method: "DELETE" });
  selectedId = null;
  document.getElementById("title-input").value = "";
  document.getElementById("content-input").value = "";
  loadNotes();
};

loadNotes();
