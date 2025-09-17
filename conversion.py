import os
import tempfile
import uuid
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import cross_origin
import magic
from src.utils.converters import DocumentConverter, ImageConverter, AudioConverter

conversion_bp = Blueprint('conversion', __name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'document': {'pdf', 'docx', 'txt', 'html', 'md'},
    'image': {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'},
    'audio': {'mp3', 'wav', 'ogg', 'm4a'}
}

def allowed_file(filename, file_type):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS.get(file_type, set())

def get_file_type(filename):
    """Determine file type based on extension"""
    if not filename or '.' not in filename:
        return None
    
    ext = filename.rsplit('.', 1)[1].lower()
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return file_type
    return None

@conversion_bp.route('/convert', methods=['POST'])
@cross_origin()
def convert_file():
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        target_format = request.form.get('target_format', '').lower()
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not target_format:
            return jsonify({'error': 'Target format not specified'}), 400
        
        # Determine source file type
        source_type = get_file_type(file.filename)
        if not source_type:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        # Determine target file type
        target_type = None
        for file_type, extensions in ALLOWED_EXTENSIONS.items():
            if target_format in extensions:
                target_type = file_type
                break
        
        if not target_type:
            return jsonify({'error': 'Unsupported target format'}), 400
        
        # Check if conversion is possible
        if source_type != target_type:
            return jsonify({'error': f'Cannot convert from {source_type} to {target_type}'}), 400
        
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        source_path = os.path.join(temp_dir, filename)
        file.save(source_path)
        
        # Generate output filename
        base_name = os.path.splitext(filename)[0]
        output_filename = f"{base_name}.{target_format}"
        output_path = os.path.join(temp_dir, output_filename)
        
        # Perform conversion based on file type
        success = False
        error_message = ""
        
        try:
            if source_type == 'document':
                converter = DocumentConverter()
                success = converter.convert(source_path, output_path, target_format)
            elif source_type == 'image':
                converter = ImageConverter()
                success = converter.convert(source_path, output_path, target_format)
            elif source_type == 'audio':
                converter = AudioConverter()
                success = converter.convert(source_path, output_path, target_format)
            
            if success and os.path.exists(output_path):
                # Return the converted file
                return send_file(
                    output_path,
                    as_attachment=True,
                    download_name=output_filename,
                    mimetype='application/octet-stream'
                )
            else:
                return jsonify({'error': 'Conversion failed'}), 500
                
        except Exception as e:
            return jsonify({'error': f'Conversion error: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@conversion_bp.route('/supported-formats', methods=['GET'])
@cross_origin()
def get_supported_formats():
    """Return list of supported file formats"""
    return jsonify({
        'formats': ALLOWED_EXTENSIONS,
        'conversions': {
            'document': ['pdf', 'docx', 'txt', 'html', 'md'],
            'image': ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'],
            'audio': ['mp3', 'wav', 'ogg', 'm4a']
        }
    })

@conversion_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'file-converter-api'})

