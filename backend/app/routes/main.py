from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from backend.app.models import Course, Module, Topic, NewsArticle, Event, Resource
from sqlalchemy import or_

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

@bp.route('/news', methods=['GET'])
def get_news():
    articles = NewsArticle.query.order_by(NewsArticle.created_at.desc()).all()
    return jsonify([{'id': a.id, 'title': a.title, 'content': a.content, 'created_at': a.created_at.isoformat()} for a in articles])

@bp.route('/events', methods=['GET'])
def get_events():
    events = Event.query.order_by(Event.event_date.asc()).all()
    return jsonify([{'id': e.id, 'title': e.title, 'description': e.description, 'event_date': e.event_date.isoformat()} for e in events])

@bp.route('/search', methods=['GET'])
@jwt_required()
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])

    search_term = f"%{query}%"

    topics = Topic.query.filter(or_(Topic.name.ilike(search_term), Topic.content.ilike(search_term))).all()
    resources = Resource.query.filter(Resource.name.ilike(search_term)).all()

    results = []
    for topic in topics:
        results.append({'id': topic.id, 'name': topic.name, 'type': 'topic', 'url': f'#/topics/{topic.id}'})

    for resource in resources:
        # Avoid duplicating topics if a resource and its parent topic are both found
        if not any(r['id'] == resource.topic_id and r['type'] == 'topic' for r in results):
             results.append({'id': resource.id, 'name': resource.name, 'type': 'resource', 'url': f'#/topics/{resource.topic_id}'})

    return jsonify(results)
