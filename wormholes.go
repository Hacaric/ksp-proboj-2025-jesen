package main

import (
	"math"
)

type Wormhole struct {
	ID       int      `json:"id"`
	TargetID int      `json:"target_id"`
	Position Position `json:"position"`
}

func NewWormholes(m *Map) (*Wormhole, *Wormhole) {
	w1 := &Wormhole{
		ID:       len(m.Wormholes),
		Position: RandomPosition(m),
	}

	m.Wormholes = append(m.Wormholes, w1)

	w2 := &Wormhole{
		ID:       len(m.Wormholes),
		TargetID: w1.ID,
		Position: RandomPosition(m),
	}

	m.Wormholes = append(m.Wormholes, w2)
	w1.TargetID = w2.ID

	return w1, w2
}

func CheckShipWormholeTeleportation(m *Map, ship *Ship) {
	if ship == nil {
		return
	}

	for _, wormhole := range m.Wormholes {
		distance := ship.Position.Distance(wormhole.Position)
		if distance < WormholeRadius {
			targetWormhole := m.Wormholes[wormhole.TargetID]

			if ship.Vector.Size() > 0 {
				normalizedVector := ship.Vector.Normalize()
				teleportVector := normalizedVector.Scale(WormholeTeleportDistance)
				ship.Position = targetWormhole.Position.Add(teleportVector)
			} else {
				// If ship has no vector, teleport to a random position at minimum distance
				angle := RandomFloat(0, 2*math.Pi)
				teleportX := targetWormhole.Position.X + WormholeTeleportDistance*math.Cos(angle)
				teleportY := targetWormhole.Position.Y + WormholeTeleportDistance*math.Sin(angle)
				ship.Position = Position{teleportX, teleportY}
			}
			break
		}
	}
}
