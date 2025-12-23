sources = $(wildcard *.go)
servers = server_mac server_linux server_windows.exe
runners = runner_mac runner_linux runner_windows.exe
observer_files != find observer -type f -print
python_files != find python ! -path '*/__pycache__/*' -type f -print
rust_files != find rust_bot ! -path '*/target/*' -type f -print
runner_v = 25.1005

template.zip: $(servers) $(runners) config.json games.json $(observer_files) $(python_files) $(rust_files)
	zip $@ $^

bundle.zip: README.md
	zip $@ $^

server_linux: $(sources)
	docker run -v .:/app -w /app golang:1.25-bookworm go build -buildvcs=false -o server_linux .

server_windows.exe: $(sources)
	GOOS=windows go build -o server_windows.exe .

server_mac: $(sources)
	GOOS=darwin go build -o server_mac .

runner_linux:
	wget https://github.com/trojsten/ksp-proboj/releases/download/$(runner_v)/$@

runner_windows.exe:
	wget https://github.com/trojsten/ksp-proboj/releases/download/$(runner_v)/$@

runner_mac:
	wget https://github.com/trojsten/ksp-proboj/releases/download/$(runner_v)/$@
