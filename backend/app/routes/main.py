from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models import Course, Module, Topic

bp = Blueprint('main', __name__)

@bp.route('/ping', methods=['GET'])
def ping():
    """
    A simple ping route to confirm the server is running.
    """
    return jsonify({'message': 'pong!'})

@bp.route('/courses/<int:id>/modules', methods=['GET'])
@jwt_required()
def get_course_modules(id):
    course = Course.query.get_or_404(id)
    modules = course.modules.all()
    return jsonify([{'id': m.id, 'name': m.name, 'description': m.description} for m in modules])

@bp.route('/modules/<int:id>/topics', methods=['GET'])
@jwt_required()
def get_module_topics(id):
    module = Module.query.get_or_404(id)
    topics = module.topics.all()
    return jsonify([{'id': t.id, 'name': t.name} for t in topics])

@bp.route('/topics/<int:id>', methods=['GET'])
@jwt_required()
def get_topic_details(id):
    topic = Topic.query.get_or_404(id)
    resources = topic.resources.all()
    return jsonify({
        'id': topic.id,
        'name': topic.name,
        'content': topic.content,
        'resources': [{'id': r.id, 'name': r.name, 'resource_type': r.resource_type, 'path_or_url': r.path_or_url} for r in resources]
    })
