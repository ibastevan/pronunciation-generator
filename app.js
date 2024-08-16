const entries = [];
let currentPage = 1;
let entriesPerPage = 25; // Default entries per page
let filteredEntries = [];

// Initialize Materialize components
document.addEventListener('DOMContentLoaded', function() {
    M.FormSelect.init(document.querySelectorAll('select'), {});
    M.updateTextFields(); // Ensure labels are updated
    setupPagination();
    setupSorting();
    setupFiltering();
    loadEntries();
});

function addEntry() {
    const grapheme = document.getElementById('grapheme').value.trim();
    const type = document.querySelector('input[name="type"]:checked').value;
    const value = document.getElementById('value').value.trim();

    if (grapheme && value) {
        entries.push({ grapheme, type, value });
        updateEntriesList();
        document.getElementById('inputForm').reset();
        document.querySelector('input[name="type"][value="phoneme"]').checked = true;
        M.updateTextFields(); // Ensure labels are updated
        M.FormSelect.init(document.querySelectorAll('select'), {}); // Reinitialize select elements
    } else {
        M.toast({html: 'All fields are required.', classes: 'rounded'});
    }
}

function setupPagination() {
    const paginationSelect = document.getElementById('entriesPerPage');
    paginationSelect.addEventListener('change', function() {
        entriesPerPage = parseInt(this.value);
        currentPage = 1;
        updateEntriesList();
    });
}

function setupFiltering() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');

    searchInput.addEventListener('input', updateEntriesList);
    typeFilter.addEventListener('change', updateEntriesList);
}

function setupSorting() {
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', updateEntriesList);
}

function updateEntriesList() {
    filteredEntries = entries.filter(entry => {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const filterType = document.getElementById('typeFilter').value;

        return (entry.grapheme.toLowerCase().includes(searchQuery) ||
                entry.value.toLowerCase().includes(searchQuery)) &&
               (filterType === 'all' || entry.type === filterType);
    });

    sortEntries();
    renderPagination();
    renderEntries();
}

function sortEntries() {
    const sortOption = document.getElementById('sortSelect').value;
    filteredEntries.sort((a, b) => {
        if (a[sortOption] < b[sortOption]) return -1;
        if (a[sortOption] > b[sortOption]) return 1;
        return 0;
    });
}

function renderPagination() {
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
    let paginationHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a href="#!" class="page-link" onclick="changePage(${i})">${i}</a>
        </li>`;
    }

    document.getElementById('pagination').innerHTML = paginationHTML;
}

function renderEntries() {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = Math.min(startIndex + entriesPerPage, filteredEntries.length);
    const entriesList = document.getElementById('entriesList');

    entriesList.innerHTML = '';
    for (let i = startIndex; i < endIndex; i++) {
        const entry = filteredEntries[i];
        const li = document.createElement('li');
        li.className = 'collection-item';
        li.innerHTML = `${entry.grapheme}: ${entry.type} - ${entry.value}
                        <a href="#!" class="secondary-content">
                            <i class="material-icons" onclick="editEntry(${i})">edit</i>
                            <i class="material-icons" onclick="removeEntry(${i})">delete</i>
                        </a>`;
        entriesList.appendChild(li);
    }
}

function changePage(page) {
    currentPage = page;
    renderEntries();
}

function editEntry(index) {
    const entry = filteredEntries[index];
    document.getElementById('grapheme').value = entry.grapheme;
    document.getElementById('value').value = entry.value;
    document.querySelector(`input[name="type"][value="${entry.type}"]`).checked = true;
    M.updateTextFields(); // Ensure labels are updated
    M.FormSelect.init(document.querySelectorAll('select'), {}); // Reinitialize select elements
    entries.splice(entries.indexOf(filteredEntries[index]), 1); // Remove the entry for re-adding with updated details
    updateEntriesList();
}

function removeEntry(index) {
    entries.splice(entries.indexOf(filteredEntries[index]), 1);
    updateEntriesList();
}

function generateXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<lexicon version="1.0">\n';
    
    entries.forEach(entry => {
        xml += `  <entry>\n`;
        xml += `    <grapheme>${escapeXML(entry.grapheme)}</grapheme>\n`;
        xml += `    <${entry.type}>${escapeXML(entry.value)}</${entry.type}>\n`;
        xml += `  </entry>\n`;
    });
    
    xml += '</lexicon>';
    return xml;
}

function escapeXML(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function downloadXML() {
    const xml = generateXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lexicon.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // Ensure the file is XML based on the file extension or MIME type
        if (file.type === 'application/xml' || file.name.endsWith('.xml')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const xmlString = e.target.result;
                parseXML(xmlString);
            };
            reader.readAsText(file);
        } else {
            M.toast({html: 'Please upload a valid XML file with .xml extension.', classes: 'rounded'});
        }
    } else {
        M.toast({html: 'No file selected.', classes: 'rounded'});
    }
});

function parseXML(xmlString) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        // Check if there were any parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            M.toast({html: 'Invalid XML file. Please upload a correct XML file.', classes: 'rounded'});
            console.error('XML Parsing Error:', parserError.textContent); // Log error for debugging
            return;
        }

        const entriesList = xmlDoc.getElementsByTagName("entry");
        entries.length = 0; // Clear existing entries
        
        for (let i = 0; i < entriesList.length; i++) {
            const entry = entriesList[i];
            const grapheme = entry.getElementsByTagName("grapheme")[0]?.textContent || '';
            const phoneme = entry.getElementsByTagName("phoneme")[0];
            const alias = entry.getElementsByTagName("alias")[0];
            
            let type = 'phoneme';
            let value = '';
            if (phoneme) {
                value = phoneme.textContent;
            } else if (alias) {
                type = 'alias';
                value = alias.textContent;
            }
            
            entries.push({ grapheme, type, value });
        }
        
        updateEntriesList();
    } catch (error) {
        M.toast({html: 'Error parsing XML file.', classes: 'rounded'});
        console.error('Parsing Error:', error); // Log error for debugging
    }
}
