package main

import (
	"math"
	"math/rand"
)

const (
	Radius                          = 15000                   // Game map radius
	MaxAsteroidSize                 = 50                      // Maximum size of generated asteroids
	MinAsteroidSize                 = MaxAsteroidSize / 7 * 5 // Minimum size of generated asteroids
	AsteroidCount                   = 500                     // Number of generated asteroids in the game
	WormholeCount                   = 25                      // Number of generated wormhole pairs in the game
	ShipMaxHealth                   = 100                     // Maximum health points for ships
	ShipStartFuel                   = 100                     // Starting fuel for new ships
	PlayerStartFuel                 = 1000                    // Starting fuel for players
	PlayerStartRock                 = 1000                    // Starting rock resources for players
	BaseShipMovementFree            = 1.0                     // Free movement distance before fuel cost
	BaseShipMovementMultiplier      = 1.0                     // Fuel cost multiplier for movement delta beyond free range
	ShipMovementMaxSize             = 10000                   // Maximum movement delta per turn - larger movements are scaled down
	ShipTransferDistance            = 20                      // Maximum distance for resource transfer between ships
	ShipShootDistance               = 500                     // Maximum shooting range for ships
	ShipShootDamage                 = 25                      // Damage dealt by ship weapons
	ShipRepairDistance              = 50                      // Maximum distance for ship repair operations
	ShipRepairAmount                = 30                      // Health points restored by repair
	ShipRepairRockCost              = 15                      // Rock cost per repair operation
	MaterialToSurfaceRatio          = 0.1                     // Ratio of material to surface area for asteroids
	AsteroidSpawnOffset             = 40.0                    // Offset distance for asteroid spawning after ship death
	GlobalAsteroidMovementScale     = 2.0                     // Global scale factor for asteroid movement
	IndividualAsteroidMovementScale = 1.0                     // Individual asteroid movement scale factor
	PerlinNoiseScale                = 0.01                    // Scale factor for Perlin noise generation
	WormholeRadius                  = 5                       // Radius within which ships get teleported by wormholes
	WormholeTeleportDistance        = WormholeRadius * 2      // Minimum distance from target wormhole (2x radius) to prevent teleport loops
	ShipMiningDistance              = MaxAsteroidSize         // Maximum distance for mining operations
	ShipMiningAmount                = 10                      // Units mined per tick
	ShipConqueringDistance          = MaxAsteroidSize         // Maximum distance for conquering operations
	ShipConqueringRate              = 10                      // Surface units conquered/lost per tick
)

func ShipRockPrice(t ShipType) int {
	return 250
}

func ShipMovementFree(t ShipType) float64 {
	switch t {
	case TruckShip:
		fallthrough
	case TankerShip:
		return BaseShipMovementFree * 3
	default:
		return BaseShipMovementFree
	}
}

func ShipMovementMultiplier(t ShipType) float64 {
	switch t {
	case TruckShip:
		fallthrough
	case TankerShip:
		return BaseShipMovementMultiplier / 3.0
	default:
		return BaseShipMovementMultiplier
	}
}

func ShipMovementPrice(vector Position, t ShipType) float64 {
	return max(0.0, (vector.Size()-ShipMovementFree(t))*ShipMovementMultiplier(t))
}

func RandomFloat(min, max float64) float64 {
	return rand.Float64()*(max-min) + min
}

func AsteroidScore(a Asteroid) float64 {
	asteroidSurface := a.Size * a.Size * math.Pi
	ownedSurface := a.OwnedSurface

	surfaceFactor := math.Pow(1.5, (ownedSurface/asteroidSurface)/9) * (a.Size / MaxAsteroidSize)

	return 100 + surfaceFactor
}
