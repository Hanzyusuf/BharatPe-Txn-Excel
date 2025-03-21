// const columnOrderContainer = document.getElementById("column-order-container");
const columnContainer = document.getElementById("column-container");
let draggedItem = null;

const defaultColumns = [
    { id: "received_from", label: "Received From" },
    { id: "utr_id", label: "UTR ID" },
    { id: "vpa", label: "VPA" },
    { id: "date_time", label: "Date & Time" },
    { id: "amount", label: "Amount" }
];

async function loadColumnOrder() {
    const storedData = await browser.storage.local.get("columnOrder");
    const order = storedData.columnOrder || defaultColumns.map(col => col.id);
    renderColumns(order);
}

function renderColumns(order) {
    columnContainer.innerHTML = "";
    order.forEach(colId => {
        const column = defaultColumns.find(c => c.id === colId);
        if (column) {
            const button = document.createElement("button");
            button.className = "column-item";
            button.innerText = column.label;
            button.dataset.id = column.id;
            button.draggable = true;
            columnContainer.appendChild(button);
        }
    });
    enableDragAndDrop();
}

function enableDragAndDrop() {
    let draggedItem = null;

    document.querySelectorAll(".column-item").forEach(item => {

        item.addEventListener("dragstart", (e) => {
            draggedItem = item;
            setTimeout(() => item.classList.add("dragging"), 0);
        });
    
        item.addEventListener("dragend", () => {
            draggedItem.classList.remove("dragging");
            draggedItem = null;
        });
    
        item.addEventListener("dragover", (e) => e.preventDefault());
    
        item.addEventListener("drop", (e) => {
            e.preventDefault();
            if (!draggedItem || draggedItem === item) return;
    
            let items = [...columnContainer.children];
            let dropIndex = items.indexOf(item);
            let dragIndex = items.indexOf(draggedItem);
    
            columnContainer.removeChild(draggedItem);
            columnContainer.insertBefore(draggedItem, dropIndex > dragIndex ? item.nextSibling : item);

            saveColumnOrder();
        });
    });
}

function saveColumnOrder() {
    const newOrder = [...columnContainer.children].map(item => item.dataset.id);
    browser.storage.local.set({ columnOrder: newOrder });
    // browser.storage.local.set({ columnOrder: null });
}

function setError(msg){
    let title = document.getElementById("input-settings-title");
    title.innerHTML = msg;
}

document.addEventListener("DOMContentLoaded", loadColumnOrder);
