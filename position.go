package main

import (
	"math"
	"math/rand"
)

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

func (p Position) Add(r Position) Position {
	return Position{p.X + r.X, p.Y + r.Y}
}

func (p Position) Sub(r Position) Position {
	return Position{p.X - r.X, p.Y - r.Y}
}

func (p Position) Distance(r Position) float64 {
	return math.Sqrt((p.X-r.X)*(p.X-r.X) + (p.Y-r.Y)*(p.Y-r.Y))
}

func (p Position) Size() float64 {
	return p.Distance(Position{})
}

func RandomPosition(m *Map) Position {
	return Position{
		rand.Float64()*m.Radius*2 - m.Radius,
		rand.Float64()*m.Radius*2 - m.Radius,
	}
}

func RandomOffsetPosition(original Position, maxOffset float64) Position {
	angle := rand.Float64() * 2 * math.Pi
	distance := rand.Float64() * maxOffset
	return Position{
		original.X + distance*math.Cos(angle),
		original.Y + distance*math.Sin(angle),
	}
}

func (p Position) Scale(factor float64) Position {
	return Position{p.X * factor, p.Y * factor}
}

func (p Position) Normalize() Position {
	size := p.Size()
	if size == 0 {
		return Position{0, 0}
	}
	return Position{p.X / size, p.Y / size}
}
