package main

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"math"
	"strings"
)

type Player struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Color      string `json:"color"`
	MotherShip *Ship  `json:"mothership"`
	Alive      bool   `json:"alive"`
	Score      int    `json:"score"`
}

// generateHexColor creates a deterministic hex color from a player name
func generateHexColor(name string) string {
	// Handle empty names
	trimmedName := strings.TrimSpace(name)
	if trimmedName == "" {
		return "#808080" // gray fallback
	}

	// Generate SHA-256 hash from player name
	h := sha256.Sum256([]byte(trimmedName))

	// Use first 8 bytes for better distribution
	hashInt := binary.BigEndian.Uint64(h[:8])

	// Convert to HSL for better colors
	hue := float64(hashInt % 360)
	saturation := 0.75 // Fixed good saturation
	lightness := 0.50  // Fixed good lightness for visibility

	// Convert HSL to RGB and then to hex
	r, g, b := hslToRGB(hue, saturation, lightness)
	return fmt.Sprintf("#%02X%02X%02X", r, g, b)
}

// hslToRGB converts HSL color space to RGB
func hslToRGB(h, s, l float64) (r, g, b int) {
	h = h / 360.0

	c := (1.0 - math.Abs(2*l-1.0)) * s
	x := c * (1.0 - math.Abs(math.Mod(h*6.0, 2.0)-1.0))
	m := l - c/2.0

	var rFloat, gFloat, bFloat float64

	switch {
	case h < 1.0/6.0:
		rFloat, gFloat, bFloat = c, x, 0
	case h < 2.0/6.0:
		rFloat, gFloat, bFloat = x, c, 0
	case h < 3.0/6.0:
		rFloat, gFloat, bFloat = 0, c, x
	case h < 4.0/6.0:
		rFloat, gFloat, bFloat = 0, x, c
	case h < 5.0/6.0:
		rFloat, gFloat, bFloat = x, 0, c
	default:
		rFloat, gFloat, bFloat = c, 0, x
	}

	r = int((rFloat + m) * 255)
	g = int((gFloat + m) * 255)
	b = int((bFloat + m) * 255)

	// Ensure values are within valid range
	if r < 0 {
		r = 0
	} else if r > 255 {
		r = 255
	}
	if g < 0 {
		g = 0
	} else if g > 255 {
		g = 255
	}
	if b < 0 {
		b = 0
	} else if b > 255 {
		b = 255
	}

	return r, g, b
}

func NewPlayer(m *Map, name string) *Player {
	p := &Player{
		ID:    len(m.Players),
		Name:  name,
		Color: generateHexColor(name),
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
