/**
 * Locations Routes
 * Handle collection point lookup and nearby search
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { CollectionPoint } = require('../models');

/**
 * GET /api/locations
 * Get all active collection points
 */
router.get('/', async (req, res) => {
  try {
    const { city, accepts } = req.query;

    const where = { active: true };

    // Filter by city if provided
    if (city) {
      where.city = { [Op.like]: `%${city}%` };
    }

    const points = await CollectionPoint.findAll({
      where,
      order: [['name', 'ASC']]
    });

    // Filter by accepted materials if provided
    let filteredPoints = points;
    if (accepts) {
      const acceptedTypes = accepts.split(',');
      filteredPoints = points.filter(point => {
        const pointAccepts = point.accepts || [];
        return acceptedTypes.some(type => pointAccepts.includes(type));
      });
    }

    res.json({
      success: true,
      locations: filteredPoints.map(formatCollectionPoint),
      total: filteredPoints.length
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection points'
    });
  }
});

/**
 * GET /api/locations/nearby
 * Get collection points near a location
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Get all active points
    const points = await CollectionPoint.findAll({
      where: { active: true }
    });

    // Calculate distance and filter by radius
    const nearbyPoints = points
      .map(point => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(point.latitude),
          parseFloat(point.longitude)
        );
        return {
          ...formatCollectionPoint(point),
          distance: parseFloat(distance.toFixed(2))
        };
      })
      .filter(point => point.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      locations: nearbyPoints,
      total: nearbyPoints.length,
      searchParams: {
        latitude,
        longitude,
        radiusKm
      }
    });
  } catch (error) {
    console.error('Error fetching nearby locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby collection points'
    });
  }
});

/**
 * GET /api/locations/:id
 * Get a specific collection point
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const point = await CollectionPoint.findByPk(id);

    if (!point) {
      return res.status(404).json({
        success: false,
        error: 'Collection point not found'
      });
    }

    res.json({
      success: true,
      location: formatCollectionPoint(point)
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection point'
    });
  }
});

/**
 * Helper: Format collection point for API response
 */
function formatCollectionPoint(point) {
  return {
    id: point.id,
    name: point.name,
    address: point.address,
    city: point.city,
    latitude: point.latitude ? parseFloat(point.latitude) : null,
    longitude: point.longitude ? parseFloat(point.longitude) : null,
    accepts: point.accepts || [],
    hours: point.hours,
    phone: point.phone,
    active: point.active
  };
}

/**
 * Helper: Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = router;
