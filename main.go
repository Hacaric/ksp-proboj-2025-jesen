package main

import (
	"github.com/trojsten/ksp-proboj/client"
)

func main() {
	runner := client.NewRunner()
	m := StartGame(runner)

	for m.ShouldContinue() {
		GameTick(m)
	}

	scores := map[string]int{}
	for _, p := range m.Players {
		scores[p.Name] = int(p.Score)
	}

	runner.Scores(scores)
	runner.End()
}
