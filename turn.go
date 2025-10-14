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
	RepairTurn
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
	case LoadTurn:
		var turn LoadTurnData
		err := json.Unmarshal(container.Data, &turn)
		return turn, err
	case SiphonTurn:
		var turn SiphonTurnData
		err := json.Unmarshal(container.Data, &turn)
		return turn, err
	case ShootTurn:
		var turn ShootTurnData
		err := json.Unmarshal(container.Data, &turn)
		return turn, err
	case RepairTurn:
		var turn RepairTurnData
		err := json.Unmarshal(container.Data, &turn)
		return turn, err
	}

	return nil, fmt.Errorf("unknown turn type: %v", container.Type)
}

func useShip(m *Map, p *Player, shipID int) error {
	if m.UsedShips[p.ID] == nil {
		m.UsedShips[p.ID] = make(map[int]bool)
	}

	if m.UsedShips[p.ID][shipID] {
		return fmt.Errorf("ship %v has already been used by player %v this round", shipID, p.ID)
	}

	m.UsedShips[p.ID][shipID] = true
	return nil
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
	if ship == nil {
		return fmt.Errorf("ship %v has been destroyed", t.ShipID)
	}
	if ship.PlayerID != p.ID {
		return fmt.Errorf("ship %v does not belong to player %v", t.ShipID, p.ID)
	}

	err := useShip(m, p, t.ShipID)
	if err != nil {
		return err
	}

	if t.Vector.Size() > ShipMovementMaxSize {
		scale := ShipMovementMaxSize / t.Vector.Size()
		t.Vector.X *= scale
		t.Vector.Y *= scale
	}

	fuelCost := ShipMovementPrice(t.Vector, ship.Type)

	// Mothership uses player fuel, other ships use their own fuel
	if ship.Type == MotherShip {
		if p.FuelAmount < int(fuelCost) {
			return fmt.Errorf("insufficient fuel for mothership: needed %v, has %v", fuelCost, p.FuelAmount)
		}
		p.FuelAmount -= int(fuelCost)
	} else {
		if ship.Fuel < fuelCost {
			return fmt.Errorf("insufficient fuel for ship: needed %v, has %v", fuelCost, ship.Fuel)
		}
		ship.Fuel -= fuelCost
	}

	ship.Vector = ship.Vector.Add(t.Vector)

	return nil
}

type LoadTurnData struct {
	SourceID      int `json:"source_id"`
	DestinationID int `json:"destination_id"`
	Amount        int `json:"amount"`
}

func (t LoadTurnData) Execute(m *Map, p *Player) error {
	if t.SourceID < 0 || t.SourceID >= len(m.Ships) {
		return fmt.Errorf("invalid source ship id: %v", t.SourceID)
	}
	if t.DestinationID < 0 || t.DestinationID >= len(m.Ships) {
		return fmt.Errorf("invalid destination ship id: %v", t.DestinationID)
	}
	if t.Amount <= 0 {
		return fmt.Errorf("amount must be positive: %v", t.Amount)
	}

	source := m.Ships[t.SourceID]
	if source == nil {
		return fmt.Errorf("source ship %v has been destroyed", t.SourceID)
	}
	destination := m.Ships[t.DestinationID]
	if destination == nil {
		return fmt.Errorf("destination ship %v has been destroyed", t.DestinationID)
	}

	if source.PlayerID != p.ID {
		return fmt.Errorf("source ship %v does not belong to player %v", t.SourceID, p.ID)
	}
	if destination.PlayerID != p.ID {
		return fmt.Errorf("destination ship %v does not belong to player %v", t.DestinationID, p.ID)
	}

	err := useShip(m, p, t.SourceID)
	if err != nil {
		return err
	}

	distance := source.Position.Distance(destination.Position)
	if distance > ShipTransferDistance {
		return fmt.Errorf("ships too far apart: %v > %v", distance, ShipTransferDistance)
	}

	if source.Rock < t.Amount {
		return fmt.Errorf("insufficient rocks in source ship: needed %v, has %v", t.Amount, source.Rock)
	}

	source.Rock -= t.Amount
	destination.Rock += t.Amount

	return nil
}

type SiphonTurnData struct {
	SourceID      int `json:"source_id"`
	DestinationID int `json:"destination_id"`
	Amount        int `json:"amount"`
}

