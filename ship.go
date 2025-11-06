package main

import "fmt"

type ShipType int

const (
	MotherShip ShipType = iota
	SuckerShip
	DrillShip
	TankerShip
	TruckShip
	BattleShip
)

type Ship struct {
	ID         int      `json:"id"`
	PlayerID   int      `json:"player"`
	Position   Position `json:"position"`
	Vector     Position `json:"vector"`
	Health     int      `json:"health"`
	Fuel       float64  `json:"fuel"`
	Type       ShipType `json:"type"`
	Rock       int      `json:"rock"`
	IsDestroyed bool    `json:"is_destroyed"`
}

func NewShip(m *Map, p *Player, shipType ShipType) *Ship {
	s := &Ship{
		ID:         len(m.Ships),
		PlayerID:   p.ID,
		Position:   p.MotherShip.Position,
		Health:     ShipMaxHealth,
		Fuel:       ShipStartFuel,
		Type:       shipType,
		IsDestroyed: false,
	}

	m.Ships = append(m.Ships, s)
	return s
}

func DestroyShip(m *Map, ship *Ship) {
	if ship == nil || ship.IsDestroyed {
		return
	}

	ship.IsDestroyed = true
	ship.Health = 0

	// Create asteroids from the ship's remains
	NewAsteroidFromShip(m, ship, FuelAsteroid)
	NewAsteroidFromShip(m, ship, RockAsteroid)
}

func CheckAndMarkDestroyedShips(m *Map) {
	for _, ship := range m.Ships {
		if ship != nil && !ship.IsDestroyed && ship.Health <= 0 {
			DestroyShip(m, ship)
		}
	}
}

func ValidateShipOperable(ship *Ship) error {
	if ship == nil {
		return fmt.Errorf("ship does not exist")
	}
	if ship.IsDestroyed {
		return fmt.Errorf("ship is destroyed")
	}
	return nil
}
