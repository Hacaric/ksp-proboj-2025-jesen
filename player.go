package main

type Player struct {
	ID         int     `json:"id"`
	Name       string  `json:"name"`
	Color      string  `json:"color"`
	MotherShip *Ship   `json:"mothership"`
	Alive      bool    `json:"alive"`
	Score      float64 `json:"score"`
}

func NewPlayer(m *Map, name string) *Player {
	p := &Player{
		ID:    len(m.Players),
		Name:  name,
		Color: "white",
		Alive: true,
	}

	s := &Ship{
		ID:       len(m.Ships),
		PlayerID: p.ID,
		Position: RandomPosition(m),
		Type:     MotherShip,
		Rock:     PlayerStartRock,
		Fuel:     PlayerStartFuel,
	}
	p.MotherShip = s

	m.Ships = append(m.Ships, s)
	m.Players = append(m.Players, p)
	return p
}