func (t SiphonTurnData) Execute(m *Map, p *Player) error {
	if t.SourceID < 0 || t.SourceID >= len(m.Ships) {
		return fmt.Errorf("invalid source ship id: %v", t.SourceID)
	}
	if t.DestinationID < 0 || t.DestinationID >= len(m.Ships) {
		return fmt.Errorf("invalid destination ship id: %v", t.DestinationID)
	}
	if t.Amount <= 0 {
		return fmt.Errorf("amount must be positive: %v", t.Amount)
	}
	err := useShip(m, p, t.SourceID)
	if err != nil {
		return err
	}

	source := m.Ships[t.SourceID]
	if source == nil {
		return fmt.Errorf("source ship %v has been destroyed", t.SourceID)
	}
	destination := m.Ships[t.DestinationID]
	if destination == nil {
		return fmt.Errorf("destination ship %v has been destroyed", t.DestinationID)
	}

	if source.PlayerID != p.ID {
		return fmt.Errorf("source ship %v does not belong to player %v", t.SourceID, p.ID)
	}
	if destination.PlayerID != p.ID {
		return fmt.Errorf("destination ship %v does not belong to player %v", t.DestinationID, p.ID)
	}

	distance := source.Position.Distance(destination.Position)
	if distance > ShipTransferDistance {
		return fmt.Errorf("ships too far apart: %v > %v", distance, ShipTransferDistance)
	}

	if int(source.Fuel) < t.Amount {
		return fmt.Errorf("insufficient fuel in source ship: needed %v, has %v", t.Amount, int(source.Fuel))
	}

	source.Fuel -= float64(t.Amount)
	destination.Fuel += float64(t.Amount)

	return nil
}

type ShootTurnData struct {
	SourceID      int `json:"source_id"`
	DestinationID int `json:"destination_id"`
}

func (t ShootTurnData) Execute(m *Map, p *Player) error {
	if t.SourceID < 0 || t.SourceID >= len(m.Ships) {
		return fmt.Errorf("invalid source ship id: %v", t.SourceID)
	}
	if t.DestinationID < 0 || t.DestinationID >= len(m.Ships) {
		return fmt.Errorf("invalid destination ship id: %v", t.DestinationID)
	}
	err := useShip(m, p, t.SourceID)
	if err != nil {
		return err
	}

	source := m.Ships[t.SourceID]
	if source == nil {
		return fmt.Errorf("source ship %v has been destroyed", t.SourceID)
	}
	destination := m.Ships[t.DestinationID]
	if destination == nil {
		return fmt.Errorf("destination ship %v has been destroyed", t.DestinationID)
	}

	if source.PlayerID != p.ID {
		return fmt.Errorf("source ship %v does not belong to player %v", t.SourceID, p.ID)
	}

	if source.Type != BattleShip {
		return fmt.Errorf("source ship %v is not a BattleShip", t.SourceID)
	}

	if destination.Type == MotherShip {
		return fmt.Errorf("mothership is invincible")
	}

	distance := source.Position.Distance(destination.Position)
	if distance > ShipShootDistance {
		return fmt.Errorf("ships too far apart for shooting: %v > %v", distance, ShipShootDistance)
	}

	destinationPlayer := m.Players[destination.PlayerID]
	distanceToMothership := destination.Position.Distance(destinationPlayer.MotherShip.Position)
	if distanceToMothership <= ShipRepairDistance {
		return fmt.Errorf("destination ship is protected near its mothership: %v <= %v", distanceToMothership, ShipRepairDistance)
	}

	destination.Health -= ShipShootDamage
	if destination.Health < 0 {
		NewAsteroidFromShip(m, destination, FuelAsteroid)
		NewAsteroidFromShip(m, destination, RockAsteroid)
		m.Ships[destination.ID] = nil
	}

	return nil
}

type RepairTurnData struct {
	ShipID int `json:"ship_id"`
}

func (t RepairTurnData) Execute(m *Map, p *Player) error {
	if t.ShipID < 0 || t.ShipID >= len(m.Ships) {
		return fmt.Errorf("invalid ship id: %v", t.ShipID)
	}

	ship := m.Ships[t.ShipID]
	if ship == nil {
		return fmt.Errorf("ship %v has been destroyed", t.ShipID)
	}
	if ship.PlayerID != p.ID {
		return fmt.Errorf("ship %v does not belong to player %v", t.ShipID, p.ID)
	}
	err := useShip(m, p, t.ShipID)
	if err != nil {
		return err
	}

	distance := ship.Position.Distance(p.MotherShip.Position)
	if distance > ShipRepairDistance {
		return fmt.Errorf("ship too far from mothership for repair: %v > %v", distance, ShipRepairDistance)
	}

	// Check if player has enough rock for repair
	if p.RockAmount < ShipRepairRockCost {
		return fmt.Errorf("insufficient rock for repair: needed %v, has %v", ShipRepairRockCost, p.RockAmount)
	}

	// Deduct rock cost
	p.RockAmount -= ShipRepairRockCost

	ship.Health += ShipRepairAmount
	if ship.Health > ShipMaxHealth {
		ship.Health = ShipMaxHealth
	}

	return nil
}
