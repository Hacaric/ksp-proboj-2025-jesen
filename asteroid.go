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
	ID           int          `json:"id"`
	Position     Position     `json:"position"`
	Type         AsteroidType `json:"type"`
	Size         float64      `json:"size"`
	OwnerID      int          `json:"owner_id"`
	OwnedSurface float64      `json:"surface"`
}

func NewAsteroid(m *Map) *Asteroid {
	a := &Asteroid{
		ID:           len(m.Asteroids),
		Position:     RandomPosition(m),
		Type:         AsteroidType(rand.Intn(2)),
		Size:         RandomFloat(MinAsteroidSize, MaxAsteroidSize),
		OwnerID:      -1,
		OwnedSurface: 0,
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
		ID:           len(m.Asteroids),
		Position:     RandomOffsetPosition(ship.Position, AsteroidSpawnOffset),
		Type:         asteroidType,
		Size:         size,
		OwnerID:      ship.PlayerID,
		OwnedSurface: size * size * math.Pi,
	}

	m.Asteroids = append(m.Asteroids, a)
	return a
}

func UpdateAsteroidPositions(m *Map) {
	globalX := m.perlin.Noise2D(float64(m.Round)*PerlinNoiseScale, 0) * GlobalAsteroidMovementScale
	globalY := m.perlin.Noise2D(0, float64(m.Round)*PerlinNoiseScale) * GlobalAsteroidMovementScale
	globalSteering := Position{X: globalX, Y: globalY}

	for _, asteroid := range m.Asteroids {
		if asteroid == nil {
			continue
		}

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

func MineAsteroid(m *Map, ship *Ship, asteroid *Asteroid) {
	materialToRemove := float64(ShipMiningAmount)
	currentMaterial := asteroid.Size * asteroid.Size * math.Pi * MaterialToSurfaceRatio

	if materialToRemove > currentMaterial {
		materialToRemove = currentMaterial
	}

	if asteroid.Type == FuelAsteroid {
		ship.Fuel += materialToRemove
	} else {
		ship.Rock += int(materialToRemove)
	}

	newMaterial := currentMaterial - materialToRemove
	if newMaterial <= 0 {
		m.Asteroids[asteroid.ID] = nil
	} else {
		// Store the original surface area before updating asteroid.Size
		currentSurfaceArea := asteroid.Size * asteroid.Size * math.Pi

		// Update asteroid size based on remaining material
		asteroid.Size = math.Sqrt(newMaterial / MaterialToSurfaceRatio / math.Pi)

		if asteroid.OwnedSurface > 0 {
			// Calculate the ratio of owned surface to total surface area
			surfaceRatio := asteroid.OwnedSurface / currentSurfaceArea

			// Calculate new surface area and apply the same ownership ratio
			newSurfaceArea := newMaterial / MaterialToSurfaceRatio
			asteroid.OwnedSurface = newSurfaceArea * surfaceRatio
		}
	}
}
