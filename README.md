# Get started with Qlik Core

This repository contains the source code and assets for the Engine, Data, and Visualization examples.

# Pre requistics

docker needs to be installed into system

https://docs.docker.com/compose/install/#install-compose

Note that before you deploy, you must accept the [Qlik Core EULA](https://qlikcore.com/beta/) by setting the `ACCEPT_EULA` environment variable.

```sh
ACCEPT_EULA=yes docker-compose up -d
```


# Install dependencies.

Run the following command from a command shell:

```sh
npm install
```

# Run the application.

Run the following command from a command shell:

```sh
npm run visualization
```