const entries = [];

// Initialize Materialize components
document.addEventListener('DOMContentLoaded', function() {
    M.FormSelect.init(document.querySelectorAll('select'), {});
});

function addEntry() {
    const grapheme = document.getElementById('grapheme').value.trim();
    const type = document.querySelector('input[name="type"]:checked').value;
    const value = document.getElementById('value').value.trim();

    if (grapheme && value) {
        entries.push({ grapheme, type, value });
        updateEntriesList();
        document.getElementById('inputForm').reset();
        // Reset radio buttons to default selection
        document.querySelector('input[name="type"][value="phoneme"]').checked = true;
    } else {
        M.toast({html: 'All fields are required.', classes: 'rounded'});
    }
}

function updateEntriesList() {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';
    entries.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'collection-item';
        li.innerHTML = `${entry.grapheme}: ${entry.type} - ${entry.value}
                        <a href="#!" class="secondary-content">
                            <i class="material-icons" onclick="editEntry(${index})">edit</i>
                            <i class="material-icons" onclick="removeEntry(${index})">delete</i>
                        </a>`;
        entriesList.appendChild(li);
    });
}

function editEntry(index) {
    const entry = entries[index];
    document.getElementById('grapheme').value = entry.grapheme;
    document.getElementById('value').value = entry.value;
    document.querySelector(`input[name="type"][value="${entry.type}"]`).checked = true;
    entries.splice(index, 1); // Remove the entry for re-adding with updated details
    updateEntriesList();
}

function removeEntry(index) {
    entries.splice(index, 1);
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
