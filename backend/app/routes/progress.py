from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models import User, Topic

bp = Blueprint('progress', __name__)

@bp.route('/topics/<int:id>/complete', methods=['POST'])
@jwt_required()
def mark_topic_complete(id):
    username = get_jwt_identity().get('username')
    user = User.query.filter_by(username=username).first_or_404()
    topic = Topic.query.get_or_404(id)

    if topic in user.completed_topics:
        return jsonify({'message': 'Topic already marked as complete.'}), 200

    user.completed_topics.append(topic)
    db.session.commit()
    return jsonify({'message': f'Topic {id} marked as complete.'}), 201

@bp.route('/progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    username = get_jwt_identity().get('username')
    user = User.query.filter_by(username=username).first_or_404()

    completed_ids = [topic.id for topic in user.completed_topics]
    return jsonify({'completed_topic_ids': completed_ids})
