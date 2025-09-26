package main

import (
	"encoding/json"
	"fmt"
)

type TurnType int

const (
	BuyTurn TurnType = iota
	MoveTurn
	LoadTurn
	SiphonTurn
	ShootTurn
)

type TurnContainer struct {
	Type TurnType        `json:"type"`
	Data json.RawMessage `json:"data"`
}

func ParseTurnData(container TurnContainer) (Turn, error) {
	switch container.Type {
	case BuyTurn:
		var turn BuyTurnData
		err := json.Unmarshal(container.Data, &turn)
		return turn, err
	case MoveTurn:
		var turn MoveTurnData
		err := json.Unmarshal(container.Data, &turn)
		return turn, err
	}

	return nil, fmt.Errorf("unknown turn type: %v", container.Type)
}

func ExecuteTurns(m *Map, p *Player, turns []TurnContainer) {
	for _, container := range turns {
		turn, err := ParseTurnData(container)
		if err != nil {
			m.runner.Log(fmt.Sprintf("could not parse turn '%v': %v", container, err))
			continue
		}

		err = turn.Execute(m, p)
		if err != nil {
			m.runner.Log(fmt.Sprintf("error while executing turn '%v': %v", container, err))
		}
	}
}

type Turn interface {
	Execute(*Map, *Player) error
}

type BuyTurnData struct {
	Type ShipType
}

func (t BuyTurnData) Execute(m *Map, p *Player) error {
	if t.Type <= MotherShip || t.Type > BattleShip {
		return fmt.Errorf("invalid ship type: %v", t.Type)
	}

	price := ShipRockPrice(t.Type)
	if p.RockAmount < price {
		return fmt.Errorf("not enough rocks in mothership")
	}

	p.RockAmount -= price
	NewShip(m, p, t.Type)
	return nil
}

type MoveTurnData struct {
	ShipID int      `json:"ship_id"`
	Vector Position `json:"vector"`
}

func (t MoveTurnData) Execute(m *Map, p *Player) error {
	if t.ShipID < 0 || t.ShipID >= len(m.Ships) {
		return fmt.Errorf("invalid ship id: %v", t.ShipID)
	}

	ship := m.Ships[t.ShipID]
	if ship.PlayerID != p.ID {
		return fmt.Errorf("ship %v does not belong to player %v", t.ShipID, p.ID)
	}

	if t.Vector.Size() > ShipMovementMaxSize {
		scale := ShipMovementMaxSize / t.Vector.Size()
		t.Vector.X *= scale
		t.Vector.Y *= scale
	}

	fuelCost := ShipMovementPrice(t.Vector, ship.Type)
	if ship.Fuel < fuelCost {
		return fmt.Errorf("insufficient fuel for ship: needed %v, has %v", fuelCost, ship.Fuel)
	}

	ship.Vector = ship.Vector.Add(t.Vector)
	ship.Fuel -= fuelCost

	return nil
}
