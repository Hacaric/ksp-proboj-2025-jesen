package main

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
	ID       int      `json:"id"`
	PlayerID int      `json:"player"`
	Position Position `json:"position"`
	Vector   Position `json:"vector"`
	Health   int      `json:"health"`
	Fuel     float64  `json:"fuel"`
	Type     ShipType `json:"type"`
	Rock     int      `json:"rock"`
}

func NewShip(m *Map, p *Player, shipType ShipType) *Ship {
	s := &Ship{
		ID:       len(m.Ships),
		PlayerID: p.ID,
		Position: p.MotherShip.Position,
		Health:   ShipMaxHealth,
		Fuel:     ShipStartFuel,
		Type:     shipType,
	}

	m.Ships = append(m.Ships, s)
	return s
}
