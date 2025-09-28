package main

import (
	"math/rand"

	"github.com/aquilax/go-perlin"
	"github.com/trojsten/ksp-proboj/client"
)

type Map struct {
	Radius    float64              `json:"radius"`
	Ships     []*Ship              `json:"ships"`
	Asteroids []*Asteroid          `json:"asteroids"`
	Wormholes []*Wormhole          `json:"wormholes"`
	Players   []*Player            `json:"players"`
	runner    *client.Runner       `json:"-"`
	Round     int                  `json:"round"`
	perlin    *perlin.Perlin       `json:"-"`
	UsedShips map[int]map[int]bool `json:"-"` // playerID -> shipID -> hasBeenUsed
}

func NewMap() *Map {
	m := &Map{Radius: Radius}
	m.perlin = perlin.NewPerlin(2, 2, 3, rand.Int63())

	for range AsteroidCount {
		NewAsteroid(m)
	}

	for range WormholeCount {
		NewWormholes(m)
	}

	return m
}

func (m *Map) ShouldContinue() bool {
	return m.Round <= 1000
}

func (m *Map) Tick() {
	UpdateAsteroidPositions(m)
	m.Round++
}
