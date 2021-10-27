# Standard library imports
from datetime import datetime

# Third party imports
from flask import (
	request, session, url_for, redirect,
	jsonify, Flask, Response,
	got_request_exception
)
import rollbar
import rollbar.contrib.flask

# Local imports
from web import moviedb, config
from web.auth import bp as auth_bp
from web.episode import bp as episode_bp
from web.show import bp as show_bp
from web.movie import bp as movie_bp
from flasktools import (
	handle_exception, params_to_dict, serve_static_file
)
from flasktools.auth import is_logged_in, login_required
from flasktools.db import disconnect_database, fetch_query


app = Flask(__name__)

app.secret_key = config.SECRETKEY

app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(episode_bp, url_prefix='/episode')
app.register_blueprint(show_bp, url_prefix='/show')
app.register_blueprint(movie_bp, url_prefix='/movie')

app.jinja_env.globals.update(is_logged_in=is_logged_in)
app.jinja_env.globals.update(static_file=serve_static_file)


@app.before_first_request
def init_rollbar():
	if not hasattr(config, 'TESTMODE'):
		env = 'production'
		if request.remote_addr == '127.0.0.1':
			env = 'development'
		rollbar.init(
			config.ROLLBAR_TOKEN,
			environment=env
		)

		# send exceptions from `app` to rollbar, using flask's signal system.
		got_request_exception.connect(rollbar.contrib.flask.report_exception, app)


@app.errorhandler(500)
def internal_error(e: Exception) -> Response:
	return handle_exception()


@app.teardown_appcontext
def teardown(e: Exception) -> Response:
	disconnect_database()


@app.route('/ping')
def ping() -> Response:
	return jsonify(ping='pong')


@app.route('/logout', methods=['GET'])
def logout() -> Response:
	session.pop('userid', None)
	return redirect(url_for('login'))


@app.route('/shows/search', methods=['GET'])
@login_required
def shows_search() -> Response:
	error = None
	result = []
	params = params_to_dict(request.args)
	search = params.get('search')
	if search:
		resp = moviedb.search_tvshows(search)
		for r in resp:
			year = None
			if r['first_air_date']:
				year = datetime.strptime(r['first_air_date'], '%Y-%m-%d').year
			result.append({
				'id': r['id'],
				'name': r['original_name'],
				'country': r['country'],
				'year': year
			})
	return jsonify(error=error, result=result)


@app.route('/movies/search', methods=['GET'])
@login_required
def movies_search() -> Response:
	error = None
	result = []
	params = params_to_dict(request.args)
	search = params.get('search')
	if search:
		resp = moviedb.search_movies(search)
		for r in resp:
			year = None
			if r['release_date']:
				year = datetime.strptime(r['release_date'], '%Y-%m-%d').year

			result.append({
				'id': r['id'],
				'name': r['title'],
				'releasedate': r['release_date'],
				'poster': r['poster_path'],
				'year': year
			})
	return jsonify(error=error, result=result)


@app.route('/shows/update', methods=['GET'])
@app.route('/shows/update/<int:tvshowid>', methods=['GET'])
def shows_update(tvshowid: int = None) -> Response:
	from web.asynchro import resync_tvshow

	error = None

	if tvshowid is not None:
		tvshows = fetch_query(
			"SELECT id, name, moviedb_id FROM tvshow WHERE id = %s",
			(tvshowid,)
		)
	else:
		# Only check shows with followers to save time & requests
		tvshows = fetch_query(
			"""
			SELECT
				id, name, moviedb_id
			FROM tvshow
			WHERE exists(
				SELECT * FROM watcher_tvshow WHERE tvshowid = tvshow.id
			) ORDER BY name ASC
			"""
		)

	for s in tvshows:
		resync_tvshow.delay(s)

	# with tvshowid parameter, is being called from page instead of cron
	# if tvshowid is not None:
	# 	flash('Updating episodes.', 'success')
	# 	return redirect(url_for('home'))

	return jsonify(error=error)


@app.route('/movies/update', methods=['GET'])
@app.route('/movies/update/<int:movieid>', methods=['GET'])
def movies_update(movieid: int = None) -> Response:
	from web.asynchro import resync_movie

	error = None

	qry = "SELECT *, releasedate::TEXT AS releasedate FROM movie"
	qargs = ()
	if movieid is not None:
		qry += " WHERE id = %s"
		qargs += (movieid,)
	else:
		# Only check movies with followers to save time & requests
		qry += """ WHERE exists(
					SELECT 1
					FROM watcher_movie
					WHERE movieid = movie.id
					AND watched = false
				)"""
	qry += " ORDER BY name ASC"

	movies = fetch_query(qry, qargs)

	for m in movies:
		resync_movie.delay(m)

	if movieid is not None:
		return redirect(url_for('movies'))

	return jsonify(error=error)
