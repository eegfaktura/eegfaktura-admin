# NPM parameters

NPMCMD=npm
NPMBUILD=$(NPMCMD) run build

BINARY_NAME=eeg-registration-frontend
DOCKER=docker
VERSION=v0.2.15
ORGANISATION=vfeeg-development
GLOBAL_ORG=eegfaktura

all: test build
build:
	$(NPMBUILD)

test:
	$(NPMCMD) run test -- --run

run:
	$(NPMCMD) run build

clean:

docker-clean:
	$(DOCKER) rmi ghcr.io/$(ORGANISATION)/$(BINARY_NAME):$(VERSION)
	$(DOCKER) rmi ghcr.io/$(GLOBAL_ORG)/$(BINARY_NAME):latest

docker: build
	$(DOCKER) build -t ghcr.io/$(ORGANISATION)/$(BINARY_NAME):$(VERSION) .
	$(DOCKER) image tag ghcr.io/$(ORGANISATION)/$(BINARY_NAME):$(VERSION) ghcr.io/$(GLOBAL_ORG)/$(BINARY_NAME):latest

push: docker
	$(DOCKER) push ghcr.io/$(ORGANISATION)/$(BINARY_NAME):$(VERSION)
	$(DOCKER) push ghcr.io/$(GLOBAL_ORG)/$(BINARY_NAME):latest
