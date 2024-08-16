const entries = [];

function addEntry() {
    const grapheme = document.getElementById('grapheme').value.trim();
    const type = document.getElementById('type').value;
    const value = document.getElementById('value').value.trim();

    if (grapheme && value) {
        entries.push({ grapheme, type, value });
        updateEntriesList();
        document.getElementById('inputForm').reset();
    } else {
        alert('All fields are required.');
    }
}

function updateEntriesList() {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';
    entries.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.grapheme}: ${entry.type} - ${entry.value}`;
        entriesList.appendChild(li);
    });
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
