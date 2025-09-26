package main

import (
	"math"
	"math/rand"
)

type AsteroidType int

const (
	RockAsteroid AsteroidType = iota
	FuelAsteroid
)

type Asteroid struct {
	ID       int          `json:"id"`
	Position Position     `json:"position"`
	Type     AsteroidType `json:"type"`
	Size     float64      `json:"size"`
}

func NewAsteroid(m *Map) *Asteroid {
	a := &Asteroid{
		ID:       len(m.Asteroids),
		Position: RandomPosition(m),
		Type:     AsteroidType(rand.Intn(2)),
		Size:     RandomFloat(MinAsteroidSize, MaxAsteroidSize),
	}

	m.Asteroids = append(m.Asteroids, a)
	return a
}

func NewAsteroidFromShip(m *Map, ship *Ship, asteroidType AsteroidType) *Asteroid {
	var materialAmount float64
	if asteroidType == FuelAsteroid {
		materialAmount = ship.Fuel
	} else {
		materialAmount = float64(ship.Rock)
	}

	size := math.Sqrt(materialAmount / MaterialToSurfaceRatio / math.Pi)

	a := &Asteroid{
		ID:       len(m.Asteroids),
		Position: RandomOffsetPosition(ship.Position, AsteroidSpawnOffset),
		Type:     asteroidType,
		Size:     size,
	}

	m.Asteroids = append(m.Asteroids, a)
	return a
}

func UpdateAsteroidPositions(m *Map) {
	globalX := m.perlin.Noise2D(float64(m.Round)*PerlinNoiseScale, 0) * GlobalAsteroidMovementScale
	globalY := m.perlin.Noise2D(0, float64(m.Round)*PerlinNoiseScale) * GlobalAsteroidMovementScale
	globalSteering := Position{X: globalX, Y: globalY}

	for _, asteroid := range m.Asteroids {
		individualX := m.perlin.Noise2D(
			asteroid.Position.X*PerlinNoiseScale,
			asteroid.Position.Y*PerlinNoiseScale,
		) * IndividualAsteroidMovementScale

		individualY := m.perlin.Noise2D(
			asteroid.Position.X*PerlinNoiseScale+1000,
			asteroid.Position.Y*PerlinNoiseScale+1000,
		) * IndividualAsteroidMovementScale

		individualSteering := Position{X: individualX, Y: individualY}

		// Apply both steering vectors and update position
		totalMovement := globalSteering.Add(individualSteering)
		asteroid.Position = asteroid.Position.Add(totalMovement)
	}
}
