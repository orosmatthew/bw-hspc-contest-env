#!/bin/bash
npx prisma db push --accept-data-loss
npx prisma generate
BODY_SIZE_LIMIT=10240 INIT=true node build