# Updated Printer Status Report

## Overview

This is the updated STS printer status report. Documentation can be seen on the corresponding Confluence page.

### Differences

This version of the app uses a MongoDB database to store data about the printers. Each printer is an object in the database containing all of its variables. Each printer also has an assigned maintainer, and printers are sorted into groups defined inthe database instead of in a JSON file.

### Running Locally

To run locally, first install [docker](https://docs.docker.com/get-docker/) and [docker compose](https://docs.docker.com/compose/install/) (note - Mac users do not need to install compose separately). clone the repository and cd into the directory. Run `docker-compose up --build` to build and run the app along with a MongoDB database. The app will be available at <https://localhost:8080>.

For some reason the past few times I've compiled the program for the first time using docker compose, I've gotten an error saying the container for node:latest could not be fetched. In that case, run `docker pull node:latest` and try again.

### Alternative Options

You technically don't need docker to run the app. Install a local instance of mongodb and run `npm install` when in the directory and then run `npm start`.
