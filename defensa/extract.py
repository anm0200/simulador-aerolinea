import zipfile
import re

with zipfile.ZipFile('defensa/defensa_TFG.docx', 'r') as z:
    xml_content = z.read('word/document.xml').decode('utf-8')
    text = re.sub('<[^<]+>', '', xml_content)
    with open('defensa/extracted.txt', 'w', encoding='utf-8') as f:
        f.write(text)
