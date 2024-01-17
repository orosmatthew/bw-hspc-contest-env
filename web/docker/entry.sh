#!/bin/bash
npx prisma db push --accept-data-loss
npx prisma generate
BODY_SIZE_LIMIT=Infinity INIT=true node build