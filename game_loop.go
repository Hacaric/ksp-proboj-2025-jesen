package main

import (
	"encoding/json"
	"fmt"

	"github.com/trojsten/ksp-proboj/client"
)

func GameStateFor(m *Map, p *Player) string {
	data, err := json.Marshal(m)
	if err != nil {
		panic(err)
	}

	return string(data)
}

func GameTick(m *Map) {
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
		MovePlayerShips(m, player)
	}

	m.Tick()
}

func MovePlayerShips(m *Map, p *Player) {
	for _, ship := range m.Ships {
		if ship.PlayerID == p.ID {
			ship.Position = ship.Position.Add(ship.Vector)
		}
	}
}
