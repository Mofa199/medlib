from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models import User, Topic, Badge, Module

bp = Blueprint('progress', __name__)

def check_and_award_badge(user, module):
    """Checks if a user has completed all topics in a module and awards a badge."""
    module_topics = set(t.id for t in module.topics)
    completed_topics = set(t.id for t in user.completed_topics)

    if module_topics.issubset(completed_topics):
        badge_name = f"Module Master - {module.name}"
        badge = Badge.query.filter_by(name=badge_name).first()
        if not badge:
            badge = Badge(name=badge_name, description=f"Completed all topics in the {module.name} module.", icon="🏆")
            db.session.add(badge)

        if badge not in user.badges:
            user.badges.append(badge)
            return True
    return False

@bp.route('/topics/<int:id>/complete', methods=['POST'])
@jwt_required()
def mark_topic_complete(id):
    username = get_jwt_identity().get('username')
    user = User.query.filter_by(username=username).first_or_404()
    topic = Topic.query.get_or_404(id)

    if topic in user.completed_topics:
        return jsonify({'message': 'Topic already marked as complete.'}), 200

    user.completed_topics.append(topic)

    badge_awarded = check_and_award_badge(user, topic.module)

    db.session.commit()

    message = f'Topic {id} marked as complete.'
    if badge_awarded:
        message += f' Congratulations! You earned the "{badge_awarded.name}" badge!'

    return jsonify({'message': message}), 201

@bp.route('/progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    username = get_jwt_identity().get('username')
    user = User.query.filter_by(username=username).first_or_404()

    completed_ids = [topic.id for topic in user.completed_topics]
    return jsonify({'completed_topic_ids': completed_ids})

@bp.route('/badges', methods=['GET'])
@jwt_required()
def get_user_badges():
    username = get_jwt_identity().get('username')
    user = User.query.filter_by(username=username).first_or_404()

    badges = user.badges.all()
    return jsonify([{'name': b.name, 'description': b.description, 'icon': b.icon} for b in badges])
