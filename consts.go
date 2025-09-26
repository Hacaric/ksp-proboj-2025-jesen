package main

import "math/rand"

const (
	Radius                 = 15000
	MaxAsteroidSize        = 50
	MinAsteroidSize        = MaxAsteroidSize / 2
	AsteroidCount          = 500
	WormholeCount          = 25
	ShipMaxHealth          = 100
	ShipStartFuel          = 100
	PlayerStartFuel        = 1000
	PlayerStartRock        = 1000
	ShipMovementFree       = 1.0
	ShipMovementMultiplier = 1.0
	ShipMovementMaxSize    = 10000
)

func ShipRockPrice(t ShipType) int {
	return 100
}

func ShipMovementPrice(vector Position, t ShipType) float64 {
	return max(0.0, (vector.Size()-ShipMovementFree)*ShipMovementMultiplier)
}

func RandomFloat(min, max float64) float64 {
	return rand.Float64()*(max-min) + min
}
