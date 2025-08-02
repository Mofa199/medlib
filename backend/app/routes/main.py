from flask import Blueprint, jsonify

bp = Blueprint('main', __name__)

@bp.route('/ping', methods=['GET'])
def ping():
    """
    A simple ping route to confirm the server is running.
    """
    return jsonify({'message': 'pong!'})
