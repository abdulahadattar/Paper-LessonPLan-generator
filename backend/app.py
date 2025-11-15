from flask import Flask, request, send_file
from flask_cors import CORS
from pylatex import Document, Section, Package
from pylatex.utils import NoEscape
import io

app = Flask(__name__)
CORS(app)

def create_latex_document(data):
    geometry_options = {"tmargin": "1cm", "lmargin": "1cm"}
    doc = Document(geometry_options=geometry_options)

    doc.packages.append(Package('amsmath'))

    doc.preamble.append(NoEscape(r'\title{' + data.get('title', 'Lesson Plan') + '}'))
    doc.preamble.append(NoEscape(r'\author{' + data.get('teacher', 'Teacher') + '}'))
    doc.preamble.append(NoEscape(r'\date{\today}'))
    doc.append(NoEscape(r'\maketitle'))

    with doc.create(Section('Objective')):
        doc.append(data.get('objective', ''))

    with doc.create(Section('Materials')):
        materials = data.get('materials', [])
        for item in materials:
            doc.append(item)

    with doc.create(Section('Activities')):
        activities = data.get('activities', [])
        for activity in activities:
            doc.append(NoEscape(r'\textbf{' + activity.get('name', '') + r'} (' + str(activity.get('duration', '')) + r' mins) \\'))
            doc.append(NoEscape(activity.get('description', '')))
            doc.append(NoEscape(r'\\'))

    with doc.create(Section('Homework')):
        doc.append(data.get('homework', ''))

    return doc

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    data = request.get_json()
    doc = create_latex_document(data)

    try:
        pdf_buffer = io.BytesIO()
        doc.generate_pdf(pdf_buffer, clean_tex=True)
        pdf_buffer.seek(0)
        return send_file(pdf_buffer, as_attachment=True, download_name='lesson_plan.pdf', mimetype='application/pdf')
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)