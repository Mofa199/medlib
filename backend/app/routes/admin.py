import os
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from backend.app import db
from backend.app.models import Course, Module, Topic, Resource

bp = Blueprint('admin', __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if identity.get('role') != 'admin':
            return jsonify({'message': 'Admins only!'}), 403
        return fn(*args, **kwargs)
    return wrapper

# -- Course Management --

@bp.route('/courses', methods=['POST'])
@admin_required
def create_course():
    data = request.get_json()
    if not data or not 'name' in data:
        return jsonify({'message': 'Missing course name'}), 400

    if Course.query.filter_by(name=data['name']).first():
        return jsonify({'message': 'Course with this name already exists'}), 400

    course = Course(name=data['name'], description=data.get('description', ''))
    db.session.add(course)
    db.session.commit()
    return jsonify({'message': 'Course created successfully', 'id': course.id}), 201

@bp.route('/courses', methods=['GET'])
@jwt_required() # Any logged in user can see courses
def get_courses():
    courses = Course.query.all()
    return jsonify([{'id': c.id, 'name': c.name, 'description': c.description} for c in courses])

@bp.route('/courses/<int:id>', methods=['GET'])
@jwt_required() # Any logged in user can see a course
def get_course(id):
    course = Course.query.get_or_404(id)
    return jsonify({'id': course.id, 'name': course.name, 'description': course.description})

@bp.route('/courses/<int:id>', methods=['PUT'])
@admin_required
def update_course(id):
    course = Course.query.get_or_404(id)
    data = request.get_json()
    if 'name' in data:
        course.name = data['name']
    if 'description' in data:
        course.description = data['description']
    db.session.commit()
    return jsonify({'message': 'Course updated successfully'})

@bp.route('/courses/<int:id>', methods=['DELETE'])
@admin_required
def delete_course(id):
    course = Course.query.get_or_404(id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted successfully'})

# -- Module Management --

@bp.route('/courses/<int:course_id>/modules', methods=['POST'])
@admin_required
def create_module(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    if not data or not 'name' in data:
        return jsonify({'message': 'Missing module name'}), 400

    module = Module(name=data['name'], description=data.get('description', ''), course_id=course.id)
    db.session.add(module)
    db.session.commit()
    return jsonify({'message': 'Module created successfully', 'id': module.id}), 201

@bp.route('/modules/<int:id>', methods=['PUT'])
@admin_required
def update_module(id):
    module = Module.query.get_or_404(id)
    data = request.get_json()
    if 'name' in data:
        module.name = data['name']
    if 'description' in data:
        module.description = data['description']
    db.session.commit()
    return jsonify({'message': 'Module updated successfully'})

@bp.route('/modules/<int:id>', methods=['DELETE'])
@admin_required
def delete_module(id):
    module = Module.query.get_or_404(id)
    db.session.delete(module)
    db.session.commit()
    return jsonify({'message': 'Module deleted successfully'})

# -- Topic Management --

@bp.route('/modules/<int:module_id>/topics', methods=['POST'])
@admin_required
def create_topic(module_id):
    module = Module.query.get_or_404(module_id)
    data = request.get_json()
    if not data or not 'name' in data:
        return jsonify({'message': 'Missing topic name'}), 400

    topic = Topic(name=data['name'], content=data.get('content', ''), module_id=module.id)
    db.session.add(topic)
    db.session.commit()
    return jsonify({'message': 'Topic created successfully', 'id': topic.id}), 201

@bp.route('/topics/<int:id>', methods=['PUT'])
@admin_required
def update_topic(id):
    topic = Topic.query.get_or_404(id)
    data = request.get_json()
    if 'name' in data:
        topic.name = data['name']
    if 'content' in data:
        topic.content = data['content']
    db.session.commit()
    return jsonify({'message': 'Topic updated successfully'})

@bp.route('/topics/<int:id>', methods=['DELETE'])
@admin_required
def delete_topic(id):
    topic = Topic.query.get_or_404(id)
    db.session.delete(topic)
    db.session.commit()
    return jsonify({'message': 'Topic deleted successfully'})

# -- Resource Management --

@bp.route('/topics/<int:topic_id>/resources', methods=['POST'])
@admin_required
def upload_resource(topic_id):
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if file:
        filename = secure_filename(file.filename)
        # Ensure the upload folder exists
        os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Get metadata from form
        name = request.form.get('name', filename)
        resource_type = request.form.get('resource_type', 'file')

        new_resource = Resource(
            name=name,
            resource_type=resource_type,
            path_or_url=file_path,
            topic_id=topic_id
        )
        db.session.add(new_resource)
        db.session.commit()

        return jsonify({'message': 'Resource uploaded successfully', 'id': new_resource.id}), 201

    return jsonify({'message': 'File upload failed'}), 400

@bp.route('/resources/<int:id>', methods=['DELETE'])
@admin_required
def delete_resource(id):
    resource = Resource.query.get_or_404(id)

    # Delete the physical file
    try:
        if os.path.exists(resource.path_or_url):
            os.remove(resource.path_or_url)
    except Exception as e:
        # Log the error but proceed with DB deletion
        print(f"Error deleting file {resource.path_or_url}: {e}")

    db.session.delete(resource)
    db.session.commit()

    return jsonify({'message': 'Resource deleted successfully'})
