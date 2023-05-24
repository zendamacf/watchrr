#!/bin/bash

celery -A web.asynchro.celery worker --concurrency=10 -Q scheduler --purge
