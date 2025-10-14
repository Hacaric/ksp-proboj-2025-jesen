# KSP Proboj 2025 Jesen - Game Rules

## Overview

This is a turn-based space strategy game where players control fleets of ships to mine resources, conquer asteroids, and battle opponents. The game takes place on a circular map with moving asteroids and wormholes. Players write AI bots to control their ships and compete for dominance.

## Game Setup

### Map

- **Circular map** with radius of 15,000 units
- **500 asteroids** randomly distributed
- **25 wormhole pairs** (50 total wormholes) for teleportation
- Game lasts for **maximum 1000 rounds**

### Player Starting Resources

- **Mothership**: 1 per player, starts at random position
- **Rock**: 1000 units
- **Fuel**: 1000 units
- **Ship Health**: 100 HP for all ships

## Ship Types

| Ship Type | Enum Value | Cost | Special Abilities | Description |
|-----------|------------|------|-------------------|-------------|
| **MotherShip** | `ShipType.MOTHER_SHIP` (0) | - | Invincible, uses player fuel | Base ship, cannot be destroyed |
| **SuckerShip** | `ShipType.SUCKER_SHIP` (1) | 100 rock | Auto-mines fuel asteroids | Extracts fuel when near fuel asteroids |
| **DrillShip** | `ShipType.DRILL_SHIP` (2) | 100 rock | Auto-mines rock asteroids | Extracts rock when near rock asteroids |
| **TankerShip** | `ShipType.TANKER_SHIP` (3) | 100 rock | - | Standard ship for fuel transport |
| **TruckShip** | `ShipType.TRUCK_SHIP` (4) | 100 rock | - | Standard ship for rock transport |
| **BattleShip** | `ShipType.BATTLE_SHIP` (5) | 100 rock | Can shoot other ships | Combat ship with weapon system |

## Asteroids

### Types

- **Rock Asteroids** (`AsteroidType.ROCK_ASTEROID` = 0): Contain rock material
- **Fuel Asteroids** (`AsteroidType.FUEL_ASTEROID` = 1): Contain fuel material

### Properties

- **Size**: 25-50 units radius (randomly generated)
- **Movement**: Asteroids move each round using Perlin noise
- **Ownership**: Can be conquered by players
- **Mining**: Depleted when fully mined

### Conquest System

- Ships within 15 units can conquer asteroids
- **Conquest Rate**: 2 surface units per round
- **Total Surface**: π × radius²
- Conquered asteroids show player ownership

## Game Mechanics

### Movement

- **Free Movement**: First 1.0 unit costs no fuel
- **Fuel Cost**: `(distance - 1.0) × 1.0` for additional distance
- **Max Movement**: 10,000 units per turn (larger movements are scaled down)
- **Mothership**: Uses player's fuel reserves
- **Other Ships**: Use their own fuel

### Mining

- **Mining Distance**: 10 units from asteroid
- **Mining Rate**: 5 units per round
- **Auto-mining**: SuckerShip and DrillShip mine automatically when in range

### Resource Transfer

- **Transfer Distance**: 20 units between ships
- **Load**: Transfer rock between ships
- **Siphon**: Transfer fuel between ships

### Combat

- **Shooting Range**: 100 units
- **Damage**: 25 HP per shot
- **BattleShip Only**: Only BattleShips can shoot
- **Protection**: Ships within 50 units of their mothership are protected
- **Ship Destruction**: Creates 2 new asteroids (1 fuel, 1 rock) at ship's location

### Repair

- **Repair Distance**: 50 units from mothership
- **Repair Amount**: 30 HP per action
- **Max Health**: 100 HP

### Wormholes

- **Teleport Radius**: 5 units
- **Teleport Distance**: 10 units from target wormhole
- **Direction**: Ships maintain movement direction through wormholes
- **Pairs**: Connected in bidirectional pairs

## Python Client Usage

Players create AI bots by inheriting from the `Client` class and implementing the `turn()` method:

```python
#!/bin/python3
from typing import List
from proboj import (
    Client, BuyTurn, MoveTurn, LoadTurn, SiphonTurn, 
    ShootTurn, RepairTurn, ShipType, Position, Turn
)

class MyClient(Client):
    def turn(self) -> List[Turn]:
        my_ships = self.get_my_ships()
        my_player = self.get_my_player()
        
        turns: List[Turn] = []
        
        # Buy a battleship if we have enough resources
        if my_player and my_player.rock >= 100:
            turns.append(BuyTurn(ShipType.BATTLE_SHIP))
        
        # Move first ship
        if my_ships:
            first_ship = my_ships[0]
            turns.append(MoveTurn(first_ship.id, Position(10, 0)))
        
        # Shoot with battleships
        for ship in my_ships:
            if ship.type == ShipType.BATTLE_SHIP:
                # Find and shoot at enemies
                enemy_ships = [s for s in self.game_map.ships 
                             if s and s.player_id != self.my_player_id]
                if enemy_ships:
                    nearest = min(enemy_ships, 
                                key=lambda e: ship.position.distance(e.position))
                    if ship.position.distance(nearest.position) <= 100:
                        turns.append(ShootTurn(ship.id, nearest.id))
        
        return turns

if __name__ == "__main__":
    client = MyClient()
    client.run()
```

## Turn Actions

Each round, players return a list of turn objects from their `turn()` method:

### 1. Buy Ship

```python
BuyTurn(ShipType.BATTLE_SHIP)
```

