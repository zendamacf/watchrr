from datetime import datetime
from flask import Blueprint, jsonify, Response
from web import moviedb
from flasktools.auth.oauth import auth_token_required
from flasktools.db import fetch_query, mutate_query

bp = Blueprint('movie', __name__)


@bp.route('/', methods=['GET'])
@auth_token_required
def getlist(userid: int) -> Response:
	from web.asynchro import fetch_movie_poster

	movies = fetch_query(
		"""
		SELECT
			id,
			name,
			moviedb_id,
			releasedate,
			true AS following
		FROM movie m
		WHERE follows_movie(%s, id)
		ORDER BY releasedate NULLS LAST, name
		""",
		(userid,)
	)
	for m in movies:
		if m['releasedate'] is not None:
			m['in_past'] = m['releasedate'] < datetime.today().date()
			m['releasedate'] = datetime.strftime(m['releasedate'], '%A %d/%m/%Y')
		else:
			m['in_past'] = False

		fetch_movie_poster.delay(m['moviedb_id'])
		m['poster'] = moviedb.get_movie_static(m['moviedb_id'])
		del m['moviedb_id']

	return jsonify(movies)


@bp.route('/<int:movieid>', methods=['POST'])
@auth_token_required
def follow(userid: int, movieid: int) -> Response:
	mutate_query(
		"SELECT add_watcher_movie(%s, %s)",
		(userid, movieid,)
	)
	return jsonify()


@bp.route('/<int:movieid>', methods=['DELETE'])
@auth_token_required
def unfollow(userid: int, movieid: int) -> Response:
	mutate_query(
		"SELECT remove_watcher_movie(%s, %s)",
		(userid, movieid,)
	)
	return jsonify()


@bp.route('/<int:movieid>', methods=['PUT'])
@auth_token_required
def mark_watched(userid: int, movieid: int) -> Response:
	mutate_query(
		"SELECT mark_movie_watched(%s, %s)",
		(userid, movieid,)
	)
	return jsonify()
