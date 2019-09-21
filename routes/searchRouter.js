const express = require("express"),
router        = express.Router(),
config        = require("../config"),
request       = require("request")

tmdbApiKey = config.tmdbApiKey,
omdbApiKey = config.omdbApiKey;

router.get("/results", (req, res) => {
	let searchquery = req.query.searchquery;
	let type = req.query.type;
	let url = `http://www.omdbapi.com/?apikey=${omdbApiKey}&s=${searchquery}&type=${type}`;
	request(url, (error, response, body) => {
		if(!error && response.statusCode == 200){
			let movies = JSON.parse(body);
			res.render("results", {movies: movies});
		}
	});
});

router.get("/moviedetails/:clickedmovieimdbid", (req, res) => {
	let clickedmovieimdbid = req.params.clickedmovieimdbid;
	
	if(req.user) {
		let watchlist = req.user.watchlist;
		var foundInWatchlist = false;
		// console.log("watchlist", watchlist);
		for (let i=0; i<watchlist.length; i++){
			let imdbId = watchlist[i].imdbId;
			if(imdbId === clickedmovieimdbid) {
				foundInWatchlist = true;
				break;
			}
		}
		// console.log(foundInWatchlist); 
	}
	
	// Function to Convert Runtime from Minutes to Hours:Minutes
	function convertRuntime(a) {
		let hours = Math.trunc(a/60);
		let minutes = a % 60;
		let time;
		if(hours != 0 && minutes != 0) {
			time = hours + "h " + minutes + "min";
		} else if(hours == 0) {
			time = minutes + "min";
		} else if(minutes == 0) {
			time = hours + "h ";
		}
		return time;
	}
	
	let options = {
		url: `http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${clickedmovieimdbid}`,
		json: true
	}
	
	rp(options)
	.then((data) => {
		let clickedmovie = {};
		// console.log(data)
		clickedmovie = {
			title: data.Title,
			year: data.Year,
			rated: data.Rated,
			released: data.Released,
			genre: data.Genre,
			director: data.Director,
			writer: data.Writer,
			actors: data.Actors,
			plot: data.Plot,
			language: data.Language,
			country: data.Country,
			awards: data.Awards,
			poster: data.Poster,
			ratings: data.Ratings,
			metascore: data.Metascore,
			imdbrating: data.imdbRating,
			imdbvotes: data.imdbVotes,
			imdbid: data.imdbID,
			type: data.Type,
			dvd: data.DVD,
			website: data.Website,
		};
		
		let findTmdbIdUrl = `https://api.themoviedb.org/3/find/${clickedmovieimdbid}?api_key=${tmdbApiKey}&language=en-US&external_source=imdb_id`;
		request(findTmdbIdUrl, (err, resp, body) => {
			data = JSON.parse(body);
			let tmdbId;
			if(data.movie_results.length > 0)
			tmdbId = data.movie_results[0].id;
			else if(data.tv_results.length > 0)
			tmdbId = data.tv_results[0].id;
			// console.log(tmdbId);
			
			searchTrailerLinkUrl = `http://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=videos`;
			request(searchTrailerLinkUrl, (err, resp, body) => {
				full_data = JSON.parse(body);
				// console.log(full_data);
				let youtubeId = null;
				if(full_data.videos.results.length)
					youtubeId = full_data.videos.results[0].key;
				
				if(youtubeId)
					trailerlink = `https://www.youtube.com/watch?v=${youtubeId}`;
				else
					trailerlink = '';
				
				clickedmovie.production = full_data.production_companies;
				clickedmovie.boxoffice = full_data.revenue;
				clickedmovie.tagline = full_data.tagline;
				clickedmovie.status = full_data.status;
				clickedmovie.runtime = full_data.runtime;
				// console.log(youtubeId);
				res.render("moviedetails", {
					movie: clickedmovie, 
					trailerlink: youtubeId,
					display: convertRuntime,
					found: foundInWatchlist
				});
			});
		});	
	})
	.catch((err) => console.log(err));
});

module.exports = router;