- Cost: 100 rock
- New ship spawns at mothership position
- Available ship types: `ShipType.SUCKER_SHIP`, `ShipType.DRILL_SHIP`,
  `ShipType.TANKER_SHIP`, `ShipType.TRUCK_SHIP`, `ShipType.BATTLE_SHIP`

### 2. Move Ship

```python
MoveTurn(ship_id, Position(x, y))
```

- Each ship can be used once per round
- Movement vector added to ship's current velocity
- Example: `MoveTurn(first_ship.id, Position(10, 0))`

### 3. Load Resources

```python
LoadTurn(source_id, destination_id, amount)
```

- Transfer rock between ships
- Ships must be within 20 units
- Example: `LoadTurn(tanker.id, mothership.id, 50)`

### 4. Siphon Fuel

```python
SiphonTurn(source_id, destination_id, amount)
```

- Transfer fuel between ships
- Ships must be within 20 units
- Example: `SiphonTurn(tanker.id, battleship.id, 30)`

### 5. Shoot

```python
ShootTurn(source_id, destination_id)
```

- BattleShip only
- Target must be within 100 units
- Cannot shoot motherships
- Cannot shoot protected ships (within 50 units of their mothership)
- Example: `ShootTurn(battleship.id, enemy_ship.id)`

### 6. Repair

```python
RepairTurn(ship_id)
```

- Repair ship near mothership
- Must be within 50 units
- Cost: 1 rock per repair
- Restores 30 HP (up to maximum 100 HP)
- Example: `RepairTurn(damaged_ship.id)`

## Game State

The game state is provided through Python dataclasses in the client library:

### Player State

```python
@dataclass
class Player:
    id: int
    name: str
    color: str
    rock: int          # Rock resources available
    fuel: int          # Fuel resources available  
    alive: bool        # Whether player is still in game
```

### Ship State

```python
@dataclass
class Ship:
    id: int
    player_id: int     # Owner player ID
    position: Position # Current location
    vector: Position   # Current movement vector
    health: int        # Hit points (0-100)
    fuel: float        # Ship's fuel reserves
    type: ShipType     # Ship type enum
    rock: int          # Rock cargo
```

### Asteroid State

```python
@dataclass
class Asteroid:
    id: int
    position: Position # Location
    type: AsteroidType # ROCK_ASTEROID (0) or FUEL_ASTEROID (1)
    size: float        # Radius
    owner_id: int      # -1 if unowned, otherwise player ID
    surface: float     # Owned surface area
```

### Position Class

```python
@dataclass
class Position:
    x: float
    y: float
    
    def distance(self, other: Position) -> float
    def add(self, other: Position) -> Position
    def sub(self, other: Position) -> Position
    def size(self) -> float
    def scale(self, factor: float) -> Position
    def normalize(self) -> Position
```

### Game Map

```python
@dataclass
class GameMap:
    radius: float                    # Map boundary
    ships: List[Optional[Ship]]     # All ships (None if destroyed)
    asteroids: List[Optional[Asteroid]]  # All asteroids
    wormholes: List[Optional[Wormhole]]  # All wormholes
    players: List[Optional[Player]] # All players
    round: int                      # Current round number
```

### Accessing Game State

```python
class MyClient(Client):
    def turn(self) -> List[Turn]:
        # Get your player
        my_player = self.get_my_player()
        
        # Get your ships
        my_ships = self.get_my_ships()
        
        # Get your mothership
        mothership = self.get_my_mothership()
        
        # Access game map
        if self.game_map:
            all_ships = self.game_map.ships
            all_asteroids = self.game_map.asteroids
            current_round = self.game_map.round
            
        return []
```

## Victory Conditions

The game ends after 1000 rounds or when only one player remains alive. Players are eliminated when:

- Their AI program fails to respond
- All their ships are destroyed (except mothership)

## Constants Summary

| Parameter | Value | Description |
|-----------|-------|-------------|
| Map Radius | 15,000 | Game boundary |
| Max Rounds | 1000 | Game duration |
| Ship Health | 100 | Maximum HP |
| Ship Start Fuel | 100 | Initial fuel per ship |
| Player Start Rock | 1000 | Initial rock resources |
| Player Start Fuel | 1000 | Initial fuel resources |
| Ship Cost | 100 rock | Cost to build new ship |
| Mining Rate | 5 units/round | Resource extraction |
| Conquest Rate | 2 surface units/round | Territory capture |
| Shoot Damage | 25 HP | Combat damage |
| Repair Amount | 30 HP | Health restoration |
| Repair Cost | 1 rock | Cost per repair operation |

## Strategy Tips

1. **Resource Management**: Balance rock and fuel usage for ship production and movement
2. **Territory Control**: Conquer asteroids near your base for resource security
3. **Fleet Composition**: Mix ship types for different roles (mining, combat, transport)
4. **Wormhole Usage**: Use wormholes for rapid map traversal and surprise attacks
5. **Defense**: Keep ships near mothership for protection and easy repairs
6. **Mining**: Position SuckerShips and DrillShips near rich asteroid fields
7. **Combat**: Use BattleShips to control key areas and eliminate threats

## Technical Notes

- Ships cannot be used multiple times in the same round
- Mothership is invincible but uses player's fuel for movement
- Destroyed ships create new asteroids with their remaining resources
- Asteroid movement is deterministic based on Perlin noise
- Game state is provided to the Python client through dataclasses
- Players must inherit from `Client` class and implement `turn()` method
- Turn objects are automatically converted to JSON for server communication
- The client handles all JSON parsing and object creation automatically

