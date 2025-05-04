from flask import Blueprint, jsonify, Response
from web import moviedb
from flasktools.auth.oauth import auth_token_required
from flasktools.db import fetch_query, mutate_query

bp = Blueprint('show', __name__)


@bp.route('/', methods=['GET'])
@auth_token_required
def getlist(userid: int) -> Response:
	from web.asynchro import fetch_show_poster

	shows = fetch_query(
		"""
		SELECT
			id,
			moviedb_id,
			name,
			true AS following
		FROM tvshow
		WHERE follows_tvshow(%s, id)
		ORDER BY name ASC
		""",
		(userid,)
	)
	for s in shows:
		fetch_show_poster.delay(s['moviedb_id'])
		s['poster'] = moviedb.get_tvshow_static(s['moviedb_id'])
		del s['moviedb_id']

	return jsonify(shows)


@bp.route('/<int:showid>', methods=['POST'])
@auth_token_required
def follow(userid: int, showid: int) -> Response:
	mutate_query(
		"SELECT add_watcher_tvshow(%s, %s)",
		(userid, showid,)
	)
	return jsonify()


@bp.route('/<int:showid>', methods=['DELETE'])
@auth_token_required
def unfollow(userid: int, showid: int) -> Response:
	mutate_query(
		"SELECT remove_watcher_tvshow(%s, %s)",
		(userid, showid,)
	)
	return jsonify()
