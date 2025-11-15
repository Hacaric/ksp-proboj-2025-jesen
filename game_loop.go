package main

import (
	"encoding/json"
	"fmt"
	"math"

	"github.com/trojsten/ksp-proboj/client"
)

type GameState struct {
	Map      *Map `json:"map"`
	PlayerID int  `json:"player_id"`
}

type ObserverGameState struct {
	Map *Map `json:"map"`
}

func GameStateFor(m *Map, p *Player) string {
	state := GameState{
		Map:      m,
		PlayerID: p.ID,
	}
	data, err := json.Marshal(state)
	if err != nil {
		panic(err)
	}

	return string(data)
}

func StateForObserver(m *Map) string {
	data, err := json.Marshal(m)
	if err != nil {
		panic(err)
	}

	return string(data) + "\n"
}

func GameTick(m *Map) {
	m.UsedShips = make(map[int]map[int]bool)

	for _, player := range m.Players {
		if !player.Alive {
			continue
		}

		state := GameStateFor(m, player)
		resp := m.runner.ToPlayer(player.Name, fmt.Sprintf("round %v", m.Round), state)
		if resp != client.Ok {
			m.runner.Log(fmt.Sprintf("unexpected result of TO PLAYER operation for %v: %v", player.Name, resp))
			player.Alive = false
			continue
		}

		resp, data := m.runner.ReadPlayer(player.Name)
		if resp != client.Ok {
			m.runner.Log(fmt.Sprintf("unexpected result of READ PLAYER operation for %v: %v", player.Name, resp))
			player.Alive = false
			continue
		}

		var turns []TurnContainer
		err := json.Unmarshal([]byte(data), &turns)
		if err != nil {
			m.runner.Log(fmt.Sprintf("invalid JSON from player %v: %v", player.Name, err))
			continue
		}

		m.runner.Log(fmt.Sprintf("executing turns for %v", player.Name))
		ExecuteTurns(m, player, turns)
		TickPlayerShips(m, player)
	}

	// Check for ships that have reached 0 HP and mark them as destroyed
	CheckAndMarkDestroyedShips(m)

	m.Tick()

	observerState := StateForObserver(m)
	resp := m.runner.ToObserver(observerState)
	if resp != client.Ok {
		m.runner.Log(fmt.Sprintf("unexpected result of TO OBSERVER operation: %v", resp))
	}
}

func TickPlayerShips(m *Map, p *Player) {
	for _, ship := range m.Ships {
		if ship == nil || ship.PlayerID != p.ID || ship.IsDestroyed {
			continue
		}

		ship.Position = ship.Position.Add(ship.Vector)
		CheckShipWormholeTeleportation(m, ship)
		if ship.Type == DrillShip || ship.Type == SuckerShip {
			HandleShipMining(m, ship)
		}
		HandleShipConquering(m, ship)
	}
}

func HandleShipMining(m *Map, ship *Ship) {
	for _, asteroid := range m.Asteroids {
		if asteroid == nil {
			continue
		}

		distance := ship.Position.Distance(asteroid.Position)
		if distance <= ShipMiningDistance {
			MineAsteroid(m, ship, asteroid)
			break
		}
	}
}

func HandleShipConquering(m *Map, ship *Ship) {
	for _, asteroid := range m.Asteroids {
		if asteroid == nil {
			continue
		}

		distance := ship.Position.Distance(asteroid.Position)
		if distance <= ShipConqueringDistance {
			ConquerAsteroid(m, ship, asteroid)
			break
		}
	}
}

func ConquerAsteroid(m *Map, ship *Ship, asteroid *Asteroid) {
	totalSurface := asteroid.Size * asteroid.Size * math.Pi

	if asteroid.OwnerID == ship.PlayerID {
		asteroid.OwnedSurface = min(asteroid.OwnedSurface+ShipConqueringRate, totalSurface)
	} else {
		asteroid.OwnedSurface = max(asteroid.OwnedSurface-ShipConqueringRate, 0)

		if asteroid.OwnedSurface == 0 {
			asteroid.OwnerID = ship.PlayerID
		}
	}

	asteroid.OwnedSurface = min(asteroid.OwnedSurface, totalSurface)
}
