const express = require('express');

const router = express.Router();

const destinations = require('../data/destinations.json');

router.get('/', (req, res) => {
	console.log('✅ Destinations API called - returning', destinations.length, 'destinations');
	res.json({
		success: true,
		count: destinations.length,
		destinations,
	});
});

router.get('/trending', (req, res) => {
	const trendingDestinations = destinations
		.filter((destination) => destination.trending)
		.map((destination) => ({
			...destination,
			tripCount: destination.tripCount ?? 0,
			latestSeason: destination.latestSeason ?? destination.bestSeason,
			avgBudget: destination.avgBudget ?? null,
		}));
	console.log('✅ Trending destinations API called - returning', trendingDestinations.length, 'destinations');
	res.json({
		success: true,
		count: trendingDestinations.length,
		destinations: trendingDestinations,
	});
});

module.exports = router;
